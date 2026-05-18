import { useState } from "react";
import { useTTPs, useTTPCoverage } from "../../hooks/useTTPs";
import FrameworkBadge from "../ui/FrameworkBadge";
import Spinner from "../ui/Spinner";

const FRAMEWORKS = [
  { value: "enterprise", label: "Enterprise" },
  { value: "ics",        label: "ICS"        },
  { value: "mobile",     label: "Mobile"     },
];

const TACTIC_ORDER = [
  "Reconnaissance", "Resource Development", "Initial Access", "Execution",
  "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access",
  "Discovery", "Lateral Movement", "Collection", "Command and Control",
  "Command & Control", "Exfiltration", "Impact",
];

const CELL_STYLE = {
  detected: { bg: "bg-green-950/60",  border: "border-green-700",  id: "text-green-400",  label: "text-green-200/80" },
  missed:   { bg: "bg-red-950/60",    border: "border-red-700",    id: "text-red-400",    label: "text-red-200/80"   },
  mixed:    { bg: "bg-yellow-950/60", border: "border-yellow-700", id: "text-yellow-400", label: "text-yellow-200/80" },
  default:  { bg: "bg-slate-800/60",  border: "border-slate-700",  id: "text-blue-400",   label: "text-slate-400"    },
};

const BADGE_STYLE = {
  detected: "bg-green-700 text-green-100",
  missed:   "bg-red-700 text-red-100",
  mixed:    "bg-yellow-700 text-yellow-100",
  default:  "bg-slate-600 text-slate-200",
};

function getCoverageKey(cov) {
  if (!cov || cov.total === 0) return "default";
  const outcomeTotal = cov.detected + cov.missed + cov.partial;
  if (outcomeTotal === 0) return "default";
  if (cov.detected === outcomeTotal) return "detected";
  if (cov.missed === outcomeTotal) return "missed";
  return "mixed";
}

function rolledUp(mitreId, children, coverage) {
  const ids = [mitreId, ...children.map((c) => c.mitre_id)];
  const acc = { total: 0, detected: 0, missed: 0, partial: 0 };
  for (const id of ids) {
    const c = coverage[id];
    if (c) {
      acc.total    += c.total;
      acc.detected += c.detected;
      acc.missed   += c.missed;
      acc.partial  += c.partial;
    }
  }
  return acc;
}

// ── individual technique cell ─────────────────────────────────────────────────

function TechniqueCell({ ttp, covKey, count, isSub = false }) {
  const s = CELL_STYLE[covKey];
  return (
    <div
      className={`relative rounded-md px-2 py-1.5 border ${s.bg} ${s.border} ${isSub ? "ml-2" : ""}`}
      title={`${ttp.mitre_id} — ${ttp.name}${count ? `\n${count} entr${count === 1 ? "y" : "ies"} across all exercises` : ""}`}
    >
      {count > 0 && (
        <span className={`absolute top-1 right-1 text-xs font-bold leading-none px-1 py-0.5 rounded ${BADGE_STYLE[covKey]}`}>
          {count}
        </span>
      )}
      <div className={`font-mono text-xs font-semibold leading-tight ${s.id} ${count > 0 ? "pr-5" : ""}`}>
        {ttp.mitre_id}
      </div>
      <div className={`text-xs mt-0.5 leading-tight line-clamp-2 ${s.label}`}>
        {ttp.name}
      </div>
    </div>
  );
}

// ── parent + collapsible sub-techniques ──────────────────────────────────────

