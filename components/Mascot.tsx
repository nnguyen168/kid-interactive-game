"use client";

import { ThemeId } from "@/lib/types";
import { useIsSpeaking } from "@/lib/speech";

export type MascotMood = "idle" | "happy" | "encourage" | "wave";

const SKIN = "#FFD7B5";
const SKIN_SHADE = "#F5B993";
const INK = "#2B2340";
const MOUTH = "#8B2E3B";

type Outfit = {
  torso: string;
  arm: string;
  leg: string;
  boot: string;
};

const OUTFITS: Record<ThemeId, Outfit> = {
  chevalier: { torso: "#D6DEE8", arm: "#C3CEDC", leg: "#64748B", boot: "#475569" },
  pompier: { torso: "#1E3A8A", arm: "#1E3A8A", leg: "#1E3A8A", boot: "#111827" },
  foot: { torso: "#16A34A", arm: "#16A34A", leg: "#15803D", boot: "#111827" },
  course: { torso: "#EA580C", arm: "#EA580C", leg: "#EA580C", boot: "#111827" },
};

function Arm({ side, outfit, themeId }: { side: "l" | "r"; outfit: Outfit; themeId: ThemeId }) {
  const x = side === "l" ? 64 : 136;
  return (
    <g transform={`translate(${x} 152)`}>
      <g className={`mascot-arm mascot-arm-${side}`}>
        {side === "r" && themeId === "chevalier" && (
          <g>
            <rect x={-3.5} y={58} width={7} height={46} rx={3} fill="#E5E7EB" stroke="#94A3B8" strokeWidth={1.5} />
            <path d="M-3.5 104 L0 112 L3.5 104 Z" fill="#E5E7EB" stroke="#94A3B8" strokeWidth={1.5} />
            <rect x={-12} y={54} width={24} height={6} rx={3} fill="#F59E0B" />
          </g>
        )}
        <rect x={-11} y={0} width={22} height={50} rx={11} fill={outfit.arm} />
        {themeId === "pompier" && <rect x={-11} y={30} width={22} height={6} fill="#FACC15" />}
        {themeId === "course" && <rect x={-11} y={8} width={22} height={5} fill="#FFFFFF" />}
        {themeId === "chevalier" && <rect x={-11} y={22} width={22} height={5} fill="#94A3B8" opacity={0.6} />}
        <circle cx={0} cy={54} r={12} fill={themeId === "chevalier" ? "#94A3B8" : themeId === "course" ? "#1F2937" : SKIN} />
        {side === "l" && themeId === "chevalier" && (
          <g transform="translate(-12 34)">
            <path d="M0 -20 L18 -14 C18 4 11 15 0 20 C-11 15 -18 4 -18 -14 Z" fill="#7C3AED" stroke="#FBBF24" strokeWidth={4} />
            <path d="M0 -9 L0 11 M-8 0 L8 0" stroke="#FBBF24" strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
}

function Headgear({ themeId }: { themeId: ThemeId }) {
  if (themeId === "chevalier") {
    return (
      <g>
        <path d="M100 30 C106 2 144 -4 170 12 C150 14 128 20 112 36 Z" fill="#F43F5E" />
        <path d="M112 30 C122 14 146 8 162 14" stroke="#FDA4AF" strokeWidth={3} fill="none" strokeLinecap="round" />
        <rect x={34} y={78} width={16} height={46} rx={7} fill="#B6C2D1" />
        <rect x={150} y={78} width={16} height={46} rx={7} fill="#B6C2D1" />
        <path d="M36 86 C36 44 62 26 100 26 C138 26 164 44 164 86 Z" fill="#D6DEE8" />
        <rect x={95} y={26} width={10} height={60} rx={5} fill="#B6C2D1" />
        <rect x={32} y={76} width={136} height={14} rx={7} fill="#A7B4C6" />
        {[48, 72, 128, 152].map((cx) => (
          <circle key={cx} cx={cx} cy={83} r={2.6} fill="#E2E8F0" />
        ))}
        <path d="M58 44 C66 36 78 32 90 31" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.6} fill="none" />
      </g>
    );
  }
  if (themeId === "pompier") {
    return (
      <g>
        <ellipse cx={100} cy={82} rx={78} ry={12} fill="#B91C1C" />
        <path d="M36 84 C36 40 64 22 100 22 C136 22 164 40 164 84 Z" fill="#DC2626" />
        <rect x={93} y={16} width={14} height={66} rx={7} fill="#B91C1C" />
        <path d="M58 42 C66 34 76 30 88 29" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.45} fill="none" />
        <circle cx={100} cy={58} r={14} fill="#FBBF24" stroke="#D97706" strokeWidth={2.5} />
        <path
          d="M100 49 L102.6 55.4 L109.5 55.9 L104.2 60.3 L105.9 67 L100 63.3 L94.1 67 L95.8 60.3 L90.5 55.9 L97.4 55.4 Z"
          fill="#FFFFFF"
        />
      </g>
    );
  }
  if (themeId === "course") {
    return (
      <g>
        {/* full racing helmet, visor pushed up */}
        <path d="M30 104 C26 46 60 20 100 20 C140 20 174 46 170 104 L156 108 C156 70 134 50 100 50 C66 50 44 70 44 108 Z" fill="#F8FAFC" />
        <path d="M44 106 C44 72 64 52 100 52 C136 52 156 72 156 106" stroke="#CBD5E1" strokeWidth={3} fill="none" />
        <path d="M60 24 C74 18 88 16 100 16 C112 16 126 18 140 24 L140 40 L60 40 Z" fill="#EA580C" />
        <rect x={52} y={40} width={96} height={18} rx={9} fill="#0F172A" />
        <path d="M60 44 C76 42 92 42 108 43" stroke="#38BDF8" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        <circle cx={150} cy={82} r={13} fill="#FFFFFF" stroke="#EA580C" strokeWidth={3} />
        <text x={150} y={88} textAnchor="middle" fontSize={16} fontWeight={800} fill="#EA580C" fontFamily="Arial, sans-serif">
          1
        </text>
        <path d="M48 64 C52 50 62 40 74 34" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.7} fill="none" />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M40 92 C36 44 74 26 104 28 C140 30 168 52 160 94 C152 74 138 66 124 72 C116 60 96 60 84 70 C72 62 52 70 40 92 Z"
        fill="#7C4A21"
      />
      <path d="M70 42 C80 36 92 34 102 34" stroke="#A76A3A" strokeWidth={5} strokeLinecap="round" fill="none" />
      <rect x={38} y={76} width={124} height={10} rx={5} fill="#FFFFFF" />
      <rect x={38} y={76} width={124} height={4} rx={2} fill="#16A34A" />
    </g>
  );
}

function Torso({ themeId, outfit }: { themeId: ThemeId; outfit: Outfit }) {
  return (
    <g>
      <rect x={58} y={138} width={84} height={74} rx={30} fill={outfit.torso} />
      {themeId === "chevalier" && (
        <g>
          <rect x={78} y={142} width={44} height={68} rx={12} fill="#7C3AED" />
          <path d="M100 158 L114 163 C114 178 108 187 100 192 C92 187 86 178 86 163 Z" fill="#FBBF24" stroke="#D97706" strokeWidth={2} />
          <rect x={58} y={196} width={84} height={8} rx={4} fill="#92400E" />
          <rect x={95} y={195} width={10} height={10} rx={2} fill="#FBBF24" />
        </g>
      )}
      {themeId === "pompier" && (
        <g>
          <rect x={58} y={178} width={84} height={8} fill="#FACC15" />
          <rect x={58} y={190} width={84} height={4} fill="#E5E7EB" />
          <rect x={97} y={142} width={6} height={68} fill="#0F1E4D" />
          <circle cx={112} cy={158} r={6} fill="#FBBF24" />
        </g>
      )}
      {themeId === "course" && (
        <g>
          <rect x={92} y={140} width={16} height={70} fill="#FFFFFF" />
          <rect x={58} y={194} width={84} height={10} fill="#111827" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <rect key={i} x={58 + i * 8.4} y={i % 2 ? 194 : 199} width={8.4} height={5} fill="#FFFFFF" />
          ))}
          <circle cx={75} cy={162} r={9} fill="#FACC15" />
          <path d="M75 156 L77 160.5 L81.8 161 L78.2 164.2 L79.3 169 L75 166.5 L70.7 169 L71.8 164.2 L68.2 161 L73 160.5 Z" fill="#FFFFFF" />
        </g>
      )}
      {themeId === "foot" && (
        <g>
          <path d="M84 140 L100 158 L116 140" stroke="#FFFFFF" strokeWidth={6} fill="none" strokeLinejoin="round" />
          <text x={100} y={194} textAnchor="middle" fontSize={30} fontWeight={800} fill="#FFFFFF" fontFamily="Arial, sans-serif">
            10
          </text>
        </g>
      )}
    </g>
  );
}

