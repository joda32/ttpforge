import Button from "../ui/Button";

const TACTIC_ORDER = [
  "Reconnaissance", "Resource Development", "Initial Access", "Execution",
  "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access",
  "Discovery", "Lateral Movement", "Collection", "Command and Control",
  "Command & Control", "Exfiltration", "Impact",
];

const CELL_STYLE = {
  detected: { bg: "#14532d", border: "#16a34a", id: "#4ade80", label: "#bbf7d0" },
  missed:   { bg: "#450a0a", border: "#dc2626", id: "#f87171", label: "#fecaca" },
  partial:  { bg: "#451a03", border: "#d97706", id: "#fbbf24", label: "#fde68a" },
  default:  { bg: "#1e293b", border: "#334155", id: "#60a5fa", label: "#94a3b8" },
};

// ── SVG export ────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
  if (!text) return [];
  if (text.length <= maxChars) return [text];
  const breakAt = text.lastIndexOf(" ", maxChars);
  if (breakAt > 0) {
    const line1 = text.slice(0, breakAt);
    const rest = text.slice(breakAt + 1);
    const line2 = rest.length > maxChars ? rest.slice(0, maxChars - 1) + "…" : rest;
    return [line1, line2];
  }
  return [text.slice(0, maxChars - 1) + "…"];
}

