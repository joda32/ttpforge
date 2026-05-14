import { useRef, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderAttackPath, removeFromAttackPath } from "../../api/entries";
import Button from "../ui/Button";

const NODE_W = 192; // w-48
const ARROW_W = 40; // arrow component width (mx-1 + w-6 + arrowhead)
const CELL_W = NODE_W + ARROW_W; // width of one node+arrow unit

const OUTCOME_STYLE = {
  detected: { border: "border-green-600",  bg: "bg-green-900/30",  dot: "bg-green-500",  text: "text-green-400" },
  missed:   { border: "border-red-600",    bg: "bg-red-900/30",    dot: "bg-red-500",    text: "text-red-400" },
  partial:  { border: "border-yellow-600", bg: "bg-yellow-900/30", dot: "bg-yellow-500", text: "text-yellow-400" },
  default:  { border: "border-slate-600",  bg: "bg-slate-800",     dot: "bg-slate-500",  text: "text-slate-400" },
};

// ── SVG export ────────────────────────────────────────────────────────────────

const EXP_NODE_W  = 192;
const EXP_ARROW_W = 50;
const EXP_CELL_W  = EXP_NODE_W + EXP_ARROW_W;
const EXP_NODE_H  = 120;
const EXP_ROW_GAP = 54;
const EXP_PAD     = 24;
const EXP_COLS    = 4;

const OUTCOME_SVG = {
  detected: { border: "#16a34a", fill: "#14532d", id: "#4ade80", label: "#bbf7d0", dot: "#22c55e" },
  missed:   { border: "#dc2626", fill: "#450a0a", id: "#f87171", label: "#fecaca", dot: "#ef4444" },
  partial:  { border: "#d97706", fill: "#451a03", id: "#fbbf24", label: "#fde68a", dot: "#eab308" },
  default:  { border: "#475569", fill: "#1e293b", id: "#60a5fa", label: "#94a3b8", dot: "#64748b" },
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
  if (!text) return [];
  if (text.length <= maxChars) return [text];
  const breakAt = text.lastIndexOf(" ", maxChars);
  if (breakAt > 0) {
    const line1 = text.slice(0, breakAt);
    const rest  = text.slice(breakAt + 1);
    return [line1, rest.length > maxChars ? rest.slice(0, maxChars - 1) + "…" : rest];
  }
  return [text.slice(0, maxChars - 1) + "…"];
}

