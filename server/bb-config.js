import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { protect } from './banestes-config.js';

const directory = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'MiniPreco', 'segredos');
function vault(environment) {
  if (!['sandbox', 'production'].includes(environment)) throw new Error('Ambiente inválido.');
  return path.join(directory, `bb-${environment}.dpapi`);
}
export function readBB(environment) {
  return JSON.parse(protect(fs.readFileSync(vault(environment)), true).toString('utf8'));
}
export function bbStatus(environment = 'sandbox') {
  if (!fs.existsSync(vault(environment))) return { environment, configured: false };
  try { return { environment, configured: true, revision: readBB(environment).revision }; }
  catch { throw new Error('Não foi possível abrir o cofre do BB neste usuário do Windows.'); }
}
export function saveBB(input) {
  const environment = input.environment;
  const file = vault(environment);
  const config = { environment, revision: randomUUID() };
  for (const field of ['appKey', 'clientId', 'clientSecret']) {
    const value = input[field];
    if (typeof value !== 'string' || !value.trim() || value.length > 8192 || /[\r\n]/.test(value)) throw new Error('Preencha App Key, Client ID e Client Secret válidos.');
    config[field] = value.trim();
  }
  const status = bbStatus(environment);
  if (status.configured && (input.replace !== true || input.expectedRevision !== status.revision)) throw new Error('Confirme a substituição e atualize as credenciais salvas antes de continuar.');
  fs.mkdirSync(directory, { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, protect(JSON.stringify(config)), { flag: 'wx' });
    const check = JSON.parse(protect(fs.readFileSync(temporary), true).toString('utf8'));
    if (check.revision !== config.revision) throw new Error('Falha ao verificar o cofre.');
    fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return bbStatus(environment);
}

// Official discovery URL: BB developer security guide. No caller-supplied destinations.
export async function authorizeBB(environment, fetcher = fetch, scope = 'cob.read pix.read') {
  if (environment !== 'sandbox') throw new Error('O teste de produção está bloqueado até a homologação da integração.');
  const config = readBB(environment);
  let discovery;
  try {
    discovery = await fetcher('https://oauth.hm.bb.com.br/oauth/.well-known/openid-configuration', { redirect: 'error', signal: AbortSignal.timeout(15000) });
  } catch { throw new Error('Não foi possível acessar o endereço de testes OAuth publicado pelo BB. Verifique a conexão ou confirme o endereço atual no portal do banco. Nenhum pagamento foi criado.'); }
  if (!discovery.ok) throw new Error(`O serviço de descoberta do BB respondeu HTTP ${discovery.status}.`);
  const metadata = await discovery.json();
  const endpoint = new URL(metadata.token_endpoint);
  if (endpoint.origin !== 'https://oauth.hm.bb.com.br' || endpoint.username || endpoint.password) throw new Error('O BB retornou um endereço de autenticação inesperado. Teste interrompido por segurança.');
  let response;
  try {
    response = await fetcher(endpoint.href, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}` },
      body: new URLSearchParams({ grant_type: 'client_credentials', scope }).toString(),
    });
  } catch { throw new Error('Falha de conexão segura com o BB. Nenhum pagamento foi criado.'); }
  if (!response.ok) throw new Error(`Autenticação recusada pelo BB (HTTP ${response.status}). Confira o ambiente e as credenciais no portal. Nenhum pagamento foi criado.`);
  const result = await response.json();
  if (typeof result.access_token !== 'string' || !result.access_token) throw new Error('O BB não retornou um token válido.');
  return { token: result.access_token, config };
}

export async function testBB(environment, fetcher = fetch) {
  await authorizeBB(environment, fetcher);
  // Tokens and raw bank responses must never leave this server.
  return { authenticated: true, environment, checkedAt: new Date().toISOString(), message: 'Autenticação aceita pelo BB. App Key, acesso à API Pix, cobrança e confirmação de pagamento ainda não foram validados.' };
}
