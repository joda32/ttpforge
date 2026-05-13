import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useExercise, useExerciseSummary, useExerciseEntries } from "../hooks/useExercises";
import { useCreateEntry, useUpdateEntry, useDeleteEntry } from "../hooks/useEntries";
import { exportEntriesCSV, importTemplate, importNavigatorLayer } from "../api/entries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import StatCard from "../components/ui/StatCard";
import EntryTable from "../components/entries/EntryTable";
import EntryForm from "../components/entries/EntryForm";
import MitreMatrix from "../components/entries/MitreMatrix";
import AttackMap from "../components/entries/AttackMap";

const OUTCOME_OPTIONS = [
  { value: "", label: "All Outcomes" },
  { value: "detected", label: "Detected" },
  { value: "missed",   label: "Missed" },
  { value: "partial",  label: "Partial" },
];

const TABS = ["Entries", "ATT&CK Matrix", "Attack Map"];

export default function ExerciseDetail() {
  const { id } = useParams();
  const exerciseId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({ outcome: "", tactic: "" });
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importResult, setImportResult] = useState(null);
  const importFileRef = useRef(null);
  const navigatorFileRef = useRef(null);

  const { data: exercise, isLoading: loadingEx } = useExercise(exerciseId);
  const { data: summary } = useExerciseSummary(exerciseId);

  const { data: filteredData, isLoading: loadingFiltered } = useExerciseEntries(exerciseId, {
    ...(filters.outcome && { outcome: filters.outcome }),
    ...(filters.tactic  && { tactic:  filters.tactic }),
  });
  const { data: allData } = useExerciseEntries(exerciseId, {});

  const createMutation = useCreateEntry(exerciseId);
  const updateMutation = useUpdateEntry(exerciseId);
  const deleteMutation = useDeleteEntry(exerciseId);

  const importMutation = useMutation({
    mutationFn: (entries) => importTemplate(exerciseId, entries),
    onSuccess: (result) => {
      setImportResult({ ...result, source: "template" });
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] });
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "summary"] });
    },
  });

  const navigatorMutation = useMutation({
    mutationFn: (layer) => importNavigatorLayer(exerciseId, layer),
    onSuccess: (result) => {
      setImportResult({ ...result, source: "navigator" });
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] });
      qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "summary"] });
    },
  });

  const filteredEntries = filteredData?.data ?? [];
  const allEntries = allData?.data ?? [];

  const tactics = summary
    ? Object.keys(summary.tactic_breakdown ?? {}).map((t) => ({ value: t, label: t }))
    : [];

  const detectionPct = summary?.total_entries > 0
    ? Math.round(summary.detection_rate * 100)
    : null;
  const pctColor = detectionPct >= 75
    ? "text-green-400"
    : detectionPct >= 50
    ? "text-yellow-400"
    : "text-red-400";

  // Selection helpers
  const toggleSelect = (entryId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(entryId) ? next.delete(entryId) : next.add(entryId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = filteredEntries.map((e) => e.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  };

  // Export selected entries as JSON template
  const handleExport = () => {
    const toExport = filteredEntries.filter((e) => selectedIds.has(e.id));
    const payload = {
      version: 1,
      exported_at: new Date().toISOString(),
      entries: toExport.map((e) => ({
        mitre_id: e.ttp?.mitre_id ?? "",
        ttp_name: e.ttp?.name ?? "",
        tactic: e.ttp?.tactic ?? "",
        tool_used: e.tool_used ?? "",
        command_used: e.command_used ?? "",
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exercise?.name ?? "exercise"}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import template from JSON file
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const entries = Array.isArray(json) ? json : json.entries ?? [];
        importMutation.mutate(entries);
      } catch {
        setImportResult({ error: "Invalid JSON file" });
      }
    };
    reader.readAsText(file);
  };

  // Import ATT&CK Navigator layer JSON
  const handleNavigatorFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const layer = JSON.parse(ev.target.result);
        if (!layer.techniques) {
          setImportResult({ error: "Not a valid Navigator layer file (missing 'techniques')" });
          return;
        }
        navigatorMutation.mutate(layer);
      } catch {
        setImportResult({ error: "Invalid JSON file" });
      }
    };
    reader.readAsText(file);
  };

  if (loadingEx) return <Spinner />;
  if (!exercise) return <p className="text-red-400">Exercise not found.</p>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
        <button
          onClick={() => navigate("/exercises")}
          className="hover:text-slate-300 transition-colors"
        >
          Exercises
        </button>
        <span>/</span>
        <span className="text-slate-300">{exercise.name}</span>
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
            <Button onClick={() => setShowAddEntry(true)}>+ Add Entry</Button>
          </div>
        }
      />

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total TTPs" value={summary.total_entries} />
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Detection Rate</p>
            <p className={`text-2xl font-bold mt-1 ${pctColor}`}>
              {detectionPct !== null ? `${detectionPct}%` : "—"}
            </p>
          </div>
          <StatCard label="Detected" value={summary.detected} />
          <StatCard label="Missed" value={summary.missed} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-5">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Entries */}
      {activeTab === 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select
              value={filters.outcome}
              onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value }))}
              options={OUTCOME_OPTIONS}
              className="w-40"
            />
            <Select
              value={filters.tactic}
              onChange={(e) => setFilters((f) => ({ ...f, tactic: e.target.value }))}
              options={[{ value: "", label: "All Tactics" }, ...tactics]}
              className="w-48"
            />
            {(filters.outcome || filters.tactic) && (
              <Button variant="ghost" onClick={() => setFilters({ outcome: "", tactic: "" })}>
                Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button variant="secondary" onClick={handleExport}>
                  Export {selectedIds.size} Selected
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => importFileRef.current?.click()}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? "Importing…" : "Import Template"}
              </Button>
              <input
                ref={importFileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="secondary"
                onClick={() => navigatorFileRef.current?.click()}
                disabled={navigatorMutation.isPending}
              >
                {navigatorMutation.isPending ? "Importing…" : "Import Navigator Layer"}
              </Button>
              <input
                ref={navigatorFileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleNavigatorFile}
              />
            </div>
          </div>

          {/* Import result banner */}
          {importResult && (
            <div className={`mb-4 px-4 py-3 rounded-lg border text-sm flex items-start justify-between gap-3 ${
              importResult.error
                ? "bg-red-900/30 border-red-700 text-red-300"
                : "bg-green-900/30 border-green-700 text-green-300"
            }`}>
              <div>
                {importResult.error ? (
                  <span>{importResult.error}</span>
                ) : (
                  <>
                    <span className="font-medium">{importResult.imported} {importResult.imported === 1 ? "entry" : "entries"} imported{importResult.source === "navigator" ? " from Navigator layer" : ""}.</span>
                    {importResult.skipped?.length > 0 && (
                      <span className="text-slate-400 ml-2">
                        {importResult.skipped.length} skipped ({importResult.skipped.map((s) => s.mitre_id || "unknown").join(", ")}).
                      </span>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setImportResult(null)}
                className="text-slate-400 hover:text-slate-200 shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {loadingFiltered ? (
            <Spinner />
          ) : (
            <EntryTable
              entries={filteredEntries}
              onEdit={setEditEntry}
              onDelete={(entryId) => {
                if (window.confirm("Delete this entry?")) deleteMutation.mutate(entryId);
              }}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onSelectAll={toggleSelectAll}
            />
          )}
        </>
      )}

      {/* Tab: ATT&CK Matrix */}
      {activeTab === 1 && <MitreMatrix entries={allEntries} />}

      {/* Tab: Attack Map */}
      {activeTab === 2 && <AttackMap entries={allEntries} exerciseId={exerciseId} />}

      {/* Modals */}
      <Modal isOpen={showAddEntry} onClose={() => setShowAddEntry(false)} title="Add TTP Entry" wide>
        <EntryForm
          onSubmit={(d) =>
            createMutation.mutate(
              { ...d, exercise_id: exerciseId },
              { onSuccess: () => setShowAddEntry(false) }
            )
          }
          onCancel={() => setShowAddEntry(false)}
          loading={createMutation.isPending}
        />
      </Modal>
      <Modal isOpen={!!editEntry} onClose={() => setEditEntry(null)} title="Edit TTP Entry" wide>
        <EntryForm
          initial={editEntry ?? {}}
          onSubmit={(d) =>
            updateMutation.mutate(
              { id: editEntry.id, data: d },
              { onSuccess: () => setEditEntry(null) }
            )
          }
          onCancel={() => setEditEntry(null)}
          loading={updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
