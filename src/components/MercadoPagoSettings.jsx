import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, RefreshCw, Search } from 'lucide-react';
import { localServer } from '../services/localServer';

export default function MercadoPagoSettings({ showToast }) {
  const [status, setStatus] = useState(null);
  const [token, setToken] = useState('');
  const [visibleToken, setVisibleToken] = useState('');
  const [replace, setReplace] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [terminals, setTerminals] = useState([]);
  const [checkout, setCheckout] = useState(null);
  const revealRequest = useRef(0);

  async function refresh() {
    setBusy(true);
    try { setStatus(await localServer.mercadoPagoStatus()); }
    catch (error) { showToast(error.message, 'error'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    refresh();
    localServer.getSetting('mercado-pago-checkout').then(({ value }) => setCheckout(value || null)).catch(() => setCheckout(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!visibleToken) return;
    const timer = setTimeout(() => setVisibleToken(''), 15000);
    return () => clearTimeout(timer);
  }, [visibleToken]);
  useEffect(() => {
    const hide = () => { revealRequest.current++; setVisibleToken(''); };
    window.addEventListener('blur', hide);
    return () => window.removeEventListener('blur', hide);
  }, []);

  async function save(event) {
    event.preventDefault(); setBusy(true);
    try {
      const updated = await localServer.saveMercadoPago({ accessToken: token, replace, expectedRevision: status?.revision });
      setStatus(updated); setToken(''); setReplace(false); setEditing(false);
      showToast('Access Token salvo com proteção no cofre do Windows.');
    } catch (error) { showToast(error.message, 'error'); }
    finally { setBusy(false); }
  }
  async function reveal() {
    if (visibleToken) return setVisibleToken('');
    const current = ++revealRequest.current; setBusy(true);
    try { const result = await localServer.revealMercadoPago(); if (current === revealRequest.current) setVisibleToken(result.value); }
    catch (error) { showToast(error.message, 'error'); }
    finally { setBusy(false); }
  }
  async function searchTerminals() {
    setBusy(true); setTerminals([]);
    try {
      const result = await localServer.mercadoPagoTerminals();
      setTerminals(result.terminals || []);
      const selected = result.terminals?.find(item => item.id === checkout?.terminalId);
      if (selected?.externalPosId && selected.externalPosId !== checkout?.externalPosId) {
        const updatedCheckout = { ...checkout, posId: selected.posId, storeId: selected.storeId, externalPosId: selected.externalPosId };
        await localServer.setSetting('mercado-pago-checkout', updatedCheckout);
        setCheckout(updatedCheckout);
      }
      showToast(result.terminals?.length ? 'Maquininhas encontradas na conta.' : 'Nenhuma maquininha foi encontrada nessa conta.', result.terminals?.length ? 'success' : 'warning');
    } catch (error) { showToast(error.message, 'error'); }
    finally { setBusy(false); }
  }
  async function activate(terminalId) {
    setBusy(true);
    try {
      const result = await localServer.activateMercadoPagoTerminal(terminalId);
      showToast(result.message);
      await searchTerminals();
    } catch (error) { showToast(error.message, 'error'); setBusy(false); }
  }

  async function selectForCheckout(item) {
    setBusy(true);
    try {
      const value = { terminalId: item.id, posId: item.posId, storeId: item.storeId, externalPosId: item.externalPosId || null };
      await localServer.setSetting('mercado-pago-checkout', value);
      setCheckout(value);
      showToast('Esta Point agora é a maquininha principal do caixa.');
    } catch (error) { showToast(error.message, 'error'); }
    finally { setBusy(false); }
  }

  return <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
    <div><h3 className="font-semibold text-gray-800">Integração Mercado Pago Point</h3><p className="text-sm text-gray-600 mt-1">A API já está programada. Cole somente o Access Token da conta vinculada à Point Pro 3.</p></div>
    {status?.configured && !editing ? <div className="space-y-3">
      <label className="block text-sm text-gray-700">Access Token<div className="relative mt-1"><input readOnly value={visibleToken || '••••••••••••••••••••'} className="w-full rounded-lg border bg-white p-2.5 pr-12 font-mono text-sm" /><button type="button" onClick={reveal} disabled={busy} aria-label={visibleToken ? 'Ocultar token' : 'Visualizar token'} className="absolute right-2 top-2 p-1.5 text-gray-500">{visibleToken ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      <div className="flex flex-wrap gap-2"><button onClick={searchTerminals} disabled={busy} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"><Search size={16} />Buscar maquininhas da conta</button><button onClick={() => setEditing(true)} disabled={busy} className="px-4 py-2 border rounded-lg text-sm bg-white">Substituir token</button><button onClick={refresh} disabled={busy} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm bg-white"><RefreshCw size={15} />Atualizar</button></div>
    </div> : <form onSubmit={save} className="space-y-3">
      <label className="block text-sm text-gray-700">Access Token<input type="password" required value={token} onChange={event => setToken(event.target.value)} autoComplete="new-password" spellCheck={false} placeholder="Cole o Access Token do Mercado Pago" className="mt-1 w-full rounded-lg border bg-white p-2.5" /></label>
      {status?.configured && <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={replace} onChange={event => setReplace(event.target.checked)} className="mt-1" />Confirmo que desejo substituir o token salvo neste computador.</label>}
      <div className="flex gap-2"><button disabled={busy || token.trim().length < 20 || (status?.configured && !replace)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">{busy ? 'Salvando...' : 'Salvar token'}</button>{status?.configured && <button type="button" onClick={() => { setEditing(false); setToken(''); setReplace(false); }} className="px-4 py-2 border rounded-lg text-sm bg-white">Cancelar</button>}</div>
    </form>}
    {terminals.length > 0 && <div className="space-y-2"><p className="text-sm font-semibold text-gray-700">Maquininhas localizadas</p><p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">Confira o número de série antes de ativar. Não ative todas as maquininhas.</p>{terminals.map(item => {
      const parts = item.id.split('__');
      const model = parts[0].replaceAll('_', ' ');
      const serial = parts.slice(1).join('__') || item.id;
      const selected = checkout?.terminalId === item.id;
      return <div key={item.id} className={`rounded-lg border bg-white p-3 text-sm flex flex-wrap items-center justify-between gap-3 ${selected ? 'ring-2 ring-emerald-500' : ''}`}><div><strong>{model}</strong><p className="font-mono text-xs text-gray-700 mt-1">Serial/identificador: {serial}</p><p className="text-xs text-gray-500">Modo: {item.operatingMode || 'não informado'} · Caixa: {item.posId || 'não associado'} · Loja: {item.storeId || 'não associada'}</p>{selected && <p className="text-xs font-semibold text-emerald-700 mt-1">Maquininha principal do caixa</p>}</div>{item.operatingMode === 'PDV' ? <button onClick={() => selectForCheckout(item)} disabled={busy || selected} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:bg-emerald-600">{selected ? 'Em uso no caixa' : 'Usar no caixa'}</button> : <button onClick={() => activate(item.id)} disabled={busy || !item.posId || !item.storeId} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:bg-gray-300">Ativar modo PDV</button>}</div>;
    })}</div>}
    <p className="text-xs text-gray-500">O token não fica no navegador nem no banco comum do aplicativo. O olhinho o exibe por até 15 segundos. Não envie esse valor por mensagem e não publique no GitHub.</p>
  </div>;
}
