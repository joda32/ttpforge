import { useState, useRef, useEffect } from "react";

export default function Combobox({ value, onChange, options = [], placeholder = "Select…", label, required }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label ?? "";

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted];
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const select = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        setHighlighted(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const handleFocus = () => {
    setOpen(true);
    setHighlighted(0);
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : selectedLabel}
          onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={open ? "Type to filter…" : placeholder}
          required={required && !value}
          className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
            selectedLabel && !open ? "text-slate-100" : "text-slate-400 placeholder-slate-500"
          }`}
        />
        <span
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs"
        >
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto">
          <div ref={listRef}>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-slate-500 text-sm">No results</div>
            ) : (
              filtered.map((opt, i) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => { e.preventDefault(); select(opt); }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    i === highlighted ? "bg-slate-700 text-slate-100" : "text-slate-300 hover:bg-slate-700/60"
                  } ${String(opt.value) === String(value) ? "font-medium" : ""}`}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
