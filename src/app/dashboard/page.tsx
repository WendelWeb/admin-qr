"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const issuedToday = certificates.filter((c) => c.dateIssued === today).length;
  const expired = certificates.filter((c) => c.expiryDate < today).length;
  const activeCount = certificates.length - expired;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">Browse, search, and manage every certificate you&apos;ve issued.</p>
        </div>
        <Link
          href="/dashboard/certificates/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#386E65] text-white rounded-xl hover:bg-[#2d5a53] transition-all shadow-sm hover:shadow-md text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Certificate
        </Link>
      </div>

      {/* Quick stats */}
      {!loading && certificates.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Total</div>
            <div className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{certificates.length}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Active</div>
            <div className="text-2xl font-bold text-[#386E65] mt-1 tabular-nums">{activeCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Today</div>
            <div className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{issuedToday}</div>
          </div>
        </div>
      )}

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

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Cert #</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Name</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Access Code</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Issued</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Expiry</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading certificates...
                  </div>
                </td>
              </tr>
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">No certificates found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search or create a new one.</p>
                  </div>
                </td>
              </tr>
            ) : (
              certificates.map((cert) => {
                const isExpired = cert.expiryDate < today;
                return (
                  <tr key={cert.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-gray-700 tabular-nums">#{cert.certificateNumber}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{cert.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{cert.accessCode}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(cert.dateIssued)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 ${isExpired ? "text-red-600" : "text-gray-600"}`}>
                        {isExpired && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        {formatDate(cert.expiryDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-3">
                        <Link
                          href={`/dashboard/certificates/${cert.id}`}
                          className="text-[#386E65] hover:underline font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(cert.id, cert.name)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading certificates...</div>
        ) : certificates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 font-medium">No certificates found</p>
          </div>
        ) : (
          certificates.map((cert) => {
            const isExpired = cert.expiryDate < today;
            return (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cert.name}</p>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">#{cert.certificateNumber}</p>
                  </div>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 shrink-0">
                    {cert.accessCode}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div>
                    <span className="text-gray-400">Issued:</span> {formatDate(cert.dateIssued)}
                  </div>
                  <div>
                    <span className="text-gray-400">Expiry:</span>{" "}
                    <span className={isExpired ? "text-red-600 font-medium" : ""}>{formatDate(cert.expiryDate)}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <Link
                    href={`/dashboard/certificates/${cert.id}`}
                    className="text-sm text-[#386E65] font-medium"
                  >
                    View
                  </Link>
                  {role === "super_admin" && (
                    <button
                      onClick={() => handleDelete(cert.id, cert.name)}
                      className="text-sm text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
