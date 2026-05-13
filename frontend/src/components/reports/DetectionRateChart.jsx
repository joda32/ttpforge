export default function DetectionRateChart({ tacticBreakdown }) {
  const tactics = Object.entries(tacticBreakdown ?? {});
  if (tactics.length === 0) {
    return <p className="text-slate-500 text-sm">No tactic data yet.</p>;
  }

  const BAR_HEIGHT = 24;
  const GAP = 10;
  const LABEL_W = 180;
  const BAR_W = 260;
  const RATE_W = 50;
  const SVG_W = LABEL_W + BAR_W + RATE_W + 16;
  const SVG_H = tactics.length * (BAR_HEIGHT + GAP) + 10;

  return (
    <svg width={SVG_W} height={SVG_H} className="w-full max-w-xl">
      {tactics.map(([tactic, { total, detected, detection_rate }], i) => {
        const y = i * (BAR_HEIGHT + GAP) + 4;
        const fillW = Math.round(BAR_W * detection_rate);
        return (
          <g key={tactic}>
            <text x={0} y={y + BAR_HEIGHT / 2 + 4} className="text-xs" fill="#94a3b8" fontSize={12}>
              {tactic.length > 20 ? tactic.slice(0, 18) + "…" : tactic}
            </text>
            <rect x={LABEL_W} y={y} width={BAR_W} height={BAR_HEIGHT} rx={4} fill="#1e293b" />
            {fillW > 0 && (
              <rect x={LABEL_W} y={y} width={fillW} height={BAR_HEIGHT} rx={4} fill="#16a34a" />
            )}
            <text x={LABEL_W + BAR_W + 8} y={y + BAR_HEIGHT / 2 + 4} fill="#cbd5e1" fontSize={11}>
              {Math.round(detection_rate * 100)}% ({detected}/{total})
            </text>
          </g>
        );
      })}
    </svg>
  );
}
