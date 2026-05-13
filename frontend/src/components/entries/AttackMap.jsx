const OUTCOME_STYLE = {
  detected: { border: "border-green-600",  bg: "bg-green-900/30",  dot: "bg-green-500",  text: "text-green-400" },
  missed:   { border: "border-red-600",    bg: "bg-red-900/30",    dot: "bg-red-500",    text: "text-red-400" },
  partial:  { border: "border-yellow-600", bg: "bg-yellow-900/30", dot: "bg-yellow-500", text: "text-yellow-400" },
  default:  { border: "border-slate-600",  bg: "bg-slate-800",     dot: "bg-slate-500",  text: "text-slate-400" },
};

function Arrow() {
  return (
    <div className="flex items-center self-start mt-14 shrink-0 mx-1">
      <div className="w-6 h-px bg-slate-600" />
      <div
        className="shrink-0"
        style={{
          width: 0, height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: "8px solid #475569",
        }}
      />
    </div>
  );
}

function AttackNode({ entry, step }) {
  const s = OUTCOME_STYLE[entry.outcome] ?? OUTCOME_STYLE.default;
  const time = entry.executed_at
    ? new Date(entry.executed_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`w-48 rounded-lg border p-3 shrink-0 ${s.border} ${s.bg}`}>
      {/* Step + outcome */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">Step {step}</span>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
          {entry.outcome && (
            <span className={`text-xs font-semibold uppercase ${s.text}`}>{entry.outcome}</span>
          )}
        </div>
      </div>

      {/* TTP */}
      <div className="font-mono text-xs text-blue-400">{entry.ttp?.mitre_id}</div>
      <div className="text-sm font-medium text-slate-200 line-clamp-2 mt-0.5 leading-tight">
        {entry.ttp?.name}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{entry.ttp?.tactic}</div>

      {/* Red team details */}
      {(entry.tool_used || entry.source || entry.destination) && (
        <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-0.5">
          {entry.tool_used && (
            <div className="text-xs text-slate-400 truncate" title={entry.tool_used}>
              ðŸ”§ {entry.tool_used}
            </div>
          )}
          {(entry.source || entry.destination) && (
            <div className="text-xs text-slate-500 truncate">
              {entry.source || "?"} → {entry.destination || "?"}
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      {time && (
        <div className="text-xs text-slate-600 mt-1.5">{time}</div>
      )}
    </div>
  );
}

export default function AttackMap({ entries }) {
  if (!entries?.length) {
    return (
      <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
        No entries yet. Add TTP entries to see the attack map.
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.executed_at && b.executed_at) return new Date(a.executed_at) - new Date(b.executed_at);
    if (a.executed_at) return -1;
    if (b.executed_at) return 1;
    return a.id - b.id;
  });

  // Summary counts for the legend bar
  const counts = { detected: 0, missed: 0, partial: 0, none: 0 };
  for (const e of sorted) {
    if (e.outcome) counts[e.outcome] = (counts[e.outcome] ?? 0) + 1;
    else counts.none++;
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-5 px-1">
        {[
          { key: "detected", label: "Detected", cls: "bg-green-500" },
          { key: "missed",   label: "Missed",   cls: "bg-red-500" },
          { key: "partial",  label: "Partial",  cls: "bg-yellow-500" },
          { key: "none",     label: "No outcome", cls: "bg-slate-500" },
        ].map(({ key, label, cls }) => counts[key] > 0 && (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
            <span className="text-xs text-slate-400">{counts[key]} {label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-slate-600">Double-click a row to open — scroll right to see full chain</span>
      </div>

      {/* Flow */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start min-w-max">
          {sorted.map((entry, i) => (
            <div key={entry.id} className="flex items-start">
              <AttackNode entry={entry} step={i + 1} />
              {i < sorted.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>

      {/* Source/Destination network summary */}
      {sorted.some((e) => e.source || e.destination) && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            Network Scope
          </h3>
          <div className="flex flex-wrap gap-2">
            {[...new Set(sorted.flatMap((e) => [e.source, e.destination]).filter(Boolean))].map((host) => (
              <span key={host} className="text-xs bg-slate-700 border border-slate-600 text-slate-300 px-2 py-1 rounded font-mono">
                {host}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
