import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const NAV = [
  { to: "/", label: "Dashboard", icon: "▦" },
  { to: "/exercises", label: "Exercises", icon: "⚔" },
  { to: "/ttps", label: "TTP Library", icon: "☰" },
  { to: "/reports", label: "Reports", icon: "≋" },
  { to: "/tags", label: "Tags", icon: "◈" },
];

const ROLE_LABELS = { admin: "Admin", red_team: "Red Teamer", blue_team: "Blue Teamer" };
const ROLE_COLORS = {
  admin:     "bg-purple-900/40 text-purple-300",
  red_team:  "bg-red-900/40 text-red-300",
  blue_team: "bg-blue-900/40 text-blue-300",
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-700 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-5 py-5 border-b border-slate-700 shrink-0">
        <div className="text-blue-400 font-bold text-lg tracking-tight">TTP Tracker</div>
        <div className="text-slate-500 text-xs mt-0.5">Purple Team Exercise Log</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? "bg-slate-700 text-slate-100 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
        {user?.role === "admin" && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? "bg-slate-700 text-slate-100 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            <span className="text-base">&#128100;</span>
            Users
          </NavLink>
        )}
      </nav>
      <div className="border-t border-slate-700 px-3 py-3">
        {user && (
          <div className="mb-2 px-1">
            <div className="text-slate-200 text-sm font-medium truncate">{user.username}</div>
            <span className={`inline-block text-xs px-2 py-0.5 rounded mt-0.5 ${ROLE_COLORS[user.role] ?? "bg-slate-700 text-slate-400"}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <span>&#8594;</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
