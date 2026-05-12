export default function Select({ label, options = [], placeholder, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
      <select
        className={`bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}
