import { Router } from 'express';
import { bbStatus, saveBB, testBB, readBB } from './bb-config.js';
import { createPixService, PixError } from './bb-pix.js';

export function bbRoutes(port) {
  const router = Router();
  let pix;
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`, 'http://localhost:4000', 'http://127.0.0.1:4000']);
    if (!['localhost', '127.0.0.1'].includes(req.hostname) || !origins.has(req.get('Origin')) || req.get('X-MiniPreco-Settings') !== '1' || !req.is('application/json')) return res.status(403).json({ error: 'Abra as configurações pelo aplicativo local.' });
    if (!['sandbox', 'production'].includes(req.body?.environment)) return res.status(400).json({ error: 'Ambiente inválido.' });
    next();
  });
  router.post('/status', (req, res) => {
    try { res.json(bbStatus(req.body.environment)); }
    catch { res.status(400).json({ error: 'Não foi possível abrir o cofre do BB neste usuário do Windows.' }); }
  });
  for (const action of ['create', 'check', 'simulate', 'list']) {
    router.post(`/pix/${action}`, async (req, res) => {
      if (req.body.environment !== 'sandbox') return res.status(403).json({ error: 'Fluxo Pix disponível somente em Sandbox. Produção bloqueada.' });
      try {
        pix ||= createPixService();
        res.json(await pix[action](req.body.id, req.body.amount));
      } catch (error) { res.status(400).json({ error: error instanceof PixError ? error.message : 'Não foi possível acessar o BB. Confira as credenciais e a conexão. Nenhum pagamento foi confirmado.' }); }
    });
  }
  router.post('/reveal', (req, res) => {
    if (!['appKey', 'clientId', 'clientSecret'].includes(req.body.field)) return res.status(400).json({ error: 'Campo inválido.' });
    try { res.json({ value: readBB(req.body.environment)[req.body.field] }); }
    catch { res.status(400).json({ error: 'Não foi possível abrir a credencial no cofre do Windows.' }); }
  });
  router.post('/credentials', (req, res) => {
    try { res.json(saveBB(req.body)); }
    catch { res.status(400).json({ error: 'Não foi possível salvar. Confira os três campos e, se já houver credenciais, atualize a tela e confirme a substituição.' }); }
  });
  let testing = false;
  router.post('/test', async (req, res) => {
    if (testing) return res.status(409).json({ error: 'Já existe um teste em andamento.' });
    testing = true;
    try { res.json(await testBB(req.body.environment)); }
    catch (error) {
      // Do not send arbitrary network/filesystem error details or secret-bearing URLs.
      const message = /^(O teste|Não foi possível acessar|O serviço de descoberta|O BB|Autenticação recusada|Falha de conexão segura)/.test(error.message) ? error.message : 'Não foi possível testar. Confira as credenciais salvas e a configuração do BB.';
      res.status(400).json({ error: message });
    } finally { testing = false; }
  });
  return router;
}
