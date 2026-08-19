import { useState } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Warehouse } from 'lucide-react';

export default function Estoque() {
  const { estoque, addEstoque, products } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toLocaleDateString('pt-BR'), type: 'Entrada', product: '', quantity: '', document: '', responsible: '', status: 'Concluído' });

  const columns = [
    { header: 'Data', accessor: 'date', width: '100px' },
    { header: 'Tipo', accessor: 'type', render: (row) => {
      const colors = { 'Entrada': 'bg-emerald-100 text-emerald-700', 'Saída': 'bg-red-100 text-red-700', 'Ajuste': 'bg-amber-100 text-amber-700', 'Devolução': 'bg-blue-100 text-blue-700' };
      return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[row.type] || 'bg-gray-100 text-gray-600'}`}>{row.type}</span>;
    }},
    { header: 'Produto', accessor: 'product' },
    { header: 'Quantidade', accessor: 'quantity', render: (row) => <span className={`font-semibold ${row.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{row.quantity > 0 ? '+' : ''}{row.quantity}</span> },
    { header: 'Documento', accessor: 'document' },
    { header: 'Responsável', accessor: 'responsible' },
    { header: 'Situação', accessor: 'status', render: (row) => {
      const colors = { 'Concluído': 'bg-emerald-100 text-emerald-700', 'Pendente': 'bg-amber-100 text-amber-700' };
      return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[row.status] || 'bg-gray-100 text-gray-600'}`}>{row.status}</span>;
    }},
  ];

  const handleSave = () => {
    addEstoque({ ...form, quantity: parseInt(form.quantity) || 0 });
    setModalOpen(false);
    setForm({ date: new Date().toLocaleDateString('pt-BR'), type: 'Entrada', product: '', quantity: '', document: '', responsible: '', status: 'Concluído' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="w-6 h-6 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Movimentações de Estoque</h1>
          <p className="text-sm text-gray-500">Entradas, saídas, ajustes e inventário</p>
        </div>
      </div>

      <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
        <Plus className="w-4 h-4" /> Nova movimentação
      </button>

      <DataTable columns={columns} data={estoque} emptyMessage="Nenhuma movimentação encontrada" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Movimentação" onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormField label="Tipo" type="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={['Entrada', 'Saída', 'Ajuste', 'Devolução'].map(t => ({ value: t, label: t }))} />
          <FormField label="Produto" type="select" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} options={products.filter(p => p.status === 'Ativo').map(p => ({ value: p.name, label: p.name }))} className="col-span-2" />
          <FormField label="Quantidade" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <FormField label="Documento" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder="NF, OS, etc." />
          <FormField label="Responsável" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <FormField label="Situação" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={['Concluído', 'Pendente'].map(s => ({ value: s, label: s }))} />
        </div>
      </Modal>
    </div>
  );
}
