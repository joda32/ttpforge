import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from "../hooks/useExercises";
import PageHeader from "../components/layout/PageHeader";
import ExerciseForm from "../components/exercises/ExerciseForm";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";

const STATUS_ACTIONS = {
  planned:   [{ label: "Start", next: "active",    cls: "text-reddit-green  hover:text-green-400" }],
  active:    [{ label: "Pause", next: "planned",   cls: "text-reddit-yellow hover:text-yellow-400" },
              { label: "Stop",  next: "completed", cls: "text-reddit-red    hover:text-red-400" }],
  completed: [],
};

export default function Exercises() {
  const navigate = useNavigate();
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
        actions={<Button variant="orange" onClick={() => setShowCreate(true)}>+ New Exercise</Button>}
      />

      {isLoading && <Spinner />}
      {error && <p className="text-reddit-red text-sm">Failed to load exercises.</p>}

      {!isLoading && exercises.length === 0 && (
        <div className="text-center py-16 text-reddit-muted border border-reddit-border rounded-lg bg-reddit-card">
          No exercises yet. Create one to get started.
        </div>
      )}

      {!isLoading && exercises.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-reddit-border">
          <table className="w-full text-sm">
            <thead className="bg-reddit-surface border-b border-reddit-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider">Exercise</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider">Start</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider">End</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-reddit-border bg-reddit-card hover:bg-reddit-hover cursor-pointer transition-colors select-none"
                  onDoubleClick={() => navigate(`/exercises/${ex.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="text-reddit-text font-medium">{ex.name}</div>
                    {ex.description && <div className="text-reddit-muted text-xs line-clamp-1">{ex.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={ex.status} />
                      {(STATUS_ACTIONS[ex.status] ?? []).map(({ label, next, cls }) => (
                        <button
                          key={label}
                          onClick={(e) => handleStatusChange(ex.id, next, e)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border border-reddit-border bg-reddit-surface hover:bg-reddit-hover transition-colors ${cls}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-reddit-muted">{ex.start_date ?? "—"}</td>
                  <td className="px-4 py-3 text-reddit-muted">{ex.end_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" className="text-xs px-2 py-1" onClick={(e) => handleEdit(ex, e)}>Edit</Button>
                      <Button variant="ghost" className="text-xs px-2 py-1 text-reddit-red hover:text-red-400" onClick={(e) => handleDelete(ex.id, e)}>Delete</Button>
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
