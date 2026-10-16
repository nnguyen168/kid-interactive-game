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

function RaceTrackScene() {
  const kerb = Array.from({ length: 34 }, (_, i) => i);
  return (
    <g>
      <path d="M-20 520 Q300 430 700 500 T1620 470 L1620 900 L-20 900 Z" fill="#86C96B" />
      <path d="M-20 560 Q420 500 820 560 T1620 540 L1620 900 L-20 900 Z" fill="#6DBA56" />
      {/* grandstand */}
      <g transform="translate(980 380)">
        <rect x={0} y={40} width={520} height={150} fill="#334155" />
        <path d="M-20 44 L540 44 L520 10 L0 10 Z" fill="#EA580C" />
        {crowd.slice(0, 160).map((p, i) => (
          <circle key={i} cx={12 + ((p.x * 0.31) % 496)} cy={60 + ((p.y - 430) % 120)} r={6} fill={p.c} />
        ))}
      </g>
      {/* track */}
      <path d="M-40 760 C300 600 700 640 900 700 S1400 800 1660 690" stroke="#475569" strokeWidth={170} fill="none" />
      <path d="M-40 760 C300 600 700 640 900 700 S1400 800 1660 690" stroke="#FFFFFF" strokeWidth={6} strokeDasharray="40 36" fill="none" />
      <path d="M-40 675 C300 515 700 555 900 615 S1400 715 1660 605" stroke="#EF4444" strokeWidth={14} strokeDasharray="30 30" fill="none" />
      <path d="M-40 675 C300 515 700 555 900 615 S1400 715 1660 605" stroke="#FFFFFF" strokeWidth={14} strokeDasharray="30 30" strokeDashoffset={30} fill="none" />
      {/* start / finish gantry */}
      <g transform="translate(520 470)">
        <rect x={-10} y={0} width={16} height={230} fill="#94A3B8" />
        <rect x={334} y={0} width={16} height={230} fill="#94A3B8" />
        <rect x={-10} y={-10} width={360} height={50} rx={6} fill="#111827" />
        {kerb.slice(0, 18).map((i) => (
          <rect key={i} x={i * 20} y={i % 2 ? 0 : 15} width={20} height={15} fill="#FFFFFF" />
        ))}
      </g>
      {/* tyre stacks */}
      {[140, 1460].map((x) => (
        <g key={x} transform={`translate(${x} 560)`}>
          {[0, 1, 2].map((r) => (
            <ellipse key={r} cx={0} cy={-r * 22} rx={34} ry={14} fill={r % 2 ? "#EF4444" : "#1F2937"} />
          ))}
        </g>
      ))}
      <image href="/art/racing-car.png" x={250} y={560} width={190} height={190} />
      <image href="/art/checkered-flag.png" x={1240} y={420} width={140} height={140} />
    </g>
  );
}

const spaceStars = (() => {
  const r = seeded(31);
  return Array.from({ length: 120 }, () => ({ x: r() * 1600, y: r() * 520, s: 1 + r() * 2.6, o: 0.4 + r() * 0.6 }));
})();

const craters = (() => {
  const r = seeded(13);
  return Array.from({ length: 14 }, () => ({ x: r() * 1600, y: 640 + r() * 240, rx: 30 + r() * 70 }));
})();

