import { useNavigate } from "react-router-dom";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const STATUS_ACTIONS = {
  planned:   [{ label: "Start",  next: "active",    className: "text-green-400 hover:text-green-300" }],
  active:    [{ label: "Pause",  next: "planned",   className: "text-yellow-400 hover:text-yellow-300" },
              { label: "Stop",   next: "completed", className: "text-red-400 hover:text-red-300" }],
  completed: [],
};

export default function ExerciseCard({ exercise, onEdit, onDelete, onStatusChange }) {
  const navigate = useNavigate();
  const actions = STATUS_ACTIONS[exercise.status] ?? [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 flex flex-col gap-3 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-slate-100 font-semibold text-base cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => navigate(`/exercises/${exercise.id}`)}
        >
          {exercise.name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={exercise.status} />
          {actions.map(({ label, next, className }) => (
            <button
              key={label}
              onClick={() => onStatusChange(exercise.id, next)}
              className={`text-xs font-medium px-2 py-0.5 rounded border border-slate-600 bg-slate-700 hover:bg-slate-600 transition-colors ${className}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {exercise.description && (
        <p className="text-slate-400 text-sm line-clamp-2">{exercise.description}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {exercise.start_date && <span>Start: {exercise.start_date}</span>}
        {exercise.end_date && <span>End: {exercise.end_date}</span>}
      </div>
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-700">
        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => navigate(`/exercises/${exercise.id}`)}>
          View
        </Button>
        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => onEdit(exercise)}>
          Edit
        </Button>
        <Button variant="ghost" className="text-xs px-2 py-1 text-red-400 hover:text-red-300" onClick={() => onDelete(exercise.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}
