import { useNavigate } from "react-router-dom";
import { useExercises } from "../hooks/useExercises";
import PageHeader from "../components/layout/PageHeader";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";

export default function Dashboard() {
  const { data, isLoading, error } = useExercises();
  const navigate = useNavigate();
  const exercises = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Purple team exercise overview" />

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load data.</p>}

      {!isLoading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Exercises" value={exercises.length} />
            <StatCard label="Active"    value={exercises.filter((e) => e.status === "active").length} />
            <StatCard label="Completed" value={exercises.filter((e) => e.status === "completed").length} />
            <StatCard label="Planned"   value={exercises.filter((e) => e.status === "planned").length} />
          </div>

          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">All Exercises</h2>

          {exercises.length === 0 && (
            <p className="text-slate-500 text-sm">
              No exercises yet.{" "}
              <button className="text-blue-400 hover:underline" onClick={() => navigate("/exercises")}>
                Create one →
              </button>
            </p>
          )}

          {exercises.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Exercise</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Start</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">End</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((ex) => (
                    <tr
                      key={ex.id}
                      className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/exercises/${ex.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-slate-200 font-medium">{ex.name}</div>
                        {ex.description && <div className="text-slate-500 text-xs line-clamp-1">{ex.description}</div>}
                      </td>
                      <td className="px-4 py-3"><Badge variant={ex.status} /></td>
                      <td className="px-4 py-3 text-slate-400">{ex.start_date ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{ex.end_date ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
