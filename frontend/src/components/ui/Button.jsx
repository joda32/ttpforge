const VARIANTS = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white",
  secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600",
  danger: "bg-red-700 hover:bg-red-600 text-white",
  ghost: "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
};

export default function Button({ variant = "primary", className = "", children, ...props }) {
  const cls = VARIANTS[variant] ?? VARIANTS.primary;
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cls} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
