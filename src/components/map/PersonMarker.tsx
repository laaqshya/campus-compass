import { motion } from "framer-motion";

interface Props {
  x: number;
  y: number;
  heading: number;
  rerouting: boolean;
}

export function PersonMarker({ x, y, heading, rerouting }: Props) {
  return (
    <g style={{ pointerEvents: "none" }}>
      <motion.circle
        cx={x}
        cy={y}
        r={20}
        fill="#3b82f6"
        opacity={0.25}
        animate={{ r: [16, 28, 16], opacity: [0.35, 0, 0.35] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <circle cx={x} cy={y} r={11} fill="#3b82f6" opacity={0.55} />
      <circle cx={x} cy={y} r={6} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
      <g transform={`translate(${x}, ${y}) rotate(${heading + 90})`}>
        <polygon points="0,-14 4,-6 -4,-6" fill="#ffffff" />
      </g>
      <text
        x={x}
        y={y + 24}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill="#ffffff"
        stroke="#0b1220"
        strokeWidth={2.5}
        paintOrder="stroke"
      >
        You
      </text>
      {rerouting && (
        <g transform={`translate(${x + 18}, ${y - 22})`}>
          <rect x={-2} y={-8} width={62} height={14} rx={7} fill="#f59e0b" />
          <text x={28} y={2} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0b1220">
            ⟳ Rerouting…
          </text>
        </g>
      )}
    </g>
  );
}