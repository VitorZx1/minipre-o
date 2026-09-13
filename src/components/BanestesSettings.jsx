import { useEffect, useState } from 'react';
import SettingsSelect from './SettingsSelect';
import SavedCredential from './SavedCredential';
import PixBankPicker from './PixBankPicker';
import BBSettings from './BBSettings';
import { localServer } from '../services/localServer';

export default function BanestesSettings() {
  const [bank, setBank] = useState('bb');
  return <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
    <h2 className="font-semibold text-gray-800">Configuração do Pix</h2>
    <PixBankPicker bank={bank} onChange={setBank} />
    {bank === 'bb' ? <BBSettings /> : bank === 'banestes' ? <BankConfiguration /> : <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Nome cadastrado. A integração deste banco ainda não foi implementada. Adicionar o nome não conecta a conta nem confirma pagamentos.</p>}
  </section>;
}

function BankConfiguration() {
  const [status, setStatus] = useState(null);
  const [environment, setEnvironment] = useState('sandbox');
  const [error, setError] = useState('');
  const [clientId, setClientId] = useState('');
  const [authorization, setAuthorization] = useState('');
  const [replace, setReplace] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const updated = await localServer.saveBanestesCredentials({ clientId, authorization, environment, replace, expectedRevision: status?.revision });
      setStatus(updated); setClientId(''); setAuthorization(''); setReplace(false); setEditing(false);
      setSuccess('Credenciais salvas no cofre do Windows. Isso ainda não ativa a conexão bancária.');
    } catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }
  async function refresh() {
    setError(''); setSaving(true);
    try { setStatus(await localServer.banestesStatus(environment)); }
    catch { setError('Reinicie o servidor local para carregar a configuração Banestes.'); }
    finally { setSaving(false); }
  }
  useEffect(() => {
    let active = true;
    localServer.banestesStatus(environment).then(value => {
      if (!active) return;
      if (value.environment !== environment) {
        setError('Reinicie o servidor local para carregar a seleção de ambientes.');
        return;
      }
      setStatus(value);
    })
      .catch(() => { if (active) setError('Reinicie o servidor local para carregar a configuração Banestes.'); });
    return () => { active = false; };
  }, [environment]);
  return <div className="space-y-4">
    <SettingsSelect label="Ambiente" disabled={saving} value={environment} onChange={value => { setEnvironment(value); setStatus(null); setClientId(''); setAuthorization(''); setReplace(false); setError(''); setSuccess(''); setEditing(false); }} options={[{ value: 'sandbox', label: 'Sandbox — somente testes' }, { value: 'production', label: 'Production — produção' }]} />
    <p className="text-sm text-amber-700">Conexão ainda não validada</p>
    {environment === 'production' && <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">Use credenciais de uma aplicação Production aprovada pelo banco. Elas serão guardadas separadamente das de Sandbox. Salvar aqui não ativa pagamentos reais: ainda faltam certificado e validação da integração.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
    {status && <dl className="grid grid-cols-2 gap-3 text-sm">
      <dt>Certificado da API</dt><dd>Pendente</dd>
      <dt>Pagamentos reais</dt><dd>Desativados</dd>
    </dl>}
    {status?.authorizationStored && !editing && <div key={`${environment}-${status.revision}`} className="space-y-4 border-t border-gray-200 pt-4">
      <h3 className="font-medium">Credenciais salvas</h3>
      <SavedCredential label="Client ID" field="clientId" environment={environment} />
      <SavedCredential label="Autorização (authorization)" field="authorization" environment={environment} />
      <p className="text-xs text-gray-500">O olhinho mostra o valor por 15 segundos. Ao sair da janela, ele será ocultado novamente.</p>
      <button type="button" onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Substituir credenciais</button>
    </div>}
    {(!status?.configured || editing) && <form onSubmit={save} autoComplete="off" className="space-y-4 border-t border-gray-200 pt-4">
      <h3 className="font-medium">{status?.configured ? 'Substituir credenciais' : 'Cadastrar credenciais'}</h3>
      <fieldset disabled={saving || !status || Boolean(status.error)} className="space-y-4 disabled:opacity-50">
        <label className="block text-sm text-gray-700">Client ID<input required value={clientId} onChange={event => setClientId(event.target.value)} spellCheck={false} autoCapitalize="none" maxLength={100} placeholder="Cole o Client ID fornecido pelo Banestes" className="mt-1 w-full border rounded-lg p-2.5" /></label>
        <label className="block text-sm text-gray-700">Autorização (authorization)<input required type="password" value={authorization} onChange={event => setAuthorization(event.target.value)} autoComplete="new-password" spellCheck={false} maxLength={4096} placeholder="Cole a autorização fornecida pelo Banestes" className="mt-1 w-full border rounded-lg p-2.5" /></label>
        <p className="text-xs text-gray-500">Cole a autorização da API, não sua senha bancária. Após salvar, os campos aparecerão ocultos. Para substituir, informe as duas credenciais novamente.</p>
        {status?.configured && <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={replace} onChange={event => setReplace(event.target.checked)} className="mt-1" />Confirmo que desejo substituir as credenciais de {environment === 'sandbox' ? 'Sandbox' : 'Production'} salvas neste computador.</label>}
        <div className="flex gap-3"><button disabled={!clientId.trim() || !authorization.trim() || (status?.configured && !replace)} type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Salvando com proteção...' : 'Salvar credenciais'}</button><button type="button" onClick={() => { setClientId(''); setAuthorization(''); setReplace(false); }} className="px-4 py-2 border rounded-lg text-sm">Limpar campos</button></div>
      </fieldset>
    </form>}
    {editing && <button type="button" onClick={() => { setEditing(false); setClientId(''); setAuthorization(''); setReplace(false); }} className="text-sm text-gray-600 underline">Cancelar substituição</button>}
    <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">{status?.error || status?.message || 'É necessário cadastrar as credenciais e o certificado para validar o acesso.'} As credenciais são consultadas apenas ao clicar no olhinho e não são persistidas no armazenamento do navegador.</p>
    <p className="text-xs text-gray-500">O cofre pertence a este usuário do Windows. Em outro computador, será necessário configurar as credenciais novamente. A autorização compartilhada na conversa deve ser substituída antes do uso regular.</p>
    <button disabled={saving || !status} onClick={refresh} className="px-4 py-2 border rounded-lg text-sm">Conferir credenciais salvas</button>
    <p className="text-xs text-gray-500">Este botão consulta o cofre deste computador e atualiza as informações acima. Não testa a conexão com o banco, não confirma pagamentos e não reinicia o servidor.</p>
  </div>;
}
