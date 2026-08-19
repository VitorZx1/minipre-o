import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, DollarSign, Users, Shield, ClipboardList,
  ShoppingCart, FileText, LogOut, ChevronRight, Store
} from 'lucide-react';
import logo from '../assets/mini-preco-logo.png';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/compras', icon: ShoppingCart, label: 'Compras' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/fornecedores', icon: FileText, label: 'Fornecedores' },
  { to: '/usuarios', icon: Users, label: 'Usuários' },
  { to: '/permissoes', icon: Shield, label: 'Permissões' },
  { to: '/auditoria', icon: ClipboardList, label: 'Auditoria' },
];

export default function Layout() {
  const { user, logout } = useApp();
  const location = useLocation();

  const currentPage = navItems.find(item => item.to === location.pathname)?.label || 'Painel';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-gray-800 flex flex-col shadow-xl border-r border-gray-200">
        {/* Logo */}
        <div className="px-6 py-3 flex justify-center items-center border-b border-gray-200">
          <img src={logo} alt="Mini Preço" className="h-28 w-full object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
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
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
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
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Conectado
            </span>
            <span className="text-gray-300">|</span>
            <span>Unidade: MATRIZ</span>
            <span className="text-gray-300">|</span>
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
