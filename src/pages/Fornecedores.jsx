import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Edit, Power, Search } from 'lucide-react';
import { supplierCategories } from '../data/seed';

export default function Fornecedores() {
  const { suppliers, addSupplier, updateSupplier, toggleSupplierStatus } = useApp();
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState({});

  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.cnpj.includes(search);
      const matchCategory = !filterCategory || s.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [suppliers, search, filterCategory]);

  const columns = [
    { header: 'Fornecedor', accessor: 'name' },
    { header: 'Categoria', accessor: 'category', render: (row) => <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">{row.category}</span> },
    { header: 'CNPJ', accessor: 'cnpj' },
    { header: 'Cidade', accessor: 'city' },
    { header: 'Contato', accessor: 'contact' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {row.status}
      </span>
    )},
  ];

  const handleNew = () => {
    setForm({ name: '', category: 'Atacado', cnpj: '', city: '', contact: '', billingPeriod: 'Mensal', status: 'Ativo' });
    setModalType('new');
    setModalOpen(true);
  };

  const handleEdit = () => {
    if (!selected) return;
    setForm({ ...selected });
    setModalType('edit');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (modalType === 'new') {
      addSupplier({ ...form, id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}` });
    } else {
      updateSupplier(selected.id, form);
    }
    setModalOpen(false);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>
        <p className="text-sm text-gray-500">Cadastro de fornecedores e parceiros comerciais</p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo fornecedor
        </button>
        <button onClick={handleEdit} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40">
          <Edit className="w-4 h-4" /> Editar
        </button>
        <button onClick={() => { if (selected) toggleSupplierStatus(selected.id); setSelected(null); }} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-40">
          <Power className="w-4 h-4" /> Ativar/Inativar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar fornecedor..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <FormField label="" type="select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} options={[{ value: '', label: 'Todas categorias' }, ...supplierCategories.map(c => ({ value: c, label: c }))]} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} onRowClick={setSelected} selectedId={selected?.id} emptyMessage="Nenhum fornecedor encontrado" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalType === 'new' ? 'Novo Fornecedor' : `Editar ${selected?.name || ''}`} onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2" placeholder="Razão social" />
          <FormField label="Categoria" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={supplierCategories.map(c => ({ value: c, label: c }))} />
          <FormField label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
          <FormField label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <FormField label="Contato" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Telefone ou e-mail" />
          <FormField label="Período Faturamento" type="select" value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })} options={['Mensal', 'Quinzenal', 'Semanal', 'Avulso'].map(p => ({ value: p, label: p }))} />
          <FormField label="Situação" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={['Ativo', 'Inativo'].map(s => ({ value: s, label: s }))} />
        </div>
      </Modal>
    </div>
  );
}