function buildMatrixSVG(tactics, tacticMap, exerciseName) {
  const COL_W    = 164;
  const COL_GAP  = 8;
  const CELL_H   = 64;
  const CELL_GAP = 6;
  const HDR_H    = 52;
  const PAD      = 20;
  const LEGEND_H = 44;
  const TITLE_H  = exerciseName ? 38 : 0;

  const maxCells = Math.max(...tactics.map((t) => tacticMap[t].length));
  const totalW   = tactics.length * (COL_W + COL_GAP) - COL_GAP + PAD * 2;
  const totalH   = PAD + TITLE_H + HDR_H + CELL_GAP + maxCells * (CELL_H + CELL_GAP) + LEGEND_H + PAD;

  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`;
  out += `<rect width="${totalW}" height="${totalH}" fill="#0f172a"/>`;

  // Optional title
  if (exerciseName) {
    out += `<text x="${PAD}" y="${PAD + 24}" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#e2e8f0">${esc(exerciseName)} — ATT&amp;CK Matrix</text>`;
  }

  const topY = PAD + TITLE_H;

  tactics.forEach((tactic, ti) => {
    const x = PAD + ti * (COL_W + COL_GAP);
    const cells = tacticMap[tactic];
    const detected = cells.filter((e) => e.outcome === "detected").length;

    // Tactic header
    out += `<rect x="${x}" y="${topY}" width="${COL_W}" height="${HDR_H}" rx="6" fill="#334155" stroke="#475569"/>`;
    out += `<text x="${x + COL_W / 2}" y="${topY + 19}" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="#e2e8f0" text-anchor="middle">${esc(tactic.toUpperCase())}</text>`;
    out += `<text x="${x + COL_W / 2}" y="${topY + 36}" font-family="system-ui,sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${detected}/${cells.length} detected</text>`;

    // Technique cells
    const sorted = [...cells].sort((a, b) => (a.ttp?.mitre_id ?? "").localeCompare(b.ttp?.mitre_id ?? ""));
    sorted.forEach((entry, ci) => {
      const s  = CELL_STYLE[entry.outcome] ?? CELL_STYLE.default;
      const cy = topY + HDR_H + CELL_GAP + ci * (CELL_H + CELL_GAP);

      out += `<rect x="${x}" y="${cy}" width="${COL_W}" height="${CELL_H}" rx="6" fill="${s.bg}" stroke="${s.border}"/>`;
      out += `<text x="${x + 8}" y="${cy + 14}" font-family="monospace" font-size="10" font-weight="600" fill="${s.id}">${esc(entry.ttp?.mitre_id ?? "")}</text>`;

      const nameLines = wrapText(entry.ttp?.name ?? "", 22);
      nameLines.forEach((line, li) => {
        out += `<text x="${x + 8}" y="${cy + 27 + li * 13}" font-family="system-ui,sans-serif" font-size="10" fill="${s.label}">${esc(line)}</text>`;
      });

      if (entry.outcome) {
        out += `<text x="${x + 8}" y="${cy + CELL_H - 7}" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="${s.id}">${esc(entry.outcome.toUpperCase())}</text>`;
      }
    });
  });

  // Legend
  const legendY = topY + HDR_H + CELL_GAP + maxCells * (CELL_H + CELL_GAP) + 12;
  const legendItems = [
    { key: "detected", label: "Detected" },
    { key: "missed",   label: "Missed" },
    { key: "partial",  label: "Partial" },
    { key: "default",  label: "No outcome" },
  ];
  legendItems.forEach((item, i) => {
    const s  = CELL_STYLE[item.key];
    const lx = PAD + i * 110;
    out += `<rect x="${lx}" y="${legendY}" width="14" height="14" rx="3" fill="${s.bg}" stroke="${s.border}"/>`;
    out += `<text x="${lx + 20}" y="${legendY + 11}" font-family="system-ui,sans-serif" font-size="11" fill="#94a3b8">${esc(item.label)}</text>`;
  });

  out += `</svg>`;
  return { svg: out, width: totalW, height: totalH };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerSVGExport(tactics, tacticMap, exerciseName) {
  const { svg } = buildMatrixSVG(tactics, tacticMap, exerciseName);
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${exerciseName ?? "matrix"}-attack-matrix.svg`);
}

function triggerPNGExport(tactics, tacticMap, exerciseName) {
  const { svg, width, height } = buildMatrixSVG(tactics, tacticMap, exerciseName);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = () => {
    const scale  = 2;
    const canvas = document.createElement("canvas");
    canvas.width  = width  * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob((pngBlob) => {
      downloadBlob(pngBlob, `${exerciseName ?? "matrix"}-attack-matrix.png`);
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MitreMatrix({ entries, exerciseName }) {
  if (!entries?.length) {
    return (
      <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
        No entries yet. Add TTP entries to see the ATT&CK matrix.
      </div>
    );
  }

  // Deduplicate by mitre_id — keep the entry with the "worst" outcome
  const PRIORITY = { missed: 0, partial: 1, detected: 2, null: 3 };
  const dedupMap = {};
  for (const entry of entries) {
    const mid = entry.ttp?.mitre_id;
    if (!mid) continue;
    const existing = dedupMap[mid];
    if (!existing || (PRIORITY[entry.outcome] ?? 3) < (PRIORITY[existing.outcome] ?? 3)) {
      dedupMap[mid] = entry;
    }
  }
  const deduped = Object.values(dedupMap);

  // Group by tactic
  const tacticMap = {};
  for (const entry of deduped) {
    const tactic = entry.ttp?.tactic ?? "Unknown";
    if (!tacticMap[tactic]) tacticMap[tactic] = [];
    tacticMap[tactic].push(entry);
  }

  const tactics = Object.keys(tacticMap).sort((a, b) => {
    const ai = TACTIC_ORDER.findIndex((t) => t.toLowerCase() === a.toLowerCase());
    const bi = TACTIC_ORDER.findIndex((t) => t.toLowerCase() === b.toLowerCase());
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div>
      {/* Export controls */}
      <div className="flex justify-end gap-2 mb-3">
        <Button variant="secondary" onClick={() => triggerSVGExport(tactics, tacticMap, exerciseName)}>
          Export SVG
        </Button>
        <Button variant="secondary" onClick={() => triggerPNGExport(tactics, tacticMap, exerciseName)}>
          Export PNG
        </Button>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {tactics.map((tactic) => {
            const cols = tacticMap[tactic];
            const detected = cols.filter((e) => e.outcome === "detected").length;
            return (
              <div key={tactic} className="flex flex-col gap-1.5" style={{ width: 164 }}>
                {/* Tactic header */}
                <div className="rounded-md px-2 py-2 bg-slate-700 border border-slate-600 text-center">
                  <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide leading-tight">
                    {tactic}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {detected}/{cols.length} detected
                  </div>
                </div>

                {/* Technique cells */}
                {cols
                  .sort((a, b) => (a.ttp?.mitre_id ?? "").localeCompare(b.ttp?.mitre_id ?? ""))
                  .map((entry) => {
                    const s = CELL_STYLE[entry.outcome] ?? CELL_STYLE.default;
                    return (
                      <div
                        key={entry.id}
                        className="rounded-md px-2 py-2 border"
                        style={{ backgroundColor: s.bg, borderColor: s.border }}
                        title={`${entry.ttp?.mitre_id} — ${entry.ttp?.name}\nOutcome: ${entry.outcome ?? "not set"}`}
                      >
                        <div className="font-mono text-xs font-medium" style={{ color: s.id }}>
                          {entry.ttp?.mitre_id}
                        </div>
                        <div className="text-xs mt-0.5 line-clamp-2 leading-tight" style={{ color: s.label }}>
                          {entry.ttp?.name}
                        </div>
                        {entry.outcome && (
                          <div className="text-xs mt-1 font-semibold uppercase tracking-wide" style={{ color: s.id }}>
                            {entry.outcome}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-700">
          {Object.entries(CELL_STYLE).map(([key, s]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: s.bg, borderColor: s.border }} />
              <span className="text-xs text-slate-400 capitalize">{key === "default" ? "No outcome" : key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
