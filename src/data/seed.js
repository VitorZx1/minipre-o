// Produtos iniciais do mercado
export const seedProducts = [
  { id: 'PROD-001', name: 'Arroz Tipo 1 5kg', category: 'Mercearia', unit: 'kg', cost: '4.50', price: '5.99', stock: 120, supplier: 'Atacarejo Central', status: 'Ativo' },
  { id: 'PROD-002', name: 'Feijão Carioca 1kg', category: 'Mercearia', unit: 'kg', cost: '3.20', price: '4.49', stock: 95, supplier: 'Atacarejo Central', status: 'Ativo' },
  { id: 'PROD-003', name: 'Óleo de Soja 900ml', category: 'Mercearia', unit: 'Unidade', cost: '4.80', price: '6.49', stock: 80, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-004', name: 'Açúcar Cristal 1kg', category: 'Mercearia', unit: 'kg', cost: '3.10', price: '4.29', stock: 110, supplier: 'Atacarejo Central', status: 'Ativo' },
  { id: 'PROD-005', name: 'Café Torrado 500g', category: 'Mercearia', unit: 'kg', cost: '12.00', price: '16.99', stock: 45, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-006', name: 'Macarrão Espaguete 500g', category: 'Mercearia', unit: 'Unidade', cost: '2.80', price: '3.99', stock: 200, supplier: 'Atacarejo Central', status: 'Ativo' },
  { id: 'PROD-007', name: 'Extrato de Tomate 340g', category: 'Mercearia', unit: 'Unidade', cost: '2.50', price: '3.49', stock: 150, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-008', name: 'Leite Integral 1L', category: 'Hortifruti', unit: 'Litro', cost: '4.20', price: '5.49', stock: 300, supplier: 'Frigorífico Sul', status: 'Ativo' },
  { id: 'PROD-009', name: 'Queijo Mussarela 500g', category: 'Frios e Laticínios', unit: 'kg', cost: '28.00', price: '35.99', stock: 30, supplier: 'Frigorífico Sul', status: 'Ativo' },
  { id: 'PROD-010', name: 'Presunto Fatiado 200g', category: 'Frios e Laticínios', unit: 'Unidade', cost: '8.50', price: '11.99', stock: 40, supplier: 'Frigorífico Sul', status: 'Ativo' },
  { id: 'PROD-011', name: 'Cerveja Lata 350ml', category: 'Bebidas', unit: 'Unidade', cost: '2.80', price: '4.49', stock: 500, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-012', name: 'Refrigerante 2L', category: 'Bebidas', unit: 'Unidade', cost: '5.50', price: '7.99', stock: 180, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-013', name: 'Água Mineral 500ml', category: 'Bebidas', unit: 'Unidade', cost: '1.20', price: '1.99', stock: 400, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-014', name: 'Sabão em Pó 1kg', category: 'Limpeza', unit: 'kg', cost: '6.50', price: '8.99', stock: 60, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-015', name: 'Detergente 500ml', category: 'Limpeza', unit: 'Unidade', cost: '2.20', price: '3.49', stock: 90, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-016', name: 'Shampoo 400ml', category: 'Higiene Pessoal', unit: 'Unidade', cost: '9.00', price: '12.99', stock: 35, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-017', name: 'Sabonete 90g', category: 'Higiene Pessoal', unit: 'Unidade', cost: '1.80', price: '2.99', stock: 200, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-018', name: 'Pão Francês 1kg', category: 'Padaria', unit: 'kg', cost: '6.00', price: '8.99', stock: 80, supplier: 'Produtor Rural Verde', status: 'Ativo' },
  { id: 'PROD-019', name: 'Bolo de Chocolate 500g', category: 'Padaria', unit: 'Unidade', cost: '8.00', price: '12.99', stock: 20, supplier: 'Produtor Rural Verde', status: 'Ativo' },
  { id: 'PROD-020', name: 'Frango Inteiro Resfriado 1kg', category: 'Açougue', unit: 'kg', cost: '7.50', price: '10.99', stock: 50, supplier: 'Frigorífico Sul', status: 'Ativo' },
  { id: 'PROD-021', name: 'Carne Moída 500g', category: 'Açougue', unit: 'kg', cost: '18.00', price: '24.99', stock: 25, supplier: 'Frigorífico Sul', status: 'Ativo' },
  { id: 'PROD-022', name: 'Linguiça Toscana 1kg', category: 'Açougue', unit: 'kg', cost: '14.00', price: '19.99', stock: 30, supplier: 'Frigorífico Sul', status: 'Ativo' },
  { id: 'PROD-023', name: 'Pizza Congelada 400g', category: 'Congelados', unit: 'Unidade', cost: '12.00', price: '17.99', stock: 40, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-024', name: 'Sorvete 1L', category: 'Congelados', unit: 'Unidade', cost: '14.00', price: '19.99', stock: 25, supplier: 'Distribuidora Norte', status: 'Ativo' },
  { id: 'PROD-025', name: 'Banana Prata 1kg', category: 'Hortifruti', unit: 'kg', cost: '3.50', price: '5.49', stock: 60, supplier: 'Produtor Rural Verde', status: 'Ativo' },
  { id: 'PROD-026', name: 'Tomate Italiano 1kg', category: 'Hortifruti', unit: 'kg', cost: '5.00', price: '7.99', stock: 45, supplier: 'Produtor Rural Verde', status: 'Ativo' },
  { id: 'PROD-027', name: 'Cebola 1kg', category: 'Hortifruti', unit: 'kg', cost: '3.00', price: '4.49', stock: 80, supplier: 'Produtor Rural Verde', status: 'Ativo' },
  { id: 'PROD-028', name: 'Batata 1kg', category: 'Hortifruti', unit: 'kg', cost: '4.00', price: '5.99', stock: 70, supplier: 'Produtor Rural Verde', status: 'Ativo' },
  { id: 'PROD-029', name: 'Batata Palha 500g', category: 'Mercearia', unit: 'Unidade', cost: '4.50', price: '6.49', stock: 30, supplier: 'Atacarejo Central', status: 'Ativo' },
  { id: 'PROD-030', name: 'Molho de Pimenta 200ml', category: 'Mercearia', unit: 'Unidade', cost: '5.00', price: '7.49', stock: 25, supplier: 'Distribuidora Norte', status: 'Ativo' },
];

export const seedSuppliers = [
  { id: 'SUP-001', name: 'Atacarejo Central', category: 'Atacarejo', cnpj: '12.345.678/0001-90', city: 'Linhares', contact: '(27) 99999-0001', billingPeriod: 'Mensal', status: 'Ativo' },
  { id: 'SUP-002', name: 'Distribuidora Norte', category: 'Distribuidora', cnpj: '23.456.789/0001-01', city: 'São Mateus', contact: '(27) 99999-0002', billingPeriod: 'Quinzenal', status: 'Ativo' },
  { id: 'SUP-003', name: 'Frigorífico Sul', category: 'Frigorífico', cnpj: '34.567.890/0001-12', city: 'Governador Valadares', contact: '(33) 99999-0003', billingPeriod: 'Semanal', status: 'Ativo' },
  { id: 'SUP-004', name: 'Produtor Rural Verde', category: 'Produtor rural', cnpj: '45.678.901/0001-23', city: 'Rio Bananal', contact: '(27) 99999-0004', billingPeriod: 'Semanal', status: 'Ativo' },
];

export const seedFinanceiro = [
  { id: 'FIN-001', date: '11/08/2026', type: 'Receita', description: 'Vendas do dia 10/08', category: 'Receita', value: 4580.00, status: 'Lançado' },
  { id: 'FIN-002', date: '11/08/2026', type: 'Despesa', description: 'Energia elétrica - Agosto', category: 'Despesa', value: -1850.00, status: 'Lançado' },
  { id: 'FIN-003', date: '10/08/2026', type: 'Receita', description: 'Vendas do dia 09/08', category: 'Receita', value: 3920.00, status: 'Lançado' },
  { id: 'FIN-004', date: '10/08/2026', type: 'Compra', description: 'Pedido PED-2026-002', category: 'Compra', value: -3800.00, status: 'Pendente' },
  { id: 'FIN-005', date: '09/08/2026', type: 'Despesa', description: 'Aluguel - Agosto', category: 'Aluguel', value: -8500.00, status: 'Lançado' },
  { id: 'FIN-006', date: '09/08/2026', type: 'Receita', description: 'Vendas do dia 08/08', category: 'Receita', value: 5120.00, status: 'Lançado' },
  { id: 'FIN-007', date: '08/08/2026', type: 'Compra', description: 'Pedido PED-2026-004', category: 'Compra', value: -890.00, status: 'Lançado' },
  { id: 'FIN-008', date: '08/08/2026', type: 'Despesa', description: 'Folha de pagamento', category: 'Folha de pagamento', value: -12400.00, status: 'Lançado' },
];

export const seedUsers = [
  { login: 'adm', name: 'ADMINISTRADOR', sector: 'Administrativo', status: 'Ativo', permissions: null },
  { login: 'ana.paula', name: 'Ana Paula Martins', sector: 'Operações', status: 'Ativo', permissions: [] },
  { login: 'camila', name: 'Camila Souza', sector: 'Caixa', status: 'Ativo', permissions: [] },
  { login: 'gabriel', name: 'Gabriel Costa', sector: 'Estoque', status: 'Ativo', permissions: [] },
  { login: 'rafael', name: 'Rafael Luz', sector: 'Financeiro', status: 'Ativo', permissions: [] },
];

export const seedCompras = [
  {
    id: 'PED-2026-001',
    date: '11/08/2026',
    dateFechamento: '',
    supplier: 'Atacarejo Central',
    description: 'Pedido feito com Atacarejo Central no dia 11/08/2026',
    total: 2450.00,
    totalReal: null,
    status: 'Pendente',
    observacoes: [
      { text: 'Pedido feito com Atacarejo Central no dia 11/08/2026', user: 'Sistema', attachment: null, attachmentName: null, createdAt: '11/08/2026' }
    ]
  },
  {
    id: 'PED-2026-002',
    date: '10/08/2026',
    dateFechamento: '',
    supplier: 'Distribuidora Norte',
    description: 'Pedido feito com Distribuidora Norte no dia 10/08/2026',
    total: 3800.00,
    totalReal: null,
    status: 'Em andamento',
    observacoes: [
      { text: 'Pedido feito com Distribuidora Norte no dia 10/08/2026', user: 'Sistema', attachment: null, attachmentName: null, createdAt: '10/08/2026' }
    ]
  },
  {
    id: 'PED-2026-003',
    date: '09/08/2026',
    dateFechamento: '12/08/2026',
    supplier: 'Frigorífico Sul',
    description: 'Pedido feito com Frigorífico Sul no dia 09/08/2026',
    total: 1950.00,
    totalReal: 1950.00,
    status: 'Concluído',
    observacoes: [
      { text: 'Pedido feito com Frigorífico Sul no dia 09/08/2026', user: 'Sistema', attachment: null, attachmentName: null, createdAt: '09/08/2026' },
      { text: 'Produtos entregues na mercearia, conferido, e nota lançada', user: 'ADMINISTRADOR', attachment: null, attachmentName: 'NF-Frigorifico-003.pdf', createdAt: '12/08/2026' }
    ]
  },
  {
    id: 'PED-2026-004',
    date: '08/08/2026',
    dateFechamento: '11/08/2026',
    supplier: 'Produtor Rural Verde',
    description: 'Pedido feito com Produtor Rural Verde no dia 08/08/2026',
    total: 890.00,
    totalReal: 890.00,
    status: 'Concluído',
    observacoes: [
      { text: 'Pedido feito com Produtor Rural Verde no dia 08/08/2026', user: 'Sistema', attachment: null, attachmentName: null, createdAt: '08/08/2026' },
      { text: 'Produtos entregues na mercearia, conferido, e nota lançada', user: 'ADMINISTRADOR', attachment: null, attachmentName: 'NF-ProdutorRural-004.pdf', createdAt: '11/08/2026' }
    ]
  },
];

export const seedEstoque = [
  { id: 'MOV-001', date: '11/08/2026', type: 'Entrada', product: 'Arroz Tipo 1 5kg', quantity: 50, document: 'NF-2026-0891', responsible: 'Administrador', status: 'Concluído' },
  { id: 'MOV-002', date: '11/08/2026', type: 'Saída', product: 'Cerveja Lata 350ml', quantity: 120, document: 'Venda PDV-0452', responsible: 'Caixa Ana', status: 'Concluído' },
  { id: 'MOV-003', date: '10/08/2026', type: 'Ajuste', product: 'Leite Integral 1L', quantity: -5, document: 'Inventário', responsible: 'Estoque Lucas', status: 'Concluído' },
  { id: 'MOV-004', date: '10/08/2026', type: 'Entrada', product: 'Sabão em Pó 1kg', quantity: 30, document: 'NF-2026-0890', responsible: 'Administrador', status: 'Concluído' },
  { id: 'MOV-005', date: '09/08/2026', type: 'Devolução', product: 'Pizza Congelada 400g', quantity: 10, document: 'Devolução PED-2026-001', responsible: 'Estoque Lucas', status: 'Pendente' },
];

export const categories = ['Mercearia', 'Hortifruti', 'Frios e Laticínios', 'Bebidas', 'Limpeza', 'Higiene Pessoal', 'Padaria', 'Açougue', 'Congelados', 'Outros'];
export const units = ['kg', 'Unidade', 'Litro', 'Caixa', 'Pacote'];
export const supplierCategories = ['Atacado', 'Mercearia', 'Atacarejo', 'Distribuidora', 'Frigorífico', 'Produtor rural', 'Hortifruti', 'Padaria', 'Outros'];
export const departments = ['Administrativo', 'Operações', 'Estoque', 'Financeiro', 'Caixa', 'Limpeza'];
