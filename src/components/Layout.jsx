import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, DollarSign, Users, Shield, ClipboardList,
  ShoppingCart, FileText, LogOut, ChevronRight, Database, ScanBarcode, BarChart3
} from 'lucide-react';
import logo from '../assets/mini-preco-logo-v2.png';

const navGroups = [
  {
    label: 'Visão geral',
    items: [{ to: '/', icon: LayoutDashboard, label: 'Painel' }],
  },
  {
    label: 'Operação',
    items: [
      { to: '/pdv', icon: ScanBarcode, label: 'Caixa / PDV', primary: true },
      { to: '/produtos', icon: Package, label: 'Produtos' },
      { to: '/compras', icon: ShoppingCart, label: 'Compras' },
      { to: '/clientes', icon: Users, label: 'Clientes e contas' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
      { to: '/fornecedores', icon: FileText, label: 'Fornecedores' },
      { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { to: '/usuarios', icon: Users, label: 'Usuários' },
      { to: '/permissoes', icon: Shield, label: 'Permissões' },
      { to: '/auditoria', icon: ClipboardList, label: 'Auditoria' },
    ],
  },
];

const navItems = navGroups.flatMap(group => group.items);

export default function Layout() {
  const { user, logout, storageInfo } = useApp();
  const location = useLocation();
  const [saleInProgress, setSaleInProgress] = useState(false);

  useEffect(() => {
    const updateSaleState = event => setSaleInProgress(Boolean(event.detail));
    window.addEventListener('pdv-sale-state', updateSaleState);
    setSaleInProgress(Boolean(localStorage.getItem('mini-preco-pdv-draft')));
    return () => window.removeEventListener('pdv-sale-state', updateSaleState);
  }, []);

  const currentPage = location.pathname === '/configuracao-local'
    ? 'Armazenamento local'
    : navItems.find(item => item.to === location.pathname)?.label || 'Painel';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-gray-800 flex flex-col shadow-xl border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center justify-center border-b border-gray-100 px-6 py-2">
          <img src={logo} alt="Mini Preço" className="h-20 w-full object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex ? 'mt-4 border-t border-gray-100 pt-4' : ''}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(({ to, icon: Icon, label, primary }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => {
                      if (to === '/pdv') window.dispatchEvent(new CustomEvent('pdv-focus-scanner'));
                    }}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                          : primary
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>{label}</span>
                    <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'ADMINISTRADOR'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.sector || 'Administrativo'}</p>
            </div>
          </div>
          <button
            onClick={() => { if (!saleInProgress) logout(); }}
            disabled={saleInProgress}
            title={saleInProgress ? 'Finalize ou cancele a venda antes de sair.' : 'Sair do sistema'}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${storageInfo.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              {storageInfo.connected ? 'Dados locais conectados' : 'Dados locais indisponíveis'}
            </span>
            <span className="text-gray-300">|</span>
            <span>Unidade: MATRIZ</span>
            <span className="text-gray-300">|</span>
            {user?.login === 'adm' && (
              <NavLink to="/configuracao-local" title="Armazenamento local" className="p-1.5 rounded-md hover:bg-gray-100 hover:text-red-600 transition-colors">
                <Database className="w-4 h-4" />
              </NavLink>
            )}
            <span>v1.0.0</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
