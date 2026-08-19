import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Edit, Trash2, Power, Search, Key } from 'lucide-react';
import { departments } from '../data/seed';

export default function Usuarios() {
  const { users, addUser, updateUser, deleteUser, inactivateUser } = useApp();
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.login.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [users, search]);

  const columns = [
    { header: 'Usuário', accessor: 'login', render: (row) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{row.login}</span> },
    { header: 'Nome completo', accessor: 'name' },
    { header: 'Departamento', accessor: 'sector' },
    { header: 'Perfil', accessor: 'login', render: () => 'Usuário' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Inativo' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
        {row.status}
      </span>
    )},
  ];

  const handleNew = () => {
    setForm({ name: '', login: '', sector: 'Operações', status: 'Ativo', password: '' });
    setModalType('new');
    setModalOpen(true);
  };

  const handleEdit = () => {
    if (!selected || selected.login === 'adm') return;
    setForm({ ...selected, password: '' });
    setModalType('edit');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (modalType === 'new') {
      if (!form.login || !form.name) return;
      addUser({ ...form, permissions: [] });
    } else {
      const updates = { ...form };
      delete updates.password;
      updateUser(selected.login, updates);
    }
    setModalOpen(false);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        <p className="text-sm text-gray-500">Cadastro e controle de acesso dos colaboradores</p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo
        </button>
        <button onClick={handleEdit} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40">
          <Edit className="w-4 h-4" /> Editar
        </button>
        <button onClick={() => { if (selected) { inactivateUser(selected.login); setSelected(null); } }} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-40">
          <Power className="w-4 h-4" /> Inativar
        </button>
        <button onClick={() => { if (selected && selected.login !== 'adm') { deleteUser(selected.login); setSelected(null); } }} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40">
          <Trash2 className="w-4 h-4" /> Arquivar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} onRowClick={setSelected} selectedId={selected?.login} emptyMessage="Nenhum usuário encontrado" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalType === 'new' ? 'Novo Usuário' : `Editar ${selected?.name || ''}`} onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2" />
          <FormField label="Departamento" type="select" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} options={departments.map(d => ({ value: d, label: d }))} />
          <FormField label="Login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} disabled={modalType === 'edit'} />
          {modalType === 'new' && <FormField label="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
          <FormField label="Situação" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={['Ativo', 'Inativo'].map(s => ({ value: s, label: s }))} />
        </div>
      </Modal>
    </div>
  );
}
