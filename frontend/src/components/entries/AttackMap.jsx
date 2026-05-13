import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderAttackPath, removeFromAttackPath } from "../../api/entries";

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

function AttackNode({ entry, step, isFirst, isLast, onMove, onRemove }) {
  const s = OUTCOME_STYLE[entry.outcome] ?? OUTCOME_STYLE.default;
  const time = entry.executed_at
    ? new Date(entry.executed_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`w-48 rounded-lg border p-3 shrink-0 ${s.border} ${s.bg} relative group`}>
      {/* Controls */}
      <div className="absolute -top-3 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={isFirst}
          className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
          title="Move left"
        >
          &#8592;
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={isLast}
          className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
          title="Move right"
        >
          &#8594;
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded bg-red-900/60 border border-red-700 text-red-300 hover:bg-red-800 text-xs"
          title="Remove from attack path"
        >
          &#10005;
        </button>
      </div>

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
              {entry.tool_used}
            </div>
          )}
          {(entry.source || entry.destination) && (
            <div className="text-xs text-slate-500 truncate">
              {entry.source || "?"} &#8594; {entry.destination || "?"}
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

export default function AttackMap({ entries, exerciseId }) {
  const qc = useQueryClient();

  const reorderMutation = useMutation({
    mutationFn: (steps) => reorderAttackPath(exerciseId, steps),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (entryId) => removeFromAttackPath(exerciseId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] }),
  });

  const pathEntries = (entries ?? [])
    .filter((e) => e.attack_path_include)
    .sort((a, b) => (a.attack_path_step ?? 9999) - (b.attack_path_step ?? 9999));

  if (!pathEntries.length) {
    return (
      <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
        <p>No entries in the attack path.</p>
        <p className="text-xs mt-1 text-slate-600">Edit an entry and enable "Include in Attack Path" to add it here.</p>
      </div>
    );
  }

  const handleMove = (index, direction) => {
    const next = [...pathEntries];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;

    const steps = next.map((e, i) => {
      if (i === index) return { entry_id: e.id, attack_path_step: next[swapIndex].attack_path_step ?? swapIndex + 1 };
      if (i === swapIndex) return { entry_id: e.id, attack_path_step: next[index].attack_path_step ?? index + 1 };
      return { entry_id: e.id, attack_path_step: e.attack_path_step ?? i + 1 };
    });
    reorderMutation.mutate(steps);
  };

  // Summary counts for the legend bar
  const counts = { detected: 0, missed: 0, partial: 0, none: 0 };
  for (const e of pathEntries) {
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
        <span className="ml-auto text-xs text-slate-600">Hover a node to move or remove it — scroll right to see full chain</span>
      </div>

      {/* Flow */}
      <div className="overflow-x-auto pb-4 pt-5">
        <div className="flex items-start min-w-max">
          {pathEntries.map((entry, i) => (
            <div key={entry.id} className="flex items-start">
              <AttackNode
                entry={entry}
                step={entry.attack_path_step ?? i + 1}
                isFirst={i === 0}
                isLast={i === pathEntries.length - 1}
                onMove={(dir) => handleMove(i, dir)}
                onRemove={() => removeMutation.mutate(entry.id)}
              />
              {i < pathEntries.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>

      {/* Source/Destination network summary */}
      {pathEntries.some((e) => e.source || e.destination) && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            Network Scope
          </h3>
          <div className="flex flex-wrap gap-2">
            {[...new Set(pathEntries.flatMap((e) => [e.source, e.destination]).filter(Boolean))].map((host) => (
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
