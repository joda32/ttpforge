export default function StatCard({ label, value, sub }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-100">{value ?? "—"}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
