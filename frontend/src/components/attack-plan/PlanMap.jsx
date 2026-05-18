import { useState } from "react";
import { useTTPs } from "../../hooks/useTTPs";

const TACTIC_COLORS = {
  "Reconnaissance":       "border-purple-700 bg-purple-950/40",
  "Resource Development": "border-purple-700 bg-purple-950/40",
  "Initial Access":       "border-red-700 bg-red-950/40",
  "Execution":            "border-orange-700 bg-orange-950/40",
  "Persistence":          "border-yellow-700 bg-yellow-950/40",
  "Privilege Escalation": "border-yellow-700 bg-yellow-950/40",
  "Defense Evasion":      "border-teal-700 bg-teal-950/40",
  "Credential Access":    "border-blue-700 bg-blue-950/40",
  "Discovery":            "border-cyan-700 bg-cyan-950/40",
  "Lateral Movement":     "border-green-700 bg-green-950/40",
  "Collection":           "border-lime-700 bg-lime-950/40",
  "Command and Control":  "border-rose-700 bg-rose-950/40",
  "Command & Control":    "border-rose-700 bg-rose-950/40",
  "Exfiltration":         "border-pink-700 bg-pink-950/40",
  "Impact":               "border-red-800 bg-red-950/60",
};

function defaultColor(tactic) {
  return TACTIC_COLORS[tactic] ?? "border-slate-700 bg-slate-800/60";
}

// ── single TTP card ────────────────────────────────────────────────────────────

function PlanCard({ item, index, total, onRemove, onMove }) {
  const color = defaultColor(item.tactic);
  return (
    <div className={`relative flex gap-3 rounded-lg border px-3 py-2.5 ${color}`}>
      {/* Step badge */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-xs font-bold text-slate-400 w-5 text-center">{index + 1}</span>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="text-slate-500 hover:text-slate-200 disabled:opacity-20 text-xs leading-none"
            title="Move up"
          >▲</button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="text-slate-500 hover:text-slate-200 disabled:opacity-20 text-xs leading-none"
            title="Move down"
          >▼</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-blue-400 shrink-0">{item.mitre_id}</span>
          {!item.in_library && (
            <span className="text-xs text-yellow-500 bg-yellow-950/60 border border-yellow-700 rounded px-1">not in library</span>
          )}
        </div>
        <div className="text-sm text-slate-100 font-medium leading-snug mt-0.5">{item.name}</div>
        <div className="text-xs text-slate-500 mt-0.5">{item.tactic}</div>
        {item.justification && (
          <div className="text-xs text-slate-400 mt-1 italic line-clamp-2">{item.justification}</div>
        )}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1.5 right-2 text-slate-600 hover:text-red-400 text-base leading-none"
        title="Remove"
      >✕</button>
    </div>
  );
}

// ── add TTP picker ─────────────────────────────────────────────────────────────

function AddTTPPicker({ onAdd }) {
  const [search, setSearch] = useState("");
  const { data } = useTTPs({ search: search.length >= 2 ? search : undefined });
  const results = data?.data ?? [];

  return (
    <div className="border border-dashed border-slate-600 rounded-lg p-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search TTP library to add manually…"
        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm placeholder:text-slate-600"
      />
      {search.length >= 2 && results.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
          {results.slice(0, 20).map((ttp) => (
            <button
              key={ttp.id}
              type="button"
              onClick={() => {
                onAdd({
                  mitre_id: ttp.mitre_id,
                  name: ttp.name,
                  tactic: ttp.tactic,
                  justification: "",
                  in_library: true,
                  ttp_id: ttp.id,
                });
                setSearch("");
              }}
              className="text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 text-sm"
            >
              <span className="font-mono text-blue-400 text-xs shrink-0">{ttp.mitre_id}</span>
              <span className="text-slate-200">{ttp.name}</span>
              <span className="text-slate-500 text-xs ml-auto shrink-0">{ttp.tactic}</span>
            </button>
          ))}
        </div>
      )}
      {search.length >= 2 && results.length === 0 && (
        <p className="text-xs text-slate-600 mt-2">No matches found.</p>
      )}
    </div>
  );
}

// ── main PlanMap ───────────────────────────────────────────────────────────────

export default function PlanMap({ items, onChange }) {
  const handleRemove = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleMove = (from, to) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const handleAdd = (item) => {
    const already = items.some((i) => i.mitre_id === item.mitre_id);
    if (!already) onChange([...items, item]);
  };

  if (items.length === 0 && !onChange) return null;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <PlanCard
          key={`${item.mitre_id}-${idx}`}
          item={item}
          index={idx}
          total={items.length}
          onRemove={handleRemove}
          onMove={handleMove}
        />
      ))}
      <AddTTPPicker onAdd={handleAdd} />
    </div>
  );
}
