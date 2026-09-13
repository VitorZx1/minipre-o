import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Financeiro from './pages/Financeiro';
import Fornecedores from './pages/Fornecedores';
import Usuarios from './pages/Usuarios';
import Permissoes from './pages/Permissoes';
import Auditoria from './pages/Auditoria';
import Compras from './pages/Compras';
import ArmazenamentoLocal from './pages/ArmazenamentoLocal';
import PDV from './pages/PDV';
import Relatorios from './pages/Relatorios';
import Clientes from './pages/Clientes';
import Layout from './components/Layout';
import Toast from './components/Toast';

function ProtectedRoute({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="fornecedores" element={<Fornecedores />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="permissoes" element={<Permissoes />} />
        <Route path="auditoria" element={<Auditoria />} />
        <Route path="compras" element={<Compras />} />
        <Route path="pdv" element={<PDV />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="configuracao-local" element={<ArmazenamentoLocal />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toast />
      </BrowserRouter>
    </AppProvider>
  );
}
