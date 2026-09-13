import { randomUUID } from 'node:crypto';
import { getMercadoPagoAccessToken } from './mercado-pago-config.js';

const api = 'https://api.mercadopago.com';

function safeMessage(status, body) {
  if (status === 401 || status === 403) return 'O Mercado Pago recusou o Access Token.';
  const detail = body?.message || body?.error || body?.errors?.[0]?.message;
  return detail ? `Mercado Pago: ${String(detail).slice(0, 240)}` : `Mercado Pago respondeu HTTP ${status}.`;
}

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(safeMessage(response.status, body));
  return body;
}

function paymentFromOrder(order, expected = {}) {
  const payment = order?.transactions?.payments?.[0] || {};
  const amount = Number(payment.amount ?? order?.total_amount);
  const approved = order?.status === 'processed' && (order?.status_detail === 'accredited' || payment?.status_detail === 'accredited');
  if (approved && expected.reference && order.external_reference !== expected.reference) throw new Error('A resposta do pagamento não pertence a esta venda.');
  if (approved && Number.isFinite(expected.amount) && Math.abs(amount - expected.amount) > 0.001) throw new Error('O valor confirmado pelo Mercado Pago é diferente do valor da venda.');
  const terminalState = ['created', 'processing', 'action_required', 'at_terminal'].includes(order?.status);
  return {
    providerOrderId: order.id,
    providerPaymentId: payment.id || null,
    status: approved ? 'approved' : order?.status === 'expired' ? 'expired' : ['canceled', 'cancelled'].includes(order?.status) ? 'cancelled' : terminalState ? 'pending' : 'declined',
    providerStatus: order?.status || null,
    providerStatusDetail: order?.status_detail || payment?.status_detail || null,
    reference: order?.external_reference || null,
    amount,
    qrData: order?.qr_data || order?.type_response?.qr_data || order?.config?.qr?.qr_data || payment?.qr_data || null,
  };
}

export async function createMercadoPagoOrder({ method, amount, terminalId, externalPosId }) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 1000000) throw new Error('Valor do pagamento inválido.');
  const reference = `MP_${randomUUID().replaceAll('-', '')}`;
  const formattedAmount = numericAmount.toFixed(2);
  const isPix = method === 'PIX';
  if (isPix && !externalPosId) throw new Error('Configure o identificador externo do caixa do Mercado Pago para gerar o Pix.');
  if (!isPix && !terminalId) throw new Error('Escolha uma Point vinculada para receber o pagamento.');

  const body = isPix ? {
    type: 'qr', total_amount: formattedAmount, description: 'Venda Mini Preço', external_reference: reference,
    expiration_time: 'PT10M',
    config: { qr: { external_pos_id: externalPosId, mode: 'dynamic' } },
    transactions: { payments: [{ amount: formattedAmount }] },
  } : {
    type: 'point', description: 'Venda Mini Preço', external_reference: reference, expiration_time: 'PT10M',
    transactions: { payments: [{ amount: formattedAmount }] },
    config: {
      point: { terminal_id: terminalId, print_on_terminal: 'no_ticket' },
      payment_method: { default_type: method === 'Cartão de débito' ? 'debit_card' : 'credit_card' },
    },
  };
  const order = await request('/v1/orders', {
    method: 'POST', headers: { 'X-Idempotency-Key': randomUUID() }, body: JSON.stringify(body),
  });
  return { ...paymentFromOrder(order), reference, amount: numericAmount, method, kind: isPix ? 'qr' : 'point', terminalId: terminalId || null, externalPosId: externalPosId || null };
}

export async function getMercadoPagoOrder(id, expected) {
  return paymentFromOrder(await request(`/v1/orders/${encodeURIComponent(id)}`), expected);
}

export async function cancelMercadoPagoOrder(id) {
  return paymentFromOrder(await request(`/v1/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', headers: { 'X-Idempotency-Key': randomUUID() }, body: '{}' }));
}
