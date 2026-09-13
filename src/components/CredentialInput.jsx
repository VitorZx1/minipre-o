import { useEffect, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function CredentialInput({ label, value, onChange }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const hide = () => setVisible(false);
    const timer = setTimeout(hide, 15000);
    window.addEventListener('blur', hide);
    return () => { clearTimeout(timer); window.removeEventListener('blur', hide); };
  }, [visible]);
  return <div className="text-sm text-gray-700">
    <label htmlFor={id}>{label}</label>
    <div className="relative mt-1">
      <input id={id} required type={visible ? 'text' : 'password'} autoComplete="new-password" autoCapitalize="none" spellCheck={false} maxLength={8192} value={value} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2.5 pr-12 focus:outline-red-500" />
      <button type="button" onClick={() => setVisible(current => !current)} aria-label={`${visible ? 'Ocultar' : 'Visualizar'} ${label}`} aria-pressed={visible} aria-controls={id} title={visible ? 'Ocultar credencial' : 'Visualizar por 15 segundos'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-500">
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  </div>;
}
