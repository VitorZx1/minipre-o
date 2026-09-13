import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { localServer } from '../services/localServer';

export default function SavedCredential({ label, field, environment, provider = 'banestes' }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => {
    const invalidate = () => { request.current++; };
    const hide = () => { request.current++; setValue(''); setBusy(false); };
    window.addEventListener('blur', hide);
    return () => { invalidate(); window.removeEventListener('blur', hide); };
  }, []);
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => setValue(''), 15000);
    return () => clearTimeout(timer);
  }, [value]);
  async function toggle() {
    if (value) { setValue(''); return; }
    const current = ++request.current;
    setBusy(true); setError('');
    try {
      const result = provider === 'bb' ? await localServer.bb('reveal', { environment, field }) : await localServer.revealBanestesCredential(environment, field);
      if (request.current === current) setValue(result.value);
    } catch (failure) { if (request.current === current) setError(failure.message); }
    finally { if (request.current === current) setBusy(false); }
  }
  return <div>
    <label className="block text-sm text-gray-700">{label}<div className="relative mt-1"><input readOnly value={value || '************'} autoComplete="off" spellCheck={false} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 pr-12 font-mono text-sm" /><button type="button" disabled={busy} onClick={toggle} aria-label={`${value ? 'Ocultar' : 'Visualizar'} ${label}`} className="absolute right-2 top-2 rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">{value ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
    {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
  </div>;
}
