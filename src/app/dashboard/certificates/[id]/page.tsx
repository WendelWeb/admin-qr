"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  qrCode: string | null;
  createdAt: string;
  system?: string;
  employerName?: string | null;
  purposeOfResidency?: string | null;
}

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.role) setRole(d.role); });
    async function load() {
      const res = await fetch(`/api/certificates/${params.id}`);
      if (res.ok) {
        setCert(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  function copy(value: string, field: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading certificate...
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
        Certificate not found.
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const issuedDate = new Date(cert.dateIssued + "T00:00:00");
  const expiryDate = new Date(cert.expiryDate + "T00:00:00");
  const isExpired = expiryDate < today;
  const totalDays = Math.max(daysBetween(issuedDate, expiryDate), 1);
  const elapsed = Math.max(0, Math.min(daysBetween(issuedDate, today), totalDays));
  const daysRemaining = Math.max(0, daysBetween(today, expiryDate));
  const validityPct = Math.round((elapsed / totalDays) * 100);

  // Compute status color tones
  const statusTone = isExpired
    ? { ring: "ring-red-300/40", bg: "bg-red-500/20", dot: "bg-red-400", text: "text-red-200", label: "Expired" }
    : daysRemaining <= 30
      ? { ring: "ring-amber-300/40", bg: "bg-amber-400/20", dot: "bg-amber-300", text: "text-amber-100", label: "Expiring soon" }
      : { ring: "ring-emerald-300/40", bg: "bg-emerald-400/20", dot: "bg-emerald-300", text: "text-emerald-100", label: "Active" };

  const initials = getInitials(cert.name);

  // Field groups
  const groups = [
    {
      title: "Certificate Holder",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      fields: [
        { label: "Full Name", value: cert.name },
        { label: "Date of Birth", value: formatDate(cert.dateOfBirth) },
        { label: "Country", value: cert.country },
      ],
    },
    {
      title: "Issuance",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      fields: [
        { label: "Date Issued", value: formatDate(cert.dateIssued) },
        { label: "Examining Physician", value: cert.examiningPhysician },
        { label: "Medical Officer", value: cert.medicalOfficer },
      ],
    },
    ...(cert.system === "new" && (cert.employerName || cert.purposeOfResidency)
      ? [{
          title: "Residency",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          fields: [
            ...(cert.employerName ? [{ label: "Employer Name", value: cert.employerName }] : []),
            ...(cert.purposeOfResidency ? [{ label: "Purpose of Residency", value: cert.purposeOfResidency }] : []),
          ],
        }]
      : []),
    {
      title: "Validity & Identifiers",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      fields: [
        { label: "Expiry Date", value: formatDate(cert.expiryDate) },
        { label: "Certificate #", value: `#${cert.certificateNumber}`, copy: String(cert.certificateNumber), mono: true },
        { label: "Access Code", value: cert.accessCode, copy: cert.accessCode, mono: true },
      ],
    },
  ];

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#386E65] transition-colors mb-4 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to certificates
      </button>

      {/* ─── HERO ─── */}
      <div className={`relative rounded-3xl text-white overflow-hidden shadow-2xl mb-6 ${
        cert.system === "new"
          ? "bg-gradient-to-br from-[#1a0c2e] via-[#2d1b4e] to-[#6366f1]"
          : "bg-gradient-to-br from-[#0e1c26] via-[#1a3530] to-[#386E65]"
      }`}>
        {/* Decorative orbs */}
        <div className={`absolute -top-32 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          cert.system === "new" ? "bg-purple-400/25" : "bg-emerald-400/20"
        }`} />
        <div className={`absolute -bottom-40 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          cert.system === "new" ? "bg-indigo-300/15" : "bg-teal-300/10"
        }`} />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top bar */}
        <div className="relative px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              Health Certificate · {cert.system === "new" ? "New System" : "Old System"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${
              cert.system === "new"
                ? "bg-white/15 text-white ring-white/30"
                : "bg-white/15 text-white ring-white/30"
            }`}>
              {cert.system === "new" ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ) : null}
              {cert.system === "new" ? "New" : "Old"}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${statusTone.bg} ${statusTone.text} ${statusTone.ring}`}>
              <span className="relative flex h-1.5 w-1.5">
                {!isExpired && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusTone.dot} opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusTone.dot}`} />
              </span>
              {statusTone.label}
            </div>
          </div>
        </div>

        {/* Main hero content */}
        <div className="relative px-6 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-start gap-6">
          {/* Initials avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
              {initials || "—"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-[#0e1c26]">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Name + cert # */}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight truncate">{cert.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.951.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.072 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
                <span className="font-mono tabular-nums">#{cert.certificateNumber}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>{cert.country}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Issued {formatDate(cert.dateIssued)}</span>
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href={`/api/certificates/${cert.id}/download`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#0e1c26] rounded-xl hover:bg-white/95 transition-all text-sm font-semibold shadow-lg cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
            {role === "super_admin" && (
              <button
                onClick={async () => {
                  if (!confirm(`Delete certificate #${cert.certificateNumber} for "${cert.name}"?`)) return;
                  const res = await fetch(`/api/certificates/${cert.id}`, { method: "DELETE" });
                  if (res.ok) router.push("/dashboard");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm font-medium ring-1 ring-white/15 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Validity progress strip */}
        <div className="relative px-6 sm:px-10 pb-6 sm:pb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-0.5">Validity Timeline</div>
                <div className="text-sm font-semibold text-white">
                  {isExpired
                    ? `Expired ${Math.abs(daysBetween(today, expiryDate))} day${Math.abs(daysBetween(today, expiryDate)) === 1 ? "" : "s"} ago`
                    : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-0.5">Expires</div>
                <div className="text-sm font-semibold text-white">{formatDate(cert.expiryDate)}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                  isExpired
                    ? "bg-gradient-to-r from-red-400 to-red-300"
                    : daysRemaining <= 30
                      ? "bg-gradient-to-r from-amber-400 to-amber-300"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-300"
                }`}
                style={{ width: `${Math.min(validityPct, 100)}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-white/40">
              <span>{formatDate(cert.dateIssued)}</span>
              <span>Today</span>
              <span>{formatDate(cert.expiryDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Field groups */}
        <div className="lg:col-span-3 space-y-5">
          {groups.map((group) => (
            <div key={group.title} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 sm:px-6 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#386E65]/10 text-[#386E65] flex items-center justify-center">
                  {group.icon}
                </div>
                <h2 className="text-sm font-semibold text-gray-900">{group.title}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {group.fields.map((f) => (
                  <div key={f.label} className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 group/row">
                    <span className="text-xs sm:text-sm text-gray-500 sm:w-44 sm:shrink-0">{f.label}</span>
                    <span className={`flex-1 text-sm font-medium text-gray-900 ${"mono" in f && f.mono ? "font-mono tabular-nums" : ""}`}>{f.value}</span>
                    {"copy" in f && f.copy && (
                      <button
                        onClick={() => copy(f.copy as string, f.label)}
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          copiedField === f.label
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 opacity-0 group-hover/row:opacity-100"
                        }`}
                      >
                        {copiedField === f.label ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right column: QR + Verification */}
        <div className="lg:col-span-2 space-y-5">
          {/* QR Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6.364.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Verification QR</h3>
                <p className="text-[11px] text-gray-500">Scan to verify authenticity</p>
              </div>
            </div>
            <div className="p-5 text-center">
              {cert.qrCode ? (
                <>
                  <div className="inline-block p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl mb-4 shadow-sm">
                    <img
                      src={cert.qrCode}
                      alt="Certificate QR Code"
                      className="w-44 h-44 sm:w-52 sm:h-52"
                    />
                  </div>

                  <a
                    href={cert.qrCode}
                    download={`qr-${cert.certificateNumber}.png`}
                    className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-colors text-sm font-medium cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR Image
                  </a>

                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-left">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1.5">QR Image Link</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/qr/${cert.certificateNumber}`}
                        className="flex-1 min-w-0 text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-mono"
                      />
                      <button
                        onClick={() => copy(`${window.location.origin}/api/qr/${cert.certificateNumber}`, "QR-link")}
                        className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0 font-medium cursor-pointer ${
                          copiedField === "QR-link"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {copiedField === "QR-link" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm py-6">No QR code available</p>
              )}
            </div>
          </div>

          {/* Verification info card */}
          <div className="relative bg-gradient-to-br from-[#386E65] to-[#1f4640] rounded-2xl text-white overflow-hidden">
            <div className="absolute -top-16 -right-12 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="relative p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Officially issued</h3>
                  <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                    This certificate is registered in the Migrant Health Unit database. Anyone scanning the QR code or visiting the verification URL will see the live status.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-1">Issued by</div>
                  <div className="text-white/90 font-medium leading-tight">{cert.examiningPhysician}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-1">Verified by</div>
                  <div className="text-white/90 font-medium leading-tight">{cert.medicalOfficer}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
