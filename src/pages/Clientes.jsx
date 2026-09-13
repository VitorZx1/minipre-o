import { useMemo, useState } from 'react';
import { CreditCard, Edit, Plus, Search, WalletCards, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';

const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const digits = value => String(value || '').replace(/\D/g, '');

export default function Clientes() {
  const { customers, customerLedger, addCustomer, updateCustomer, recordCustomerPayment, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({});
  const [accountCustomer, setAccountCustomer] = useState(null);
  const [paymentValue, setPaymentValue] = useState('');

  const balanceOf = customerId => customerLedger.filter(entry => entry.customerId === customerId).reduce((sum, entry) => sum + (entry.type === 'purchase' ? Number(entry.value) : -Number(entry.value)), 0);
  const filtered = useMemo(() => customers.filter(customer => !search || [customer.name, customer.phone, customer.cpf].some(value => String(value || '').toLowerCase().includes(search.toLowerCase()))), [customers, search]);

  const columns = [
    { header: 'Cliente', accessor: 'name', render: customer => <div><p className="font-semibold text-gray-900">{customer.name}</p><p className="text-xs text-gray-500">{customer.phone}</p></div> },
    { header: 'CPF', accessor: 'cpf', render: customer => customer.cpf || '—' },
    { header: 'Limite', accessor: 'creditLimit', render: customer => customer.creditLimit ? money(customer.creditLimit) : 'Sem limite definido' },
    { header: 'Saldo devedor', accessor: 'balance', render: customer => <strong className={balanceOf(customer.id) > 0 ? 'text-red-600' : 'text-emerald-600'}>{money(Math.max(0, balanceOf(customer.id)))}</strong> },
    { header: 'Situação', accessor: 'status', render: customer => <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{customer.status || 'Ativo'}</span> },
  ];

  function openNew() {
    setSelected(null);
    setForm({ name: '', phone: '', cpf: '', address: '', creditLimit: '' });
    setFormOpen(true);
  }

  function openEdit() {
    if (!selected) return;
    setForm({ ...selected, creditLimit: selected.creditLimit || '' });
    setFormOpen(true);
  }

  function saveCustomer() {
    const name = String(form.name || '').trim();
    const phone = digits(form.phone);
    const cpf = digits(form.cpf);
    if (!name || !phone) return showToast('Nome e telefone são obrigatórios.', 'error');
    if (cpf && cpf.length !== 11) return showToast('O CPF deve possuir 11 números.', 'error');
    if (cpf && customers.some(customer => digits(customer.cpf) === cpf && customer.id !== selected?.id)) return showToast('Este CPF já pertence a outro cliente.', 'error');
    const data = { ...form, name, phone, cpf, address: String(form.address || '').trim(), creditLimit: form.creditLimit === '' ? null : Math.max(0, Number(form.creditLimit) || 0) };
    if (selected) updateCustomer(selected.id, data);
    else addCustomer(data);
    setFormOpen(false);
    setSelected(null);
  }

  function receivePayment() {
    const value = Number(String(paymentValue).replace(',', '.'));
    const balance = balanceOf(accountCustomer.id);
    if (!value || value <= 0) return showToast('Informe um valor maior que zero.', 'error');
    if (value > balance) return showToast('O pagamento não pode ser maior que o saldo devedor.', 'error');
    recordCustomerPayment(accountCustomer, value);
    setPaymentValue('');
  }

  const accountEntries = accountCustomer ? customerLedger.filter(entry => entry.customerId === accountCustomer.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
  const accountBalance = accountCustomer ? Math.max(0, balanceOf(accountCustomer.id)) : 0;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-800">Clientes e contas</h1><p className="text-sm text-gray-500">Cadastros, compras para pagar depois e recebimentos</p></div>
    <div className="flex flex-wrap gap-3">
      <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"><Plus className="h-4 w-4" /> Novo cliente</button>
      <button disabled={!selected} onClick={openEdit} className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"><Edit className="h-4 w-4" /> Editar</button>
      <button disabled={!selected} onClick={() => { setAccountCustomer(selected); setPaymentValue(''); }} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-40"><WalletCards className="h-4 w-4" /> Ver conta</button>
    </div>
    <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome, telefone ou CPF" className="w-full rounded-xl border bg-white py-3 pl-10 pr-10 outline-none focus:border-red-400" />{search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="h-4 w-4" /></button>}</div>
    <DataTable columns={columns} data={filtered} onRowClick={setSelected} selectedId={selected?.id} emptyMessage="Nenhum cliente cadastrado" />

    <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar cliente' : 'Novo cliente'} onSave={saveCustomer} saveLabel="Salvar cliente">
      <div className="grid grid-cols-2 gap-4"><FormField label="Nome *" value={form.name || ''} onChange={event => setForm({ ...form, name: event.target.value })} className="col-span-2" required /><FormField label="Telefone *" value={form.phone || ''} onChange={event => setForm({ ...form, phone: event.target.value })} className="col-span-2" required /><FormField label="CPF (opcional)" value={form.cpf || ''} onChange={event => setForm({ ...form, cpf: event.target.value })} /><FormField label="Limite de crédito (opcional)" type="number" value={form.creditLimit ?? ''} onChange={event => setForm({ ...form, creditLimit: event.target.value })} /><FormField label="Endereço (opcional)" value={form.address || ''} onChange={event => setForm({ ...form, address: event.target.value })} className="col-span-2" /></div>
    </Modal>

    {accountCustomer && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setAccountCustomer(null)} /><div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="text-xl font-bold">Conta de {accountCustomer.name}</h2><p className="text-sm text-gray-500">{accountCustomer.phone}</p></div><button onClick={() => setAccountCustomer(null)} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="grid gap-4 border-b bg-gray-50 p-5 sm:grid-cols-2"><div className="rounded-xl bg-red-50 p-4"><p className="text-sm text-red-700">Saldo devedor</p><strong className="text-3xl text-red-700">{money(accountBalance)}</strong></div><div className="rounded-xl border bg-white p-4"><label className="text-sm font-semibold text-gray-700">Receber pagamento</label><div className="mt-2 flex gap-2"><input inputMode="decimal" value={paymentValue} onChange={event => setPaymentValue(event.target.value.replace(/[^0-9,.]/g, ''))} placeholder="R$ 0,00" className="min-w-0 flex-1 rounded-lg border px-3 py-2 outline-none focus:border-emerald-500" /><button disabled={!accountBalance} onClick={receivePayment} className="rounded-lg bg-emerald-600 px-4 font-semibold text-white disabled:bg-gray-300">Receber</button></div></div></div><div className="min-h-0 flex-1 overflow-auto p-5"><h3 className="mb-3 font-semibold text-gray-800">Histórico da conta</h3><div className="space-y-2">{accountEntries.length ? accountEntries.map(entry => <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium text-gray-800">{entry.description}</p><p className="text-xs text-gray-500">{entry.date}{entry.saleId ? ` · ${entry.saleId}` : ''}</p></div><strong className={entry.type === 'purchase' ? 'text-red-600' : 'text-emerald-600'}>{entry.type === 'purchase' ? '+' : '−'} {money(entry.value)}</strong></div>) : <div className="py-10 text-center text-gray-400"><CreditCard className="mx-auto mb-2 h-10 w-10" /><p>Nenhum movimento nesta conta</p></div>}</div></div></div></div>}
  </div>;
}
