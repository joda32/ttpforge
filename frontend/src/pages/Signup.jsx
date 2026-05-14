import { useState } from "react";
import { Link } from "react-router-dom";
import { signup } from "../api/auth";
import Button from "../components/ui/Button";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "red_team" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await signup({ username: form.username, email: form.email || undefined, password: form.password, role: form.role });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-blue-400 font-bold text-2xl tracking-tight mb-2">TTPForge</div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl mt-6">
            <div className="text-green-400 text-lg font-semibold mb-2">Request submitted</div>
            <p className="text-slate-400 text-sm">Your account is pending approval by an administrator. You will be able to sign in once approved.</p>
            <Link to="/login" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-blue-400 font-bold text-2xl tracking-tight">TTPForge</div>
          <div className="text-slate-500 text-sm mt-1">Purple Team Exercise Log</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-slate-100 mb-5">Request access</h1>

          {error && (
            <div className="mb-4 px-3 py-2 rounded bg-red-900/40 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Username *</label>
              <input type="text" value={form.username} onChange={set("username")} required
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                placeholder="Choose a username" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Email <span className="text-slate-600">(optional)</span></label>
              <input type="email" value={form.email} onChange={set("email")}
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Password *</label>
              <input type="password" value={form.password} onChange={set("password")} required
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                placeholder="Choose a password" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Confirm password *</label>
              <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                placeholder="Repeat your password" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Role *</label>
              <select value={form.role} onChange={set("role")}
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="red_team">Red Teamer</option>
                <option value="blue_team">Blue Teamer</option>
              </select>
            </div>
            <Button type="submit" disabled={loading} className="w-full justify-center mt-1">
              {loading ? "Submitting…" : "Request access"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
