export default function Input({ label, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
      <input
        className={`bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 ${className}`}
        {...props}
      />
    </div>
  );
}
