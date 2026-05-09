import { motion } from "framer-motion";
import { CATEGORY_STYLE, type Location } from "@/data/locations";
import { statusFromPct, type OccupancyData } from "@/stores/navigationStore";
import { titleCase } from "@/utils/titleCase";

interface Props {
  loc: Location;
  occ: OccupancyData;
  screenX: number;
  screenY: number;
  isMobile: boolean;
  onClose: () => void;
  onSetStart: () => void;
  onNavigate: () => void;
  onMoveHere: () => void;
}

export function LocationPopup({
  loc,
  occ,
  screenX,
  screenY,
  isMobile,
  onClose,
  onSetStart,
  onNavigate,
  onMoveHere,
}: Props) {
  const style = CATEGORY_STYLE[loc.category];
  const status = statusFromPct(occ.pct);
  const trendIcon = occ.trend === "up" ? "↑ Rising" : occ.trend === "down" ? "↓ Falling" : "→ Stable";

  const positioning: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "60%",
        borderRadius: "20px 20px 0 0",
      }
    : {
        position: "absolute",
        left: Math.min(Math.max(screenX - 130, 10), window.innerWidth - 270),
        top: Math.max(screenY - 240, 10),
        width: 260,
      };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: isMobile ? "rgba(0,0,0,0.4)" : "transparent",
          zIndex: 40,
        }}
        onClick={onClose}
      />
      <motion.div
        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.85 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
        exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.85 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        style={{
          ...positioning,
          background: "#0f172a",
          border: `1px solid ${style.stroke}`,
          padding: 16,
          color: "white",
          zIndex: 50,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{titleCase(loc.name)}</h3>
            <span
              style={{
                display: "inline-block",
                marginTop: 6,
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 999,
                background: style.fill,
                border: `1px solid ${style.stroke}`,
                color: style.stroke,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {style.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", color: "#94a3b8", border: "none", fontSize: 18, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
            <span>Occupancy</span>
            <span style={{ color: status.color, fontWeight: 700 }}>{Math.round(occ.pct * 100)}%</span>
          </div>
          <div style={{ height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occ.pct * 100}%` }}
              transition={{ type: "spring", damping: 18, stiffness: 120 }}
              style={{ height: "100%", background: status.color }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: status.color }} />
          <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>
          <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 11 }}>{trendIcon}</span>
        </div>

        {(loc.category === "food" || loc.category === "admin") && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#cbd5e1" }}>
            ~{occ.queue_minutes} min wait
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={onSetStart}
            style={{
              flex: 1,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 600,
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Set as Start
          </button>
          <button
            onClick={onNavigate}
            style={{
              flex: 1,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 700,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Navigate Here
          </button>
        </div>

        <button
          onClick={onMoveHere}
          style={{
            display: "block",
            marginTop: 10,
            width: "100%",
            background: "transparent",
            color: "#60a5fa",
            border: "none",
            fontSize: 11,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Move me here
        </button>
      </motion.div>
    </>
  );
}