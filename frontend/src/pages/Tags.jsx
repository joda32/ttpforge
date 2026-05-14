import { useState } from "react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "../hooks/useTags";
import { useAuth } from "../hooks/useAuth";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import TagBadge from "../components/ui/TagBadge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";

function TagForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name ?? "",
    color: initial.color ?? "#6366f1",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4">
      <Input label="Name *" value={form.name} onChange={set("name")} required placeholder="Tag name" />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.color}
            onChange={set("color")}
            className="w-10 h-10 rounded cursor-pointer border border-slate-600 bg-slate-700 p-0.5"
          />
          <TagBadge tag={form} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}

export default function Tags() {
  const { data, isLoading } = useTags();
  const tags = data?.data ?? [];
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div>
      <PageHeader
        title="Tags"
        subtitle="Manage tags for exercises and entries"
        actions={isAdmin && <Button onClick={() => setShowCreate(true)}>+ New Tag</Button>}
      />

      {isLoading && <Spinner />}

      {!isLoading && tags.length === 0 && (
        <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
          No tags yet. Create one to get started.
        </div>
      )}

      {!isLoading && tags.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Color</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <TagBadge tag={tag} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border border-slate-600" style={{ backgroundColor: tag.color }} />
                      <span className="text-slate-400 text-xs font-mono">{tag.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => setEditTarget(tag)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs px-2 py-1 text-red-400 hover:text-red-300"
                          onClick={() => {
                            if (window.confirm(`Delete tag "${tag.name}"?`)) deleteMutation.mutate(tag.id);
                          }}
                        >
                          Del
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Tag">
        <TagForm
          onSubmit={(d) => createMutation.mutate(d, { onSuccess: () => setShowCreate(false) })}
          onCancel={() => setShowCreate(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Tag">
        <TagForm
          initial={editTarget ?? {}}
          onSubmit={(d) =>
            updateMutation.mutate({ id: editTarget.id, data: d }, { onSuccess: () => setEditTarget(null) })
          }
          onCancel={() => setEditTarget(null)}
          loading={updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
