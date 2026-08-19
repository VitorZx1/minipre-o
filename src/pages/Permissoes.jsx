import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Users, Save } from 'lucide-react';

const permissionModules = [
  { id: 'Painel', actions: ['Ver', 'Atualizar', 'Imprimir', 'Exportar'] },
  { id: 'Produtos', actions: ['Ver', 'Criar', 'Editar', 'Excluir', 'Imprimir', 'Exportar'] },
  { id: 'Compras', actions: ['Ver', 'Criar', 'Editar', 'Excluir', 'Imprimir', 'Exportar'] },
  { id: 'Estoque', actions: ['Ver', 'Criar', 'Editar', 'Excluir', 'Imprimir', 'Exportar'] },
  { id: 'Financeiro', actions: ['Ver', 'Criar', 'Editar', 'Excluir', 'Imprimir', 'Exportar'] },
  { id: 'Fornecedores', actions: ['Ver', 'Criar', 'Editar', 'Excluir', 'Imprimir', 'Exportar'] },
  { id: 'Usuários', actions: ['Ver', 'Criar', 'Editar', 'Excluir', 'Imprimir', 'Exportar'] },
  { id: 'Permissões', actions: ['Ver', 'Editar'] },
  { id: 'Relatórios', actions: ['Ver', 'Criar', 'Imprimir', 'Exportar'] },
  { id: 'Auditoria', actions: ['Ver', 'Imprimir', 'Exportar'] },
];

export default function Permissoes() {
  const { users, updateUser } = useApp();
  const [selectedLogin, setSelectedLogin] = useState('');
  const [permissions, setPermissions] = useState(new Set());

  const activeUsers = users.filter(u => u.status === 'Ativo');

  const handleSelectUser = (login) => {
    setSelectedLogin(login);
    const user = users.find(u => u.login === login);
    if (user?.permissions) {
      setPermissions(new Set(user.permissions));
    } else {
      setPermissions(new Set());
    }
  };

  const togglePermission = (action, module) => {
    const key = `${action}:${module}`;
    setPermissions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModule = (module, actions) => {
    setPermissions(prev => {
      const next = new Set(prev);
      const allChecked = actions.every(a => next.has(`${a}:${module}`));
      actions.forEach(a => {
        const key = `${a}:${module}`;
        if (allChecked) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedLogin) return;
    updateUser(selectedLogin, { permissions: [...permissions] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Permissões</h1>
          <p className="text-sm text-gray-500">Controle de acesso por usuário</p>
        </div>
        <button onClick={handleSave} disabled={!selectedLogin} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40">
          <Save className="w-4 h-4" /> Salvar
        </button>
      </div>

      {/* User selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="w-4 h-4 inline mr-1" />
          Selecionar Usuário
        </label>
        <select
          value={selectedLogin}
          onChange={(e) => handleSelectUser(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        >
          <option value="">Selecione um usuário...</option>
          <option value="adm">ADMINISTRADOR</option>
          {activeUsers.filter(u => u.login !== 'adm').map(u => (
            <option key={u.login} value={u.login}>{u.name} ({u.login})</option>
          ))}
        </select>
      </div>

      {selectedLogin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {permissionModules.map(mod => {
            const allChecked = mod.actions.every(a => permissions.has(`${a}:${mod.id}`));
            return (
              <div key={mod.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => toggleModule(mod.id, mod.actions)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{mod.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mod.actions.map(action => (
                    <label key={action} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.has(`${action}:${mod.id}`)}
                        onChange={() => togglePermission(action, mod.id)}
                        className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      {action}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
