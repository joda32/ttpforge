import EntryRow from "./EntryRow";

export default function EntryTable({ entries, onEdit, onDelete, selectedIds, onToggleSelect, onSelectAll }) {
  const selectable = !!onToggleSelect;
  const allSelected = selectable && entries.length > 0 && entries.every((e) => selectedIds?.has(e.id));
  const someSelected = selectable && entries.some((e) => selectedIds?.has(e.id));

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
        No entries yet. Add a TTP entry to begin tracking.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 border-b border-slate-700">
          <tr>
            {selectable && (
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={onSelectAll}
                  className="rounded border-slate-500 bg-slate-700 accent-blue-500 cursor-pointer"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">TTP</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tags</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Red Team</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Blue Team</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Outcome</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Gap</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
              selected={selectedIds?.has(entry.id) ?? false}
              onToggleSelect={selectable ? () => onToggleSelect(entry.id) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
