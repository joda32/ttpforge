import { useQuery } from "@tanstack/react-query";
import { getEntryChangelog } from "../../api/entries";
import Spinner from "../ui/Spinner";

const FIELD_LABELS = {
  command_used: "Command / Payload",
  red_notes:    "Red Team Notes",
  detected:     "Detected",
  outcome:      "Outcome",
  detected_at:  "Detection Timestamp",
  blue_notes:   "Blue Team Notes",
  alert_name:   "Alert Name / Rule",
  screenshot:   "Screenshot",
};

const OUTCOME_LABELS = { detected: "Detected", missed: "Missed", partial: "Partial" };

function formatValue(field, raw) {
  if (raw === null || raw === undefined) return <span className="italic text-slate-500">—</span>;
  if (field === "detected") return raw === "true" ? "Yes" : "No";
  if (field === "outcome")  return OUTCOME_LABELS[raw] ?? raw;
  if (field === "detected_at") {
    try { return new Date(raw).toLocaleString(); } catch { return raw; }
  }
  if (field === "screenshot") return <span className="font-mono text-xs">{raw}</span>;
  // Truncate long text values
  if (raw.length > 120) return <span title={raw}>{raw.slice(0, 120)}…</span>;
  return raw;
}

function fmt(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

const FIELD_COLOR = {
  command_used: "bg-red-900/30 text-red-300 border-red-800",
  red_notes:    "bg-red-900/30 text-red-300 border-red-800",
  detected:     "bg-blue-900/30 text-blue-300 border-blue-800",
  outcome:      "bg-blue-900/30 text-blue-300 border-blue-800",
  detected_at:  "bg-blue-900/30 text-blue-300 border-blue-800",
  blue_notes:   "bg-blue-900/30 text-blue-300 border-blue-800",
  alert_name:   "bg-blue-900/30 text-blue-300 border-blue-800",
  screenshot:   "bg-purple-900/30 text-purple-300 border-purple-800",
};

export default function EntryChangelog({ entryId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["entries", entryId, "changelog"],
    queryFn: () => getEntryChangelog(entryId),
    enabled: !!entryId,
  });

  if (isLoading) return <Spinner />;

  const logs = data ?? [];

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        No changes recorded yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {logs.map((log, i) => {
        const isLast = i === logs.length - 1;
        const fieldColor = FIELD_COLOR[log.field_name] ?? "bg-slate-700/40 text-slate-300 border-slate-600";
        return (
          <div key={log.id} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
              {!isLast && <div className="w-px flex-1 bg-slate-700 my-1" />}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 min-w-0 ${isLast ? "" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${fieldColor}`}>
                  {FIELD_LABELS[log.field_name] ?? log.field_name}
                </span>
                <span className="text-xs text-slate-400">
                  by <span className="text-slate-300 font-medium">{log.username}</span>
                </span>
                <span className="text-xs text-slate-500 ml-auto">{fmt(log.changed_at)}</span>
              </div>

              {log.field_name === "screenshot" ? (
                <p className="text-xs text-slate-400">
                  Screenshot added: <span className="font-mono text-slate-300">{log.new_value}</span>
                </p>
              ) : (
                <div className="flex items-start gap-2 text-xs">
                  <div className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-400 min-w-0 flex-1 break-words">
                    {formatValue(log.field_name, log.old_value)}
                  </div>
                  <span className="text-slate-500 shrink-0 mt-1">→</span>
                  <div className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 min-w-0 flex-1 break-words">
                    {formatValue(log.field_name, log.new_value)}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
