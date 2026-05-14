import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-blue-400 font-bold text-2xl tracking-tight">TTP Tracker</div>
          <div className="text-slate-500 text-sm mt-1">Purple Team Exercise Log</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-slate-100 mb-5">Sign in</h1>

          {error && (
            <div className="mb-4 px-3 py-2 rounded bg-red-900/40 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={set("username")}
                required
                autoFocus
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                placeholder="Enter your username"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                placeholder="Enter your password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full justify-center mt-1">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          No account?{" "}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
