import express from 'express';
import { bbRoutes } from './bb-routes.js';
import { bbStatus } from './bb-config.js';
import { createPixService, PixError } from './bb-pix.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBanestesStatus, saveBanestesCredentials, revealBanestesCredential } from './banestes-config.js';
import { chooseStorageFolder } from './folder-picker.js';
import { activateMercadoPagoTerminal, configureMercadoPagoPix, listMercadoPagoTerminals, mercadoPagoStatus, revealMercadoPago, saveMercadoPago } from './mercado-pago-config.js';
import { cancelMercadoPagoOrder, createMercadoPagoOrder, getMercadoPagoOrder } from './mercado-pago-payments.js';
import { lookupProduct } from './product-lookup.js';
import {
  changeStorageDirectory,
  collections,
  getStorageInfo,
  getSetting,
  readCollection,
  replaceCollection,
  setSetting,
} from './database.js';

const app = express();
const port = Number(process.env.MINI_PRECO_PORT || 4317);
const paymentTransactions = new Map();

app.use(express.json({ limit: '25mb' }));
app.use('/api/bb', bbRoutes(port));

app.post('/api/storage/choose-folder', async (req, res) => {
  const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`, 'http://localhost:4000', 'http://127.0.0.1:4000']);
  if (!['localhost', '127.0.0.1'].includes(req.hostname) || !origins.has(req.get('Origin')) || req.get('X-MiniPreco-Settings') !== '1') {
    return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  }
  try { res.json({ directory: await chooseStorageFolder() }); }
  catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/health', (_req, res) => {
  try { res.json(getStorageInfo()); }
  catch (error) { res.status(500).json({ connected: false, error: error.message }); }
});

app.get('/api/products/lookup/:barcode', async (req, res) => {
  try { res.json(await lookupProduct(req.params.barcode)); }
  catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/data', (req, res) => {
  try {
    res.json(Object.fromEntries(collections.map(name => [
      name,
      readCollection(name, req.query.startDate, req.query.endDate),
    ])));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/data/:collection', (req, res) => {
  try {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Os dados devem ser uma lista.' });
    replaceCollection(req.params.collection, req.body);
    res.json({ success: true, total: req.body.length });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/storage', (req, res) => {
  try {
    if (!req.body?.storageDirectory) return res.status(400).json({ error: 'Informe a pasta de armazenamento.' });
    res.json(changeStorageDirectory(req.body.storageDirectory));
  } catch (error) { res.status(400).json({ error: `Não foi possível usar essa pasta: ${error.message}` }); }
});

app.get('/api/settings/:key', (req, res) => {
  try { res.json({ value: getSetting(req.params.key) }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

function settingsRequestAllowed(req) {
  const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`, 'http://localhost:4000', 'http://127.0.0.1:4000']);
  return ['localhost', '127.0.0.1'].includes(req.hostname) && origins.has(req.get('Origin')) && req.get('X-MiniPreco-Settings') === '1';
}

