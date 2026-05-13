import { useState } from "react";
import { useTTPs } from "../../hooks/useTTPs";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Combobox from "../ui/Combobox";
import Button from "../ui/Button";
import TagSelector from "../ui/TagSelector";
import ImageUploader from "./ImageUploader";

const OUTCOME_OPTIONS = [
  { value: "", label: "— Not set —" },
  { value: "detected", label: "Detected" },
  { value: "missed", label: "Missed" },
  { value: "partial", label: "Partial" },
];

const TABS = ["Red Team", "Blue Team"];

function toLocalDatetimeValue(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 16);
}

export default function EntryForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [activeTab, setActiveTab] = useState(0);
  const { data: ttpData } = useTTPs({});
  const ttps = ttpData?.data ?? [];

  const [form, setForm] = useState({
    ttp_id: initial.ttp_id ?? "",
    executed_at: toLocalDatetimeValue(initial.executed_at),
    tool_used: initial.tool_used ?? "",
    command_used: initial.command_used ?? "",
    source: initial.source ?? "",
    destination: initial.destination ?? "",
    red_notes: initial.red_notes ?? "",
    detected: initial.detected ?? "",
    detected_at: toLocalDatetimeValue(initial.detected_at),
    detection_method: initial.detection_method ?? "",
    alert_name: initial.alert_name ?? "",
    response_action: initial.response_action ?? "",
    blue_notes: initial.blue_notes ?? "",
    outcome: initial.outcome ?? "",
    gap_identified: initial.gap_identified ?? "",
    tag_ids: initial.tags?.map((t) => t.id) ?? [],
  });

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: val };
      if (k === "detected") {
        if (val === "true" || val === true) next.outcome = "detected";
        else if (val === "false" || val === false) next.outcome = "missed";
        else next.outcome = "";
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      ttp_id: Number(form.ttp_id),
      detected: form.detected === "" ? null : form.detected === "true" || form.detected === true,
      executed_at: form.executed_at || null,
      detected_at: form.detected_at || null,
      outcome: form.outcome || null,
    };
    onSubmit(payload);
  };

  const ttpOptions = ttps.map((t) => ({ value: t.id, label: `${t.mitre_id} — ${t.name}` }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Combobox
        label="TTP *"
        value={form.ttp_id}
        onChange={(val) => setForm((f) => ({ ...f, ttp_id: val }))}
        options={ttpOptions}
        placeholder="Search by MITRE ID or technique name…"
        required
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? i === 0
                  ? "border-red-500 text-red-400"
                  : "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Executed At</label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={form.executed_at}
                onChange={set("executed_at")}
                className="flex-1 bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, executed_at: new Date().toISOString().slice(0, 16) }))}
                className="shrink-0 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-slate-100 transition-colors whitespace-nowrap"
              >
                Now
              </button>
            </div>
          </div>
          <Input label="Tool Used" value={form.tool_used} onChange={set("tool_used")} placeholder="e.g. Cobalt Strike, Metasploit" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Source" value={form.source} onChange={set("source")} placeholder="e.g. 10.0.0.5, attacker-host" />
            <Input label="Destination" value={form.destination} onChange={set("destination")} placeholder="e.g. 10.0.0.10, target-host" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Command / Payload</label>
            <textarea
              value={form.command_used}
              onChange={set("command_used")}
              rows={3}
              className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 resize-none"
              placeholder="Command or payload used"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Red Team Notes</label>
            <textarea
              value={form.red_notes}
              onChange={set("red_notes")}
              rows={2}
              className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 resize-none"
              placeholder="Context, variations attempted, etc."
            />
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="flex flex-col gap-3">
          <Select
            label="Detected?"
            value={String(form.detected)}
            onChange={set("detected")}
            options={[
              { value: "", label: "— Unknown —" },
              { value: "true", label: "Yes — Detected" },
              { value: "false", label: "No — Missed" },
            ]}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Detected At</label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={form.detected_at}
                onChange={set("detected_at")}
                className="flex-1 bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, detected_at: new Date().toISOString().slice(0, 16) }))}
                className="shrink-0 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-slate-100 transition-colors whitespace-nowrap"
              >
                Now
              </button>
            </div>
          </div>
          <Input label="Detection Method" value={form.detection_method} onChange={set("detection_method")} placeholder="e.g. SIEM alert, EDR, manual review" />
          <Input label="Alert Name / Rule" value={form.alert_name} onChange={set("alert_name")} placeholder="Alert or detection rule name" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Response Action</label>
            <textarea
              value={form.response_action}
              onChange={set("response_action")}
              rows={2}
              className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 resize-none"
              placeholder="Actions taken in response"
            />
          </div>
          <Select label="Outcome" value={form.outcome} onChange={set("outcome")} options={OUTCOME_OPTIONS} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Gap Identified</label>
            <textarea
              value={form.gap_identified}
              onChange={set("gap_identified")}
              rows={2}
              className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 resize-none"
              placeholder="Detection or response gaps identified"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Blue Team Notes</label>
            <textarea
              value={form.blue_notes}
              onChange={set("blue_notes")}
              rows={2}
              className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 resize-none"
            />
          </div>
        </div>
      )}

      <TagSelector
        value={form.tag_ids}
        onChange={(ids) => setForm((f) => ({ ...f, tag_ids: ids }))}
      />

      {initial.id && <ImageUploader entryId={initial.id} />}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.ttp_id}>
          {loading ? "Saving…" : "Save Entry"}
        </Button>
      </div>
    </form>
  );
}
