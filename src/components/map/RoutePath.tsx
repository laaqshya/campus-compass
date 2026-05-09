import { motion, AnimatePresence } from "framer-motion";

interface Props {
  points: { x: number; y: number }[];
  eta: number;
}

export function RoutePath({ points, eta }: Props) {
  if (points.length < 2) return null;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const dest = points[points.length - 1];

  return (
    <AnimatePresence>
      <motion.g
        key={d}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Corridor */}
        <path d={d} fill="none" stroke="#3b82f6" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} />
        {/* Animated dashed route */}
        <path
          d={d}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 6"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="0.8s" repeatCount="indefinite" />
        </path>
        {/* Waypoint dots */}
        {points.slice(1, -1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#60a5fa" stroke="#0b1220" strokeWidth={1.5} />
        ))}
        {/* Destination marker */}
        <motion.circle
          cx={dest.x}
          cy={dest.y}
          r={18}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={2}
          animate={{ r: [14, 22, 14], opacity: [0.9, 0.2, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
        <circle cx={dest.x} cy={dest.y} r={7} fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />
        {/* ETA chip */}
        <g transform={`translate(${dest.x}, ${dest.y - 32})`}>
          <rect x={-22} y={-10} width={44} height={16} rx={8} fill="#0b1220" stroke="#3b82f6" strokeWidth={1} />
          <text x={0} y={2} textAnchor="middle" fontSize={9} fontWeight={700} fill="#60a5fa">
            {eta} min
          </text>
        </g>
      </motion.g>
    </AnimatePresence>
  );
}