import { useState, useRef, useEffect } from "react";
import { useTags } from "../../hooks/useTags";
import TagBadge from "./TagBadge";

export default function TagSelector({ value = [], onChange, label = "Tags" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data } = useTags();
  const allTags = data?.data ?? [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (tagId) => {
    onChange(value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId]);
  };

  const selectedTags = allTags.filter((t) => value.includes(t.id));

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <div
        className="min-h-[34px] bg-slate-700 border border-slate-600 rounded px-2 py-1.5 cursor-pointer flex flex-wrap gap-1 items-center"
        onClick={() => setOpen((o) => !o)}
      >
        {selectedTags.length === 0 && (
          <span className="text-slate-500 text-sm select-none">Add tags…</span>
        )}
        {selectedTags.map((t) => (
          <TagBadge key={t.id} tag={t} />
        ))}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded shadow-xl z-20 max-h-48 overflow-y-auto">
          {allTags.length === 0 ? (
            <div className="px-3 py-2 text-slate-500 text-sm">
              No tags yet — create some in the Tags page.
            </div>
          ) : (
            allTags.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-700 transition-colors ${
                  value.includes(t.id) ? "bg-slate-700/60" : ""
                }`}
                onClick={(e) => { e.stopPropagation(); toggle(t.id); }}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    value.includes(t.id)
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-slate-500"
                  }`}
                >
                  {value.includes(t.id) ? "✓" : ""}
                </span>
                <TagBadge tag={t} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
