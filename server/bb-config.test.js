import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseBBCredentials } from '../src/services/bbCredentials.js';

test('BB import keeps only needed fields', () => {
  assert.deepEqual(parseBBCredentials('appKey: fake-key\nclientID: fake-id\nclientSecret: fake-secret\nbasic: unused\nregistrationAccessToken: unused'), { appKey: 'fake-key', clientId: 'fake-id', clientSecret: 'fake-secret' });
  assert.throws(() => parseBBCredentials('basic: incomplete'));
});
test('BB encrypted vault, independent environments, safe authentication', { skip: process.platform !== 'win32' }, async () => {
  const prior = process.env.APPDATA;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-preco-bb-test-'));
  process.env.APPDATA = directory;
  try {
    const { bbStatus, saveBB, testBB } = await import('./bb-config.js');
    const fields = { appKey: 'test-key', clientId: 'test-id', clientSecret: 'test-secret', environment: 'sandbox' };
    assert.equal(bbStatus().configured, false);
    const status = saveBB(fields);
    assert.equal(JSON.stringify(status).includes('test-secret'), false);
    assert.throws(() => saveBB(fields));
    assert.throws(() => saveBB({ ...fields, environment: '../unsafe' }));
    assert.equal(bbStatus('production').configured, false);
    const bytes = fs.readFileSync(path.join(directory, 'MiniPreco', 'segredos', 'bb-sandbox.dpapi'));
    assert.equal(bytes.includes(Buffer.from('test-secret')), false);
    let calls = 0;
    const result = await testBB('sandbox', async (url, options) => {
      calls++;
      assert.equal(options.redirect, 'error');
      if (calls === 1) return { ok: true, json: async () => ({ token_endpoint: 'https://oauth.hm.bb.com.br/oauth/token' }) };
      assert.equal(url, 'https://oauth.hm.bb.com.br/oauth/token');
      assert.equal(options.body, 'grant_type=client_credentials&scope=cob.read+pix.read');
      return { ok: true, json: async () => ({ access_token: 'fake-private-token' }) };
    });
    assert.equal(result.authenticated, true);
    assert.equal(JSON.stringify(result).includes('fake-private-token'), false);
    await assert.rejects(testBB('production'), /produção/);
    await assert.rejects(testBB('sandbox', async () => { throw new Error('secret-bearing-network-error'); }), /Não foi possível acessar/);
    await assert.rejects(testBB('sandbox', async () => ({ ok: true, json: async () => ({ token_endpoint: 'https://example.com/leak' }) })), /inesperado/);
    assert.deepEqual(fs.readFileSync(path.join(directory, 'MiniPreco', 'segredos', 'bb-sandbox.dpapi')), bytes);
  } finally {
    if (prior === undefined) delete process.env.APPDATA; else process.env.APPDATA = prior;
    fs.rmSync(directory, { recursive: true });
  }
});
