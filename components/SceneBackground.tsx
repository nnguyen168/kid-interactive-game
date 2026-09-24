import { ThemeId } from "@/lib/types";
import { THEMES } from "@/lib/themes";

// Deterministic pseudo-random numbers so server and client render the same scene.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const CROWD_COLORS = ["#F87171", "#FBBF24", "#60A5FA", "#F472B6", "#FFFFFF", "#34D399", "#A78BFA"];

const crowd = (() => {
  const r = seeded(7);
  return Array.from({ length: 420 }, () => ({
    x: r() * 1600,
    y: 430 + r() * 190,
    c: CROWD_COLORS[Math.floor(r() * CROWD_COLORS.length)],
  }));
})();

const skyline = (() => {
  const r = seeded(21);
  const far: { x: number; w: number; h: number }[] = [];
  let x = -20;
  while (x < 1640) {
    const w = 70 + r() * 90;
    far.push({ x, w, h: 160 + r() * 220 });
    x += w + 6;
  }
  return far;
})();

const flowers = (() => {
  const r = seeded(3);
  const colors = ["#F472B6", "#FBBF24", "#FFFFFF", "#F87171"];
  return Array.from({ length: 38 }, () => ({
    x: r() * 1600,
    y: 790 + r() * 100,
    c: colors[Math.floor(r() * colors.length)],
  }));
})();

function Clouds() {
  const clouds = [
    { y: 110, s: 1.1, d: 95, delay: -10 },
    { y: 200, s: 0.8, d: 120, delay: -60 },
    { y: 70, s: 0.7, d: 140, delay: -100 },
    { y: 250, s: 1.3, d: 110, delay: -35 },
  ];
  return (
    <g>
      {clouds.map((c, i) => (
        <g key={i} className="cloud-drift" style={{ animationDuration: `${c.d}s`, animationDelay: `${c.delay}s` }}>
          <g transform={`translate(0 ${c.y}) scale(${c.s})`} fill="#FFFFFF" opacity={0.92}>
            <ellipse cx={0} cy={20} rx={90} ry={34} />
            <ellipse cx={-45} cy={12} rx={50} ry={36} />
            <ellipse cx={40} cy={0} rx={60} ry={48} />
          </g>
        </g>
      ))}
    </g>
  );
}

function Sun() {
  return (
    <g>
      <circle cx={1360} cy={150} r={120} fill="#FFF3B0" opacity={0.45} />
      <circle cx={1360} cy={150} r={72} fill="#FFE066" />
    </g>
  );
}

function RoundTree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-8} y={-10} width={16} height={50} rx={6} fill="#8B5A2B" />
      <circle cx={0} cy={-40} r={48} fill="#4CAF50" />
      <circle cx={-22} cy={-52} r={22} fill="#66BB6A" />
    </g>
  );
}

function CastleScene() {
  return (
    <g>
      <path d="M0 610 C220 530 420 560 620 600 C820 640 1020 520 1220 560 C1420 600 1500 560 1600 575 L1600 900 L0 900 Z" fill="#A5D88A" />
      <g transform="translate(1000 330)">
        <rect x={-190} y={120} width={380} height={140} fill="#CBC3E3" />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={-190 + i * 40} y={104} width={24} height={20} fill="#CBC3E3" />
        ))}
        <rect x={-60} y={20} width={120} height={240} fill="#D8D1EE" />
        {Array.from({ length: 4 }, (_, i) => (
          <rect key={i} x={-60 + i * 34} y={4} width={20} height={20} fill="#D8D1EE" />
        ))}
        {[-190, 150].map((tx) => (
          <g key={tx}>
            <rect x={tx} y={40} width={40} height={220} fill="#BDB3DA" />
            <path d={`M${tx - 10} 42 L${tx + 20} -40 L${tx + 50} 42 Z`} fill="#7C3AED" />
            <line x1={tx + 20} y1={-40} x2={tx + 20} y2={-80} stroke="#5B21B6" strokeWidth={4} />
            <path className="flag-wave" d={`M${tx + 22} -80 L${tx + 62} -70 L${tx + 22} -58 Z`} fill="#F43F5E" />
          </g>
        ))}
        <path d="M-30 260 L-30 200 A30 30 0 0 1 30 200 L30 260 Z" fill="#6D5A96" />
        <rect x={-12} y={70} width={24} height={36} rx={12} fill="#6D5A96" />
      </g>
      <path d="M0 690 C300 640 520 670 760 690 C1000 710 1250 650 1600 670 L1600 900 L0 900 Z" fill="#7CC46A" />
      <RoundTree x={180} y={660} s={1.1} />
      <RoundTree x={330} y={690} s={0.8} />
      <RoundTree x={1480} y={660} s={1} />
      <path d="M0 770 C320 735 620 755 820 765 C1120 780 1320 740 1600 755 L1600 900 L0 900 Z" fill="#5DB14E" />
      <path d="M700 900 C740 840 860 800 960 760 C1000 745 1020 700 1000 690 L1040 690 C1070 710 1050 760 1010 780 C900 830 820 860 800 900 Z" fill="#E8C48A" />
      {flowers.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={5} fill={f.c} />
      ))}
    </g>
  );
}

