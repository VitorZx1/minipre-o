import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { localServer } from '../services/localServer';

export default function PixSandboxPanel({ initialAmount = '1.00' }) {
  const [amount, setAmount] = useState(initialAmount);
  const [id, setId] = useState(() => crypto.randomUUID().replaceAll('-', ''));
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const recordId = record?.id;
  const recordState = record?.state;
  async function call(action, selectedId = id) {
    return localServer.bb(`pix/${action}`, { environment: 'sandbox', id: selectedId, amount: Number(amount).toFixed(2) });
  }
  useEffect(() => {
    let active = true;
    localServer.bb('pix/list', { environment: 'sandbox' }).then(records => { if (active && Array.isArray(records)) setHistory(records); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!polling || !recordId || !['creating', 'pending'].includes(recordState)) return;
    let active = true;
    let timer;
    const poll = async () => {
      try {
        const result = await localServer.bb('pix/check', { environment: 'sandbox', id: recordId });
        if (active) { setRecord(result); setError(''); }
      } catch (failure) { if (active) { setError(failure.message); setPolling(false); } }
      if (active) timer = setTimeout(poll, 8000);
    };
    timer = setTimeout(poll, 8000);
    return () => { active = false; clearTimeout(timer); };
  }, [polling, recordId, recordState]);
  async function run(action) {
    if (busy) return;
    setBusy(true); setError(''); setPolling(false);
    try { const result = await call(action); setRecord(result); setPolling(result.state === 'pending'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  function newTest() {
    setPolling(false); setRecord(null); setError(''); setId(crypto.randomUUID().replaceAll('-', ''));
  }
  return <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
    <h3 className="font-semibold text-gray-800">Teste completo do Pix · Banco do Brasil</h3>
    <p className="text-sm text-amber-900">Sandbox: não use seu aplicativo bancário para pagar. Use o botão de simulação abaixo. Este teste não finaliza venda, não baixa estoque e não gera receita.</p>
    <label className="block text-sm">Valor da compra de teste (R$)<input type="number" min="0.01" max="10000" step="0.01" disabled={busy || Boolean(record)} value={amount} onChange={event => setAmount(event.target.value)} className="block mt-1 rounded-lg border border-gray-300 bg-white p-2.5" /></label>
    <div className="flex flex-wrap gap-3">
      <button disabled={busy || Boolean(record) || Number(amount) <= 0} onClick={() => run('create')} className="rounded-lg bg-red-600 px-4 py-2 text-white text-sm disabled:opacity-50">1. Criar cobrança e QR Code</button>
      <button disabled={busy || !record?.qr || record.state !== 'pending' || record.simulationAttempted} onClick={() => run('simulate')} className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">2. Simular pagamento no BB</button>
      <button disabled={busy} onClick={() => run('check')} className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">3. Consultar recebimento</button>
    </div>
    {busy && <p role="status" className="text-sm">Aguardando o Banco do Brasil...</p>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <p className="break-all text-xs text-gray-500">Identificador deste teste: {id}</p>
    {record?.qr && <div className="rounded-lg bg-white border border-gray-200 p-4 flex flex-col items-center gap-3"><QRCodeSVG value={record.qr} size={200} /><strong className="text-sm text-amber-800">QR CODE DE TESTE — SEM DINHEIRO REAL</strong><details className="w-full text-xs"><summary className="cursor-pointer">Ver Pix Copia e Cola retornado pelo BB</summary><p className="break-all mt-2">{record.qr}</p></details></div>}
    {record && <div role="status" className={`rounded-lg border p-3 text-sm ${record.state === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-200 text-gray-700'}`}>
      {record.state === 'paid' ? 'Pagamento de teste confirmado pelo BB: identificador e valor conferidos.' : record.state === 'cancelled' ? 'Cobrança removida pelo banco.' : 'Aguardando confirmação do BB. Ainda não está pago.'}
      {record.paidAt && <p className="mt-1">Recebido em: {new Date(record.paidAt).toLocaleString('pt-BR')}</p>}
      {record.endToEndId && <p className="break-all text-xs mt-1">Comprovante bancário: {record.endToEndId}</p>}
    </div>}
    <div className="flex gap-3 text-sm"><button disabled={busy} onClick={() => setPolling(current => !current)} className="underline">{polling ? 'Pausar consulta automática' : 'Ativar consulta automática'}</button><button disabled={busy} onClick={newTest} className="underline">Novo teste</button></div>
    {history.length > 0 && <details><summary className="cursor-pointer text-sm">Retomar testes anteriores</summary><div className="mt-2 space-y-2">{history.map(item => <button key={item.id} disabled={busy} onClick={() => { setPolling(false); setId(item.id); setRecord(item); setAmount((item.amountCents / 100).toFixed(2)); setError(''); }} className="block w-full text-left text-xs p-2 bg-white rounded border border-gray-200">{new Date(item.createdAt).toLocaleString('pt-BR')} · R$ {(item.amountCents / 100).toFixed(2)} · {item.id}</button>)}</div></details>}
  </section>;
}
