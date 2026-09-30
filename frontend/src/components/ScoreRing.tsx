/** Opportunity score as an SVG ring with ticks. Pure SVG — no charting library. */
export function ScoreRing({ score, size = 200 }: { score: number; size?: number }) {
  const r = 78, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`Farm Opportunity score: ${score} out of 100`}>
      {Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * 2 * Math.PI - Math.PI / 2, major = i % 4 === 0;
        return <line key={i} x1={100 + Math.cos(a) * 92} y1={100 + Math.sin(a) * 92} x2={100 + Math.cos(a) * (major ? 98 : 95)} y2={100 + Math.sin(a) * (major ? 98 : 95)} stroke="#c5dcc8" strokeOpacity={major ? 0.6 : 0.3} strokeWidth={major ? 2 : 1.5} strokeLinecap="round" />;
      })}
      <circle cx="100" cy="100" r={r} fill="none" stroke="#2a5636" strokeWidth="14" />
      <circle cx="100" cy="100" r={r} fill="none" stroke="#d8b04f" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dasharray 900ms ease-out' }} />
      <text x="100" y="104" textAnchor="middle" fontSize="54" fontWeight="700" fill="#fbf9f3" style={{ fontFamily: 'var(--font-display)' }}>{score}</text>
      <text x="100" y="130" textAnchor="middle" fontSize="15" fill="#c5dcc8">out of 100</text>
    </svg>
  );
}
