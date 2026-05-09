import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: "radial-gradient(ellipse at top, #0f172a, #020617)" }}
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">Live Campus Intel</p>
        <h1 className="text-5xl font-bold text-white sm:text-6xl">Find your way around campus.</h1>
        <p className="mx-auto max-w-xl text-sm text-slate-400">
          Real-time occupancy, crowd-aware routing, and walking guidance — all on one interactive map.
        </p>
      </div>
      <Link
        to="/map"
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(59,130,246,0.45)] transition hover:bg-blue-500"
      >
        Open Campus Map →
      </Link>
    </div>
  );
}
