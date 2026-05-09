import { motion } from "framer-motion";
import { CATEGORY_STYLE, type Location } from "@/data/locations";
import { statusFromPct, type OccupancyData } from "@/stores/navigationStore";
import { splitNameToLines } from "@/utils/titleCase";

interface Props {
  location: Location;
  occupancy: OccupancyData;
  visible: boolean;
  highlighted: boolean;
  onClick: (loc: Location) => void;
}

export function LocationBox({ location, occupancy, visible, highlighted, onClick }: Props) {
  const style = CATEGORY_STYLE[location.category];
  const status = statusFromPct(occupancy.pct);
  const lines = splitNameToLines(location.name);

  const x = location.x - style.w / 2;
  const y = location.y - style.h / 2;

  const body = (
    <g
      style={{
        opacity: visible ? 1 : 0.15,
        pointerEvents: visible ? "auto" : "none",
        cursor: "pointer",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(location);
      }}
    >
      {/* Heatmap glow */}
      <rect
        x={x - 8}
        y={y - 8}
        width={style.w + 16}
        height={style.h + 16}
        rx={10}
        fill={status.glow}
        opacity={0.18}
      />
      {/* Body */}
      <rect
        x={x}
        y={y}
        width={style.w}
        height={style.h}
        rx={6}
        fill={style.fill}
        stroke={highlighted ? "#ffffff" : style.stroke}
        strokeWidth={highlighted ? 2 : 1.2}
      />
      {/* Top accent bar */}
      <rect x={x} y={y} width={style.w} height={3} rx={2} fill={style.stroke} />
      {/* Name */}
      <text
        x={location.x}
        y={location.y - (lines.length === 2 ? 2 : 2)}
        textAnchor="middle"
        fontSize={9}
        fontWeight={500}
        fill="#ffffff"
        style={{ pointerEvents: "none" }}
      >
        {lines.map((l, i) => (
          <tspan key={i} x={location.x} dy={i === 0 ? 0 : 10}>
            {l}
          </tspan>
        ))}
      </text>
      {/* Occupancy badge */}
      <g transform={`translate(${location.x}, ${y + style.h - 4})`}>
        <rect x={-14} y={-2} width={28} height={9} rx={4} fill={status.color} opacity={0.95} />
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fontSize={7}
          fontWeight={600}
          fill="#0b1220"
          style={{ pointerEvents: "none" }}
        >
          {Math.round(occupancy.pct * 100)}%
        </text>
      </g>
    </g>
  );

  if (status.critical) {
    return (
      <motion.g
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
        style={{ transformOrigin: `${location.x}px ${location.y}px` }}
      >
        {body}
      </motion.g>
    );
  }
  return body;
}