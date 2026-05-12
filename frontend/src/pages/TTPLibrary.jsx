import { useState } from "react";
import { useTTPs } from "../hooks/useTTPs";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Spinner from "../components/ui/Spinner";

export default function TTPLibrary() {
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
    <div>
      <PageHeader title="TTP Library" subtitle={`${data?.total ?? 0} techniques`} />

      <div className="flex flex-wrap gap-3 mb-5">
        <Input placeholder="Search techniques…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-52" />
        <Select value={tactic} onChange={(e) => setTactic(e.target.value)} options={tactics.map((t) => ({ value: t, label: t }))} placeholder="All Tactics" className="w-48" />
        <Select value={platform} onChange={(e) => setPlatform(e.target.value)} options={["Windows","Linux","macOS","Cloud"].map((p) => ({ value: p, label: p }))} placeholder="All Platforms" className="w-44" />
        {(search || tactic || platform) && (
          <Button variant="ghost" onClick={() => { setSearch(""); setTactic(""); setPlatform(""); }}>Clear</Button>
        )}
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-reddit-red text-sm">Failed to load TTPs.</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-reddit-border">
          <table className="w-full text-sm">
            <thead className="bg-reddit-surface border-b border-reddit-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider w-32">MITRE ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider w-40">Tactic</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-reddit-muted uppercase tracking-wider w-44">Platform</th>
              </tr>
            </thead>
            <tbody>
              {ttps.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-reddit-muted">No techniques match your filters.</td></tr>
              )}
              {ttps.map((ttp) => (
                <tr key={ttp.id} className="border-b border-reddit-border bg-reddit-card hover:bg-reddit-hover transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={`https://attack.mitre.org/techniques/${ttp.mitre_id.replace(".", "/")}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-reddit-blue hover:underline text-xs font-semibold"
                    >
                      {ttp.mitre_id}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-reddit-text font-medium">{ttp.name}</div>
                    {ttp.description && <div className="text-reddit-muted text-xs mt-0.5 line-clamp-1">{ttp.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-reddit-muted text-xs">{ttp.tactic}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ttp.platform?.split(",").map((p) => (
                        <span key={p} className="text-xs bg-reddit-surface border border-reddit-border text-reddit-muted px-1.5 py-0.5 rounded-full">
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
    </div>
  );
}
