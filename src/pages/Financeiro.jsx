import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Financeiro() {
  const { financeiro, addFinanceiro } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'Receita', date: new Date().toLocaleDateString('pt-BR'), description: '', category: 'Receita', value: '', status: 'Lançado' });

  const totalReceita = financeiro.filter(f => f.value > 0).reduce((s, f) => s + f.value, 0);
  const totalDespesa = financeiro.filter(f => f.value < 0).reduce((s, f) => s + Math.abs(f.value), 0);
  const saldo = totalReceita - totalDespesa;

  const columns = [
    { header: 'Data', accessor: 'date', width: '100px' },
    { header: 'Tipo', accessor: 'type', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        row.value > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}>{row.type}</span>
    )},
    { header: 'Descrição', accessor: 'description' },
    { header: 'Categoria', accessor: 'category' },
    { header: 'Valor', accessor: 'value', render: (row) => (
      <span className={`font-semibold ${row.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {row.value >= 0 ? '+' : ''}R$ {Math.abs(row.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        row.status === 'Lançado' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
      }`}>{row.status}</span>
    )},
  ];

  const handleSave = () => {
    addFinanceiro({
      ...form,
      value: form.type === 'Receita' ? Math.abs(parseFloat(form.value) || 0) : -Math.abs(parseFloat(form.value) || 0),
    });
    setModalOpen(false);
    setForm({ type: 'Receita', date: new Date().toLocaleDateString('pt-BR'), description: '', category: 'Receita', value: '', status: 'Lançado' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
          <p className="text-sm text-gray-500">Receitas, despesas e fluxo de caixa</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Receitas</p>
              <p className="text-lg font-bold text-emerald-600">R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Despesas</p>
              <p className="text-lg font-bold text-red-600">R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo</p>
              <p className={`text-lg font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo lançamento
        </button>
      </div>

      <DataTable columns={columns} data={financeiro} emptyMessage="Nenhum lançamento encontrado" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Novo Lançamento" onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormField label="Tipo" type="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value })} options={['Receita', 'Despesa', 'Compra', 'Folha de pagamento', 'Aluguel', 'Impostos', 'Outros'].map(t => ({ value: t, label: t }))} />
          <FormField label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2" placeholder="Descrição do lançamento" />
          <FormField label="Valor (R$)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0.00" />
          <FormField label="Situação" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={['Lançado', 'Pendente', 'Pago'].map(s => ({ value: s, label: s }))} />
        </div>
      </Modal>
    </div>
  );
}
