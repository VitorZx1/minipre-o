import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Secrets stay outside the repository, SQLite snapshots and browser storage.
const vaultDirectory = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'MiniPreco', 'segredos');
function getVaultPath(environment) {
  if (!['sandbox', 'production'].includes(environment)) throw new Error('Ambiente inválido.');
  return path.join(vaultDirectory, `banestes-${environment}.dpapi`);
}

export function protect(value, decrypt = false) {
  if (process.platform !== 'win32') throw new Error('O cofre Banestes requer Windows.');
  const operation = decrypt ? 'Unprotect' : 'Protect';
  const command = `Add-Type -AssemblyName System.Security; $inputBytes=[Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()); $outputBytes=[Security.Cryptography.ProtectedData]::${operation}($inputBytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($outputBytes))`;
  try {
    const output = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      input: Buffer.from(value).toString('base64'), encoding: 'utf8', windowsHide: true,
      timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'],
    });
    return Buffer.from(output.trim(), 'base64');
  } catch {
    throw new Error('Não foi possível acessar o cofre protegido do Windows.');
  }
}

export function saveBanestesSandbox(credentials) {
  return saveBanestesCredentials({ ...credentials, environment: 'sandbox' });
}

export function saveBanestesCredentials({ clientId, authorization, environment = 'sandbox', replace = false, expectedRevision }) {
  const vaultPath = getVaultPath(environment);
  clientId = typeof clientId === 'string' ? clientId.trim() : '';
  authorization = typeof authorization === 'string' ? authorization.trim() : '';
  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(clientId) || authorization.length < 20 || authorization.length > 4096 || /[\r\n]/.test(authorization)) {
    throw new Error('Formato das credenciais inválido.');
  }
  if (fs.existsSync(vaultPath)) {
    if (replace !== true) throw new Error('Confirme a substituição das credenciais existentes.');
    const current = getBanestesStatus(environment);
    if (current.error) throw new Error(current.error);
    if (!expectedRevision || current.revision !== expectedRevision) throw new Error('A configuração mudou. Atualize a situação antes de salvar.');
  }
  const config = { provider: 'banestes', environment, clientId, authorization, savedAt: new Date().toISOString() };
  const encrypted = protect(JSON.stringify(config));
  fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
  const temporaryPath = `${vaultPath}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, encrypted, { flag: 'wx' });
    const verified = JSON.parse(protect(fs.readFileSync(temporaryPath), true).toString('utf8'));
    if (verified.clientId !== clientId || verified.authorization !== authorization) throw new Error('Falha de verificação do cofre.');
    fs.renameSync(temporaryPath, vaultPath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
  return getBanestesStatus(environment);
}

export function getBanestesStatus(environment = 'sandbox') {
  const vaultPath = getVaultPath(environment);
  if (!fs.existsSync(vaultPath)) return { configured: false, environment, connected: false };
  try {
    const config = JSON.parse(protect(fs.readFileSync(vaultPath), true).toString('utf8'));
    return {
      configured: true, environment, connected: false,
      clientIdMasked: `${config.clientId.slice(0, 4)}…${config.clientId.slice(-4)}`,
      authorizationStored: true, certificateReady: false,
      revision: config.savedAt,
      message: 'Credenciais salvas. Falta configurar o certificado e validar o acesso ao Banestes.',
    };
  } catch {
    return { configured: true, environment, connected: false, error: 'Cofre indisponível para este usuário do Windows.' };
  }
}

// Called only by the explicit, local reveal action; never included in status responses.
export function revealBanestesCredential(environment, field) {
  if (!['clientId', 'authorization'].includes(field)) throw new Error('Campo inválido.');
  const config = JSON.parse(protect(fs.readFileSync(getVaultPath(environment)), true).toString('utf8'));
  return config[field];
}
