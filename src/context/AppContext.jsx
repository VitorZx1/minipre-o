import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { seedProducts, seedSuppliers, seedFinanceiro, seedUsers, seedCompras, seedEstoque } from '../data/seed';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

function loadFromStorage(key, defaultData) {
  try {
    const saved = localStorage.getItem(`mini-preco-${key}`);
    return saved ? JSON.parse(saved) : defaultData;
  } catch {
    return defaultData;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(`mini-preco-${key}`, JSON.stringify(data));
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(() => loadFromStorage('products', seedProducts));
  const [suppliers, setSuppliers] = useState(() => loadFromStorage('suppliers', seedSuppliers));
  const [financeiro, setFinanceiro] = useState(() => loadFromStorage('financeiro', seedFinanceiro));
  const [users, setUsers] = useState(() => loadFromStorage('users', seedUsers));
  const [compras, setCompras] = useState(() => loadFromStorage('compras', seedCompras));
  const [estoque, setEstoque] = useState(() => loadFromStorage('estoque', seedEstoque));
  const [auditLog, setAuditLog] = useState(() => loadFromStorage('audit', []));
  const [toast, setToast] = useState(null);

  // Persist data
  useEffect(() => { saveToStorage('products', products); }, [products]);
  useEffect(() => { saveToStorage('suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveToStorage('financeiro', financeiro); }, [financeiro]);
  useEffect(() => { saveToStorage('users', users); }, [users]);
  useEffect(() => { saveToStorage('compras', compras); }, [compras]);
  useEffect(() => { saveToStorage('estoque', estoque); }, [estoque]);
  useEffect(() => { saveToStorage('audit', auditLog); }, [auditLog]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addAudit = useCallback((module, action, record, description) => {
    setAuditLog(prev => [{
      id: Date.now(),
      at: new Date().toISOString(),
      user: user?.name || 'ADMINISTRADOR',
      module,
      action,
      record: String(record || '—'),
      description,
      station: 'LOCAL'
    }, ...prev].slice(0, 2000));
  }, [user]);

  // Auth
  const login = useCallback(async (loginStr, password) => {
    const found = users.find(u => u.login.toLowerCase() === loginStr.toLowerCase());
    if (loginStr === 'adm' && password === 'adm') {
      const admin = { login: 'adm', name: 'ADMINISTRADOR', sector: 'Administrativo', status: 'Ativo', permissions: null };
      setUser(admin);
      addAudit('Segurança', 'Acesso', 'adm', 'Login realizado com sucesso');
      return { success: true };
    }
    if (found && found.status === 'Ativo') {
      setUser(found);
      addAudit('Segurança', 'Acesso', found.login, 'Login realizado com sucesso');
      return { success: true };
    }
    return { success: false, error: 'Login ou senha inválidos.' };
  }, [users, addAudit]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const can = useCallback((action, module) => {
    if (!user || user.permissions === null) return true;
    if (user.login === 'adm') return true;
    const key = `${action}:${module}`;
    return user.permissions?.includes(key) || user.permissions?.includes(`${action} ${module}`);
  }, [user]);

  // Products CRUD
  const addProduct = useCallback((product) => {
    setProducts(prev => [...prev, { ...product, id: `PROD-${String(prev.length + 1).padStart(3, '0')}` }]);
    addAudit('Produtos', 'Inclusão', product.id, 'Produto cadastrado');
    showToast('Produto cadastrado com sucesso!');
  }, [addAudit, showToast]);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addAudit('Produtos', 'Alteração', id, 'Produto atualizado');
    showToast('Produto atualizado!');
  }, [addAudit, showToast]);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    addAudit('Produtos', 'Exclusão', id, 'Produto arquivado');
    showToast('Produto arquivado.');
  }, [addAudit, showToast]);

  const inactivateProduct = useCallback((id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'Inativo' } : p));
    addAudit('Produtos', 'Inativação', id, 'Produto inativado');
    showToast('Produto inativado.');
  }, [addAudit, showToast]);

  // Suppliers CRUD
  const addSupplier = useCallback((supplier) => {
    setSuppliers(prev => [...prev, { ...supplier, id: `SUP-${String(prev.length + 1).padStart(3, '0')}` }]);
    addAudit('Fornecedores', 'Inclusão', supplier.name, 'Fornecedor cadastrado');
    showToast('Fornecedor cadastrado!');
  }, [addAudit, showToast]);

  const updateSupplier = useCallback((id, updates) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addAudit('Fornecedores', 'Alteração', id, 'Fornecedor atualizado');
    showToast('Fornecedor atualizado!');
  }, [addAudit, showToast]);

  const toggleSupplierStatus = useCallback((id) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Ativo' ? 'Inativo' : 'Ativo' } : s));
    addAudit('Fornecedores', 'Alteração', id, 'Status alterado');
    showToast('Status do fornecedor alterado.');
  }, [addAudit, showToast]);

  // Financeiro CRUD
  const addFinanceiro = useCallback((entry) => {
    setFinanceiro(prev => [{ ...entry, id: `FIN-${String(prev.length + 1).padStart(3, '0')}` }, ...prev]);
    addAudit('Financeiro', 'Inclusão', entry.description, 'Lançamento criado');
    showToast('Lançamento criado!');
  }, [addAudit, showToast]);

  // Users CRUD
  const addUser = useCallback((userData) => {
    setUsers(prev => [...prev, { ...userData, permissions: [] }]);
    addAudit('Usuários', 'Inclusão', userData.login, 'Usuário criado');
    showToast('Usuário criado!');
  }, [addAudit, showToast]);

  const updateUser = useCallback((login, updates) => {
    setUsers(prev => prev.map(u => u.login === login ? { ...u, ...updates } : u));
    addAudit('Usuários', 'Alteração', login, 'Usuário atualizado');
    showToast('Usuário atualizado!');
  }, [addAudit, showToast]);

  const deleteUser = useCallback((login) => {
    setUsers(prev => prev.map(u => u.login === login ? { ...u, status: 'Arquivado' } : u));
    addAudit('Usuários', 'Arquivamento', login, 'Usuário arquivado');
    showToast('Usuário arquivado.');
  }, [addAudit, showToast]);

  const inactivateUser = useCallback((login) => {
    setUsers(prev => prev.map(u => u.login === login ? { ...u, status: 'Inativo' } : u));
    addAudit('Usuários', 'Inativação', login, 'Usuário inativado');
    showToast('Usuário inativado.');
  }, [addAudit, showToast]);

  // Compras CRUD
  const addCompra = useCallback((compra) => {
    setCompras(prev => [...prev, { ...compra, id: `PED-${new Date().getFullYear()}-${String(prev.length + 1).padStart(3, '0')}` }]);
    addAudit('Compras', 'Inclusão', compra.id, 'Pedido de compra criado');
    showToast('Pedido de compra criado!');
  }, [addAudit, showToast]);

  const updateCompra = useCallback((id, updates) => {
    setCompras(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addAudit('Compras', 'Alteração', id, 'Pedido atualizado');
    showToast('Pedido atualizado!');
  }, [addAudit, showToast]);

  const deleteCompra = useCallback((id) => {
    setCompras(prev => prev.filter(c => c.id !== id));
    addAudit('Compras', 'Exclusão', id, 'Pedido de compra excluído');
    showToast('Pedido excluído.');
  }, [addAudit, showToast]);

  const addObservacao = useCallback((compraId, observacao) => {
    setCompras(prev => prev.map(c => {
      if (c.id === compraId) {
        return { ...c, observacoes: [...(c.observacoes || []), observacao] };
      }
      return c;
    }));
    addAudit('Compras', 'Observação', compraId, 'Observação adicionada ao pedido');
    showToast('Observação adicionada!');
  }, [addAudit, showToast]);

  // Estoque CRUD
  const addEstoque = useCallback((mov) => {
    setEstoque(prev => [...prev, { ...mov, id: `MOV-${String(prev.length + 1).padStart(3, '0')}` }]);
    addAudit('Estoque', 'Inclusão', mov.id, 'Movimentação registrada');
    showToast('Movimentação registrada!');
  }, [addAudit, showToast]);

  // Dashboard metrics
  const metrics = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'Ativo').length,
    inStock: products.filter(p => p.status === 'Ativo' && p.stock > 10).length,
    lowStock: products.filter(p => p.status === 'Ativo' && p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    inactive: products.filter(p => p.status === 'Inativo').length,
    pendingOrders: compras.filter(c => c.status === 'Pendente').length,
    monthlyRevenue: financeiro.filter(f => f.type === 'Receita').reduce((sum, f) => sum + f.value, 0),
  };

  const value = {
    user, login, logout, can,
    products, addProduct, updateProduct, deleteProduct, inactivateProduct,
    suppliers, addSupplier, updateSupplier, toggleSupplierStatus,
    financeiro, addFinanceiro,
    users, addUser, updateUser, deleteUser, inactivateUser,
    compras, addCompra, updateCompra, deleteCompra, addObservacao,
    estoque, addEstoque,
    auditLog,
    metrics,
    toast, showToast,
    addAudit,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
