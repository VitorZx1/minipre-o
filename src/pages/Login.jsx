import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/mini-preco-logo-v2.png';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);
  const { login: authLogin } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password) {
      setError('Preencha login e senha.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await authLogin(login.trim(), password);
    setLoading(false);
    if (result.success) {
      setEntering(true);
      setTimeout(() => navigate('/pdv'), 2600);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-white via-red-50 to-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-50 rounded-full opacity-50 blur-3xl"></div>
      </div>

      {entering && (
        <div className="login-entry-overlay fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white" role="status" aria-live="polite" aria-label="Entrando no Caixa Mini Preço">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#fff_0%,_#fff5f5_48%,_#fee2e2_100%)]" />
          <div className="login-entry-glow absolute h-72 w-72 rounded-full bg-red-200/50 blur-3xl" />
          <div className="relative flex h-full w-full max-w-3xl flex-col items-center justify-center">
            <div className="login-logo-drop absolute top-[25%] w-64">
              <img src={logo} alt="Mini Preço Variedades" className="w-full object-contain drop-shadow-xl" />
            </div>

            <div className="login-cart-run absolute top-[34%] h-44 w-64 text-red-600" aria-hidden="true">
              <svg viewBox="0 0 300 190" className="h-full w-full overflow-visible drop-shadow-xl">
                <g className="login-groceries">
                  <path d="M98 72V35c0-8 6-14 14-14h17c8 0 14 6 14 14v37" fill="#ef4444" />
                  <path d="M108 20h25v12h-25z" fill="#b91c1c" />
                  <path d="M154 74V28h37v46" fill="#dc2626" />
                  <path d="M162 37h21v21h-21z" fill="#fff" opacity=".88" />
                  <path d="M201 75V42c0-9 7-16 16-16s16 7 16 16v33" fill="#f87171" />
                  <path d="M208 26c0-10 4-17 9-22 5 5 9 12 9 22" fill="#b91c1c" />
                  <circle cx="78" cy="60" r="20" fill="#ef4444" />
                  <path d="M77 39c2-13 13-18 22-14-4 9-11 14-22 14Z" fill="#991b1b" />
                </g>
                <g className="login-cart-vector" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M28 35h24l17 91h151c10 0 18-6 21-16l18-62H61" strokeWidth="12" />
                  <path d="M76 88h155M95 48l8 78m47-78v78m48-78-9 78" strokeWidth="6" opacity=".72" />
                  <path d="M74 126c3 17 15 25 34 25h116" strokeWidth="10" />
                  <g className="login-cart-wheel"><circle cx="105" cy="169" r="14" strokeWidth="9" /><path d="M105 158v22M94 169h22" strokeWidth="3" /></g>
                  <g className="login-cart-wheel login-cart-wheel-two"><circle cx="211" cy="169" r="14" strokeWidth="9" /><path d="M211 158v22M200 169h22" strokeWidth="3" /></g>
                </g>
              </svg>
              <div className="login-speed-lines absolute left-[-110px] top-24 space-y-3"><span className="block h-1 w-24 rounded-full bg-red-500" /><span className="ml-8 block h-1 w-16 rounded-full bg-red-300" /><span className="block h-1 w-20 rounded-full bg-red-400" /></div>
            </div>

            <div className="login-progress-wrap absolute bottom-[22%] w-72 text-center">
              <p className="login-loading-label mb-3 text-sm font-bold uppercase tracking-[0.24em] text-red-700">Preparando o caixa</p>
              <div className="h-2 overflow-hidden rounded-full bg-red-100 shadow-inner"><div className="login-progress-bar h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-red-700" /></div>
              <p className="mt-3 text-xs text-gray-500">Carregando produtos e formas de pagamento...</p>
            </div>
          </div>
        </div>
      )}

      <div className={`relative w-full max-w-md ${entering ? 'pointer-events-none opacity-0' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Mini Preço Variedades"
            className="w-48 mx-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Acesso ao Sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Login</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Digite seu login"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 text-white font-semibold rounded-xl hover:from-red-800 hover:to-red-700 focus:ring-4 focus:ring-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Credenciais padrão: <span className="font-mono text-gray-500">adm</span> / <span className="font-mono text-gray-500">adm</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">Versão 1.0.0</p>
      </div>
    </div>
  );
}
