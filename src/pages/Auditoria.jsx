import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import { Search, ClipboardList } from 'lucide-react';

export default function Auditoria() {
  const { auditLog } = useApp();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const filtered = useMemo(() => {
    return auditLog.filter(item => {
      const matchSearch = !search || item.description.toLowerCase().includes(search.toLowerCase()) || item.user.toLowerCase().includes(search.toLowerCase());
      const matchModule = !filterModule || item.module === filterModule;
      const matchAction = !filterAction || item.action === filterAction;
      return matchSearch && matchModule && matchAction;
    });
  }, [auditLog, search, filterModule, filterAction]);

  const modules = [...new Set(auditLog.map(a => a.module))];
  const actions = [...new Set(auditLog.map(a => a.action))];

  const columns = [
    { header: 'Data e hora', accessor: 'at', render: (row) => (
      <span className="text-xs text-gray-500">{new Date(row.at).toLocaleString('pt-BR')}</span>
    )},
    { header: 'Usuário', accessor: 'user' },
    { header: 'Módulo', accessor: 'module', render: (row) => (
      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">{row.module}</span>
    )},
    { header: 'Ação', accessor: 'action', render: (row) => {
      const colors = {
        'Inclusão': 'bg-emerald-50 text-emerald-700',
        'Alteração': 'bg-amber-50 text-amber-700',
        'Exclusão': 'bg-red-50 text-red-700',
        'Acesso': 'bg-blue-50 text-blue-700',
        'Inativação': 'bg-orange-50 text-orange-700',
        'Arquivamento': 'bg-gray-100 text-gray-600',
      };
      return <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[row.action] || 'bg-gray-100 text-gray-600'}`}>{row.action}</span>;
    }},
    { header: 'Registro', accessor: 'record' },
    { header: 'Descrição', accessor: 'description' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Auditoria do Sistema</h1>
          <p className="text-sm text-gray-500">Histórico de acessos, alterações e operações realizadas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            <option value="">Todos módulos</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            <option value="">Todas ações</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="Nenhuma ação registrada" />

      <div className="text-sm text-gray-500">{filtered.length} registro(s) encontrado(s)</div>
    </div>
  );
}
