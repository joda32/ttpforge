const TACTIC_ORDER = [
  "Reconnaissance", "Resource Development", "Initial Access", "Execution",
  "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access",
  "Discovery", "Lateral Movement", "Collection", "Command and Control",
  "Command & Control", "Exfiltration", "Impact",
];

const CELL_STYLE = {
  detected: { bg: "#14532d", border: "#16a34a", id: "#4ade80", label: "#bbf7d0" },
  missed:   { bg: "#450a0a", border: "#dc2626", id: "#f87171", label: "#fecaca" },
  partial:  { bg: "#451a03", border: "#d97706", id: "#fbbf24", label: "#fde68a" },
  default:  { bg: "#1e293b", border: "#334155", id: "#60a5fa", label: "#94a3b8" },
};

export default function MitreMatrix({ entries }) {
  if (!entries?.length) {
    return (
      <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
        No entries yet. Add TTP entries to see the ATT&CK matrix.
      </div>
    );
  }

  // Deduplicate by mitre_id — keep the entry with the "worst" outcome
  const PRIORITY = { missed: 0, partial: 1, detected: 2, null: 3 };
  const dedupMap = {};
  for (const entry of entries) {
    const mid = entry.ttp?.mitre_id;
    if (!mid) continue;
    const existing = dedupMap[mid];
    if (!existing || (PRIORITY[entry.outcome] ?? 3) < (PRIORITY[existing.outcome] ?? 3)) {
      dedupMap[mid] = entry;
    }
  }
  const deduped = Object.values(dedupMap);

  // Group by tactic
  const tacticMap = {};
  for (const entry of deduped) {
    const tactic = entry.ttp?.tactic ?? "Unknown";
    if (!tacticMap[tactic]) tacticMap[tactic] = [];
    tacticMap[tactic].push(entry);
  }

  const tactics = Object.keys(tacticMap).sort((a, b) => {
    const ai = TACTIC_ORDER.findIndex((t) => t.toLowerCase() === a.toLowerCase());
    const bi = TACTIC_ORDER.findIndex((t) => t.toLowerCase() === b.toLowerCase());
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        {tactics.map((tactic) => {
          const cols = tacticMap[tactic];
          const detected = cols.filter((e) => e.outcome === "detected").length;
          return (
            <div key={tactic} className="flex flex-col gap-1.5" style={{ width: 164 }}>
              {/* Tactic header */}
              <div className="rounded-md px-2 py-2 bg-slate-700 border border-slate-600 text-center">
                <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide leading-tight">
                  {tactic}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {detected}/{cols.length} detected
                </div>
              </div>

              {/* Technique cells */}
              {cols
                .sort((a, b) => (a.ttp?.mitre_id ?? "").localeCompare(b.ttp?.mitre_id ?? ""))
                .map((entry) => {
                  const s = CELL_STYLE[entry.outcome] ?? CELL_STYLE.default;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-md px-2 py-2 border"
                      style={{ backgroundColor: s.bg, borderColor: s.border }}
                      title={`${entry.ttp?.mitre_id} — ${entry.ttp?.name}\nOutcome: ${entry.outcome ?? "not set"}`}
                    >
                      <div className="font-mono text-xs font-medium" style={{ color: s.id }}>
                        {entry.ttp?.mitre_id}
                      </div>
                      <div className="text-xs mt-0.5 line-clamp-2 leading-tight" style={{ color: s.label }}>
                        {entry.ttp?.name}
                      </div>
                      {entry.outcome && (
                        <div className="text-xs mt-1 font-semibold uppercase tracking-wide" style={{ color: s.id }}>
                          {entry.outcome}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-700">
        {Object.entries(CELL_STYLE).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: s.bg, borderColor: s.border }} />
            <span className="text-xs text-slate-400 capitalize">{key === "default" ? "No outcome" : key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
