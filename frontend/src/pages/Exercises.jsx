import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from "../hooks/useExercises";
import { useAuth } from "../hooks/useAuth";
import PageHeader from "../components/layout/PageHeader";
import ExerciseForm from "../components/exercises/ExerciseForm";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import TagBadge from "../components/ui/TagBadge";
import Spinner from "../components/ui/Spinner";

const STATUS_ACTIONS = {
  planned:   [{ label: "Start", next: "active",    cls: "text-green-400 hover:text-green-300" }],
  active:    [{ label: "Pause", next: "planned",   cls: "text-yellow-400 hover:text-yellow-300" },
              { label: "Stop",  next: "completed", cls: "text-red-400 hover:text-red-300" }],
  completed: [],
};

export default function Exercises() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role !== "blue_team";
  const isAdmin  = user?.role === "admin";
  const { data, isLoading, error } = useExercises();
  const exercises = data?.data ?? [];

  const createMutation = useCreateExercise();
  const deleteMutation = useDeleteExercise();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const updateMutation = useUpdateExercise(editTarget?.id);
  const statusMutation = useUpdateExercise();

  const handleStatusChange = (id, status, e) => {
    e.stopPropagation();
    statusMutation.mutate({ id, data: { status } });
  };
  const handleEdit = (ex, e) => { e.stopPropagation(); setEditTarget(ex); };
  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this exercise and all its entries?")) deleteMutation.mutate(id);
  };

  return (
    <div>
      <PageHeader
        title="Exercises"
        subtitle="Purple team engagements"
        actions={canWrite && <Button onClick={() => setShowCreate(true)}>+ New Exercise</Button>}
      />

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load exercises.</p>}

      {!isLoading && exercises.length === 0 && (
        <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
          No exercises yet. Create one to get started.
        </div>
      )}

      {!isLoading && exercises.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Exercise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Start</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">End</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer select-none"
                  onDoubleClick={() => navigate(`/exercises/${ex.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-medium">{ex.name}</div>
                    {ex.description && <div className="text-slate-500 text-xs line-clamp-1">{ex.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={ex.status} />
                      {canWrite && (STATUS_ACTIONS[ex.status] ?? []).map(({ label, next, cls }) => (
                        <button
                          key={label}
                          onClick={(e) => handleStatusChange(ex.id, next, e)}
                          className={`text-xs font-medium px-2 py-0.5 rounded border border-slate-600 bg-slate-700 hover:bg-slate-600 transition-colors ${cls}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {ex.tags?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ex.tags.map((t) => <TagBadge key={t.id} tag={t} />)}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{ex.start_date ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{ex.end_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canWrite && <Button variant="ghost" className="text-xs px-2 py-1" onClick={(e) => handleEdit(ex, e)}>Edit</Button>}
                      {isAdmin && <Button variant="ghost" className="text-xs px-2 py-1 text-red-400 hover:text-red-300" onClick={(e) => handleDelete(ex.id, e)}>Del</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Exercise">
        <ExerciseForm onSubmit={(d) => createMutation.mutate(d, { onSuccess: () => setShowCreate(false) })} onCancel={() => setShowCreate(false)} loading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Exercise">
        <ExerciseForm initial={editTarget ?? {}} onSubmit={(d) => updateMutation.mutate(d, { onSuccess: () => setEditTarget(null) })} onCancel={() => setEditTarget(null)} loading={updateMutation.isPending} />
      </Modal>
    </div>
  );
}
