import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsers, updateUser, deleteUser } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Spinner from "../../components/ui/Spinner";

const ROLE_LABELS = { admin: "Admin", red_team: "Red Teamer", blue_team: "Blue Teamer", pending: "Pending" };
const ROLE_COLORS = {
  admin:     "bg-purple-900/40 text-purple-300 border-purple-700",
  red_team:  "bg-red-900/40 text-red-300 border-red-700",
  blue_team: "bg-blue-900/40 text-blue-300 border-blue-700",
  pending:   "bg-slate-700 text-slate-400 border-slate-600",
};

function EditUserModal({ user, onClose, onSave, saving, error }) {
  const [form, setForm] = useState({
    email:           user.email ?? "",
    password:        "",
    confirmPassword: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      return;
    }
    const payload = { email: form.email || null };
    if (form.password) payload.password = form.password;
    onSave(payload);
  };

  const passwordMismatch = form.password && form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">Username</label>
        <div className="bg-slate-700/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-400">
          {user.username}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="user@example.com"
          className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
        />
      </div>

      <div className="border-t border-slate-700 pt-4">
        <p className="text-xs text-slate-500 mb-3">Leave password fields blank to keep the existing password.</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">New Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Enter new password"
              className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              placeholder="Repeat new password"
              className={`bg-slate-700 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 text-slate-100 ${
                passwordMismatch ? "border-red-600 focus:ring-red-500" : "border-slate-600"
              }`}
            />
            {passwordMismatch && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving || !!passwordMismatch}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function UserManagement() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [editTarget, setEditTarget] = useState(null);
  const [editError, setEditError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }) => updateUser(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...updates }) => updateUser(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditTarget(null);
      setEditError("");
    },
    onError: (err) => {
      setEditError(err.response?.data?.error || "Failed to save changes");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const users = data?.data ?? [];
  const displayed = filter === "pending"
    ? users.filter((u) => !u.is_approved)
    : users;

  const pendingCount = users.filter((u) => !u.is_approved).length;

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Approve accounts and manage roles"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filter === "all" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"}`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filter === "pending" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"}`}
            >
              Pending {pendingCount > 0 && <span className="ml-1 bg-yellow-600 text-yellow-100 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
          </div>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {filter === "pending" ? "No pending accounts." : "No users found."}
                  </td>
                </tr>
              )}
              {displayed.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-700/30 transition-colors ${!u.is_approved ? "bg-yellow-900/10" : ""}`}>
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {u.username}
                    {u.id === me?.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.email || <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3">
                    {u.id === me?.id ? (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded border ${ROLE_COLORS[u.role] ?? ROLE_COLORS.pending}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => updateMutation.mutate({ id: u.id, role: e.target.value })}
                        className="bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="red_team">Red Teamer</option>
                        <option value="blue_team">Blue Teamer</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_approved ? (
                      <span className="text-xs text-green-400">Approved</span>
                    ) : (
                      <span className="text-xs text-yellow-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {!u.is_approved && (
                        <Button
                          variant="secondary"
                          onClick={() => updateMutation.mutate({ id: u.id, is_approved: true })}
                          disabled={updateMutation.isPending}
                        >
                          Approve
                        </Button>
                      )}
                      {u.is_approved && u.id !== me?.id && (
                        <Button
                          variant="secondary"
                          onClick={() => updateMutation.mutate({ id: u.id, is_approved: false })}
                          disabled={updateMutation.isPending}
                        >
                          Revoke
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => { setEditTarget(u); setEditError(""); }}
                      >
                        Edit
                      </Button>
                      {u.id !== me?.id && (
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm(`Delete user "${u.username}"?`)) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!editTarget}
        onClose={() => { setEditTarget(null); setEditError(""); }}
        title={`Edit — ${editTarget?.username}`}
      >
        {editTarget && (
          <EditUserModal
            user={editTarget}
            onClose={() => { setEditTarget(null); setEditError(""); }}
            onSave={(payload) => editMutation.mutate({ id: editTarget.id, ...payload })}
            saving={editMutation.isPending}
            error={editError}
          />
        )}
      </Modal>
    </div>
  );
}
