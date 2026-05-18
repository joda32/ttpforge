import { useState } from "react";
import { useTTPs } from "../hooks/useTTPs";
import { useTactics, useMitreRefresh } from "../hooks/useTactics";
import { useAuth } from "../hooks/useAuth";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Spinner from "../components/ui/Spinner";
import FrameworkBadge from "../components/ui/FrameworkBadge";

const TABS = ["Techniques", "Tactics"];

const FRAMEWORKS = [
  { value: "",           label: "All Frameworks" },
  { value: "enterprise", label: "Enterprise"     },
  { value: "ics",        label: "ICS"            },
  { value: "mobile",     label: "Mobile"         },
];

const MITRE_URLS = {
  enterprise: (id) => `https://attack.mitre.org/techniques/${id.replace(".", "/")}/`,
  ics:        (id) => `https://attack.mitre.org/techniques/${id.replace(".", "/")}/`,
  mobile:     (id) => `https://attack.mitre.org/techniques/${id.replace(".", "/")}/`,
};

function TechniquesTab({ framework, onFrameworkChange }) {
  const [search, setSearch] = useState("");
  const [tactic, setTactic] = useState("");
  const [platform, setPlatform] = useState("");

  const params = {};
  if (search)    params.search    = search;
  if (tactic)    params.tactic    = tactic;
  if (platform)  params.platform  = platform;
  if (framework) params.framework = framework;

  const { data, isLoading, error } = useTTPs(params);
  const ttps    = data?.data    ?? [];
  const tactics = data?.tactics ?? [];

  const clearFilters = () => { setSearch(""); setTactic(""); setPlatform(""); onFrameworkChange(""); };
  const hasFilters = search || tactic || platform || framework;

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-5">
        <Select
          value={framework}
          onChange={(e) => { onFrameworkChange(e.target.value); setTactic(""); }}
          options={FRAMEWORKS.slice(1).map((f) => ({ value: f.value, label: f.label }))}
          placeholder="All Frameworks"
          className="w-40"
        />
        <Input
          placeholder="Search techniques…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-52"
        />
        <Select
          value={tactic}
          onChange={(e) => setTactic(e.target.value)}
          options={tactics.map((t) => ({ value: t, label: t }))}
          placeholder="All Tactics"
          className="w-48"
        />
        <Select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          options={["Windows", "Linux", "macOS", "Cloud", "Network", "Embedded"].map((p) => ({ value: p, label: p }))}
          placeholder="All Platforms"
          className="w-44"
        />
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>Clear</Button>
        )}
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-red-400 text-sm">Failed to load techniques.</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">MITRE ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28">Framework</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-52">Tactics</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-44">Platform</th>
              </tr>
            </thead>
            <tbody>
              {ttps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No techniques match your filters.
                  </td>
                </tr>
              )}
              {ttps.map((ttp) => (
                <tr key={ttp.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={MITRE_URLS[ttp.framework]?.(ttp.mitre_id) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-400 hover:underline text-xs font-medium"
                    >
                      {ttp.mitre_id}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <FrameworkBadge framework={ttp.framework} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-medium">{ttp.name}</div>
                    {ttp.description && (
                      <div className="text-slate-500 text-xs mt-0.5 line-clamp-1">{ttp.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ttp.tactics?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ttp.tactics.map((t) => (
                          <span key={t.id} className="text-xs bg-slate-700 border border-slate-600 text-slate-300 px-1.5 py-0.5 rounded">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs">{ttp.tactic || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ttp.platform?.split(",").map((p) => (
                        <span key={p} className="text-xs bg-slate-700 border border-slate-600 text-slate-400 px-1.5 py-0.5 rounded">
                          {p.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function TacticsTab({ framework, onFrameworkChange }) {
  const { data, isLoading, error } = useTactics(framework ? { framework } : undefined);
  const tactics = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Failed to load tactics.</p>;

  return (
    <>
      <div className="flex gap-3 mb-5">
        <Select
          value={framework}
          onChange={(e) => onFrameworkChange(e.target.value)}
          options={FRAMEWORKS.slice(1).map((f) => ({ value: f.value, label: f.label }))}
          placeholder="All Frameworks"
          className="w-40"
        />
      </div>

      {tactics.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
          No tactics loaded yet. Click <span className="text-slate-300 font-medium">Refresh from MITRE</span> to download the latest ATT&amp;CK framework.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">MITRE ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28">Framework</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider w-36">Techniques</th>
              </tr>
            </thead>
            <tbody>
              {tactics.map((tactic) => (
                <tr key={tactic.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={`https://attack.mitre.org/tactics/${tactic.mitre_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-400 hover:underline text-xs font-medium"
                    >
                      {tactic.mitre_id}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <FrameworkBadge framework={tactic.framework} />
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-medium">{tactic.name}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{tactic.technique_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function TTPLibrary() {
  const [activeTab, setActiveTab]   = useState(0);
  const [framework, setFramework]   = useState("");
  const [refreshFw, setRefreshFw]   = useState("");
  const refreshMutation             = useMitreRefresh();
  const { data: ttpData }           = useTTPs({});
  const { user }                    = useAuth();
  const isAdmin                     = user?.role === "admin";

  const handleRefresh = () => {
    refreshMutation.mutate(refreshFw || undefined, {
      onSuccess: (result) => {
        const parts = Object.entries(result)
          .filter(([k]) => k !== "errors")
          .map(([fw, r]) => `${fw}: ${r.tactics_updated} tactics, ${r.techniques_updated} techniques`)
          .join("\n");
        const errs = result.errors
          ? "\n\nErrors:\n" + Object.entries(result.errors).map(([fw, e]) => `${fw}: ${e}`).join("\n")
          : "";
        alert(`MITRE refresh complete.\n${parts}${errs}`);
      },
      onError: (err) => {
        alert(`Refresh failed: ${err.response?.data?.error ?? err.message}`);
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="TTP Library"
        subtitle={`${ttpData?.total ?? 0} techniques`}
        actions={isAdmin && (
          <div className="flex items-center gap-2">
            <select
              value={refreshFw}
              onChange={(e) => setRefreshFw(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-300 text-sm"
            >
              {FRAMEWORKS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? "Refreshing…" : "↻ Refresh from MITRE"}
            </Button>
          </div>
        )}
      />

      <div className="flex border-b border-slate-700 mb-5">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <TechniquesTab framework={framework} onFrameworkChange={setFramework} />}
      {activeTab === 1 && <TacticsTab   framework={framework} onFrameworkChange={setFramework} />}
    </div>
  );
}
