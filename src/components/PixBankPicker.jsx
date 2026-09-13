import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import SettingsSelect from './SettingsSelect';
import { localServer } from '../services/localServer';
const builtInBanks = [{ value: 'banestes', label: 'Banestes' }, { value: 'bb', label: 'Banco do Brasil' }];

export default function PixBankPicker({ bank, onChange }) {
  const [banks, setBanks] = useState(builtInBanks);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    localServer.getSetting('pix-bank-names').then(({ value }) => {
      if (active && Array.isArray(value)) setBanks([...builtInBanks, ...value.filter(item => typeof item?.value === 'string' && item.value.startsWith('custom-') && typeof item.label === 'string')]);
    }).catch(() => { if (active) setError('Não foi possível carregar os bancos. Verifique o servidor local.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function add(event) {
    event.preventDefault();
    const label = name.trim().replace(/\s+/g, ' ');
    if (!label || busy) return;
    if (banks.some(item => item.label.toLocaleLowerCase('pt-BR') === label.toLocaleLowerCase('pt-BR'))) { setError('Esse banco já está na lista.'); return; }
    const item = { value: `custom-${crypto.randomUUID()}`, label };
    const updated = [...banks, item];
    setBusy(true); setError('');
    try {
      await localServer.setSetting('pix-bank-names', updated.filter(entry => entry.value.startsWith('custom-')));
      setBanks(updated); onChange(item.value); setName(''); setAdding(false);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <SettingsSelect label="Banco" value={bank} options={banks} onChange={onChange} disabled={busy} />
    <button type="button" disabled={busy} onClick={() => setAdding(!adding)} className="flex items-center gap-2 text-sm font-medium text-red-600"><Plus size={16} />Adicionar banco</button>
    {adding && <form onSubmit={add} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"><label className="block text-sm">Nome do banco<input autoFocus required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Digite o nome do banco" className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-red-500" /></label><p className="text-xs text-gray-500">Cadastra somente o nome. A integração depende da API de cada banco.</p><button disabled={busy || !name.trim()} className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Adicionando...' : 'Adicionar'}</button></form>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}
