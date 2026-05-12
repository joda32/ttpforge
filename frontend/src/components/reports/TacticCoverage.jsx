import Badge from "../ui/Badge";

export default function TacticCoverage({ tacticBreakdown }) {
  const tactics = Object.entries(tacticBreakdown ?? {});
  if (tactics.length === 0) {
    return <p className="text-slate-500 text-sm">No data available.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 border-b border-slate-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tactic</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Detected</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Missed</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Rate</th>
          </tr>
        </thead>
        <tbody>
          {tactics.map(([tactic, { total, detected, detection_rate }]) => {
            const variant = detection_rate >= 0.75 ? "detected" : detection_rate >= 0.4 ? "partial" : "missed";
            return (
              <tr key={tactic} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-3 text-slate-200 font-medium">{tactic}</td>
                <td className="px-4 py-3 text-right text-slate-400">{total}</td>
                <td className="px-4 py-3 text-right text-green-400">{detected}</td>
                <td className="px-4 py-3 text-right text-red-400">{total - detected}</td>
                <td className="px-4 py-3 text-right">
                  <Badge variant={variant}>{Math.round(detection_rate * 100)}%</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
