import { saveBanestesSandbox } from './banestes-config.js';

// Receive secrets through stdin; never through CLI arguments or log output.
try {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const status = saveBanestesSandbox(JSON.parse(input));
  if (!status.authorizationStored) throw new Error('Falha ao verificar o cofre.');
  console.log('Credenciais Sandbox salvas e verificadas no cofre do Windows. Conexão bancária ainda não ativada.');
} catch {
  console.error('Não foi possível importar as credenciais. Nenhum segredo foi exibido.');
  process.exitCode = 1;
}
