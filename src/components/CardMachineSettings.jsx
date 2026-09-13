import { useEffect, useState } from 'react';
import { CreditCard, Plus, Save, Trash2 } from 'lucide-react';
import { localServer } from '../services/localServer';
import MercadoPagoSettings from './MercadoPagoSettings';

const emptyMachine = () => ({
  id: crypto.randomUUID(), name: '', operator: '', acceptsPix: true,
  acceptsDebit: true, acceptsCredit: true, acceptsTicket: false, active: true,
  model: '', serialNumber: '', integrationStatus: 'not-linked',
});

export default function CardMachineSettings({ showToast }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    localServer.getSetting('card-machines')
      .then(({ value }) => { if (active) setMachines(Array.isArray(value) ? value : []); })
      .catch(error => showToast(error.message, 'error'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  function update(id, field, value) {
    setMachines(current => current.map(machine => machine.id === id ? { ...machine, [field]: value } : machine));
  }

  async function save() {
    if (machines.some(machine => !machine.name.trim())) return showToast('Dê um nome para cada maquininha.', 'error');
    if (machines.some(machine => !machine.acceptsPix && !machine.acceptsDebit && !machine.acceptsCredit && !machine.acceptsTicket)) return showToast('Marque ao menos uma forma de pagamento em cada maquininha.', 'error');
    setSaving(true);
    try {
      const normalized = machines.map(machine => ({ ...machine, name: machine.name.trim(), operator: machine.operator.trim() }));
      await localServer.setSetting('card-machines', normalized);
      setMachines(normalized);
      showToast('Maquininhas salvas. Elas já aparecerão no caixa.');
    } catch (error) { showToast(error.message, 'error'); }
    finally { setSaving(false); }
  }

  return <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-gray-100">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><CreditCard className="w-5 h-5 text-blue-600" /></div><div><h2 className="font-semibold text-gray-800">Maquininhas de pagamento</h2><p className="text-xs text-gray-500">Cadastre as máquinas usadas para Pix, cartões e ticket.</p></div></div>
      <button onClick={save} disabled={loading || saving} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"><Save size={16} />{saving ? 'Salvando...' : 'Salvar maquininhas'}</button>
    </div>
    <div className="p-6 space-y-4">
      <MercadoPagoSettings showToast={showToast} />
      {!loading && machines.length === 0 && <div className="text-center py-7 border-2 border-dashed border-gray-200 rounded-xl text-gray-500"><CreditCard className="w-9 h-9 mx-auto mb-2 text-gray-300" /><p className="font-medium">Nenhuma maquininha cadastrada</p><p className="text-sm">Adicione as máquinas que sua mãe utiliza.</p></div>}
      {machines.map((machine, index) => <div key={machine.id} className="rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex justify-between items-center"><strong className="text-gray-800">Maquininha {index + 1}</strong><button onClick={() => setMachines(current => current.filter(item => item.id !== machine.id))} className="flex items-center gap-1 text-sm text-red-600"><Trash2 size={15} /> Remover</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">Nome para identificar<input value={machine.name} onChange={event => update(machine.id, 'name', event.target.value)} placeholder="Ex.: Maquininha do balcão" maxLength={60} className="mt-1.5 w-full px-3 py-2.5 border rounded-lg" /></label>
          <label className="text-sm text-gray-700">Operadora / marca<input value={machine.operator} onChange={event => update(machine.id, 'operator', event.target.value)} placeholder="Ex.: Ton, PagBank, Stone..." maxLength={60} className="mt-1.5 w-full px-3 py-2.5 border rounded-lg" /></label>
          <label className="text-sm text-gray-700">Modelo<input value={machine.model || ''} onChange={event => update(machine.id, 'model', event.target.value)} placeholder="Nome escrito na etiqueta da máquina" maxLength={80} className="mt-1.5 w-full px-3 py-2.5 border rounded-lg" /></label>
          <label className="text-sm text-gray-700">Número de série (opcional)<input value={machine.serialNumber || ''} onChange={event => update(machine.id, 'serialNumber', event.target.value)} placeholder="Número da etiqueta" maxLength={100} className="mt-1.5 w-full px-3 py-2.5 border rounded-lg" /></label>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 px-3 py-1.5 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-amber-500" />Não vinculada ao caixa</div>
        <div><p className="text-sm font-medium text-gray-700 mb-2">O que esta maquininha aceita?</p><div className="flex flex-wrap gap-2">
          {[["acceptsPix", "Pix"], ["acceptsDebit", "Débito"], ["acceptsCredit", "Crédito"], ["acceptsTicket", "Ticket / benefício"]].map(([field, label]) => <label key={field} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer ${machine[field] ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}><input type="checkbox" checked={machine[field]} onChange={event => update(machine.id, field, event.target.checked)} className="accent-red-600" />{label}</label>)}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"><input type="checkbox" checked={machine.active} onChange={event => update(machine.id, 'active', event.target.checked)} className="accent-red-600" />Ativa no caixa</label>
        </div></div>
      </div>)}
      <button onClick={() => setMachines(current => [...current, emptyMachine()])} disabled={loading || saving} className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"><Plus size={17} />Adicionar maquininha</button>
    </div>
  </section>;
}
