import { useState } from "react";
import { useTTPs } from "../hooks/useTTPs";
import { useTactics, useMitreRefresh } from "../hooks/useTactics";
import { useAuth } from "../hooks/useAuth";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Spinner from "../components/ui/Spinner";

const TABS = ["Techniques", "Tactics"];

function TechniquesTab() {
  const [search, setSearch] = useState("");
  const [tactic, setTactic] = useState("");
  const [platform, setPlatform] = useState("");

  const params = {};
  if (search)   params.search   = search;
  if (tactic)   params.tactic   = tactic;
  if (platform) params.platform = platform;

  const { data, isLoading, error } = useTTPs(params);
  const ttps    = data?.data    ?? [];
  const tactics = data?.tactics ?? [];

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-5">
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
          options={["Windows", "Linux", "macOS", "Cloud"].map((p) => ({ value: p, label: p }))}
          placeholder="All Platforms"
          className="w-44"
        />
        {(search || tactic || platform) && (
          <Button variant="ghost" onClick={() => { setSearch(""); setTactic(""); setPlatform(""); }}>
            Clear
          </Button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-52">Tactics</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-44">Platform</th>
              </tr>
            </thead>
            <tbody>
              {ttps.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No techniques match your filters.
                  </td>
                </tr>
              )}
              {ttps.map((ttp) => (
                <tr key={ttp.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={`https://attack.mitre.org/techniques/${ttp.mitre_id.replace(".", "/")}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-400 hover:underline text-xs font-medium"
                    >
                      {ttp.mitre_id}
                    </a>
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

function TacticsTab() {
  const { data, isLoading, error } = useTactics();
  const tactics = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-red-400 text-sm">Failed to load tactics.</p>;

  if (tactics.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
        No tactics loaded yet. Click <span className="text-slate-300 font-medium">Refresh from MITRE</span> to download the latest ATT&amp;CK framework.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 border-b border-slate-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">MITRE ID</th>
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
              <td className="px-4 py-3 text-slate-200 font-medium">{tactic.name}</td>
              <td className="px-4 py-3 text-right text-slate-400">{tactic.technique_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TTPLibrary() {
  const [activeTab, setActiveTab] = useState(0);
  const refreshMutation = useMitreRefresh();
  const { data: ttpData } = useTTPs({});
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleRefresh = () => {
    refreshMutation.mutate(undefined, {
      onSuccess: (result) => {
        alert(`MITRE refresh complete: ${result.tactics_updated} tactics, ${result.techniques_updated} techniques updated.`);
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
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? "Refreshing…" : "↻ Refresh from MITRE"}
          </Button>
        )}
      />

      {/* Tabs */}
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

      {activeTab === 0 && <TechniquesTab />}
      {activeTab === 1 && <TacticsTab />}
    </div>
  );
}
