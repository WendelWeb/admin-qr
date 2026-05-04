"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";

function PendingSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function NewCertificateCTA() {
  const { pending } = useLinkStatus();
  return (
    <span className="inline-flex items-center gap-1.5">
      {pending ? (
        <>
          <PendingSpinner />
          Loading…
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Issue New Certificate
        </>
      )}
    </span>
  );
}

interface Certificate {
  id: number;
  name: string;
  certificateNumber: number;
  accessCode: string;
  dateOfBirth: string;
  dateIssued: string;
  expiryDate: string;
  country: string;
  examiningPhysician: string;
  medicalOfficer: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.role) setRole(d.role); });
    fetchCertificates();
  }, []);

  async function fetchCertificates(query = "") {
    setLoading(true);
    const url = query ? `/api/certificates?search=${encodeURIComponent(query)}` : "/api/certificates";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setCertificates(data);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCertificates(search);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Are you sure you want to delete the certificate for "${name}"?`)) return;

    const res = await fetch(`/api/certificates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCertificates(certificates.filter((c) => c.id !== id));
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Quick stats
  const today = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(today + "T00:00:00");
  const in30Days = new Date(todayDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const issuedToday = certificates.filter((c) => c.dateIssued === today).length;
  const expired = certificates.filter((c) => c.expiryDate < today).length;
  const expiringSoon = certificates.filter((c) => c.expiryDate >= today && c.expiryDate <= in30Days).length;
  const activeCount = certificates.length - expired;

  const filtered = certificates.filter((c) => {
    if (filter === "all") return true;
    if (filter === "expired") return c.expiryDate < today;
    if (filter === "expiring") return c.expiryDate >= today && c.expiryDate <= in30Days;
    if (filter === "active") return c.expiryDate >= today;
    return true;
  });

  function getInitials(name: string) {
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  }

  return (
    <div>
      {/* ─── HERO ─── */}
      <div className="relative bg-gradient-to-br from-[#0e1c26] via-[#1a3530] to-[#386E65] rounded-3xl text-white overflow-hidden shadow-2xl mb-6">
        <div className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Dashboard · Certificates</div>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300" />
            </span>
            Live
          </div>
        </div>

        <div className="relative px-6 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">Certificates</h1>
            <p className="text-sm sm:text-base text-white/65 mt-2 max-w-xl">
              Browse, search, and manage every health certificate you&apos;ve issued — with full traceability.
            </p>
          </div>

          <Link
            href="/dashboard/certificates/new"
            prefetch
            className="inline-flex items-center justify-center px-5 py-3 bg-white text-[#0e1c26] rounded-xl hover:bg-white/95 active:scale-[0.98] transition-all text-sm font-semibold shadow-lg shrink-0 min-w-[12rem]"
          >
            <NewCertificateCTA />
          </Link>
        </div>

        {/* Inline stats */}
        <div className="relative px-6 sm:px-10 pb-6 sm:pb-8">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-white/50">Total</div>
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums mt-0.5">{certificates.length}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-emerald-200/80">Active</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-200 tabular-nums mt-0.5">{activeCount}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-white/50">Today</div>
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums mt-0.5">{issuedToday}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([
          { key: "all", label: "All", count: certificates.length, tone: "default" },
          { key: "active", label: "Active", count: activeCount, tone: "emerald" },
          { key: "expiring", label: "Expiring soon", count: expiringSoon, tone: "amber" },
          { key: "expired", label: "Expired", count: expired, tone: "red" },
        ] as const).map((chip) => {
          const isActive = filter === chip.key;
          const toneCls = isActive
            ? chip.tone === "emerald" ? "bg-emerald-600 text-white border-emerald-600"
              : chip.tone === "amber" ? "bg-amber-500 text-white border-amber-500"
              : chip.tone === "red" ? "bg-red-600 text-white border-red-600"
              : "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300";
          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${toneCls}`}
            >
              {chip.label}
              <span className={`tabular-nums ${isActive ? "opacity-90" : "text-gray-400"}`}>{chip.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, certificate #, access code..."
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); fetchCertificates(); }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ─── STUNNING ROW LIST ─── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
          <div className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading certificates...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 ring-1 ring-gray-200 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">No certificates found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {filtered.map((cert) => {
            const isExpired = cert.expiryDate < today;
            const isExpiringSoon = !isExpired && cert.expiryDate <= in30Days;
            const initials = getInitials(cert.name);
            const tone = isExpired
              ? { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-100", dot: "bg-red-500", label: "Expired" }
              : isExpiringSoon
                ? { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100", dot: "bg-amber-500", label: "Expiring soon" }
                : { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100", dot: "bg-emerald-500", label: "Active" };

            // Mini validity progress
            const issuedT = new Date(cert.dateIssued + "T00:00:00").getTime();
            const expiryT = new Date(cert.expiryDate + "T00:00:00").getTime();
            const todayT = Date.now();
            const totalSpan = Math.max(expiryT - issuedT, 1);
            const elapsed = Math.min(Math.max(todayT - issuedT, 0), totalSpan);
            const pct = Math.round((elapsed / totalSpan) * 100);

            return (
              <div
                key={cert.id}
                className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 hover:bg-gradient-to-r hover:from-[#386E65]/[0.02] hover:to-transparent transition-all"
              >
                {/* Avatar + identity */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#386E65] to-[#1f4640] ring-1 ring-[#386E65]/20 flex items-center justify-center text-base sm:text-lg font-bold text-white shadow-lg shadow-[#386E65]/15">
                      {initials || "—"}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ring-2 ring-white ${tone.dot}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 truncate text-base">{cert.name}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.951.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.072 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                        </svg>
                        #{cert.certificateNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {cert.accessCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validity meta + progress (desktop) */}
                <div className="hidden lg:flex flex-col w-56 shrink-0">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                    <span>Issued {formatDate(cert.dateIssued)}</span>
                    <span className={isExpired ? "text-red-600 font-medium" : "text-gray-700 font-medium"}>{formatDate(cert.expiryDate)}</span>
                  </div>
                  <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        isExpired ? "bg-red-400" : isExpiringSoon ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/certificates/${cert.id}`}
                    prefetch
                    className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] active:scale-[0.97] transition-all text-sm font-semibold shadow-sm shadow-[#386E65]/15 hover:shadow-md hover:shadow-[#386E65]/25 group-hover:gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  {role === "super_admin" && (
                    <button
                      onClick={() => handleDelete(cert.id, cert.name)}
                      className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
