import { randomUUID } from 'node:crypto';
import { createPixService, PixError } from './bb-pix.js';
const service = createPixService();
try {
  const id = process.argv[2] || randomUUID().replaceAll('-', '');
  console.log('Teste:', id);
  let result = process.argv[2] ? await service.check(id) : await service.create(id, '1.00');
  console.log('Cobrança:', result.state, 'QR retornado:', Boolean(result.qr));
  if (process.argv.includes('--simulate') && result.state === 'pending') result = await service.simulate(id);
  console.log('Conciliação:', result.state);
} catch (error) { console.log(error instanceof PixError ? error.message : 'Teste interrompido. Verifique autenticação e acesso ao BB.'); process.exitCode = 1; }
finally { service.close(); }
