import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { protect } from './banestes-config.js';

const directory = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'MiniPreco', 'segredos');
const file = path.join(directory, 'mercado-pago.dpapi');

function readConfig() {
  return JSON.parse(protect(fs.readFileSync(file), true).toString('utf8'));
}

export function getMercadoPagoAccessToken() {
  return readConfig().accessToken;
}

export function mercadoPagoStatus() {
  if (!fs.existsSync(file)) return { configured: false };
  try { return { configured: true, revision: readConfig().revision }; }
  catch { throw new Error('Não foi possível abrir o cofre do Mercado Pago neste usuário do Windows.'); }
}

export function saveMercadoPago(input) {
  const token = typeof input.accessToken === 'string' ? input.accessToken.trim() : '';
  if (token.length < 20 || token.length > 4096 || /\s/.test(token)) throw new Error('Informe um Access Token válido.');
  const status = mercadoPagoStatus();
  if (status.configured && (input.replace !== true || input.expectedRevision !== status.revision)) throw new Error('Confirme a substituição e atualize a situação antes de salvar.');
  const config = { accessToken: token, revision: randomUUID() };
  fs.mkdirSync(directory, { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, protect(JSON.stringify(config)), { flag: 'wx' });
    if (readProtected(temporary).revision !== config.revision) throw new Error('Falha ao verificar o cofre.');
    fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return mercadoPagoStatus();
}

function readProtected(target) {
  return JSON.parse(protect(fs.readFileSync(target), true).toString('utf8'));
}

export function revealMercadoPago() {
  return readConfig().accessToken;
}

export async function listMercadoPagoTerminals(fetcher = fetch) {
  const accessToken = readConfig().accessToken;
  const response = await fetcher('https://api.mercadopago.com/terminals/v1/list?limit=50&offset=0', {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  if (response.status === 401 || response.status === 403) throw new Error('O Mercado Pago recusou o Access Token. Confira se ele pertence à conta da maquininha.');
  if (!response.ok) throw new Error(`O Mercado Pago respondeu HTTP ${response.status}. Tente novamente.`);
  const body = await response.json();
  const source = Array.isArray(body) ? body : (body.data?.terminals || body.results || body.terminals || []);
  const terminals = source.map(item => ({
    id: String(item.id || ''), operatingMode: item.operating_mode || null,
    status: item.status || null, posId: item.pos_id || item.pos?.id || null,
    storeId: item.store_id || item.store?.id || null,
    externalPosId: item.external_pos_id || item.pos?.external_id || null,
  })).filter(item => item.id);
  const posIds = [...new Set(terminals.map(item => item.posId).filter(id => /^\d+$/.test(String(id))))];
  const posDetails = new Map();
  await Promise.all(posIds.map(async posId => {
    try {
      const posResponse = await fetcher(`https://api.mercadopago.com/v2/pos/${posId}`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000), redirect: 'error',
      });
      if (posResponse.ok) posDetails.set(String(posId), await posResponse.json());
    } catch { /* cartão continua disponível mesmo se o detalhe do Pix falhar */ }
  }));
  return terminals.map(item => ({ ...item, externalPosId: item.externalPosId || posDetails.get(String(item.posId))?.external_id || null }));
}

export async function activateMercadoPagoTerminal(terminalId, fetcher = fetch) {
  if (typeof terminalId !== 'string' || terminalId.length < 5 || terminalId.length > 200 || !/^[A-Za-z0-9_-]+$/.test(terminalId)) throw new Error('Maquininha inválida. Atualize a lista e tente novamente.');
  const terminals = await listMercadoPagoTerminals(fetcher);
  const terminal = terminals.find(item => item.id === terminalId);
  if (!terminal) throw new Error('Essa maquininha não foi encontrada na conta do Mercado Pago.');
  if (!terminal.posId || !terminal.storeId) throw new Error('Antes de ativar o modo PDV, associe a maquininha a uma loja e a um caixa pelo aplicativo do Mercado Pago.');
  if (terminal.operatingMode === 'PDV') return { terminal, message: 'A maquininha já está no modo PDV.' };
  const response = await fetcher('https://api.mercadopago.com/terminals/v1/setup', {
    method: 'PATCH', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${readConfig().accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ terminals: [{ id: terminalId, operating_mode: 'PDV' }] }),
  });
  if (response.status === 401 || response.status === 403) throw new Error('O Mercado Pago recusou a alteração. Confira o token e a conta da maquininha.');
  if (!response.ok) throw new Error(`Não foi possível ativar o modo PDV (HTTP ${response.status}).`);
  return { terminal: { ...terminal, operatingMode: 'PDV' }, message: 'Modo PDV ativado. Reinicie a maquininha e confira o modo de vinculação.' };
}

export async function configureMercadoPagoPix(posId, fetcher = fetch) {
  if (!/^\d{1,20}$/.test(String(posId))) throw new Error('Caixa do Mercado Pago inválido.');
  const accessToken = readConfig().accessToken;
  const terminals = await listMercadoPagoTerminals(fetcher);
  if (!terminals.some(item => String(item.posId) === String(posId))) throw new Error('Esse caixa não pertence às maquininhas encontradas na conta.');
  const externalId = `MINIPRECO${posId}`.slice(0, 40);
  const response = await fetcher(`https://api.mercadopago.com/v2/pos/${posId}`, {
    method: 'PATCH', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': randomUUID() },
    body: JSON.stringify({ external_id: externalId }),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) throw new Error('O Mercado Pago recusou a configuração do Pix.');
  if (!response.ok) throw new Error(body.message ? `Mercado Pago: ${body.message}` : `Não foi possível configurar o Pix (HTTP ${response.status}).`);
  return { posId: String(posId), externalPosId: body.external_id || externalId };
}