function buildAttackMapSVG(pathEntries, exerciseName) {
  const exportCols = Math.min(EXP_COLS, pathEntries.length);

  const rows = [];
  for (let i = 0; i < pathEntries.length; i += exportCols) {
    rows.push(pathEntries.slice(i, i + exportCols));
  }

  const TITLE_H   = exerciseName ? 38 : 0;
  const SUMMARY_H = 28;

  const hosts = [...new Set(
    pathEntries.flatMap((e) => [e.source, e.destination]).filter(Boolean)
  )];
  const SCOPE_H = hosts.length ? 52 : 0;

  const totalW = exportCols * EXP_CELL_W - EXP_ARROW_W + EXP_PAD * 2;
  const totalH = EXP_PAD + TITLE_H + SUMMARY_H
    + rows.length * EXP_NODE_H
    + Math.max(0, rows.length - 1) * EXP_ROW_GAP
    + SCOPE_H + EXP_PAD;

  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`;
  out += `<rect width="${totalW}" height="${totalH}" fill="#0f172a"/>`;

  // Title
  if (exerciseName) {
    out += `<text x="${EXP_PAD}" y="${EXP_PAD + 24}" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#e2e8f0">${esc(exerciseName)} — Attack Map</text>`;
  }

  // Summary bar
  const summaryY = EXP_PAD + TITLE_H + 18;
  const counts = { detected: 0, missed: 0, partial: 0, none: 0 };
  for (const e of pathEntries) {
    if (e.outcome) counts[e.outcome] = (counts[e.outcome] ?? 0) + 1;
    else counts.none++;
  }
  const summaryItems = [
    { key: "detected", label: "Detected",   dot: "#22c55e" },
    { key: "missed",   label: "Missed",     dot: "#ef4444" },
    { key: "partial",  label: "Partial",    dot: "#eab308" },
    { key: "none",     label: "No outcome", dot: "#64748b" },
  ];
  let sx = EXP_PAD;
  for (const item of summaryItems) {
    if (!counts[item.key]) continue;
    out += `<circle cx="${sx + 5}" cy="${summaryY - 4}" r="4" fill="${item.dot}"/>`;
    out += `<text x="${sx + 14}" y="${summaryY}" font-family="system-ui,sans-serif" font-size="11" fill="#94a3b8">${counts[item.key]} ${esc(item.label)}</text>`;
    sx += 90;
  }

  // Rows
  const firstRowY = EXP_PAD + TITLE_H + SUMMARY_H;

  rows.forEach((row, rowIdx) => {
    const rowY = firstRowY + rowIdx * (EXP_NODE_H + EXP_ROW_GAP);

    row.forEach((entry, colIdx) => {
      const x = EXP_PAD + colIdx * EXP_CELL_W;
      const s = OUTCOME_SVG[entry.outcome] ?? OUTCOME_SVG.default;

      // Node background
      out += `<rect x="${x}" y="${rowY}" width="${EXP_NODE_W}" height="${EXP_NODE_H}" rx="8" fill="${s.fill}" stroke="${s.border}" stroke-width="1.5"/>`;

      // Step label (left)
      out += `<text x="${x + 8}" y="${rowY + 14}" font-family="system-ui,sans-serif" font-size="10" fill="#64748b">Step ${entry.attack_path_step ?? (rowIdx * exportCols + colIdx + 1)}</text>`;

      // Outcome dot + text (right)
      if (entry.outcome) {
        const outcomeText = entry.outcome.toUpperCase();
        out += `<circle cx="${x + EXP_NODE_W - 34}" cy="${rowY + 10}" r="4" fill="${s.dot}"/>`;
        out += `<text x="${x + EXP_NODE_W - 26}" y="${rowY + 14}" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="${s.id}">${esc(outcomeText)}</text>`;
      }

      // MITRE ID
      out += `<text x="${x + 8}" y="${rowY + 29}" font-family="monospace" font-size="10" font-weight="600" fill="${s.id}">${esc(entry.ttp?.mitre_id ?? "")}</text>`;

      // Name (up to 2 lines)
      const nameLines = wrapText(entry.ttp?.name ?? "", 22);
      nameLines.forEach((line, li) => {
        out += `<text x="${x + 8}" y="${rowY + 43 + li * 13}" font-family="system-ui,sans-serif" font-size="11" font-weight="500" fill="${s.label}">${esc(line)}</text>`;
      });

      // Tactic
      out += `<text x="${x + 8}" y="${rowY + 72}" font-family="system-ui,sans-serif" font-size="10" fill="#64748b">${esc(entry.ttp?.tactic ?? "")}</text>`;

      // Optional: tool_used + src→dst
      let optY = 84;
      if (entry.tool_used || entry.source || entry.destination) {
        out += `<line x1="${x + 8}" y1="${rowY + 80}" x2="${x + EXP_NODE_W - 8}" y2="${rowY + 80}" stroke="#334155" stroke-width="1"/>`;
        if (entry.tool_used) {
          const tool = entry.tool_used.length > 24 ? entry.tool_used.slice(0, 23) + "…" : entry.tool_used;
          out += `<text x="${x + 8}" y="${rowY + optY + 10}" font-family="system-ui,sans-serif" font-size="10" fill="#94a3b8">${esc(tool)}</text>`;
          optY += 12;
        }
        if (entry.source || entry.destination) {
          const srcDst = `${entry.source || "?"} → ${entry.destination || "?"}`;
          const sd = srcDst.length > 24 ? srcDst.slice(0, 23) + "…" : srcDst;
          out += `<text x="${x + 8}" y="${rowY + optY + 10}" font-family="system-ui,sans-serif" font-size="10" fill="#64748b">${esc(sd)}</text>`;
        }
      }

      // Arrow to next node in row
      if (colIdx < row.length - 1) {
        const arrowLineX1 = x + EXP_NODE_W;
        const arrowLineX2 = x + EXP_NODE_W + EXP_ARROW_W - 10;
        const arrowY = rowY + 56;
        out += `<line x1="${arrowLineX1}" y1="${arrowY}" x2="${arrowLineX2}" y2="${arrowY}" stroke="#475569" stroke-width="1.5"/>`;
        out += `<polygon points="${arrowLineX2},${arrowY - 5} ${arrowLineX2 + 10},${arrowY} ${arrowLineX2},${arrowY + 5}" fill="#475569"/>`;
      }
    });

    // Row-wrap connector (between rows)
    if (rowIdx < rows.length - 1) {
      const nodeBottom = rowY + EXP_NODE_H;
      const runY       = nodeBottom + EXP_ROW_GAP - 16;
      const nextRowY   = rowY + EXP_NODE_H + EXP_ROW_GAP;

      // rightEdge relative: (rowLength-1)*CELL_W + NODE_W, then subtract NODE_W/2 for center
      const dropXRel      = (row.length - 1) * EXP_CELL_W + EXP_NODE_W / 2;
      const dropXAbs      = EXP_PAD + dropXRel;
      const firstCenterX  = EXP_PAD + EXP_NODE_W / 2;

      out += `<line x1="${dropXAbs}" y1="${nodeBottom}" x2="${dropXAbs}" y2="${runY}" stroke="#475569" stroke-width="1.5"/>`;
      out += `<line x1="${dropXAbs}" y1="${runY}" x2="${firstCenterX}" y2="${runY}" stroke="#475569" stroke-width="1.5"/>`;
      out += `<line x1="${firstCenterX}" y1="${runY}" x2="${firstCenterX}" y2="${nextRowY - 9}" stroke="#475569" stroke-width="1.5"/>`;
      out += `<polygon points="${firstCenterX - 5},${nextRowY - 9} ${firstCenterX + 5},${nextRowY - 9} ${firstCenterX},${nextRowY}" fill="#475569"/>`;
    }
  });

  // Network scope
  if (hosts.length) {
    const scopeY = EXP_PAD + TITLE_H + SUMMARY_H + rows.length * EXP_NODE_H + (rows.length - 1) * EXP_ROW_GAP + 12;
    out += `<line x1="${EXP_PAD}" y1="${scopeY}" x2="${totalW - EXP_PAD}" y2="${scopeY}" stroke="#334155" stroke-width="1"/>`;
    out += `<text x="${EXP_PAD}" y="${scopeY + 16}" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="#64748b" letter-spacing="0.05em">NETWORK SCOPE</text>`;
    let hx = EXP_PAD;
    for (const host of hosts) {
      const label = host.length > 18 ? host.slice(0, 17) + "…" : host;
      const boxW  = label.length * 6.5 + 16;
      out += `<rect x="${hx}" y="${scopeY + 22}" width="${boxW}" height="20" rx="4" fill="#1e293b" stroke="#334155"/>`;
      out += `<text x="${hx + 8}" y="${scopeY + 36}" font-family="monospace" font-size="10" fill="#cbd5e1">${esc(label)}</text>`;
      hx += boxW + 8;
      if (hx > totalW - EXP_PAD - 80) break;
    }
  }

  out += `</svg>`;
  return { svg: out, width: totalW, height: totalH };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function triggerSVGExport(pathEntries, exerciseName) {
  const { svg } = buildAttackMapSVG(pathEntries, exerciseName);
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${exerciseName ?? "attack"}-attack-map.svg`);
}

function triggerPNGExport(pathEntries, exerciseName) {
  const { svg, width, height } = buildAttackMapSVG(pathEntries, exerciseName);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale; canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob((pngBlob) => {
      downloadBlob(pngBlob, `${exerciseName ?? "attack"}-attack-map.png`);
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ── DOM components ────────────────────────────────────────────────────────────

function Arrow() {
  return (
    <div className="flex items-center self-start mt-14 shrink-0 mx-1">
      <div className="w-6 h-px bg-slate-600" />
      <div
        className="shrink-0"
        style={{
          width: 0, height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: "8px solid #475569",
        }}
      />
    </div>
  );
}

function RowWrapConnector({ rowLength }) {
  const rightEdge = (rowLength - 1) * CELL_W + NODE_W;
  const dropX = rightEdge - NODE_W / 2;

  return (
    <div className="relative mb-2" style={{ height: 36 }}>
      <div className="absolute top-0 w-px bg-slate-600" style={{ left: dropX, height: "calc(100% - 8px)" }} />
      <div className="absolute h-px bg-slate-600" style={{ left: NODE_W / 2, right: `calc(100% - ${dropX}px)`, bottom: 8 }} />
      <div
        className="absolute"
        style={{
          left: NODE_W / 2 - 5, bottom: 0,
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "8px solid #475569",
        }}
      />
    </div>
  );
}

function AttackNode({ entry, step, isFirst, isLast, onMove, onRemove }) {
  const s = OUTCOME_STYLE[entry.outcome] ?? OUTCOME_STYLE.default;
  const time = entry.executed_at
    ? new Date(entry.executed_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`w-48 rounded-lg border p-3 shrink-0 ${s.border} ${s.bg} relative group`}>
      <div className="absolute -top-3 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={() => onMove(-1)} disabled={isFirst}
          className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
          title="Move left">&#8592;</button>
        <button type="button" onClick={() => onMove(1)} disabled={isLast}
          className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
          title="Move right">&#8594;</button>
        <button type="button" onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded bg-red-900/60 border border-red-700 text-red-300 hover:bg-red-800 text-xs"
          title="Remove from attack path">&#10005;</button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">Step {step}</span>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
          {entry.outcome && <span className={`text-xs font-semibold uppercase ${s.text}`}>{entry.outcome}</span>}
        </div>
      </div>

      <div className="font-mono text-xs text-blue-400">{entry.ttp?.mitre_id}</div>
      <div className="text-sm font-medium text-slate-200 line-clamp-2 mt-0.5 leading-tight">{entry.ttp?.name}</div>
      <div className="text-xs text-slate-500 mt-0.5">{entry.ttp?.tactic}</div>

      {(entry.tool_used || entry.source || entry.destination) && (
        <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-0.5">
          {entry.tool_used && (
            <div className="text-xs text-slate-400 truncate" title={entry.tool_used}>{entry.tool_used}</div>
          )}
          {(entry.source || entry.destination) && (
            <div className="text-xs text-slate-500 truncate">
              {entry.source || "?"} &#8594; {entry.destination || "?"}
            </div>
          )}
        </div>
      )}

      {time && <div className="text-xs text-slate-600 mt-1.5">{time}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AttackMap({ entries, exerciseId, exerciseName }) {
  const qc = useQueryClient();
  const containerRef = useRef(null);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current.clientWidth;
      setCols(Math.max(1, Math.floor(w / CELL_W)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const reorderMutation = useMutation({
    mutationFn: (steps) => reorderAttackPath(exerciseId, steps),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (entryId) => removeFromAttackPath(exerciseId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises", exerciseId, "entries"] }),
  });

  const pathEntries = (entries ?? [])
    .filter((e) => e.attack_path_include)
    .sort((a, b) => (a.attack_path_step ?? 9999) - (b.attack_path_step ?? 9999));

  if (!pathEntries.length) {
    return (
      <div className="text-center py-16 text-slate-500 border border-slate-700 rounded-lg">
        <p>No entries in the attack path.</p>
        <p className="text-xs mt-1 text-slate-600">Edit an entry and enable "Include in Attack Path" to add it here.</p>
      </div>
    );
  }

  const handleMove = (globalIndex, direction) => {
    const swapIndex = globalIndex + direction;
    if (swapIndex < 0 || swapIndex >= pathEntries.length) return;
    const steps = pathEntries.map((e, i) => {
      if (i === globalIndex) return { entry_id: e.id, attack_path_step: pathEntries[swapIndex].attack_path_step ?? swapIndex + 1 };
      if (i === swapIndex)   return { entry_id: e.id, attack_path_step: pathEntries[globalIndex].attack_path_step ?? globalIndex + 1 };
      return { entry_id: e.id, attack_path_step: e.attack_path_step ?? i + 1 };
    });
    reorderMutation.mutate(steps);
  };

  const rows = [];
  for (let i = 0; i < pathEntries.length; i += cols) {
    rows.push(pathEntries.slice(i, i + cols));
  }

  const counts = { detected: 0, missed: 0, partial: 0, none: 0 };
  for (const e of pathEntries) {
    if (e.outcome) counts[e.outcome] = (counts[e.outcome] ?? 0) + 1;
    else counts.none++;
  }

  return (
    <div ref={containerRef}>
      {/* Export controls */}
      <div className="flex justify-end gap-2 mb-3">
        <Button variant="secondary" onClick={() => triggerSVGExport(pathEntries, exerciseName)}>
          Export SVG
        </Button>
        <Button variant="secondary" onClick={() => triggerPNGExport(pathEntries, exerciseName)}>
          Export PNG
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-5 px-1">
        {[
          { key: "detected", label: "Detected", cls: "bg-green-500" },
          { key: "missed",   label: "Missed",   cls: "bg-red-500" },
          { key: "partial",  label: "Partial",  cls: "bg-yellow-500" },
          { key: "none",     label: "No outcome", cls: "bg-slate-500" },
        ].map(({ key, label, cls }) => counts[key] > 0 && (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
            <span className="text-xs text-slate-400">{counts[key]} {label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-slate-600">Hover a node to move or remove it</span>
      </div>

      {/* Wrapped flow */}
      <div className="pt-5">
        {rows.map((row, rowIdx) => {
          const globalOffset = rowIdx * cols;
          return (
            <div key={rowIdx}>
              <div className="flex items-start">
                {row.map((entry, colIdx) => {
                  const globalIndex = globalOffset + colIdx;
                  return (
                    <div key={entry.id} className="flex items-start">
                      <AttackNode
                        entry={entry}
                        step={entry.attack_path_step ?? globalIndex + 1}
                        isFirst={globalIndex === 0}
                        isLast={globalIndex === pathEntries.length - 1}
                        onMove={(dir) => handleMove(globalIndex, dir)}
                        onRemove={() => removeMutation.mutate(entry.id)}
                      />
                      {colIdx < row.length - 1 && <Arrow />}
                    </div>
                  );
                })}
              </div>
              {rowIdx < rows.length - 1 && <RowWrapConnector rowLength={row.length} />}
            </div>
          );
        })}
      </div>

      {/* Network scope summary */}
      {pathEntries.some((e) => e.source || e.destination) && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Network Scope</h3>
          <div className="flex flex-wrap gap-2">
            {[...new Set(pathEntries.flatMap((e) => [e.source, e.destination]).filter(Boolean))].map((host) => (
              <span key={host} className="text-xs bg-slate-700 border border-slate-600 text-slate-300 px-2 py-1 rounded font-mono">
                {host}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
