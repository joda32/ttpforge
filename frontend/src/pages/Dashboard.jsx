import { useNavigate } from "react-router-dom";
import { useExercises, useExerciseSummary } from "../hooks/useExercises";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import GlobalMitreMatrix from "../components/dashboard/GlobalMitreMatrix";

// ── colour tokens (matches Exercises page) ────────────────────────────────────
const CARD_STYLE = {
  planned: {
    border: "border-slate-600",   bg: "bg-slate-800",        accent: "bg-slate-500",
    name: "text-slate-100",       desc: "text-slate-400",    muted: "text-slate-500",
  },
  active: {
    border: "border-yellow-700",  bg: "bg-yellow-950/50",    accent: "bg-yellow-500",
    name: "text-yellow-50",       desc: "text-yellow-200/60", muted: "text-yellow-300/50",
  },
  completed: {
    border: "border-green-700",   bg: "bg-green-950/50",     accent: "bg-green-600",
    name: "text-green-50",        desc: "text-green-200/60",  muted: "text-green-300/50",
  },
};


// ── detection bar ─────────────────────────────────────────────────────────────
function DetectionBar({ rate, total }) {
  if (!total) {
    return <span className="text-xs text-slate-600">No entries yet</span>;
  }
  const pct  = Math.round(rate * 100);
  const fill  = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  const label = pct >= 75 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${label}`}>{pct}%</span>
    </div>
  );
}

// ── individual exercise card ───────────────────────────────────────────────────
function ExerciseCard({ ex }) {
  const navigate = useNavigate();
  const { data: summary } = useExerciseSummary(ex.id);
  const s = CARD_STYLE[ex.status] ?? CARD_STYLE.planned;

  const total    = summary?.total_entries ?? null;
  const detected = summary?.detected      ?? null;
  const missed   = summary?.missed        ?? null;
  const rate     = summary?.detection_rate ?? 0;

  return (
    <div
      onDoubleClick={() => navigate(`/exercises/${ex.id}`)}
      className={`relative flex flex-col rounded-lg border ${s.border} ${s.bg} cursor-pointer hover:brightness-110 transition-all select-none overflow-hidden`}
    >
      {/* Coloured accent bar */}
      <div className={`h-1 w-full ${s.accent}`} />

      <div className="flex flex-col gap-2.5 p-4 flex-1">
        {/* Header: badge + dates */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={ex.status} />
          <span className={`text-xs ${s.muted}`}>
            {ex.start_date ?? "—"} → {ex.end_date ?? "—"}
          </span>
        </div>

        {/* Name */}
        <div className={`font-semibold text-sm leading-snug ${s.name}`}>{ex.name}</div>

        {/* Description */}
        {ex.description && (
          <p className={`text-xs line-clamp-2 leading-relaxed ${s.desc}`}>{ex.description}</p>
        )}

        {/* Stats row */}
        <div className={`flex items-center gap-3 text-xs ${s.muted} border-t border-white/5 pt-2.5 mt-auto`}>
          {total !== null ? (
            <>
              <span className="font-medium text-slate-300">{total}</span> TTP{total !== 1 ? "s" : ""}
              {detected !== null && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-green-400">{detected} detected</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-red-400">{missed} missed</span>
                </>
              )}
            </>
          ) : (
            <span className="text-slate-600">Loading…</span>
          )}
        </div>

        {/* Detection rate bar */}
        <DetectionBar rate={rate} total={total} />
      </div>
    </div>
  );
}

// ── stat pill (compact, coloured) ─────────────────────────────────────────────
function StatPill({ label, value, color }) {
  const colors = {
    slate:  "bg-slate-800 border-slate-700 text-slate-300",
    yellow: "bg-yellow-900/30 border-yellow-700 text-yellow-300",
    green:  "bg-green-900/30 border-green-700 text-green-300",
    blue:   "bg-blue-900/30 border-blue-700 text-blue-300",
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border px-6 py-4 ${colors[color] ?? colors.slate}`}>
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      <span className="text-xs uppercase tracking-wider mt-1 opacity-70">{label}</span>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data, isLoading, error } = useExercises();
  const exercises = data?.data ?? [];

  const total     = exercises.length;
  const active    = exercises.filter((e) => e.status === "active").length;
  const completed = exercises.filter((e) => e.status === "completed").length;
  const planned   = exercises.filter((e) => e.status === "planned").length;

  // Top 4 by most recent entry activity; fall back to exercise created_at for exercises with no entries
  const sorted = [...exercises]
    .sort((a, b) => {
      const ta = a.last_entry_at ?? a.created_at ?? 0;
      const tb = b.last_entry_at ?? b.created_at ?? 0;
      return new Date(tb) - new Date(ta);
    })
    .slice(0, 4);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Purple team exercise overview" />

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load data.</p>}

      {!isLoading && (
        <>
          {/* Stat pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatPill label="Total"     value={total}     color="blue"   />
            <StatPill label="Active"    value={active}    color="yellow" />
            <StatPill label="Completed" value={completed} color="green"  />
            <StatPill label="Planned"   value={planned}   color="slate"  />
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
              No exercises yet.{" "}
              <button
                className="text-blue-400 hover:underline"
                onClick={() => window.location.href = "/exercises"}
              >
                Create one →
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Most Recent Activity
              </h2>
              <div className="grid grid-cols-4 gap-3 min-w-0">
                {sorted.map((ex) => (
                  <ExerciseCard key={ex.id} ex={ex} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Full enterprise ATT&CK coverage matrix */}
      <div className="mt-10">
        <GlobalMitreMatrix />
      </div>
    </div>
  );
}
