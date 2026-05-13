const VARIANTS = {
  detected: "bg-green-900 text-green-300 border border-green-700",
  missed: "bg-red-900 text-red-300 border border-red-700",
  partial: "bg-yellow-900 text-yellow-300 border border-yellow-700",
  planned: "bg-slate-700 text-slate-300 border border-slate-600",
  active: "bg-blue-900 text-blue-300 border border-blue-700",
  completed: "bg-teal-900 text-teal-300 border border-teal-700",
};

export default function Badge({ variant, children }) {
  const cls = VARIANTS[variant] ?? VARIANTS.planned;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${cls}`}>
      {children ?? variant}
    </span>
  );
}
