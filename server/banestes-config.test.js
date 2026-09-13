import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('Sandbox vault: create, reject accidental overwrite, replace and redact', { skip: process.platform !== 'win32' }, async () => {
  const originalAppData = process.env.APPDATA;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-preco-vault-test-'));
  process.env.APPDATA = directory;
  try {
    const { saveBanestesSandbox, saveBanestesCredentials, getBanestesStatus, revealBanestesCredential } = await import('./banestes-config.js');
    const credentials = { clientId: '11111111-1111-1111-1111-111111111111', authorization: 'fictional-test-authorization-one' };
    assert.equal(getBanestesStatus().configured, false);
    assert.throws(() => saveBanestesSandbox({ clientId: 'invalid', authorization: 'invalid' }));
    const first = saveBanestesSandbox(credentials);
    assert.equal(first.authorizationStored, true);
    assert.equal(first.connected, false);
    assert.equal(first.environment, 'sandbox');
    assert.equal('authorization' in first, false);
    const vault = path.join(directory, 'MiniPreco', 'segredos', 'banestes-sandbox.dpapi');
    const before = fs.readFileSync(vault);
    assert.equal(before.includes(Buffer.from(credentials.authorization)), false);
    assert.throws(() => saveBanestesSandbox(credentials));
    assert.throws(() => saveBanestesSandbox({ ...credentials, replace: true, expectedRevision: 'outdated' }));
    assert.deepEqual(fs.readFileSync(vault), before);
    const updated = saveBanestesSandbox({ ...credentials, authorization: 'fictional-test-authorization-two', replace: true, expectedRevision: first.revision });
    assert.equal(updated.authorizationStored, true);
    assert.notEqual(updated.revision, first.revision);
    assert.notDeepEqual(fs.readFileSync(vault), before);
    assert.equal(JSON.stringify(updated).includes('fictional-test'), false);
    const sandboxBytes = fs.readFileSync(vault);
    assert.equal(getBanestesStatus('production').configured, false);
    const production = saveBanestesCredentials({ ...credentials, environment: 'production' });
    assert.equal(production.environment, 'production');
    assert.equal(production.connected, false);
    assert.equal(production.authorizationStored, true);
    assert.deepEqual(fs.readFileSync(vault), sandboxBytes);
    assert.equal(getBanestesStatus().revision, updated.revision);
    assert.throws(() => saveBanestesCredentials({ ...credentials, environment: '../outside' }));
    assert.throws(() => getBanestesStatus('invalid'));
    assert.equal(revealBanestesCredential('production', 'authorization'), credentials.authorization);
    assert.equal(revealBanestesCredential('sandbox', 'authorization'), 'fictional-test-authorization-two');
    assert.equal(revealBanestesCredential('sandbox', 'clientId'), credentials.clientId);
    assert.throws(() => revealBanestesCredential('sandbox', 'other'));
    assert.throws(() => revealBanestesCredential('../outside', 'authorization'));
    assert.equal(JSON.stringify(getBanestesStatus()).includes('fictional-test'), false);
  } finally {
    if (originalAppData === undefined) delete process.env.APPDATA;
    else process.env.APPDATA = originalAppData;
    // Only remove the exact temporary directory created by this test.
    fs.rmSync(directory, { recursive: true });
  }
});