function ParentCell({ ttp, children, coverage }) {
  const [open, setOpen] = useState(false);
  const hasChildren = children.length > 0;

  const rolled = rolledUp(ttp.mitre_id, children, coverage);
  const parentKey = getCoverageKey(rolled);
  const s = CELL_STYLE[parentKey];
  const count = rolled.total;

  return (
    <div className="flex flex-col gap-1">
      {/* Parent cell */}
      <div
        className={`relative rounded-md border ${s.bg} ${s.border}`}
        title={`${ttp.mitre_id} — ${ttp.name}${count ? `\n${count} total entries (incl. sub-techniques)` : ""}`}
      >
        <div className="px-2 pt-1.5 pb-1">
          {count > 0 && (
            <span className={`absolute top-1 right-1 text-xs font-bold leading-none px-1 py-0.5 rounded ${BADGE_STYLE[parentKey]}`}>
              {count}
            </span>
          )}
          <div className={`font-mono text-xs font-semibold leading-tight ${s.id} ${count > 0 ? "pr-5" : ""}`}>
            {ttp.mitre_id}
          </div>
          <div className={`text-xs mt-0.5 leading-tight line-clamp-2 ${s.label}`}>
            {ttp.name}
          </div>
        </div>

        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`w-full flex items-center justify-between px-2 py-0.5 border-t text-xs transition-colors
              ${open ? "border-white/10 text-slate-300 hover:text-white" : "border-white/5 text-slate-500 hover:text-slate-300"}`}
          >
            <span>{children.length} sub-technique{children.length !== 1 ? "s" : ""}</span>
            <span className="text-slate-400">{open ? "▲" : "▼"}</span>
          </button>
        )}
      </div>

      {/* Sub-techniques (expanded) */}
      {open && children.map((child) => {
        const childCov = coverage[child.mitre_id];
        const childKey = getCoverageKey(childCov);
        return (
          <TechniqueCell
            key={child.id}
            ttp={child}
            covKey={childKey}
            count={childCov?.total ?? 0}
            isSub
          />
        );
      })}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function GlobalMitreMatrix() {
  const [framework, setFramework] = useState("enterprise");
  const { data: ttpData, isLoading: ttpsLoading } = useTTPs({ framework });
  const { data: coverage = {}, isLoading: covLoading } = useTTPCoverage();

  if (ttpsLoading || covLoading) return <Spinner />;

  const ttps = ttpData?.data ?? [];
  if (!ttps.length) return null;

  // Separate parents and sub-techniques
  const childrenOf = {};
  const parentById = {};
  for (const ttp of ttps) {
    if (ttp.mitre_id.includes(".")) {
      const parentId = ttp.mitre_id.split(".")[0];
      if (!childrenOf[parentId]) childrenOf[parentId] = [];
      childrenOf[parentId].push(ttp);
    } else {
      parentById[ttp.mitre_id] = ttp;
    }
  }

  // Group parents by tactic; orphan sub-techniques go in as standalone cells
  const tacticMap = {};
  for (const ttp of ttps) {
    if (ttp.mitre_id.includes(".") && parentById[ttp.mitre_id.split(".")[0]]) continue;
    const tactic = ttp.tactic ?? "Unknown";
    if (!tacticMap[tactic]) tacticMap[tactic] = [];
    tacticMap[tactic].push(ttp);
  }

  const tactics = Object.keys(tacticMap).sort((a, b) => {
    const ai = TACTIC_ORDER.findIndex((t) => t.toLowerCase() === a.toLowerCase());
    const bi = TACTIC_ORDER.findIndex((t) => t.toLowerCase() === b.toLowerCase());
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Summary bar — count parent techniques only
  const parentTTPs = ttps.filter((t) => !t.mitre_id.includes("."));
  const testedParents = parentTTPs.filter((t) => {
    const r = rolledUp(t.mitre_id, childrenOf[t.mitre_id] ?? [], coverage);
    return r.total > 0;
  });
  const detectedCount = testedParents.filter((t) => getCoverageKey(rolledUp(t.mitre_id, childrenOf[t.mitre_id] ?? [], coverage)) === "detected").length;
  const missedCount   = testedParents.filter((t) => getCoverageKey(rolledUp(t.mitre_id, childrenOf[t.mitre_id] ?? [], coverage)) === "missed").length;
  const mixedCount    = testedParents.filter((t) => getCoverageKey(rolledUp(t.mitre_id, childrenOf[t.mitre_id] ?? [], coverage)) === "mixed").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            ATT&amp;CK Coverage
          </h2>
          <div className="flex gap-1">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.value}
                type="button"
                onClick={() => setFramework(fw.value)}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  framework === fw.value
                    ? fw.value === "enterprise" ? "bg-blue-900/60 border-blue-600 text-blue-300"
                      : fw.value === "ics"      ? "bg-amber-900/60 border-amber-600 text-amber-300"
                      : "bg-violet-900/60 border-violet-600 text-violet-300"
                    : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                }`}
              >
                {fw.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span><span className="text-slate-300 font-medium">{parentTTPs.length}</span> techniques</span>
          <span className="text-slate-700">·</span>
          <span><span className="text-slate-300 font-medium">{testedParents.length}</span> tested</span>
          <span className="text-slate-700">·</span>
          <span className="text-green-400 font-medium">{detectedCount} all-detected</span>
          <span className="text-slate-700">·</span>
          <span className="text-red-400 font-medium">{missedCount} all-missed</span>
          <span className="text-slate-700">·</span>
          <span className="text-yellow-400 font-medium">{mixedCount} mixed</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {tactics.map((tactic) => {
            const cells = [...tacticMap[tactic]].sort((a, b) =>
              (a.mitre_id ?? "").localeCompare(b.mitre_id ?? "")
            );
            const tacticTested = cells.filter((t) => {
              const r = rolledUp(t.mitre_id, childrenOf[t.mitre_id] ?? [], coverage);
              return r.total > 0;
            }).length;

            return (
              <div key={tactic} className="flex flex-col gap-1" style={{ width: 148 }}>
                {/* Tactic header */}
                <div className="rounded-md px-2 py-2 bg-slate-700 border border-slate-600 text-center">
                  <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide leading-tight truncate">
                    {tactic}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {tacticTested}/{cells.length}
                  </div>
                </div>

                {/* Technique cells */}
                {cells.map((ttp) => {
                  const children = (childrenOf[ttp.mitre_id] ?? []).sort((a, b) =>
                    a.mitre_id.localeCompare(b.mitre_id)
                  );
                  const isParent = !ttp.mitre_id.includes(".");

                  if (isParent) {
                    return (
                      <ParentCell
                        key={ttp.id}
                        ttp={ttp}
                        children={children}
                        coverage={coverage}
                      />
                    );
                  }

                  // Orphan sub-technique (no parent in library)
                  const cov = coverage[ttp.mitre_id];
                  return (
                    <TechniqueCell
                      key={ttp.id}
                      ttp={ttp}
                      covKey={getCoverageKey(cov)}
                      count={cov?.total ?? 0}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-slate-700">
          {[
            { key: "detected", label: "All detected" },
            { key: "missed",   label: "All missed"   },
            { key: "mixed",    label: "Mixed"        },
            { key: "default",  label: "Not tested"   },
          ].map(({ key, label }) => {
            const s = CELL_STYLE[key];
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm border ${s.bg} ${s.border}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            );
          })}
          <span className="text-xs text-slate-600 ml-2">▼ expand sub-techniques</span>
        </div>
      </div>
    </div>
  );
}
