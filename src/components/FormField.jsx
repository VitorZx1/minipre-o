export default function FormField({ label, type = 'text', value, onChange, options, placeholder, disabled, required, className = '', inputRef, autoFocus = false, onKeyDown }) {
  const baseClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className={baseClass}
        >
          {options?.map(opt => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          className={baseClass}
        />
      )}
    </div>
  );
}
