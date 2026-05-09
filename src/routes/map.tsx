import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  CATEGORY_STYLE,
  LOCATIONS,
  PATHWAYS,
  ZONES,
  type Category,
  type Location,
} from "@/data/locations";
import { useNavigationStore, statusFromPct } from "@/stores/navigationStore";
import { crowdAwareDijkstra } from "@/lib/crowdAwareDijkstra";
import { LocationBox } from "@/components/map/LocationBox";
import { PersonMarker } from "@/components/map/PersonMarker";
import { RoutePath } from "@/components/map/RoutePath";
import { LocationPopup } from "@/components/map/LocationPopup";
import { useIsMobile } from "@/hooks/use-mobile";
import { titleCase } from "@/utils/titleCase";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Campus Map — Live Navigation" },
      { name: "description", content: "Interactive campus map with live crowd data and crowd-aware routing." },
      { property: "og:title", content: "Campus Map — Live Navigation" },
      { property: "og:description", content: "Interactive campus map with live crowd data and crowd-aware routing." },
    ],
  }),
  component: MapPage,
});

const VIEWBOX_W = 1000;
const VIEWBOX_H = 700;
const ALL_CATS: Category[] = ["academic", "hostel", "food", "sports", "admin", "transport", "facility"];

function MapPage() {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    personX,
    personY,
    heading,
    from,
    to,
    route,
    eta,
    distance,
    occupancy,
    visibleCategories,
    scale,
    tx,
    ty,
    rerouting,
    setPerson,
    setFrom,
    setTo,
    setRoute,
    endNavigation,
    toggleCategory,
    resetCategories,
    setTransform,
    updateOccupancy,
    setRerouting,
  } = useNavigationStore();

  const [selectedLoc, setSelectedLoc] = useState<Location | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; mapX: number; mapY: number } | null>(null);
  const [waypointIdx, setWaypointIdx] = useState(1);

  // Initialize default zoom on mobile to fit campus
  useEffect(() => {
    if (isMobile && scale === 1 && tx === 0 && ty === 0) {
      setTransform(0.7, 0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Live occupancy refresh
  useEffect(() => {
    const id = setInterval(() => updateOccupancy(), 30000);
    return () => clearInterval(id);
  }, [updateOccupancy]);

  // Auto-recompute route when from/to change
  useEffect(() => {
    if (from && to) {
      const r = crowdAwareDijkstra(from.id, to.id, occupancy, { x: personX, y: personY });
      if (r) {
        setRoute(r.points, r.eta, r.distance);
        setWaypointIdx(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // Person walking animation
  useEffect(() => {
    if (!route || route.length < 2 || !to) return;
    const id = setInterval(() => {
      const target = route[waypointIdx];
      if (!target) return;
      const dx = target.x - personX;
      const dy = target.y - personY;
      const d = Math.sqrt(dx * dx + dy * dy);
      const newHeading = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (d < 15) {
        if (waypointIdx >= route.length - 1) {
          toast.success(`Arrived at ${titleCase(to.name)}`);
          endNavigation();
          return;
        }
        setWaypointIdx((i) => i + 1);
      } else {
        const nx = personX + dx * 0.18;
        const ny = personY + dy * 0.18;
        setPerson(nx, ny, newHeading);
      }
    }, 250);
    return () => clearInterval(id);
  }, [route, waypointIdx, personX, personY, to, setPerson, endNavigation]);

  // Crowd-aware reroute every 15s
  useEffect(() => {
    if (!from || !to || route.length < 2) return;
    const id = setInterval(() => {
      const r = crowdAwareDijkstra(from.id, to.id, occupancy, { x: personX, y: personY });
      if (!r) return;
      const better = r.eta < eta * 0.9;
      const differs = JSON.stringify(r.points.map((p) => p.id)) !== JSON.stringify(route.map((p) => p.id));
      if (differs && better) {
        setRerouting(true);
        setTimeout(() => setRerouting(false), 1500);
        setRoute(r.points, r.eta, r.distance);
        setWaypointIdx(1);
        const avoid = route.find((p) => p.id && (occupancy[p.id]?.pct ?? 0) > 0.8);
        const avoidName = avoid?.id ? LOCATIONS.find((l) => l.id === avoid.id)?.name : "crowded area";
        toast.info(`Route updated — avoiding crowd near ${titleCase(avoidName ?? "area")}`);
      }
    }, 15000);
    return () => clearInterval(id);
  }, [from, to, route, eta, occupancy, personX, personY, setRoute, setRerouting]);

  // Pan handlers
  const panState = useRef({ panning: false, sx: 0, sy: 0, otx: 0, oty: 0 });
  const pinchState = useRef<{ active: boolean; startDist: number; startScale: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    panState.current = { panning: true, sx: e.clientX, sy: e.clientY, otx: tx, oty: ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!panState.current.panning) return;
    setTransform(scale, panState.current.otx + (e.clientX - panState.current.sx), panState.current.oty + (e.clientY - panState.current.sy));
  };
  const onMouseUp = () => {
    panState.current.panning = false;
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const next = Math.min(3, Math.max(0.5, scale + delta));
    setTransform(next, tx, ty);
  };

  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      panState.current = { panning: true, sx: t.clientX, sy: t.clientY, otx: tx, oty: ty };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchState.current = { active: true, startDist: Math.hypot(dx, dy), startScale: scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.current?.active) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      const ratio = d / pinchState.current.startDist;
      const next = Math.min(3, Math.max(0.5, pinchState.current.startScale * ratio));
      setTransform(next, tx, ty);
    } else if (e.touches.length === 1 && panState.current.panning) {
      const t = e.touches[0];
      setTransform(scale, panState.current.otx + (t.clientX - panState.current.sx), panState.current.oty + (t.clientY - panState.current.sy));
    }
  };
  const onTouchEnd = () => {
    panState.current.panning = false;
    pinchState.current = null;
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    // account for transform on the inner group
    const mapX = (px * VIEWBOX_W - tx / (rect.width / VIEWBOX_W)) / scale;
    const mapY = (py * VIEWBOX_H - ty / (rect.height / VIEWBOX_H)) / scale;
    setContextMenu({ x: e.clientX, y: e.clientY, mapX, mapY });
  };

  // Filter and search
  const filteredLocations = useMemo(
    () =>
      search
        ? LOCATIONS.filter((l) => l.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
        : [],
    [search],
  );

  const flyTo = (loc: Location) => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const newScale = 1.4;
    const targetX = w / 2 - (loc.x / VIEWBOX_W) * w * newScale;
    const targetY = h / 2 - (loc.y / VIEWBOX_H) * h * newScale;
    setTransform(newScale, targetX, targetY);
    setHighlightedId(loc.id);
    setTimeout(() => setHighlightedId(null), 3000);
  };

  // Stats
  const visibleLocs = LOCATIONS.filter((l) => visibleCategories.has(l.category));
  const avgOcc = Math.round(
    (visibleLocs.reduce((s, l) => s + (occupancy[l.id]?.pct ?? 0), 0) / Math.max(1, visibleLocs.length)) * 100,
  );
  const criticalCount = visibleLocs.filter((l) => (occupancy[l.id]?.pct ?? 0) >= 0.9).length;

  // Compute popup screen position
  const popupScreenPos = useMemo(() => {
    if (!selectedLoc || !containerRef.current) return { x: 0, y: 0 };
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const sx = (selectedLoc.x / VIEWBOX_W) * w * scale + tx;
    const sy = (selectedLoc.y / VIEWBOX_H) * h * scale + ty;
    return { x: sx, y: sy };
  }, [selectedLoc, scale, tx, ty]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#020617",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Toaster theme="dark" position="top-center" />

      {/* Map container */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, cursor: panState.current.panning ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={onContextMenu}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: panState.current.panning || pinchState.current?.active ? "none" : "transform 0.4s ease",
          }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f172a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="#050a18" />
          <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="url(#grid)" />

          {/* Zone backgrounds */}
          {ZONES.map((z, i) => (
            <g key={i}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill={z.fill} opacity={0.07} />
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx={12}
                fill="none"
                stroke={z.stroke}
                strokeWidth={0.8}
                strokeDasharray="4 4"
                opacity={0.35}
              />
              <text
                x={z.x + 10}
                y={z.y + 18}
                fontSize={11}
                fontWeight={500}
                fill={z.stroke}
                opacity={0.5}
                letterSpacing={1}
                style={{ textTransform: "uppercase" }}
              >
                {z.label}
              </text>
            </g>
          ))}

          {/* Pathways */}
          {PATHWAYS.map((p, i) => (
            <g key={i}>
              <path d={p.d} stroke={p.color} strokeWidth={p.w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path
                d={p.d}
                stroke="#475569"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="6 8"
                opacity={0.4}
              />
              {p.label && (
                <text x={p.lx} y={p.ly} fontSize={7} fill="#64748b">
                  {p.label}
                </text>
              )}
            </g>
          ))}

          {/* Active route */}
          {route.length >= 2 && <RoutePath points={route} eta={eta} />}

          {/* Location boxes */}
          {LOCATIONS.map((loc) => (
            <LocationBox
              key={loc.id}
              location={loc}
              occupancy={occupancy[loc.id]}
              visible={visibleCategories.has(loc.category)}
              highlighted={highlightedId === loc.id}
              onClick={(l) => setSelectedLoc(l)}
            />
          ))}

          {/* Person marker (top) */}
          <PersonMarker x={personX} y={personY} heading={heading} rerouting={rerouting} />
        </svg>
      </div>

      {/* Top: search + filters + stats */}
      <div style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 8, padding: "0 12px", pointerEvents: "none" }}>
        {/* Search */}
        <div style={{ alignSelf: "center", width: "min(420px, 90%)", pointerEvents: "auto", position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location…"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid #334155",
              background: "rgba(15,23,42,0.92)",
              backdropFilter: "blur(8px)",
              color: "#e2e8f0",
              fontSize: 13,
              outline: "none",
            }}
          />
          {filteredLocations.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 12,
                overflow: "hidden",
                zIndex: 30,
              }}
            >
              {filteredLocations.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    flyTo(l);
                    setSearch("");
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "#e2e8f0",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {titleCase(l.name)}{" "}
                  <span style={{ color: "#64748b", fontSize: 10, marginLeft: 6 }}>
                    {CATEGORY_STYLE[l.category].label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "4px 4px",
            pointerEvents: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          <FilterPill active={visibleCategories.size === ALL_CATS.length} color="#64748b" label="All" onClick={() => resetCategories()} />
          {ALL_CATS.map((c) => (
            <FilterPill
              key={c}
              active={visibleCategories.has(c)}
              color={CATEGORY_STYLE[c].stroke}
              label={CATEGORY_STYLE[c].label}
              onClick={() => toggleCategory(c)}
            />
          ))}
        </div>

        {/* Live stats */}
        <div
          style={{
            alignSelf: "center",
            display: "flex",
            gap: 14,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid #1e293b",
            color: "#cbd5e1",
            fontSize: 11,
            pointerEvents: "auto",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              style={{ width: 7, height: 7, borderRadius: 999, background: "#10b981", display: "inline-block" }}
            />
            LIVE
          </span>
          <span>{visibleLocs.length} locations</span>
          <span>Avg {avgOcc}%</span>
          <span style={{ color: criticalCount > 0 ? "#ef4444" : "#cbd5e1" }}>{criticalCount} critical</span>
        </div>
      </div>

      {/* Compass */}
      <div style={{ position: "absolute", top: 12, right: 12, width: 56, height: 56, pointerEvents: "none" }}>
        <svg viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="26" fill="rgba(15,23,42,0.85)" stroke="#334155" />
          <polygon points="28,6 32,28 28,24 24,28" fill="#ef4444" />
          <polygon points="28,50 32,28 28,32 24,28" fill="#94a3b8" />
          <text x="28" y="14" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e2e8f0">N</text>
          <text x="28" y="50" textAnchor="middle" fontSize="8" fill="#94a3b8">S</text>
          <text x="50" y="31" textAnchor="middle" fontSize="8" fill="#94a3b8">E</text>
          <text x="6" y="31" textAnchor="middle" fontSize="8" fill="#94a3b8">W</text>
        </svg>
      </div>

      {/* Zoom controls (desktop) */}
      {!isMobile && (
        <div style={{ position: "absolute", bottom: 90, right: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <ZoomBtn onClick={() => setTransform(Math.min(3, scale + 0.2), tx, ty)}>+</ZoomBtn>
          <ZoomBtn onClick={() => setTransform(Math.max(0.5, scale - 0.2), tx, ty)}>−</ZoomBtn>
          <ZoomBtn onClick={() => setTransform(1, 0, 0)}>⊙</ZoomBtn>
          <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
            {Math.round(scale * 100)}%
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 12,
          padding: 10,
          background: "rgba(15,23,42,0.88)",
          border: "1px solid #1e293b",
          borderRadius: 10,
          color: "#cbd5e1",
          fontSize: 10,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 14px",
          maxWidth: 280,
        }}
      >
        {ALL_CATS.map((c) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, background: CATEGORY_STYLE[c].stroke, borderRadius: 2 }} />
            {CATEGORY_STYLE[c].label}
          </div>
        ))}
        {[
          { label: "Low", color: "#10b981" },
          { label: "Moderate", color: "#f59e0b" },
          { label: "High", color: "#ef4444" },
          { label: "Critical", color: "#dc2626", pulse: true },
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <motion.span
              animate={s.pulse ? { opacity: [1, 0.3, 1] } : {}}
              transition={s.pulse ? { repeat: Infinity, duration: 1.4 } : {}}
              style={{ width: 10, height: 10, background: s.color, borderRadius: 999 }}
            />
            {s.label}
          </div>
        ))}
      </div>

      {/* Navigation banner */}
      <AnimatePresence>
        {from && to && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
              border: "1px solid #3b82f6",
              padding: "10px 16px",
              borderRadius: 12,
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 10px 30px rgba(59,130,246,0.4)",
              maxWidth: "94%",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <span>
              {titleCase(from.name)} → {titleCase(to.name)}
            </span>
            <span style={{ opacity: 0.85 }}>ETA {eta} min</span>
            <span style={{ opacity: 0.85 }}>{distance}m</span>
            <button
              onClick={endNavigation}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              End
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup */}
      <AnimatePresence>
        {selectedLoc && (
          <LocationPopup
            loc={selectedLoc}
            occ={occupancy[selectedLoc.id]}
            screenX={popupScreenPos.x}
            screenY={popupScreenPos.y}
            isMobile={isMobile}
            onClose={() => setSelectedLoc(null)}
            onSetStart={() => {
              setFrom(selectedLoc);
              toast(`Start set: ${titleCase(selectedLoc.name)}`);
              setSelectedLoc(null);
            }}
            onNavigate={() => {
              setTo(selectedLoc);
              if (!from) {
                // use current person position as start - find nearest location
                const nearest = LOCATIONS.reduce((best, l) => {
                  const d = Math.hypot(l.x - personX, l.y - personY);
                  return d < best.d ? { loc: l, d } : best;
                }, { loc: LOCATIONS[0], d: Infinity });
                setFrom(nearest.loc);
              }
              toast(`Navigating to ${titleCase(selectedLoc.name)}`);
              setSelectedLoc(null);
            }}
            onMoveHere={() => {
              setPerson(selectedLoc.x, selectedLoc.y);
              setSelectedLoc(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setContextMenu(null)} />
          <div
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: 4,
              zIndex: 70,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <button
              onClick={() => {
                setPerson(contextMenu.mapX, contextMenu.mapY);
                if (from && to) {
                  const r = crowdAwareDijkstra(from.id, to.id, occupancy, { x: contextMenu.mapX, y: contextMenu.mapY });
                  if (r) setRoute(r.points, r.eta, r.distance);
                }
                setContextMenu(null);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#e2e8f0",
                fontSize: 12,
                padding: "8px 14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              📍 Move me here
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FilterPill({
  active,
  color,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "6px 12px",
        borderRadius: 999,
        background: active ? color : "rgba(15,23,42,0.85)",
        color: active ? "#0b1220" : color,
        border: `1px solid ${color}`,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function ZoomBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        background: "rgba(15,23,42,0.92)",
        color: "#e2e8f0",
        border: "1px solid #334155",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 16,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}