function Face({ mood, talking }: { mood: MascotMood; talking: boolean }) {
  const happy = mood === "happy";
  return (
    <g>
      {happy ? (
        <g stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
          <path d="M66 102 Q78 88 90 102" />
          <path d="M110 102 Q122 88 134 102" />
        </g>
      ) : (
        <g className="mascot-eyes">
          <ellipse cx={78} cy={100} rx={12} ry={14} fill="#FFFFFF" />
          <ellipse cx={122} cy={100} rx={12} ry={14} fill="#FFFFFF" />
          <circle cx={80} cy={103} r={7.5} fill={INK} />
          <circle cx={124} cy={103} r={7.5} fill={INK} />
          <circle cx={83} cy={98} r={2.8} fill="#FFFFFF" />
          <circle cx={127} cy={98} r={2.8} fill="#FFFFFF" />
        </g>
      )}
      <g stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none">
        {mood === "encourage" ? (
          <>
            <path d="M68 82 Q78 74 88 80" />
            <path d="M112 80 Q122 74 132 82" />
          </>
        ) : (
          <>
            <path d="M68 84 Q78 78 88 84" />
            <path d="M112 84 Q122 78 132 84" />
          </>
        )}
      </g>
      <ellipse cx={62} cy={120} rx={10} ry={6} fill="#FF8FA3" opacity={0.55} />
      <ellipse cx={138} cy={120} rx={10} ry={6} fill="#FF8FA3" opacity={0.55} />
      <ellipse cx={100} cy={112} rx={4.5} ry={3.2} fill={SKIN_SHADE} />
      {talking ? (
        <g className="mascot-mouth-talk">
          <ellipse cx={100} cy={128} rx={11} ry={9} fill={MOUTH} />
          <ellipse cx={100} cy={133} rx={6} ry={3.5} fill="#F87171" />
        </g>
      ) : happy ? (
        <g>
          <path d="M82 121 Q100 148 118 121 Z" fill={MOUTH} />
          <path d="M91 133 Q100 140 109 133 Q100 130 91 133 Z" fill="#F87171" />
        </g>
      ) : (
        <path d="M87 124 Q100 136 113 124" stroke={MOUTH} strokeWidth={4} strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

export default function Mascot({
  themeId,
  mood = "idle",
  talking,
  className = "",
  shadow = true,
}: {
  themeId: ThemeId;
  mood?: MascotMood;
  talking?: boolean;
  className?: string;
  shadow?: boolean;
}) {
  const speaking = useIsSpeaking();
  const isTalking = talking ?? speaking;
  const outfit = OUTFITS[themeId];

  return (
    <svg
      viewBox="0 0 200 262"
      className={`mascot mascot--${mood} ${className}`}
      role="img"
      aria-label="Ton héros"
    >
      {shadow && <ellipse cx={100} cy={252} rx={58} ry={8} fill="#000000" opacity={0.15} className="mascot-shadow" />}
      <g className="mascot-body">
        <rect x={76} y={198} width={20} height={40} rx={9} fill={outfit.leg} />
        <rect x={104} y={198} width={20} height={40} rx={9} fill={outfit.leg} />
        {themeId === "foot" && (
          <>
            <rect x={70} y={196} width={60} height={18} rx={8} fill="#FFFFFF" />
            <rect x={76} y={224} width={20} height={6} fill="#FFFFFF" />
            <rect x={104} y={224} width={20} height={6} fill="#FFFFFF" />
          </>
        )}
        <ellipse cx={85} cy={240} rx={16} ry={9} fill={outfit.boot} />
        <ellipse cx={115} cy={240} rx={16} ry={9} fill={outfit.boot} />

        <Arm side="l" outfit={outfit} themeId={themeId} />
        <Arm side="r" outfit={outfit} themeId={themeId} />
        <Torso themeId={themeId} outfit={outfit} />

        <circle cx={40} cy={100} r={12} fill={SKIN} />
        <circle cx={160} cy={100} r={12} fill={SKIN} />
        <circle cx={100} cy={94} r={60} fill={SKIN} />
        <Face mood={mood} talking={isTalking} />
        <Headgear themeId={themeId} />
      </g>
      {themeId === "foot" && (
        <image href="/art/ball.png" x={140} y={214} width={42} height={42} />
      )}
      {themeId === "course" && (
        <image href="/art/checkered-flag.png" x={138} y={200} width={54} height={54} />
      )}
    </svg>
  );
}
