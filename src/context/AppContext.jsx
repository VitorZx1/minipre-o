import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { seedUsers } from '../data/seed';
import { localServer } from '../services/localServer';

const AppContext = createContext();

const defaultReceiptSettings = {
  companyName: 'MINI PREÇO VARIEDADES',
  legalName: '',
  cnpj: '',
  address: '',
  city: '',
  phone: '',
  logo: '',
  footerMessage: 'Obrigado pela preferência!\nVolte sempre!',
  showOperator: true,
  showProductCode: false,
  paperWidth: '80',
  copies: 1,
  autoPrint: true,
};

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
  const [products, setProducts] = useState(() => loadFromStorage('products', []));
  const [suppliers, setSuppliers] = useState(() => loadFromStorage('suppliers', []));
  const [financeiro, setFinanceiro] = useState(() => loadFromStorage('financeiro', []));
  const [users, setUsers] = useState(() => loadFromStorage('users', seedUsers.filter(item => item.login === 'adm')));
  const [compras, setCompras] = useState(() => loadFromStorage('compras', []));
  const [estoque, setEstoque] = useState(() => loadFromStorage('estoque', []));
  const [vendas, setVendas] = useState(() => loadFromStorage('vendas', []));
  const [auditLog, setAuditLog] = useState(() => loadFromStorage('audit', []));
  const [customers, setCustomers] = useState(() => loadFromStorage('customers', []));
  const [customerLedger, setCustomerLedger] = useState(() => loadFromStorage('customerLedger', []));
  const [toast, setToast] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ connected: false });
  const [receiptSettings, setReceiptSettings] = useState(() => loadFromStorage('receipt-settings', defaultReceiptSettings));

  useEffect(() => {
    let active = true;
    async function connectStorage() {
      try {
        const [info, stored, receiptResponse, initializedResponse, cleanupResponse] = await Promise.all([localServer.health(), localServer.loadAll(), localServer.getSetting('receipt'), localServer.getSetting('data-initialized'), localServer.getSetting('example-data-cleared-v1')]);
        if (!active) return;
        setStorageInfo(info);
        if (receiptResponse.value) {
          const mergedSettings = { ...defaultReceiptSettings, ...receiptResponse.value };
          setReceiptSettings(mergedSettings);
          saveToStorage('receipt-settings', mergedSettings);
        } else {
          await localServer.setSetting('receipt', receiptSettings);
        }
        let effectiveStored = stored;
        if (cleanupResponse.value !== true) {
          const administrator = [...(stored.users || []), ...users, ...seedUsers].find(item => item.login === 'adm') || seedUsers[0];
          effectiveStored = { products: [], suppliers: [], financeiro: [], users: [administrator], compras: [], estoque: [], vendas: [], audit: [], customers: [], customerLedger: [] };
          await Promise.all(Object.entries(effectiveStored).map(([collection, records]) => localServer.saveCollection(collection, records)));
          await localServer.setSetting('example-data-cleared-v1', true);
        }
        const localSnapshot = { products, suppliers, financeiro, users, compras, estoque, vendas, audit: auditLog, customers, customerLedger };
        const setters = { products: setProducts, suppliers: setSuppliers, financeiro: setFinanceiro, users: setUsers, compras: setCompras, estoque: setEstoque, vendas: setVendas, audit: setAuditLog, customers: setCustomers, customerLedger: setCustomerLedger };
        const databaseAlreadyUsed = initializedResponse.value === true || cleanupResponse.value !== true || Object.values(effectiveStored).some(records => records?.length);
        for (const [collection, records] of Object.entries(localSnapshot)) {
          if (databaseAlreadyUsed) {
            const databaseRecords = effectiveStored[collection] || [];
            setters[collection](databaseRecords);
            saveToStorage(collection, databaseRecords);
          } else if (records.length) {
            await localServer.saveCollection(collection, records);
          }
        }
        await localServer.setSetting('data-initialized', true);
      } catch {
        if (active) setStorageInfo({ connected: false, error: 'Serviço local indisponível' });
      } finally {
        if (active) setStorageReady(true);
      }
    }
    connectStorage();
    return () => { active = false; };
    // O retrato inicial é usado somente na primeira conexão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((collection, records) => {
    if (!storageReady || !storageInfo.connected) return;
    localServer.saveCollection(collection, records).catch(error => {
      setStorageInfo(previous => ({ ...previous, connected: false, error: error.message }));
    });
  }, [storageReady, storageInfo.connected]);

  // Persist data
  useEffect(() => { saveToStorage('products', products); persist('products', products); }, [products, persist]);
  useEffect(() => { saveToStorage('suppliers', suppliers); persist('suppliers', suppliers); }, [suppliers, persist]);
  useEffect(() => { saveToStorage('financeiro', financeiro); persist('financeiro', financeiro); }, [financeiro, persist]);
  useEffect(() => { saveToStorage('users', users); persist('users', users); }, [users, persist]);
  useEffect(() => { saveToStorage('compras', compras); persist('compras', compras); }, [compras, persist]);
  useEffect(() => { saveToStorage('estoque', estoque); persist('estoque', estoque); }, [estoque, persist]);
  useEffect(() => { saveToStorage('vendas', vendas); persist('vendas', vendas); }, [vendas, persist]);
  useEffect(() => { saveToStorage('audit', auditLog); persist('audit', auditLog); }, [auditLog, persist]);
  useEffect(() => { saveToStorage('customers', customers); persist('customers', customers); }, [customers, persist]);
  useEffect(() => { saveToStorage('customerLedger', customerLedger); persist('customerLedger', customerLedger); }, [customerLedger, persist]);

  const refreshStorageInfo = useCallback(async () => {
    const info = await localServer.health();
    setStorageInfo(info);
    return info;
  }, []);

  const changeStorageDirectory = useCallback(async (directory) => {
    const info = await localServer.setStorageDirectory(directory);
    setStorageInfo(info);
    return info;
  }, []);

  const updateReceiptSettings = useCallback(async (settings) => {
    const normalized = { ...defaultReceiptSettings, ...settings };
    if (storageInfo.connected) await localServer.setSetting('receipt', normalized);
    setReceiptSettings(normalized);
    saveToStorage('receipt-settings', normalized);
    return normalized;
  }, [storageInfo.connected]);

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
    if (found && found.status === 'Ativo' && found.password === password) {
      setUser(found);
      addAudit('Segurança', 'Acesso', found.login, 'Login realizado com sucesso');
      return { success: true };
    }
    return { success: false, error: 'Login ou senha inválidos.' };
  }, [users, addAudit]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const authorizeManager = useCallback((loginStr, password) => {
    const normalizedLogin = String(loginStr || '').trim().toLowerCase();
    if (normalizedLogin === 'adm' && password === 'adm') return { success: true, manager: 'ADMINISTRADOR' };
    const manager = users.find(candidate => candidate.login.toLowerCase() === normalizedLogin && candidate.status === 'Ativo');
    const privileged = manager && (manager.permissions === null || manager.sector === 'Administrativo' || manager.role === 'CEO');
    if (privileged && manager.password === password) return { success: true, manager: manager.name };
    return { success: false, error: 'Usuário ou senha de administrador/dono inválidos.' };
  }, [users]);

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

  // Clientes e contas a receber
  const addCustomer = useCallback((customer) => {
    const created = { ...customer, id: `CLI-${Date.now()}`, status: 'Ativo', createdAt: new Date().toISOString() };
    setCustomers(previous => [created, ...previous]);
    addAudit('Clientes', 'Inclusão', created.id, `Cliente ${created.name} cadastrado.`);
    showToast('Cliente cadastrado com sucesso!');
    return created;
  }, [addAudit, showToast]);

  const updateCustomer = useCallback((id, updates) => {
    setCustomers(previous => previous.map(customer => customer.id === id ? { ...customer, ...updates } : customer));
    addAudit('Clientes', 'Alteração', id, 'Cadastro do cliente atualizado.');
    showToast('Cliente atualizado!');
  }, [addAudit, showToast]);

  const recordCustomerPayment = useCallback((customer, amount) => {
    const now = new Date();
    const entry = { id: `CC-${Date.now()}`, customerId: customer.id, customerName: customer.name, type: 'payment', value: Number(amount), date: now.toLocaleDateString('pt-BR'), createdAt: now.toISOString(), description: 'Pagamento recebido' };
    setCustomerLedger(previous => [entry, ...previous]);
    setFinanceiro(previous => [{ id: `FIN-${Date.now()}`, date: entry.date, type: 'Receita', description: `Recebimento de ${customer.name}`, category: 'Conta de cliente', value: entry.value, status: 'Lançado' }, ...previous]);
    addAudit('Clientes', 'Pagamento', customer.id, `Pagamento de R$ ${entry.value.toFixed(2)} recebido.`);
    showToast('Pagamento registrado no financeiro!');
    return entry;
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

  const finalizeSale = useCallback((sale) => {
    const now = new Date();
    const id = `VEN-${now.getFullYear()}-${String(Date.now()).slice(-7)}`;
    const completedSale = { ...sale, id, createdAt: now.toISOString(), operator: user?.name || 'ADMINISTRADOR', status: 'Concluída' };
    setVendas(prev => [completedSale, ...prev]);
    setProducts(prev => prev.map(product => {
      const item = sale.items.find(entry => entry.productId === product.id);
      return item ? { ...product, stock: Math.max(0, Number(product.stock) - item.quantity) } : product;
    }));
    setEstoque(prev => [
      ...sale.items.map((item, index) => ({
        id: `MOV-${Date.now()}-${index}`,
        date: now.toLocaleDateString('pt-BR'),
        type: 'Saída', product: item.name, quantity: -item.quantity,
        document: id, responsible: user?.name || 'ADMINISTRADOR', status: 'Concluído',
      })),
      ...prev,
    ]);
    if (sale.onAccount && sale.customer?.id) {
      setCustomerLedger(prev => [{ id: `CC-${Date.now()}`, customerId: sale.customer.id, customerName: sale.customer.name, saleId: id, type: 'purchase', value: sale.total, date: now.toLocaleDateString('pt-BR'), createdAt: now.toISOString(), description: `Compra ${id}` }, ...prev]);
    } else {
      setFinanceiro(prev => [{
        id: `FIN-${Date.now()}`, date: now.toLocaleDateString('pt-BR'), type: 'Receita',
        description: `Venda ${id}`, category: 'Venda PDV', value: sale.total, status: 'Lançado',
      }, ...prev]);
    }
    addAudit('PDV', 'Venda', id, `Venda finalizada no valor de R$ ${sale.total.toFixed(2)}`);
    return completedSale;
  }, [user, addAudit]);

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
    user, login, logout, authorizeManager, can,
    products, addProduct, updateProduct, deleteProduct, inactivateProduct,
    suppliers, addSupplier, updateSupplier, toggleSupplierStatus,
    financeiro, addFinanceiro,
    users, addUser, updateUser, deleteUser, inactivateUser,
    compras, addCompra, updateCompra, deleteCompra, addObservacao,
    estoque, addEstoque,
    vendas, finalizeSale,
    customers, customerLedger, addCustomer, updateCustomer, recordCustomerPayment,
    auditLog,
    metrics,
    toast, showToast,
    addAudit,
    storageInfo, storageReady, refreshStorageInfo, changeStorageDirectory,
    receiptSettings, updateReceiptSettings,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
