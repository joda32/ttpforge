import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";
import TTPLibrary from "./pages/TTPLibrary";
import Reports from "./pages/Reports";
import Tags from "./pages/Tags";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserManagement from "./pages/admin/UserManagement";

function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/ttps" element={<TTPLibrary />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="*" element={<p className="text-slate-400">Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
