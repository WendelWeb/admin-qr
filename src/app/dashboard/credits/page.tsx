"use client";

import { useEffect, useState } from "react";

export default function CreditsPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Add credits form
  const [amount, setAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Set exact
  const [setExactValue, setSetExactValue] = useState("");
  const [showSetExact, setShowSetExact] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/credits").then((r) => r.json()),
    ]).then(([me, cred]) => {
      setRole(me.role || "");
      setCredits(cred.credits ?? 0);
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const num = parseInt(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }

    setAdding(true);

    try {
      const res = await fetch("/api/credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add credits");
      } else {
        setCredits(data.credits);
        setSuccess(`+${num} credits added. New balance: ${data.credits}`);
        setAmount("");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
    setAdding(false);
  }

  async function handleReset() {
    if (!confirm("Are you sure you want to reset credits to 0? This will block certificate creation until new credits are added.")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredits(0);
        setSuccess("Credits reset to 0.");
      } else {
        setError(data.error || "Failed to reset");
      }
    } catch {
      setError("An error occurred.");
    }
  }

  async function handleSetExact() {
    const val = parseInt(setExactValue);
    if (isNaN(val) || val < 0) {
      setError("Please enter a valid number (0 or more).");
      return;
    }
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", amount: val }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredits(data.credits);
        setSuccess(`Credits set to ${data.credits}.`);
        setSetExactValue("");
        setShowSetExact(false);
      } else {
        setError(data.error || "Failed to set credits");
      }
    } catch {
      setError("An error occurred.");
    }
  }

  const presets = [10, 25, 50, 100];

  if (role !== "super_admin" && !loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Credits</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
          <p className="text-amber-800 text-sm">Only the super admin can manage credits.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading...
      </div>
    );
  }

  return (
    <div>
      {/* ─── HERO ─── */}
      <div className={`relative rounded-3xl text-white overflow-hidden shadow-2xl mb-6 ${
        credits === 0
          ? "bg-gradient-to-br from-[#3a0f0f] via-[#5a1818] to-[#a83232]"
          : "bg-gradient-to-br from-[#0e1c26] via-[#1a3530] to-[#386E65]"
      }`}>
        <div className={`absolute -top-32 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          credits === 0 ? "bg-red-400/20" : "bg-emerald-400/20"
        }`} />
        <div className={`absolute -bottom-40 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          credits === 0 ? "bg-rose-300/10" : "bg-teal-300/10"
        }`} />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Dashboard · Credits</div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${
            credits === 0
              ? "bg-red-500/20 text-red-100 ring-red-300/30"
              : "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
          }`}>
            <span className="relative flex h-1.5 w-1.5">
              {credits !== 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${credits === 0 ? "bg-red-300" : "bg-emerald-300"}`} />
            </span>
            {credits === 0 ? "Blocked" : "Active"}
          </div>
        </div>

        <div className="relative px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p className="text-sm text-white/60 uppercase tracking-widest font-medium mb-2">Current Balance</p>
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl sm:text-7xl font-bold tabular-nums ${
                credits === 0 ? "text-red-200" : "text-white"
              }`}>
                {credits}
              </span>
              <span className="text-sm text-white/60">
                {credits === 1 ? "credit" : "credits"}
              </span>
            </div>
            <p className="text-sm text-white/65 mt-2 max-w-md">
              {credits === 0
                ? "No credits remaining — certificate creation is blocked until you add more."
                : "Each certificate created consumes one credit. Top up below to keep issuance flowing."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current Balance */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className={`relative p-6 sm:p-8 text-center overflow-hidden ${
            credits === 0
              ? "bg-gradient-to-br from-red-50 to-rose-100"
              : "bg-gradient-to-br from-emerald-50 to-teal-50"
          }`}>
            <div className={`absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
              credits === 0 ? "bg-red-300/30" : "bg-emerald-300/30"
            }`} />
            <div className="relative">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Current Balance</p>
            <p className={`text-5xl sm:text-6xl font-bold ${
              credits === 0 ? "text-red-500" : "text-[#386E65]"
            }`}>
              {credits}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {credits === 0
                ? "No credits remaining — certificate creation is blocked"
                : credits === 1
                  ? "credit remaining"
                  : "credits remaining"
              }
            </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className={`w-3 h-3 rounded-full ${credits === 0 ? "bg-red-500" : "bg-emerald-500"}`} />
              <span>
                {credits === 0
                  ? "Certificate creation is currently blocked"
                  : "Certificate creation is active"
                }
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Each certificate created uses 1 credit. When credits reach 0, admins will not be able to create new certificates until more credits are added.
            </p>

            {/* Quick actions */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Reset to 0
                </button>
                <button
                  onClick={() => setShowSetExact(!showSetExact)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Set exact amount
                </button>
              </div>

              {showSetExact && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min="0"
                    value={setExactValue}
                    onChange={(e) => setSetExactValue(e.target.value)}
                    placeholder="Enter value"
                    className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSetExact();
                      if (e.key === "Escape") { setShowSetExact(false); setSetExactValue(""); }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSetExact}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#386E65] rounded-lg hover:bg-[#2d5a53] transition-colors cursor-pointer"
                  >
                    Set
                  </button>
                  <button
                    onClick={() => { setShowSetExact(false); setSetExactValue(""); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Credits */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Add Credits</h2>
          <p className="text-xs text-gray-500 mb-5">
            Credits are added to the current balance. Each credit allows the creation of one certificate.
          </p>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(String(p))}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                  amount === String(p)
                    ? "bg-[#386E65] text-white border-[#386E65] shadow-sm shadow-[#386E65]/20"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-[#386E65]/40 hover:text-[#386E65]"
                }`}
              >
                +{p}
              </button>
            ))}
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Amount</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="Enter number of credits to add"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-emerald-700 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={adding || !amount}
              className="w-full py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {adding ? "Adding..." : `Add ${amount ? amount : "0"} Credits`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
