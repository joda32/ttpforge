const STYLES = {
  enterprise: "bg-blue-900/40 border-blue-700 text-blue-300",
  ics:        "bg-amber-900/40 border-amber-700 text-amber-300",
  mobile:     "bg-violet-900/40 border-violet-700 text-violet-300",
};

const LABELS = {
  enterprise: "Enterprise",
  ics:        "ICS",
  mobile:     "Mobile",
};

export default function FrameworkBadge({ framework, className = "" }) {
  if (!framework) return null;
  const style = STYLES[framework] ?? "bg-slate-700 border-slate-600 text-slate-400";
  const label = LABELS[framework] ?? framework;
  return (
    <span className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium ${style} ${className}`}>
      {label}
    </span>
  );
}
