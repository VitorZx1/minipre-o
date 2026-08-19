import { useApp } from '../context/AppContext';
import { AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

function AlertItem({ alert }) {
  const colors = {
    danger: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[alert.level] || colors.info}`}>
      <p className="text-sm font-medium">{alert.title}</p>
      <p className="text-xs opacity-75 mt-0.5">{alert.text}</p>
    </div>
  );
}

export default function Dashboard() {
  const { metrics, products, compras, financeiro } = useApp();

  // Build alerts
  const alerts = [];
  products.forEach(p => {
    if (p.status === 'Ativo' && p.stock <= 5) {
      alerts.push({ level: 'danger', title: `${p.name} — estoque crítico`, text: `Apenas ${p.stock} unidade(s) em estoque.` });
    } else if (p.status === 'Ativo' && p.stock <= 10) {
      alerts.push({ level: 'warning', title: `${p.name} — estoque baixo`, text: `${p.stock} unidade(s) restante(s).` });
    }
  });
  compras?.forEach(c => {
    if (c.status === 'Pendente') {
      alerts.push({ level: 'warning', title: `Pedido ${c.id}`, text: `Pedido de ${c.supplier} aguardando processamento.` });
    }
  });

  const today = new Date().toLocaleDateString('pt-BR');

  // Top products by stock
  const topProducts = [...products]
    .filter(p => p.status === 'Ativo')
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 8)
    .map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      estoque: p.stock,
    }));

  // Financial data grouped by date
  const financialByDate = {};
  financeiro.forEach(f => {
    const date = f.date;
    if (!financialByDate[date]) {
      financialByDate[date] = { date, receitas: 0, despesas: 0 };
    }
    if (f.type === 'Receita') {
      financialByDate[date].receitas += f.value;
    } else {
      financialByDate[date].despesas += Math.abs(f.value);
    }
  });
  const financialData = Object.values(financialByDate).reverse();

  // Recent purchases
  const recentCompras = compras?.slice(0, 4) || [];

  const CustomTooltip = ({ active, payload, label, showCurrency }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-800 mb-1">{label}</p>
          {payload.map((p, i) => {
            const val = p.value;
            let color = p.color;
            let text = '';
            if (showCurrency) {
              text = `R$ ${val.toLocaleString('pt-BR')}`;
            } else {
              color = val > 0 ? '#16a34a' : '#dc2626';
              text = val > 0 ? `${val.toLocaleString('pt-BR')} unidades` : `- ${Math.abs(val).toLocaleString('pt-BR')} unidades`;
            }
            return (
              <p key={i} className="text-xs font-medium" style={{ color }}>
                {p.name}: {text}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Painel do Mercado</h1>
        <p className="text-sm text-gray-500">Visão geral — {today}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{metrics.totalProducts}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Pedidos Pendentes</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{metrics.pendingOrders}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Receita do Mês</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">R$ {metrics.monthlyRevenue.toLocaleString('pt-BR')}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar Chart - Top Products */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Produtos por Estoque</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip showCurrency={false} />} />
                <Bar dataKey="estoque" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Fluxo Financeiro</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickFormatter={(val) => val.split('/')[0] + '/' + val.split('/')[1]}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip showCurrency={true} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Purchases */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-red-500" />
            Pedidos Recentes
          </h3>
          <div className="space-y-3">
            {recentCompras.map((c, i) => {
              const statusColors = {
                'Pendente': 'bg-amber-100 text-amber-700',
                'Em andamento': 'bg-blue-100 text-blue-700',
                'Concluído': 'bg-green-100 text-green-700',
              };
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.id}</p>
                    <p className="text-xs text-gray-500">{c.supplier} — {c.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">R$ {c.total.toLocaleString('pt-BR')}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas do Mercado
            {alerts.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {alerts.length > 0 ? alerts.slice(0, 5).map((alert, i) => (
              <AlertItem key={i} alert={alert} />
            )) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                <p className="font-medium text-gray-600">Tudo certo!</p>
                <p>Nenhuma pendência encontrada no mercado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
