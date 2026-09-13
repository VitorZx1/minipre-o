const baseUrl = '/api';

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Falha no armazenamento local.');
  return body;
}

export const localServer = {
  lookupProduct: barcode => request(`/products/lookup/${encodeURIComponent(barcode)}`),
  mercadoPagoStatus: () => request('/mercado-pago/status'),
  saveMercadoPago: credentials => request('/mercado-pago/credentials', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' }, body: JSON.stringify(credentials),
  }),
  revealMercadoPago: () => request('/mercado-pago/reveal', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' }, body: '{}',
  }),
  mercadoPagoTerminals: () => request('/mercado-pago/terminals', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' }, body: '{}',
  }),
  activateMercadoPagoTerminal: terminalId => request('/mercado-pago/terminals/activate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' }, body: JSON.stringify({ terminalId }),
  }),
  configureMercadoPagoPix: posId => request('/mercado-pago/pix/configure', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' }, body: JSON.stringify({ posId }),
  }),
  bb: (action, data) => request(`/bb/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' }, body: JSON.stringify(data),
  }),
  revealBanestesCredential: (environment, field) => request('/banestes/reveal', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' },
    body: JSON.stringify({ environment, field }),
  }),
  banestesStatus: (environment = 'sandbox') => request(`/banestes/status?environment=${encodeURIComponent(environment)}`),
  saveBanestesCredentials: credentials => request('/banestes/credentials', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' },
    body: JSON.stringify(credentials),
  }),
  health: () => request('/health'),
  chooseStorageFolder: () => request('/storage/choose-folder', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniPreco-Settings': '1' },
  }),
  loadAll: () => request('/data'),
  saveCollection: (collection, records) => request(`/data/${collection}`, {
    method: 'PUT',
    body: JSON.stringify(records),
  }),
  setStorageDirectory: (storageDirectory) => request('/storage', {
    method: 'PUT',
    body: JSON.stringify({ storageDirectory }),
  }),
  getSetting: key => request(`/settings/${key}`),
  setSetting: (key, value) => request(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  }),
  createPayment: (method, amount) => request('/payments', {
    method: 'POST',
    body: JSON.stringify({ method, amount, confirmRealPayment: true }),
  }),
  getPayment: id => request(`/payments/${id}`),
  cancelPayment: id => request(`/payments/${id}/cancel`, { method: 'POST' }),
};
