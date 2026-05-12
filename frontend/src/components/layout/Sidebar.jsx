import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: "▦" },
  { to: "/exercises", label: "Exercises", icon: "⚔" },
  { to: "/ttps", label: "TTP Library", icon: "☰" },
  { to: "/reports", label: "Reports", icon: "📊" },
  { to: "/tags", label: "Tags", icon: "🏷" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-700 flex flex-col min-h-screen shrink-0">
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="text-blue-400 font-bold text-lg tracking-tight">TTP Tracker</div>
        <div className="text-slate-500 text-xs mt-0.5">Purple Team Exercise Log</div>
      </div>
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
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
      </nav>
    </aside>
  );
}
