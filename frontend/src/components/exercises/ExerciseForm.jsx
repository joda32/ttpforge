import { useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import TagSelector from "../ui/TagSelector";

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export default function ExerciseForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name ?? "",
    description: initial.description ?? "",
    start_date: initial.start_date ?? "",
    end_date: initial.end_date ?? "",
    status: initial.status ?? "planned",
    tag_ids: initial.tags?.map((t) => t.id) ?? [],
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Name *" value={form.name} onChange={set("name")} required placeholder="Exercise name" />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={set("description")}
          rows={3}
          className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 resize-none"
          placeholder="Optional description or scope"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" type="date" value={form.start_date} onChange={set("start_date")} />
        <Input label="End Date" type="date" value={form.end_date} onChange={set("end_date")} />
      </div>
      <Select label="Status" value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />
      <TagSelector value={form.tag_ids} onChange={(ids) => setForm((f) => ({ ...f, tag_ids: ids }))} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
