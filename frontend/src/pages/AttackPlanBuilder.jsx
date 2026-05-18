import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import PlanMap from "../components/attack-plan/PlanMap";
import { useAnalyzeReport, useConvertPlan } from "../hooks/useAttackPlan";

const SOURCE_TABS = [
  { key: "url",  label: "URL"        },
  { key: "pdf",  label: "PDF upload" },
  { key: "text", label: "Paste text" },
];

// ── Source input section ───────────────────────────────────────────────────────

function SourceInput({ onAnalyzed }) {
  const [tab, setTab]       = useState("url");
  const [url, setUrl]       = useState("");
  const [text, setText]     = useState("");
  const [file, setFile]     = useState(null);
  const [error, setError]   = useState(null);
  const fileRef             = useRef();

  const { mutateAsync: analyze, isPending } = useAnalyzeReport();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      let result;
      if (tab === "url")  result = await analyze({ sourceType: "url", content: url });
      if (tab === "pdf")  result = await analyze({ sourceType: "pdf", content: file });
      if (tab === "text") result = await analyze({ sourceType: "text", content: text });
      onAnalyzed(result?.ttps ?? []);
    } catch (ex) {
      setError(ex?.response?.data?.error ?? "Analysis failed. Check LLM configuration.");
    }
  };

  const tabClass = (k) =>
    `px-4 py-2 text-sm border-b-2 transition-colors ${
      tab === k
        ? "border-blue-500 text-blue-400"
        : "border-transparent text-slate-500 hover:text-slate-300"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-700">
        {SOURCE_TABS.map(({ key, label }) => (
          <button key={key} type="button" className={tabClass(key)} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "url" && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="https://example.com/threat-report"
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm placeholder:text-slate-600"
        />
      )}

      {tab === "pdf" && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 hover:border-slate-500"
          >
            {file ? file.name : "Choose PDF file…"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {!file && <p className="text-xs text-slate-600 mt-1">Select a PDF threat report to upload.</p>}
        </div>
      )}

      {tab === "text" && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={10}
          placeholder="Paste threat report text here…"
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm placeholder:text-slate-600 resize-y font-mono"
        />
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isPending || (tab === "pdf" && !file)}
        className="self-start flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
      >
        {isPending ? "Analysing…" : "Extract TTPs"}
      </button>
    </form>
  );
}

// ── Convert modal ──────────────────────────────────────────────────────────────

function ConvertModal({ ttps, onClose }) {
  const navigate = useNavigate();
  const [name, setName]     = useState("");
  const [desc, setDesc]     = useState("");
  const [error, setError]   = useState(null);
  const { mutateAsync: convert, isPending } = useConvertPlan();

  const handleConvert = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await convert({ name, description: desc, ttps });
      navigate(`/exercises/${res.exercise_id}`);
    } catch (ex) {
      setError(ex?.response?.data?.error ?? "Conversion failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleConvert}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl"
      >
        <h2 className="text-base font-semibold text-slate-100">Convert to Exercise</h2>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Exercise name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm resize-none"
          />
        </div>

        <p className="text-xs text-slate-500">
          {ttps.filter((t) => t.in_library).length} of {ttps.length} TTPs are in the library and will be added as entries.
          TTPs not in the library will be skipped.
        </p>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {isPending ? "Creating…" : "Create exercise"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function AttackPlanBuilder() {
  const [ttps, setTtps]         = useState(null);
  const [showConvert, setShowConvert] = useState(false);

  return (
    <div>
      <PageHeader
        title="Attack Plan Builder"
        subtitle="Analyse a threat report to extract MITRE ATT&CK techniques and build an exercise"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: source input */}
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Threat Report Source
          </h2>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <SourceInput onAnalyzed={(result) => setTtps(result)} />
          </div>
        </div>

        {/* Right: plan map */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Attack Plan{ttps !== null ? ` — ${ttps.length} technique${ttps.length !== 1 ? "s" : ""}` : ""}
            </h2>
            {ttps !== null && ttps.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConvert(true)}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
              >
                Convert to exercise →
              </button>
            )}
          </div>

          {ttps === null ? (
            <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-xl p-10 text-center text-slate-600 text-sm">
              Submit a threat report to extract techniques
            </div>
          ) : ttps.length === 0 ? (
            <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-xl p-10 text-center text-slate-600 text-sm">
              No MITRE techniques found in the report
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <PlanMap items={ttps} onChange={setTtps} />
            </div>
          )}
        </div>
      </div>

      {showConvert && ttps && (
        <ConvertModal ttps={ttps} onClose={() => setShowConvert(false)} />
      )}
    </div>
  );
}
