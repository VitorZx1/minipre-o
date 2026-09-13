import fs from 'node:fs';
import { parseBBCredentials } from '../src/services/bbCredentials.js';
import { bbStatus, saveBB, testBB } from './bb-config.js';

try {
  const fields = parseBBCredentials(fs.readFileSync(process.argv[2], 'utf8'));
  if (bbStatus('sandbox').configured) console.log('Cofre BB já existe; não foi substituído.');
  else { saveBB({ ...fields, environment: 'sandbox' }); console.log('Credenciais BB Sandbox salvas no cofre do Windows.'); }
  try { console.log((await testBB('sandbox')).message); }
  catch (error) { console.log(error.message.startsWith('Não foi possível acessar') ? error.message : 'Teste de autenticação não concluído. Consulte o teste pelo aplicativo.'); }
} catch { console.error('Não foi possível importar. O arquivo original foi preservado.'); process.exitCode = 1; }
