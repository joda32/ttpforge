import { useState, useEffect } from "react";
import { useLLMConfig, useUpdateLLMConfig } from "../../hooks/useAttackPlan";
import PageHeader from "../../components/layout/PageHeader";
import Spinner from "../../components/ui/Spinner";

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

export default function LLMConfig() {
  const { data: cfg, isLoading } = useLLMConfig();
  const { mutateAsync: save, isPending } = useUpdateLLMConfig();

  const [form, setForm] = useState({
    provider: "anthropic",
    model:    "claude-opus-4-7",
    api_key:  "",
    base_url: "",
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
      max_tokens: cfg.max_tokens ?? 4096,
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
      setErr(ex?.response?.data?.error ?? "Save failed");
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-xl">
      <PageHeader title="LLM Configuration" subtitle="Configure the language model used for threat report analysis" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Provider */}
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

        {/* Model */}
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

        {/* API Key */}
        {form.provider !== "ollama" && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              API Key{cfg?.api_key_set && <span className="ml-2 text-green-400 text-xs">(currently set)</span>}
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

        {/* Base URL (Ollama) */}
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

        {/* Max tokens */}
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
    </div>
  );
}
