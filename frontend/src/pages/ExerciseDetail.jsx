import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useExercise, useExerciseSummary, useExerciseEntries } from "../hooks/useExercises";
import { useCreateEntry, useUpdateEntry, useDeleteEntry } from "../hooks/useEntries";
import { exportEntriesCSV } from "../api/entries";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import EntryTable from "../components/entries/EntryTable";
import EntryForm from "../components/entries/EntryForm";

const OUTCOME_OPTIONS = [
  { value: "", label: "All Outcomes" },
  { value: "detected", label: "Detected" },
  { value: "missed",   label: "Missed" },
  { value: "partial",  label: "Partial" },
];

export default function ExerciseDetail() {
  const { id } = useParams();
  const exerciseId = Number(id);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ outcome: "", tactic: "" });
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const { data: exercise, isLoading: loadingEx } = useExercise(exerciseId);
  const { data: summary } = useExerciseSummary(exerciseId);
  const { data: entriesData, isLoading: loadingEntries } = useExerciseEntries(exerciseId, {
    ...(filters.outcome && { outcome: filters.outcome }),
    ...(filters.tactic  && { tactic:  filters.tactic }),
  });

  const createMutation = useCreateEntry(exerciseId);
  const updateMutation = useUpdateEntry(exerciseId);
  const deleteMutation = useDeleteEntry(exerciseId);

  const entries = entriesData?.data ?? [];
  const tactics = summary
    ? Object.keys(summary.tactic_breakdown ?? {}).map((t) => ({ value: t, label: t }))
    : [];

  const detectionPct = summary?.total_entries > 0 ? Math.round(summary.detection_rate * 100) : null;
  const pctColor = detectionPct >= 75 ? "text-reddit-green" : detectionPct >= 50 ? "text-reddit-yellow" : "text-reddit-red";

  if (loadingEx) return <Spinner />;
  if (!exercise)  return <p className="text-reddit-red">Exercise not found.</p>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-reddit-muted text-xs mb-3">
        <button onClick={() => navigate("/exercises")} className="hover:text-reddit-blue transition-colors">Exercises</button>
        <span>/</span>
        <span className="text-reddit-text">{exercise.name}</span>
      </div>

      <PageHeader
        title={exercise.name}
        subtitle={exercise.description}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={exercise.status} />
            <Button variant="secondary" onClick={() => exportEntriesCSV(exerciseId, exercise.name)}>
              Download CSV
            </Button>
            <Button variant="orange" onClick={() => setShowAddEntry(true)}>+ Add Entry</Button>
          </div>
        }
      />

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-reddit-card border border-reddit-border rounded-lg p-4">
            <p className="text-xs text-reddit-muted font-semibold uppercase tracking-wider">Total TTPs</p>
            <p className="text-2xl font-bold text-reddit-text">{summary.total_entries}</p>
          </div>
          <div className="bg-reddit-card border border-reddit-border rounded-lg p-4">
            <p className="text-xs text-reddit-muted font-semibold uppercase tracking-wider">Detection Rate</p>
            <p className={`text-2xl font-bold ${pctColor}`}>{detectionPct !== null ? `${detectionPct}%` : "—"}</p>
          </div>
          <div className="bg-reddit-card border border-reddit-border rounded-lg p-4">
            <p className="text-xs text-reddit-muted font-semibold uppercase tracking-wider">Detected</p>
            <p className="text-2xl font-bold text-reddit-green">{summary.detected}</p>
          </div>
          <div className="bg-reddit-card border border-reddit-border rounded-lg p-4">
            <p className="text-xs text-reddit-muted font-semibold uppercase tracking-wider">Missed</p>
            <p className="text-2xl font-bold text-reddit-red">{summary.missed}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filters.outcome} onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value }))} options={OUTCOME_OPTIONS} className="w-40" />
        <Select value={filters.tactic} onChange={(e) => setFilters((f) => ({ ...f, tactic: e.target.value }))} options={[{ value: "", label: "All Tactics" }, ...tactics]} className="w-48" />
        {(filters.outcome || filters.tactic) && (
          <Button variant="ghost" onClick={() => setFilters({ outcome: "", tactic: "" })}>Clear</Button>
        )}
      </div>

      {loadingEntries ? <Spinner /> : <EntryTable entries={entries} onEdit={setEditEntry} onDelete={(entryId) => { if (window.confirm("Delete this entry?")) deleteMutation.mutate(entryId); }} />}

      <Modal isOpen={showAddEntry} onClose={() => setShowAddEntry(false)} title="Add TTP Entry" wide>
        <EntryForm onSubmit={(d) => createMutation.mutate({ ...d, exercise_id: exerciseId }, { onSuccess: () => setShowAddEntry(false) })} onCancel={() => setShowAddEntry(false)} loading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!editEntry} onClose={() => setEditEntry(null)} title="Edit TTP Entry" wide>
        <EntryForm initial={editEntry ?? {}} onSubmit={(d) => updateMutation.mutate({ id: editEntry.id, data: d }, { onSuccess: () => setEditEntry(null) })} onCancel={() => setEditEntry(null)} loading={updateMutation.isPending} />
      </Modal>
    </div>
  );
}