function SpaceScene() {
  return (
    <g>
      {spaceStars.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s} fill="#FFFFFF" opacity={p.o} />
      ))}
      {/* the Earth */}
      <g transform="translate(1290 170)">
        <circle r={110} fill="#2563EB" />
        <path d="M-60 -60 C-20 -80 10 -40 -10 -10 C-30 20 -70 0 -80 -30 Z" fill="#22C55E" />
        <path d="M20 10 C60 0 80 40 50 70 C30 90 0 60 20 10 Z" fill="#22C55E" />
        <path d="M-90 30 C-60 40 -40 70 -60 90" stroke="#FFFFFF" strokeWidth={10} opacity={0.6} fill="none" strokeLinecap="round" />
        <circle r={110} fill="none" stroke="#93C5FD" strokeWidth={10} opacity={0.5} />
      </g>
      <image href="/art/ringed-planet.png" x={180} y={90} width={150} height={150} />
      {/* moon ground */}
      <path d="M-20 600 Q400 540 800 590 T1620 570 L1620 900 L-20 900 Z" fill="#CBD5E1" />
      <path d="M-20 660 Q500 610 900 660 T1620 650 L1620 900 L-20 900 Z" fill="#E2E8F0" />
      {craters.map((c, i) => (
        <g key={i}>
          <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.rx * 0.28} fill="#94A3B8" opacity={0.55} />
          <ellipse cx={c.x} cy={c.y - c.rx * 0.06} rx={c.rx * 0.8} ry={c.rx * 0.2} fill="#CBD5E1" />
        </g>
      ))}
      {/* moon base */}
      {[1080, 1220].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 80} 640 A80 80 0 0 1 ${x + 80} 640 Z`} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={4} />
          <rect x={x - 18} y={600} width={36} height={40} rx={8} fill="#334155" />
          {i === 0 && <rect x={x + 80} y={618} width={60} height={16} fill="#E2E8F0" />}
        </g>
      ))}
      {/* launch pad and rocket */}
      <rect x={300} y={630} width={260} height={30} rx={8} fill="#64748B" />
      <rect x={520} y={330} width={20} height={300} fill="#94A3B8" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={470} y={360 + i * 56} width={50} height={8} fill="#94A3B8" />
      ))}
      <image href="/art/rocket.png" x={300} y={330} width={300} height={300} />
      <g transform="translate(760 600)">
        <rect x={0} y={-90} width={6} height={90} fill="#94A3B8" />
        <rect x={6} y={-90} width={60} height={38} fill="#2563EB" />
        <circle cx={36} cy={-71} r={10} fill="#FACC15" />
      </g>
    </g>
  );
}

function TennisScene() {
  return (
    <g>
      <path d="M-20 520 Q400 470 800 500 T1620 480 L1620 900 L-20 900 Z" fill="#4ADE80" />
      {/* stands */}
      <rect x={-20} y={420} width={1640} height={130} fill="#166534" />
      {crowd.slice(0, 260).map((p, i) => (
        <circle key={i} cx={(p.x * 1.03) % 1620} cy={436 + ((p.y - 430) % 104)} r={7} fill={p.c} />
      ))}
      <rect x={-20} y={540} width={1640} height={22} fill="#14532D" />
      {/* green surround and the clay court */}
      <rect x={-20} y={560} width={1640} height={340} fill="#15803D" />
      <path d="M430 590 L1170 590 L1420 900 L180 900 Z" fill="#C2410C" />
      <path d="M430 590 L1170 590 L1420 900 L180 900 Z" fill="none" stroke="#FFFFFF" strokeWidth={8} />
      <path d="M520 590 L310 900 M1080 590 L1290 900" stroke="#FFFFFF" strokeWidth={6} />
      <path d="M800 650 L800 820 M395 820 L1205 820 M470 650 L1130 650" stroke="#FFFFFF" strokeWidth={6} />
      {/* net */}
      <rect x={300} y={690} width={1000} height={70} fill="#0F172A" opacity={0.35} />
      {Array.from({ length: 50 }, (_, i) => (
        <line key={i} x1={300 + i * 20} y1={690} x2={300 + i * 20} y2={760} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6} />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={300} y1={710 + i * 20} x2={1300} y2={710 + i * 20} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6} />
      ))}
      <rect x={290} y={684} width={1020} height={10} rx={4} fill="#F8FAFC" />
      <rect x={284} y={684} width={14} height={90} fill="#334155" />
      <rect x={1302} y={684} width={14} height={90} fill="#334155" />
      <RoundTree x={90} y={560} s={1} />
      <RoundTree x={1510} y={560} s={0.9} />
      <image href="/art/tennis.png" x={1180} y={760} width={150} height={150} />
    </g>
  );
}

function KitchenScene() {
  const tiles = Array.from({ length: 34 }, (_, i) => i);
  return (
    <g>
      {/* tiled wall */}
      <rect x={-20} y={300} width={1640} height={420} fill="#FEF3C7" />
      {tiles.map((i) => (
        <line key={`v${i}`} x1={i * 50} y1={300} x2={i * 50} y2={720} stroke="#FDE68A" strokeWidth={3} />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line key={`h${i}`} x1={-20} y1={300 + i * 50} x2={1620} y2={300 + i * 50} stroke="#FDE68A" strokeWidth={3} />
      ))}
      <rect x={-20} y={290} width={1640} height={16} fill="#E11D48" />
      {/* shelf with jars and hanging pans */}
      <rect x={160} y={400} width={420} height={14} rx={4} fill="#92400E" />
      {["#F59E0B", "#E11D48", "#16A34A", "#3B82F6"].map((c, i) => (
        <g key={c} transform={`translate(${190 + i * 100} 340)`}>
          <rect x={0} y={0} width={56} height={60} rx={10} fill="#FFFFFF" opacity={0.85} />
          <rect x={6} y={22} width={44} height={34} rx={8} fill={c} />
          <rect x={-2} y={-8} width={60} height={12} rx={4} fill="#94A3B8" />
        </g>
      ))}
      {[1080, 1180, 1280].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={310} x2={x} y2={360} stroke="#64748B" strokeWidth={4} />
          <circle cx={x} cy={380 + i * 6} r={28 + i * 6} fill="#334155" />
          <rect x={x - 4} y={350} width={8} height={30} fill="#334155" />
        </g>
      ))}
      {/* oven with a warm glow */}
      <g transform="translate(1180 470)">
        <rect x={-150} y={0} width={300} height={260} rx={18} fill="#B45309" />
        <rect x={-110} y={60} width={220} height={140} rx={70} fill="#1C1917" />
        <ellipse cx={0} cy={170} rx={90} ry={26} fill="#F97316" opacity={0.9} />
        <ellipse cx={0} cy={168} rx={50} ry={14} fill="#FDE047" />
      </g>
      {/* counter */}
      <rect x={-20} y={690} width={1640} height={40} fill="#E2E8F0" />
      <rect x={-20} y={730} width={1640} height={180} fill="#9A3412" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={30 + i * 200} y={760} width={170} height={120} rx={10} fill="#C2410C" />
      ))}
      {/* steaming pot */}
      <g transform="translate(470 610)">
        <rect x={-80} y={0} width={160} height={84} rx={14} fill="#94A3B8" />
        <rect x={-92} y={-8} width={184} height={16} rx={8} fill="#64748B" />
        {[-40, 0, 40].map((x) => (
          <path key={x} d={`M${x} -20 C${x - 16} -50 ${x + 16} -70 ${x} -100`} stroke="#FFFFFF" strokeWidth={10} opacity={0.6} fill="none" strokeLinecap="round" />
        ))}
      </g>
      <image href="/art/croissant.png" x={720} y={600} width={110} height={110} />
      <image href="/art/cupcake.png" x={840} y={590} width={110} height={110} />
      <image href="/art/baguette.png" x={170} y={600} width={120} height={120} />
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
        {themeId !== "espace" && <Clouds />}
        {themeId === "chevalier" && <CastleScene />}
        {themeId === "pompier" && <FireStationScene />}
        {themeId === "foot" && <StadiumScene />}
        {themeId === "course" && <RaceTrackScene />}
        {themeId === "espace" && <SpaceScene />}
        {themeId === "tennis" && <TennisScene />}
        {themeId === "cuisine" && <KitchenScene />}
      </svg>
    </div>
  );
}
