import { useId, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function SettingsSelect({ label, value, options, onChange, disabled }) {
  const details = useRef(null);
  const id = useId();
  return <div className="space-y-1.5">
    <span id={id} className="text-sm font-medium text-gray-700">{label}</span>
    <details ref={details} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} onKeyDown={event => { if (event.key === 'Escape') { details.current.open = false; details.current.querySelector('summary').focus(); } }}>
      <summary aria-labelledby={id} aria-disabled={disabled} onClick={event => { if (disabled) event.preventDefault(); }} className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-red-500">
        {options.find(option => option.value === value)?.label}<ChevronDown className="w-4 h-4 text-gray-500" />
      </summary>
      <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
        {options.map(option => <button key={option.value} type="button" disabled={disabled} aria-pressed={value === option.value} onClick={() => { onChange(option.value); details.current.open = false; details.current.querySelector('summary').focus(); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-red-50 focus-visible:outline-red-500 ${value === option.value ? 'bg-red-50 font-medium text-red-700' : 'text-gray-700'}`}>{option.label}{value === option.value && <Check className="w-4 h-4" />}</button>)}
      </div>
    </details>
  </div>;
}
