import { useState } from "react";
import { useExercises, useExerciseSummary } from "../hooks/useExercises";
import { exportEntriesCSV } from "../api/entries";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import DetectionRateChart from "../components/reports/DetectionRateChart";
import TacticCoverage from "../components/reports/TacticCoverage";

export default function Reports() {
  const { data: exercisesData, isLoading: loadingExercises } = useExercises();
  const exercises = exercisesData?.data ?? [];

  const [selectedId, setSelectedId] = useState("");
  const exerciseId = selectedId ? Number(selectedId) : null;

  const { data: summary, isLoading: loadingSummary } = useExerciseSummary(exerciseId);
  const selectedExercise = exercises.find((e) => e.id === exerciseId);

  const detectionPct = summary?.total_entries > 0 ? Math.round(summary.detection_rate * 100) : null;
  const pctColor = detectionPct >= 75 ? "text-green-400" : detectionPct >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div>
      <PageHeader title="Reports" subtitle="Exercise detection summaries" />

      <div className="flex items-center gap-3 mb-6">
        <Select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          options={exercises.map((e) => ({ value: e.id, label: e.name }))}
          placeholder="Select an exercise…"
          className="w-72"
        />
        {selectedId && (
          <Button variant="secondary" onClick={() => exportEntriesCSV(exerciseId, selectedExercise?.name)}>
            Download CSV
          </Button>
        )}
      </div>

      {loadingExercises && <Spinner />}
      {!selectedId && !loadingExercises && (
        <p className="text-slate-500 text-sm">Select an exercise above to view its report.</p>
      )}
      {selectedId && loadingSummary && <Spinner />}

      {selectedId && summary && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-slate-100">{selectedExercise?.name}</h2>
            {selectedExercise && <Badge variant={selectedExercise.status} />}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total TTPs" value={summary.total_entries} />
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Detection Rate</p>
              <p className={`text-2xl font-bold mt-1 ${pctColor}`}>
                {detectionPct !== null ? `${detectionPct}%` : "—"}
              </p>
            </div>
            <StatCard label="Detected" value={summary.detected} />
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Time to Detect</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">
                {summary.avg_time_to_detect_minutes != null ? `${summary.avg_time_to_detect_minutes}m` : "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                Detection Rate by Tactic
              </h3>
              <DetectionRateChart tacticBreakdown={summary.tactic_breakdown} />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                Tactic Coverage
              </h3>
              <TacticCoverage tacticBreakdown={summary.tactic_breakdown} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
