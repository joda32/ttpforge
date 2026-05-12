import Badge from "../ui/Badge";
import Button from "../ui/Button";

function fmt(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString();
}

export default function EntryRow({ entry, onEdit, onDelete }) {
  return (
    <tr className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-mono text-xs text-blue-400">{entry.ttp?.mitre_id}</div>
        <div className="text-sm text-slate-200 font-medium">{entry.ttp?.name}</div>
        <div className="text-xs text-slate-500">{entry.ttp?.tactic}</div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {entry.tool_used && <div className="font-medium text-slate-300">{entry.tool_used}</div>}
        {entry.executed_at && <div>{fmt(entry.executed_at)}</div>}
        {!entry.tool_used && !entry.executed_at && <span className="text-slate-600">—</span>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {entry.detection_method && <div className="text-slate-300">{entry.detection_method}</div>}
        {entry.alert_name && <div className="text-slate-400">{entry.alert_name}</div>}
        {entry.time_to_detect_minutes != null && (
          <div className="text-slate-500">{entry.time_to_detect_minutes} min</div>
        )}
        {!entry.detection_method && !entry.alert_name && <span className="text-slate-600">—</span>}
      </td>
      <td className="px-4 py-3">
        {entry.outcome ? <Badge variant={entry.outcome} /> : <span className="text-slate-600 text-xs">—</span>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs">
        <div className="line-clamp-2">{entry.gap_identified || "—"}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => onEdit(entry)}>Edit</Button>
          <Button variant="ghost" className="text-xs px-2 py-1 text-red-400 hover:text-red-300" onClick={() => onDelete(entry.id)}>Del</Button>
        </div>
      </td>
    </tr>
  );
}
