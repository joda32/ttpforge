import { useState, useEffect } from "react";
import PageHeader from "../../components/layout/PageHeader";
import Spinner from "../../components/ui/Spinner";
import { useLLMConfig, useUpdateLLMConfig } from "../../hooks/useAttackPlan";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";

const TABS = [
  { key: "general",     label: "General"     },
  { key: "ttp-library", label: "TTP Library" },
  { key: "llm",         label: "LLM Config"  },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-slate-700 mb-6">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-5 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
            active === key
              ? "border-blue-500 text-blue-400 font-medium"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── General tab ────────────────────────────────────────────────────────────────

function GeneralTab() {
  return (
    <div className="text-slate-500 text-sm py-4">
      No general settings configured yet.
    </div>
  );
}

// ── TTP Library tab ────────────────────────────────────────────────────────────

const URL_FIELDS = [
  {
    section: "Enterprise ATT&CK",
    color:   "text-blue-400",
    fields: [
      { key: "mitre_tactics_url",    label: "Tactics XLSX URL",    hint: "e.g. …/enterprise-attack-v19.1-tactics.xlsx",    placeholder: "https://github.com/CyberCX-STA/PurpleOps-Deps/raw/master/attack.mitre/15.1/enterprise-attack-v15.1-tactics.xlsx" },
      { key: "mitre_techniques_url", label: "Techniques XLSX URL", hint: "e.g. …/enterprise-attack-v19.1-techniques.xlsx", placeholder: "https://github.com/CyberCX-STA/PurpleOps-Deps/raw/master/attack.mitre/15.1/enterprise-attack-v15.1-techniques.xlsx" },
    ],
  },
  {
    section: "ICS ATT&CK",
    color:   "text-amber-400",
    fields: [
      { key: "mitre_ics_tactics_url",    label: "ICS Tactics XLSX URL",    hint: "e.g. …/ics-attack-v17.0-tactics.xlsx",    placeholder: "https://attack.mitre.org/docs/attack-excel-files/v17.0/ics-attack/ics-attack-v17.0-tactics.xlsx" },
      { key: "mitre_ics_techniques_url", label: "ICS Techniques XLSX URL", hint: "e.g. …/ics-attack-v17.0-techniques.xlsx", placeholder: "https://attack.mitre.org/docs/attack-excel-files/v17.0/ics-attack/ics-attack-v17.0-techniques.xlsx" },
    ],
  },
  {
    section: "Mobile ATT&CK",
    color:   "text-violet-400",
    fields: [
      { key: "mitre_mobile_tactics_url",    label: "Mobile Tactics XLSX URL",    hint: "e.g. …/mobile-attack-v17.0-tactics.xlsx",    placeholder: "https://attack.mitre.org/docs/attack-excel-files/v17.0/mobile-attack/mobile-attack-v17.0-tactics.xlsx" },
      { key: "mitre_mobile_techniques_url", label: "Mobile Techniques XLSX URL", hint: "e.g. …/mobile-attack-v17.0-techniques.xlsx", placeholder: "https://attack.mitre.org/docs/attack-excel-files/v17.0/mobile-attack/mobile-attack-v17.0-techniques.xlsx" },
    ],
  },
];

const EMPTY_URLS = {
  mitre_tactics_url: "", mitre_techniques_url: "",
  mitre_ics_tactics_url: "", mitre_ics_techniques_url: "",
  mitre_mobile_tactics_url: "", mitre_mobile_techniques_url: "",
};

function TTPLibraryTab() {
  const { data: settings, isLoading } = useSettings();
  const { mutateAsync: save, isPending } = useUpdateSettings();
  const [urls, setUrls]   = useState(EMPTY_URLS);
  const [saved, setSaved] = useState(false);
  const [err, setErr]     = useState(null);

  useEffect(() => {
    if (!settings) return;
    setUrls((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(EMPTY_URLS).map((k) => [k, settings[k] ?? ""])) }));
  }, [settings]);

  const setUrl = (key) => (e) => setUrls((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    try {
      const payload = Object.fromEntries(Object.entries(urls).map(([k, v]) => [k, v || null]));
      await save(payload);
      setSaved(true);
    } catch {
      setErr("Failed to save.");
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7 max-w-2xl">
      <p className="text-xs text-slate-500">
        Provide direct URLs to MITRE ATT&amp;CK Excel files for each framework. Leave blank to use built-in defaults (Enterprise v15.1). ICS and Mobile require explicit URLs.
      </p>

      {URL_FIELDS.map(({ section, color, fields }) => (
        <div key={section} className="flex flex-col gap-4">
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{section}</h3>
          {fields.map(({ key, label, hint, placeholder }) => (
            <div key={key}>
              <label className="block text-sm text-slate-400 mb-1">{label}</label>
              <input
                type="url"
                value={urls[key]}
                onChange={setUrl(key)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm placeholder:text-slate-600"
              />
              <p className="text-xs text-slate-600 mt-1">{hint}</p>
            </div>
          ))}
        </div>
      ))}

      {err  && <p className="text-red-400 text-sm">{err}</p>}
      {saved && <p className="text-green-400 text-sm">Saved.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

// ── LLM Config tab ─────────────────────────────────────────────────────────────

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "openai",    label: "OpenAI"              },
  { value: "ollama",    label: "Ollama (local)"       },
];

const DEFAULT_MODELS = {
  anthropic: "claude-opus-4-7",
  openai:    "gpt-4o",
  ollama:    "llama3",
};

const OLLAMA_DEFAULT_URL = "http://localhost:11434/v1";

function LLMTab() {
  const { data: cfg, isLoading } = useLLMConfig();
  const { mutateAsync: save, isPending } = useUpdateLLMConfig();

  const [form, setForm] = useState({
    provider:   "anthropic",
    model:      "claude-opus-4-7",
    api_key:    "",
    base_url:   "",
    max_tokens: 8192,
  });
  const [saved, setSaved] = useState(false);
  const [err, setErr]     = useState(null);

  useEffect(() => {
    if (!cfg) return;
    setForm({
      provider:   cfg.provider   ?? "anthropic",
      model:      cfg.model      ?? "claude-opus-4-7",
      api_key:    "",
      base_url:   cfg.base_url   ?? "",
      max_tokens: cfg.max_tokens ?? 8192,
    });
  }, [cfg]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "provider") {
        next.model    = DEFAULT_MODELS[val] ?? "";
        next.base_url = val === "ollama" ? OLLAMA_DEFAULT_URL : "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    try {
      await save(form);
      setSaved(true);
      setForm((prev) => ({ ...prev, api_key: "" }));
    } catch (ex) {
      setErr(ex?.response?.data?.error ?? "Save failed.");
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      <div>
        <label className="block text-sm text-slate-400 mb-1">Provider</label>
        <select
          value={form.provider}
          onChange={set("provider")}
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Model</label>
        <input
          type="text"
          value={form.model}
          onChange={set("model")}
          placeholder="e.g. claude-opus-4-7"
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm"
        />
      </div>

      {form.provider !== "ollama" && (
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            API Key
            {cfg?.api_key_set && (
              <span className="ml-2 text-green-400 text-xs">(currently set)</span>
            )}
          </label>
          <input
            type="password"
            value={form.api_key}
            onChange={set("api_key")}
            placeholder={cfg?.api_key_set ? "Leave blank to keep existing key" : "Paste API key here"}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm"
          />
        </div>
      )}

      {form.provider === "ollama" && (
        <div>
          <label className="block text-sm text-slate-400 mb-1">Base URL</label>
          <input
            type="text"
            value={form.base_url}
            onChange={set("base_url")}
            placeholder="http://localhost:11434/v1"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm"
          />
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-400 mb-1">Max tokens</label>
        <input
          type="number"
          value={form.max_tokens}
          onChange={set("max_tokens")}
          min={256}
          max={32768}
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm"
        />
      </div>

      {err  && <p className="text-red-400 text-sm">{err}</p>}
      {saved && <p className="text-green-400 text-sm">Configuration saved.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [tab, setTab] = useState("general");

  return (
    <div>
      <PageHeader title="Settings" subtitle="Application configuration" />
      <TabBar active={tab} onChange={setTab} />
      {tab === "general"     && <GeneralTab />}
      {tab === "ttp-library" && <TTPLibraryTab />}
      {tab === "llm"         && <LLMTab />}
    </div>
  );
}
