import { useEffect, useState } from 'react';
import SettingsSelect from './SettingsSelect';
import SavedCredential from './SavedCredential';
import CredentialInput from './CredentialInput';
import PixSandboxPanel from './PixSandboxPanel';
import { localServer } from '../services/localServer';
import { parseBBCredentials } from '../services/bbCredentials';

export default function BBSettings() {
  const [environment, setEnvironment] = useState('sandbox');
  return <div className="space-y-4">
    <SettingsSelect label="Ambiente" value={environment} onChange={setEnvironment} options={[{ value: 'sandbox', label: 'Sandbox — testes' }, { value: 'production', label: 'Production — cadastro de credenciais' }]} />
    <BBForm key={environment} environment={environment} />
  </div>;
}
function BBForm({ environment }) {
  const [status, setStatus] = useState(null);
  const [fields, setFields] = useState({ appKey: '', clientId: '', clientSecret: '' });
  const [editing, setEditing] = useState(false);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    localServer.bb('status', { environment }).then(value => { if (active) setStatus(value); }).catch(() => { if (active) setError('Não foi possível carregar o BB. Reinicie o servidor local após a atualização.'); });
    return () => { active = false; };
  }, [environment]);
  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error('Escolha o arquivo TXT de credenciais do BB (até 64 KB).');
      setFields(parseBBCredentials(await file.text())); setError(''); setMessage('Arquivo lido. Confira o ambiente e clique em Salvar credenciais.');
    } catch (failure) { setError(failure.message); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      setStatus(await localServer.bb('credentials', { ...fields, environment, replace, expectedRevision: status?.revision }));
      setFields({ appKey: '', clientId: '', clientSecret: '' }); setEditing(false); setReplace(false);
      setMessage('Credenciais salvas no cofre do Windows. Você já pode testar a autenticação em Sandbox.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function test() {
    setBusy(true); setError(''); setMessage('');
    try { const result = await localServer.bb('test', { environment }); setMessage(result.message); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <p className="text-sm text-gray-600">Preencha os três campos abaixo ou importe o TXT exportado pelo portal do Banco do Brasil. Basic é calculado pelo sistema; registrationAccessToken não é necessário para este teste.</p>
    {environment === 'production' && <p className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">Produção ainda não habilitada neste aplicativo. Você pode guardar as credenciais separadamente, mas não gerar pagamentos reais. A aprovação no portal do BB não altera o ambiente aqui.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">{message}</p>}
    {status?.configured && !editing ? <div className="space-y-3">
      {[['appKey', 'App Key'], ['clientId', 'Client ID'], ['clientSecret', 'Client Secret']].map(([field, label]) => <SavedCredential key={`${field}-${status.revision}`} provider="bb" environment={environment} field={field} label={label} />)}
      <button onClick={() => setEditing(true)} disabled={busy} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Substituir credenciais</button>
    </div> : <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy || !status} className="space-y-4 disabled:opacity-50">
        <label className="inline-block cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm">Importar arquivo de credenciais<input type="file" accept=".txt,text/plain" onChange={importFile} className="block mt-2 text-xs" /></label>
        {[['appKey', 'App Key'], ['clientId', 'Client ID'], ['clientSecret', 'Client Secret']].map(([field, label]) => <CredentialInput key={field} label={label} value={fields[field]} onChange={event => setFields({ ...fields, [field]: event.target.value })} />)}
        <p className="text-xs text-gray-500">Use o olhinho para conferir cada campo antes de salvar. O valor é ocultado novamente após 15 segundos ou ao sair da janela.</p>
        {status?.configured && <label className="flex gap-2 text-sm"><input type="checkbox" required checked={replace} onChange={event => setReplace(event.target.checked)} />Confirmo a substituição das credenciais deste ambiente.</label>}
        <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm">Salvar credenciais</button>
        {editing && <button type="button" onClick={() => { setEditing(false); setFields({ appKey: '', clientId: '', clientSecret: '' }); setReplace(false); }} className="ml-3 text-sm">Cancelar</button>}
      </fieldset>
    </form>}
    <button disabled={busy || !status?.configured || editing || environment !== 'sandbox'} onClick={test} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50">{busy ? 'Aguarde...' : 'Testar autenticação com o BB'}</button>
    <p className="text-xs text-gray-500">O teste solicita um token de acesso ao BB. Não cria cobrança, não confirma Pix, não altera estoque nem financeiro. Pagamentos reais permanecem bloqueados.</p>
    <p className="text-xs text-gray-500">As credenciais ficam criptografadas para este usuário do Windows, fora do código e do banco de dados. Para mudar de computador, cadastre-as novamente nesta tela.</p>
    {status?.configured && environment === 'sandbox' && !editing && <PixSandboxPanel />}
  </div>;
}
