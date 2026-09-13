import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Store, ArrowRight, LogIn } from 'lucide-react';
import logo from '../assets/mini-preco-logo-v2.png';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-red-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">Mini Preço</h1>
            <p className="text-xs text-red-600 font-medium">Variedades</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Versão 1.0.0</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-end sm:items-center justify-center p-6 pb-16">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-red-200/30 blur-3xl rounded-full scale-150"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-red-500/20 p-8 border border-red-100">
              <img
                src={logo}
                alt="Mini Preço Variedades"
                className="w-72 mx-auto object-contain"
              />
            </div>
          </div>

          {/* Welcome text */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-800">
              Bem-vindo ao <span className="text-red-600">Mini Preço</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-md mx-auto">
              Preços baixos todos os dias. Gerencie seu mercado com facilidade.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <button
                onClick={() => navigate('/app')}
                className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all shadow-lg shadow-red-600/30 text-lg"
              >
                <ArrowRight className="w-5 h-5" />
                Acessar o Sistema
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all shadow-lg shadow-red-600/30 text-lg"
              >
                <LogIn className="w-5 h-5" />
                Entrar no Sistema
              </button>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="bg-white rounded-xl border border-red-100 p-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Store className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Gestão Completa</h3>
              <p className="text-xs text-gray-500 mt-1">Produtos, estoque e financeiro</p>
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Store className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Fornecedores</h3>
              <p className="text-xs text-gray-500 mt-1">Controle de compras e pedidos</p>
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Store className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Relatórios</h3>
              <p className="text-xs text-gray-500 mt-1">Auditoria e permissões</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 bg-white/80 backdrop-blur-sm border-t border-red-100">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <p>&copy; 2026 Mini Preço Variedades. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">              <span>Usuário: {user?.name || 'Visitante'}</span>
            <span>Unidade: MATRIZ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
