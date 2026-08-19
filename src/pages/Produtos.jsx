import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Edit, Trash2, Power, Search, X } from 'lucide-react';
import { categories, units } from '../data/seed';

export default function Produtos() {
  const { products, addProduct, updateProduct, deleteProduct, inactivateProduct, can } = useApp();
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'new', 'edit', 'confirmDelete'
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({});

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search || p.id.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || p.category === filterCategory;
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, filterCategory, filterStatus]);

  const columns = [
    { header: 'Código', accessor: 'id', width: '100px' },
    { header: 'Descrição', accessor: 'name' },
    { header: 'Categoria', accessor: 'category', render: (row) => <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">{row.category}</span> },
    { header: 'Unidade', accessor: 'unit', width: '80px' },
    { header: 'Preço Custo', accessor: 'cost', render: (row) => <span className="text-gray-500">R$ {Number(row.cost).toFixed(2)}</span> },
    { header: 'Preço Venda', accessor: 'price', render: (row) => <span className="font-semibold text-emerald-600">R$ {Number(row.price).toFixed(2)}</span> },
    { header: 'Estoque', accessor: 'stock', render: (row) => {
      const color = row.stock === 0 ? 'text-red-600 bg-red-50' : row.stock <= 10 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
      return <span className={`px-2 py-1 rounded-md text-xs font-bold ${color}`}>{row.stock}</span>;
    }},
    { header: 'Fornecedor', accessor: 'supplier' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {row.status}
      </span>
    )},
  ];

  const handleNew = () => {
    setForm({ name: '', category: 'Mercearia', unit: 'Unidade', cost: '', price: '', stock: 0, supplier: '', status: 'Ativo' });
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
      addProduct({ ...form, id: `PROD-${String(products.length + 1).padStart(3, '0')}` });
    } else if (modalType === 'edit') {
      updateProduct(selected.id, form);
    }
    setModalOpen(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    setModalType('confirmDelete');
    setModalOpen(true);
  };

  const confirmDelete = () => {
    deleteProduct(selected.id);
    setModalOpen(false);
    setSelected(null);
  };

  const handleInactivate = () => {
    if (!selected) return;
    inactivateProduct(selected.id);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cadastro de Produtos</h1>
          <p className="text-sm text-gray-500">Produtos, categorias, preços e códigos de barras</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo produto
        </button>
        <button onClick={handleEdit} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Edit className="w-4 h-4" /> Editar
        </button>
        <button onClick={handleInactivate} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Power className="w-4 h-4" /> Inativar
        </button>
        <button onClick={handleDelete} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Trash2 className="w-4 h-4" /> Arquivar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
          >
            <option value="">Todas categorias</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
          >
            <option value="">Todos status</option>
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
          </select>
          <div className="flex items-end">
            <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterStatus(''); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={setSelected}
        selectedId={selected?.id}
        emptyMessage="Nenhum produto encontrado"
      />

      <div className="text-sm text-gray-500">
        {filtered.length} produto{filtered.length !== 1 ? 's' : ''} localizado{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen && modalType !== 'confirmDelete'}
        onClose={() => setModalOpen(false)}
        title={modalType === 'new' ? 'Novo Produto' : `Editar ${selected?.name || ''}`}
        onSave={handleSave}
      >
        <div className="grid grid-cols-2 gap-4">
          {modalType === 'edit' && (
            <FormField label="Código" value={form.id} disabled className="col-span-2" />
          )}
          <FormField label="Descrição" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" className="col-span-2" required />
          <FormField label="Categoria" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories.map(c => ({ value: c, label: c }))} />
          <FormField label="Unidade" type="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} options={units.map(u => ({ value: u, label: u }))} />
          <FormField label="Preço Custo (R$)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" />
          <FormField label="Preço Venda (R$)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          <FormField label="Estoque Atual" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
          <FormField label="Fornecedor" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Nome do fornecedor" />
          <FormField label="Situação" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }]} />
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'confirmDelete'}
        onClose={() => setModalOpen(false)}
        title="Confirmar Arquivamento"
        onSave={confirmDelete}
        saveLabel="Arquivar"
        saveClass="bg-red-600 hover:bg-red-700"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700">Deseja arquivar o produto <strong>{selected?.name}</strong>?</p>
          <p className="text-sm text-gray-500 mt-2">O registro será removido da listagem principal.</p>
        </div>
      </Modal>
    </div>
  );
}
