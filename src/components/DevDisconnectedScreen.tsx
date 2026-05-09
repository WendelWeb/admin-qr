"use client";

export default function DevDisconnectedScreen() {
  // Stable-looking incident reference so it doesn't reshuffle on every render.
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const ref = `MHU-${yyyy}${mm}${dd}-DC`;
  const issuedAt = today.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0a0a] via-[#2b1212] to-[#3a1818] px-4 py-12 overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-2xl">
        {/* Top alert banner */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-2xl bg-red-600/30 border border-red-500/40 text-red-100 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
          </span>
          Critical · Service Unavailable
        </div>

        {/* Main card */}
        <div className="bg-[#0e0606]/85 backdrop-blur-xl ring-1 ring-red-500/20 rounded-b-2xl shadow-2xl p-8 sm:p-10">
          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/30 to-rose-600/30 ring-1 ring-red-400/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
              <line
                x1="3"
                y1="3"
                x2="21"
                y2="21"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-center text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Project Disconnected by the Developer
          </h1>
          <p className="mt-3 text-center text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            The development team has revoked the deployment keys associated
            with this project. All services have been suspended and no requests
            can be processed at this time.
          </p>

          {/* Status grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50">
                  Database
                </span>
              </div>
              <div className="text-sm font-semibold text-red-200">
                Connection refused
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50">
                  API Tokens
                </span>
              </div>
              <div className="text-sm font-semibold text-red-200">Revoked</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-white/50">
                  Hosting
                </span>
              </div>
              <div className="text-sm font-semibold text-red-200">
                Origin offline
              </div>
            </div>
          </div>

          {/* Why this happened */}
          <div className="mt-6 p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1.5">
              Why am I seeing this?
            </p>
            <p className="text-sm text-amber-100/80 leading-relaxed">
              The project owner has chosen to disconnect this build, typically
              following the conclusion of a contract or when ownership of the
              source repository is being transferred. Until the developer
              re-authorises access, both the administration console and the
              public verification site will remain unavailable.
            </p>
          </div>

          {/* Footer info */}
          <div className="mt-7 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">
                Incident reference
              </div>
              <div className="font-mono text-white/85 tabular-nums">{ref}</div>
            </div>
            <div className="sm:text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">
                Disconnected at
              </div>
              <div className="text-white/85">{issuedAt}</div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/40">
            For reactivation, please contact the development team that
            originally delivered this software. This page will refresh
            automatically once service is restored.
          </p>
        </div>

        {/* Animated retry pill */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white/35 text-xs">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Attempting to reach the origin server…</span>
        </div>
      </div>
    </div>
  );
}
