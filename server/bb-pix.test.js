import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPixService, reconcile, cents } from './bb-pix.js';

const id = '0123456789abcdef0123456789abcdef';
const key = '9e881f18-cc66-4fc7-8f2c-a795dbb2bfc1';
const charge = () => ({ txid: id, chave: key, valor: { original: '1.00' }, status: 'ATIVA', pixCopiaECola: '000201-test-payload' });
const paid = () => ({ ...charge(), status: 'CONCLUIDA', pix: [{ txid: id, valor: '1.00', endToEndId: 'E' + '1'.repeat(31), horario: '2026-09-02T15:00:00Z' }] });

test('strict reconciliation rejects mismatched or ambiguous payment evidence', () => {
  const expected = { txid: id, amountCents: 100 };
  assert.equal(reconcile(charge(), expected).state, 'pending');
  assert.equal(reconcile(paid(), expected).state, 'paid');
  for (const changed of [
    { ...paid(), txid: 'another' },
    { ...paid(), valor: { original: '2.00' } },
    { ...paid(), chave: 'another' },
    { ...paid(), pix: [] },
    { ...paid(), pix: [paid().pix[0], paid().pix[0]] },
    { ...paid(), pix: [{ ...paid().pix[0], txid: 'another' }] },
    { ...paid(), pix: [{ ...paid().pix[0], valor: '0.99' }] },
    { ...paid(), pix: [{ ...paid().pix[0], endToEndId: '' }] },
    { ...paid(), pix: [{ ...paid().pix[0], devolucoes: [{}] }] },
  ]) assert.throws(() => reconcile(changed, expected));
  for (const invalid of ['NaN', '-1.00', '0.001', '1e2', 1, undefined]) assert.throws(() => cents(invalid));
});
test('create, idempotency, simulator, polling; no approval from simulator alone', async () => {
  let bankCharge = charge();
  let creates = 0;
  let simulations = 0;
  const service = createPixService({ databasePath: ':memory:', authorize: async environment => {
    assert.equal(environment, 'sandbox'); return { token: 'fake-token', config: { appKey: 'fake-key' } };
  }, fetcher: async (url, options) => {
    assert.equal(options.redirect, 'error');
    if (url.includes('testes-portal-desenvolvedor')) {
      simulations++;
      assert.equal(JSON.parse(options.body).pix, bankCharge.pixCopiaECola);
    } else {
      assert.equal(new URL(url).hostname, 'api.extranet.hm.bb.com.br');
      if (options.method === 'PUT') { creates++; assert.equal(JSON.parse(options.body).valor.original, '1.00'); }
    }
    return { ok: true, json: async () => bankCharge };
  } });
  try {
    assert.equal((await service.create(id, '1.00')).state, 'pending');
    await service.create(id, '1.00'); assert.equal(creates, 1);
    await assert.rejects(service.create(id, '2.00'));
    assert.equal((await service.simulate(id)).state, 'pending');
    await assert.rejects(service.simulate(id), /já foi solicitada/);
    assert.equal(simulations, 1);
    bankCharge = paid();
    assert.equal((await service.check(id)).state, 'paid');
    await service.simulate(id); assert.equal(simulations, 1);
    assert.equal(service.list().length, 1);
  } finally { service.close(); }
});
test('uncertain creation retains id; no duplicate PUT; TLS errors fail closed', async () => {
  let attempts = 0;
  const service = createPixService({ databasePath: ':memory:', authorize: async () => ({ token: 'fake', config: { appKey: 'fake' } }), fetcher: async (_, options) => {
    if (options.method === 'PUT') attempts++;
    throw Object.assign(new Error('network'), { cause: { code: 'SELF_SIGNED_CERT_IN_CHAIN' } });
  } });
  try {
    await assert.rejects(service.create(id, '1.00'), /certificado HTTPS/);
    await assert.rejects(service.create(id, '1.00'), /certificado HTTPS/);
    assert.equal(attempts, 1);
    assert.equal(service.list()[0].state, 'creating');
  } finally { service.close(); }
});