app.get('/api/mercado-pago/status', (_req, res) => {
  try { res.json(mercadoPagoStatus()); } catch (error) { res.status(400).json({ error: error.message }); }
});
app.put('/api/mercado-pago/credentials', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!settingsRequestAllowed(req) || !req.is('application/json')) return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  try { res.json(saveMercadoPago(req.body || {})); } catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/mercado-pago/reveal', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!settingsRequestAllowed(req)) return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  try { res.json({ value: revealMercadoPago() }); } catch { res.status(400).json({ error: 'Não foi possível visualizar o token no cofre do Windows.' }); }
});
app.post('/api/mercado-pago/terminals', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!settingsRequestAllowed(req)) return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  try { res.json({ terminals: await listMercadoPagoTerminals() }); } catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/mercado-pago/terminals/activate', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!settingsRequestAllowed(req) || !req.is('application/json')) return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  try { res.json(await activateMercadoPagoTerminal(req.body?.terminalId)); } catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/mercado-pago/pix/configure', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!settingsRequestAllowed(req) || !req.is('application/json')) return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  try {
    const configured = await configureMercadoPagoPix(req.body?.posId);
    const checkout = { ...(getSetting('mercado-pago-checkout') || {}), ...configured };
    setSetting('mercado-pago-checkout', checkout);
    res.json({ checkout });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.put('/api/settings/:key', (req, res) => {
  try { res.json({ value: setSetting(req.params.key, req.body?.value) }); }
  catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/payments', async (req, res) => {
  const { method, amount } = req.body || {};
  if (!['PIX', 'Cartão de débito', 'Cartão de crédito'].includes(method)) {
    return res.status(400).json({ error: 'Forma de pagamento automático inválida.' });
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valor do pagamento inválido.' });
  }

  if (req.body?.confirmRealPayment !== true) return res.status(400).json({ error: 'Confirme o envio do pagamento real.' });
  try {
    const checkout = getSetting('mercado-pago-checkout') || {};
    const result = await createMercadoPagoOrder({ method, amount, terminalId: checkout.terminalId, externalPosId: checkout.externalPosId });
    const id = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const transaction = { id, ...result, mode: 'mercado-pago', pixPayload: result.qrData, createdAt: new Date().toISOString(), approvedAt: result.status === 'approved' ? new Date().toISOString() : null };
    paymentTransactions.set(id, transaction);
    res.status(201).json(transaction);
  } catch (error) { res.status(400).json({ error: error.message }); }
});

app.get('/api/payments/:id', async (req, res) => {
  const transaction = paymentTransactions.get(req.params.id);
  if (!transaction) return res.status(404).json({ error: 'Pagamento não localizado.' });

  if (transaction.mode === 'mercado-pago' && transaction.status === 'pending') {
    try {
      const result = await getMercadoPagoOrder(transaction.providerOrderId, { reference: transaction.reference, amount: transaction.amount });
      Object.assign(transaction, result);
      if (result.status === 'approved') transaction.approvedAt = new Date().toISOString();
    } catch (error) { return res.status(502).json({ error: error.message }); }
  }
  res.json(transaction);
});

app.post('/api/payments/:id/cancel', async (req, res) => {
  const transaction = paymentTransactions.get(req.params.id);
  if (!transaction) return res.status(404).json({ error: 'Pagamento não localizado.' });
  if (transaction.status !== 'pending') return res.json(transaction);
  try {
    const result = await cancelMercadoPagoOrder(transaction.providerOrderId);
    Object.assign(transaction, result);
    res.json(transaction);
  } catch (error) { res.status(409).json({ error: error.message }); }
});

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
app.post('/api/banestes/reveal', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`, 'http://localhost:4000', 'http://127.0.0.1:4000']);
  if (!['localhost', '127.0.0.1'].includes(req.hostname) || !origins.has(req.get('Origin')) || req.get('X-MiniPreco-Settings') !== '1' || !req.is('application/json')) {
    return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  }
  try { res.json({ value: revealBanestesCredential(req.body?.environment, req.body?.field) }); }
  catch { res.status(400).json({ error: 'Não foi possível visualizar a credencial no cofre do Windows.' }); }
});
app.put('/api/banestes/credentials', (req, res) => {
  res.set('Cache-Control', 'no-store');
  // This desktop service is local-only. Reject cross-site browser writes and DNS rebinding.
  const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`, 'http://localhost:4000', 'http://127.0.0.1:4000']);
  if (!['localhost', '127.0.0.1'].includes(req.hostname) || !origins.has(req.get('Origin')) || req.get('X-MiniPreco-Settings') !== '1' || !req.is('application/json')) {
    return res.status(403).json({ error: 'Abra esta configuração pelo aplicativo local.' });
  }
  if (!['sandbox', 'production'].includes(req.body?.environment)) return res.status(400).json({ error: 'Ambiente inválido.' });
  try {
    const { clientId, authorization, environment, replace, expectedRevision } = req.body;
    res.json(saveBanestesCredentials({ clientId, authorization, environment, replace, expectedRevision }));
  } catch (error) {
    const safeErrors = ['Formato das credenciais inválido.', 'Confirme a substituição das credenciais existentes.', 'A configuração mudou. Atualize a situação antes de salvar.'];
    res.status(400).json({ error: safeErrors.includes(error.message) ? error.message : 'Não foi possível salvar no cofre do Windows. A configuração anterior foi preservada.' });
  }
});
app.get('/api/banestes/status', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { res.json(getBanestesStatus(req.query.environment || 'sandbox')); }
  catch { res.status(400).json({ error: 'Ambiente inválido.' }); }
});
const webDirectory = path.resolve(serverDirectory, '..', 'dist');
app.use(express.static(webDirectory));
app.get('/{*route}', (_req, res) => res.sendFile(path.join(webDirectory, 'index.html')));

app.listen(port, '127.0.0.1', () => {
  console.log(`Mini Preço - armazenamento local ativo em http://127.0.0.1:${port}`);
});
