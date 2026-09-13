import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { authorizeBB } from './bb-config.js';

// BB Pix v2 / Especificações e testes. Only homologation hosts, never production.
const BASE = 'https://api.extranet.hm.bb.com.br/pix/v2';
const SIMULATOR = 'https://api.hm.bb.com.br/testes-portal-desenvolvedor/v1/boletos-pix/pagar?gw-app-key=95cad3f03fd9013a9d15005056825665';
const KEY = '9e881f18-cc66-4fc7-8f2c-a795dbb2bfc1';
export class PixError extends Error {}
export function cents(value) {
  if (typeof value !== 'string' || !/^\d{1,8}\.\d{2}$/.test(value)) throw new PixError('Valor inválido. Use duas casas decimais.');
  return Number(value.replace('.', ''));
}
export function reconcile(charge, expected) {
  if (charge.txid !== expected.txid || cents(charge.valor?.original) !== expected.amountCents || charge.chave !== KEY) throw new PixError('Divergência no identificador, valor ou chave retornados pelo BB. Pagamento não confirmado.');
  if (charge.status !== 'CONCLUIDA') return { state: charge.status?.startsWith('REMOVIDA_') ? 'cancelled' : 'pending', bankStatus: charge.status };
  const entries = charge.pix;
  if (!Array.isArray(entries) || entries.length !== 1) throw new PixError('Liquidação sem um recebimento único correspondente. Pagamento não confirmado.');
  const paid = entries[0];
  if (paid.txid !== expected.txid || cents(paid.valor) !== expected.amountCents || typeof paid.endToEndId !== 'string' || !/^E[A-Za-z0-9]{31}$/.test(paid.endToEndId) || !Number.isFinite(Date.parse(paid.horario)) || paid.devolucoes?.length) throw new PixError('Recebimento divergente ou incompleto. Pagamento não confirmado.');
  return { state: 'paid', bankStatus: charge.status, endToEndId: paid.endToEndId, paidAt: paid.horario };
}

export function createPixService({ databasePath, fetcher = fetch, authorize = authorizeBB } = {}) {
  const file = databasePath || path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'MiniPreco', 'testes', 'bb-pix-sandbox.sqlite');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec('CREATE TABLE IF NOT EXISTS charges (id TEXT PRIMARY KEY, data TEXT NOT NULL);');
  const busy = new Set();
  const read = id => {
    if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) throw new PixError('Identificador de teste inválido.');
    const row = db.prepare('SELECT data FROM charges WHERE id=?').get(id);
    return row ? JSON.parse(row.data) : null;
  };
  const save = record => { db.prepare('INSERT INTO charges VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(record.id, JSON.stringify(record)); return record; };
  async function locked(id, fn) {
    if (busy.has(id)) throw new PixError('Este teste já está sendo consultado. Aguarde alguns segundos.');
    busy.add(id);
    try { return await fn(); } finally { busy.delete(id); }
  }
  async function api(method, endpoint, body) {
    const { token, config } = await authorize('sandbox', fetcher, 'cob.read cob.write pix.read');
    const url = new URL(BASE + endpoint);
    url.searchParams.set('gw-dev-app-key', config.appKey);
    let response;
    try { response = await fetcher(url.href, { method, redirect: 'error', signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
    catch (error) {
      if (['SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED'].includes(error.cause?.code)) throw new PixError('Não foi possível validar o certificado HTTPS do endereço de testes do BB. A conexão foi bloqueada por segurança; é necessário validar a cadeia oficial do banco antes de continuar.');
      throw new PixError('Sem resposta do BB. Consulte novamente este mesmo teste; não crie outra cobrança.');
    }
    if (!response.ok) throw new PixError(`API Pix do BB respondeu HTTP ${response.status}. Confira a liberação da API e tente consultar este teste novamente.`);
    try { return await response.json(); } catch { throw new PixError('Resposta inválida da API Pix do BB.'); }
  }
  function apply(record, charge) {
    const result = reconcile(charge, record);
    const qr = charge.pixCopiaECola || charge.textoImagemQRcode || record.qr;
    if (typeof qr !== 'string' || !qr.startsWith('000201') || qr.length > 4096) throw new PixError('O BB não retornou um Pix Copia e Cola válido. Consulte este teste novamente.');
    return save({ ...record, ...result, qr, checkedAt: new Date().toISOString() });
  }
  async function checkUnlocked(id) {
    const record = read(id);
    if (!record) throw new PixError('Teste não localizado neste computador.');
    const charge = await api('GET', `/cob/${record.txid}`);
    return apply(record, charge);
  }
  return {
    close: () => db.close(),
    list: () => db.prepare('SELECT data FROM charges ORDER BY rowid DESC LIMIT 10').all().map(row => JSON.parse(row.data)),
    create: (id, amount) => locked(id, async () => {
      const amountCents = cents(amount);
      if (amountCents < 1 || amountCents > 1000000) throw new PixError('O teste aceita valores entre R$ 0,01 e R$ 10.000,00.');
      const existing = read(id);
      if (existing) {
        if (existing.amountCents !== amountCents) throw new PixError('Este identificador já pertence a outro valor.');
        return checkUnlocked(id);
      }
      const record = save({ id, txid: id, amountCents, state: 'creating', environment: 'sandbox', createdAt: new Date().toISOString(), simulationAttempted: false });
      const charge = await api('PUT', `/cob/${record.txid}`, { calendario: { expiracao: 3600 }, valor: { original: amount, modalidadeAlteracao: 0 }, chave: KEY, solicitacaoPagador: 'Teste Mini Preco - sem dinheiro real' });
      return apply(record, charge);
    }),
    check: id => locked(id, () => checkUnlocked(id)),
    simulate: id => locked(id, async () => {
      // Re-query first so the simulator never intentionally pays an already settled charge.
      let record = await checkUnlocked(id);
      if (record.state === 'paid') return record;
      if (record.state !== 'pending' || !record.qr) throw new PixError('A cobrança não está disponível para simulação.');
      if (record.simulationAttempted) throw new PixError('A simulação já foi solicitada. Consulte o BB para evitar um pagamento de teste duplicado.');
      if (Date.now() - Date.parse(record.createdAt) >= 3600000) throw new PixError('O prazo deste QR Code acabou. Crie um novo teste.');
      record = save({ ...record, simulationAttempted: true });
      let response;
      try { response = await fetcher(SIMULATOR, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pix: record.qr }) }); }
      catch { throw new PixError('Simulação enviada, mas sem resposta. Continue consultando o BB; o pagamento ainda não está confirmado.'); }
      if (!response.ok) throw new PixError(`Simulador BB respondeu HTTP ${response.status}. Consulte o recebimento antes de repetir o teste.`);
      return checkUnlocked(id);
    }),
  };
}