function FireStationScene() {
  return (
    <g>
      {skyline.map((b, i) => (
        <rect key={i} x={b.x} y={720 - b.h} width={b.w} height={b.h} fill="#A9BFDD" rx={4} />
      ))}
      {skyline.map((b, i) =>
        Array.from({ length: Math.floor(b.h / 46) }, (_, j) => (
          <rect key={`${i}-${j}`} x={b.x + 14} y={740 - b.h + j * 46} width={b.w - 28} height={14} fill="#C9D8EC" rx={3} />
        ))
      )}
      <g transform="translate(1080 420)">
        <rect x={0} y={60} width={420} height={300} fill="#D9433A" rx={8} />
        <rect x={-10} y={40} width={440} height={34} fill="#A93226" rx={6} />
        <rect x={40} y={82} width={340} height={40} fill="#FFFFFF" rx={8} />
        <text x={210} y={112} textAnchor="middle" fontSize={30} fontWeight={800} fill="#B91C1C" fontFamily="Arial, sans-serif">
          POMPIERS
        </text>
        {[40, 230].map((dx) => (
          <g key={dx}>
            <path d={`M${dx} 360 L${dx} 190 A75 50 0 0 1 ${dx + 150} 190 L${dx + 150} 360 Z`} fill="#F3F4F6" />
            {[0, 1, 2, 3, 4].map((k) => (
              <rect key={k} x={dx + 8} y={200 + k * 30} width={134} height={4} fill="#D1D5DB" />
            ))}
          </g>
        ))}
        <rect x={-70} y={-30} width={70} height={390} fill="#C0392B" rx={6} />
        <circle cx={-35} cy={20} r={20} fill="#FFFFFF" stroke="#7F1D1D" strokeWidth={4} />
        <line x1={-35} y1={20} x2={-35} y2={8} stroke="#7F1D1D" strokeWidth={3} />
        <line x1={-35} y1={20} x2={-26} y2={24} stroke="#7F1D1D" strokeWidth={3} />
      </g>
      <RoundTree x={140} y={720} s={0.9} />
      <RoundTree x={820} y={730} s={0.75} />
      <rect x={0} y={760} width={1600} height={40} fill="#D1D5DB" />
      <rect x={0} y={800} width={1600} height={100} fill="#6B7280" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={i * 110 + 20} y={846} width={60} height={8} rx={4} fill="#F9FAFB" />
      ))}
      <g transform="translate(420 760)">
        <rect x={-12} y={-44} width={24} height={44} rx={8} fill="#DC2626" />
        <rect x={-18} y={-30} width={36} height={8} rx={4} fill="#B91C1C" />
        <circle cx={0} cy={-48} r={10} fill="#DC2626" />
      </g>
    </g>
  );
}

function StadiumScene() {
  return (
    <g>
      <path d="M-20 440 Q800 330 1620 440 L1620 650 L-20 650 Z" fill="#334155" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M-20 ${470 + i * 44} Q800 ${370 + i * 44} 1620 ${470 + i * 44}`} stroke="#475569" strokeWidth={6} fill="none" />
      ))}
      {crowd.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y + (p.x - 800) * (p.x - 800) * 0.00012} r={7} fill={p.c} />
      ))}
      <path d="M-20 420 Q800 300 1620 420 L1620 395 Q800 275 -20 395 Z" fill="#1E293B" />
      {[120, 1480].map((x) => (
        <g key={x}>
          <rect x={x - 8} y={120} width={16} height={330} fill="#64748B" />
          <rect x={x - 60} y={80} width={120} height={60} rx={8} fill="#1E293B" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <circle key={`${r}-${c}`} cx={x - 42 + c * 28} cy={96 + r * 16} r={6} fill="#FEF9C3" />
            ))
          )}
          <circle cx={x} cy={110} r={110} fill="#FEF9C3" opacity={0.15} />
        </g>
      ))}
      {["#EF4444", "#2563EB", "#F59E0B", "#16A34A", "#9333EA", "#EF4444", "#2563EB", "#F59E0B"].map((c, i) => (
        <rect key={i} x={i * 200} y={640} width={200} height={34} fill={c} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={0} y={674 + i * 30} width={1600} height={30} fill={i % 2 ? "#4CAF50" : "#43A047"} />
      ))}
      <line x1={800} y1={674} x2={800} y2={900} stroke="#FFFFFF" strokeWidth={6} opacity={0.9} />
      <ellipse cx={800} cy={800} rx={240} ry={70} stroke="#FFFFFF" strokeWidth={6} fill="none" opacity={0.9} />
      <circle cx={800} cy={800} r={8} fill="#FFFFFF" />
    </g>
  );
}

export default function SceneBackground({ themeId }: { themeId: ThemeId }) {
  const { sky } = THEMES[themeId];
  const gradientId = `sky-${themeId}`;
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.top} />
            <stop offset="100%" stopColor={sky.bottom} />
          </linearGradient>
        </defs>
        <rect x={-400} y={-400} width={2400} height={1700} fill={`url(#${gradientId})`} />
        <Sun />
        <Clouds />
        {themeId === "chevalier" && <CastleScene />}
        {themeId === "pompier" && <FireStationScene />}
        {themeId === "foot" && <StadiumScene />}
      </svg>
    </div>
  );
}
