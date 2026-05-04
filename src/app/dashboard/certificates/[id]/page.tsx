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
}

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
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

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

  const today = new Date().toISOString().slice(0, 10);
  const isExpired = cert.expiryDate < today;

  const fields = [
    { label: "Certificate Number", value: `#${cert.certificateNumber}`, mono: true },
    { label: "Full Name", value: cert.name },
    { label: "Date of Birth", value: formatDate(cert.dateOfBirth) },
    { label: "Country", value: cert.country },
    { label: "Examining Physician", value: cert.examiningPhysician },
    { label: "Date Issued", value: formatDate(cert.dateIssued) },
    { label: "Expiry Date", value: formatDate(cert.expiryDate) },
    { label: "Medical Officer", value: cert.medicalOfficer },
    { label: "Access Code", value: cert.accessCode, mono: true },
  ];

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#386E65] transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to certificates
      </button>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#386E65] to-[#1f4640] rounded-2xl text-white overflow-hidden shadow-xl mb-6">
        <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                  Certificate · #{cert.certificateNumber}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                  isExpired
                    ? "bg-red-500/20 text-red-200 ring-1 ring-red-300/30"
                    : "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? "bg-red-400" : "bg-emerald-300"}`} />
                  {isExpired ? "Expired" : "Active"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{cert.name}</h1>
              <p className="text-sm text-white/70 mt-1">
                Valid until <span className="text-white font-medium">{formatDate(cert.expiryDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href={`/api/certificates/${cert.id}/download`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#386E65] rounded-xl hover:bg-white/90 transition-colors text-sm font-semibold shadow-sm"
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
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm font-medium ring-1 ring-white/15"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Certificate Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">All information is read-only and tied to the issued document.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {fields.map((f) => (
              <div key={f.label} className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-500 sm:w-48 sm:flex-shrink-0">{f.label}</span>
                <span className={`text-sm font-medium text-gray-900 ${f.mono ? "font-mono tabular-nums" : ""}`}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">QR Code</h3>
            <p className="text-xs text-gray-500 mt-0.5">Scannable verification link.</p>
          </div>
          <div className="p-5 text-center">
            {cert.qrCode ? (
              <>
                <div className="inline-block p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl mb-4">
                  <img
                    src={cert.qrCode}
                    alt="Certificate QR Code"
                    className="w-40 h-40 sm:w-[200px] sm:h-[200px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={cert.qrCode}
                    download={`qr-${cert.certificateNumber}.png`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR
                  </a>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-left">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">QR Image Link</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/qr/${cert.certificateNumber}`}
                      className="flex-1 min-w-0 text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/qr/${cert.certificateNumber}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0 font-medium ${
                        copied
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm py-6">No QR code available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
