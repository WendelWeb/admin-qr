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

  useEffect(() => {
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Certificates</h1>
        <Link
          href="/dashboard/certificates/new"
          className="px-4 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm text-center"
        >
          + New Certificate
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, certificate #, access code..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); fetchCertificates(); }}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Cert #</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Access Code</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Date Issued</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Expiry</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">No certificates found</td>
              </tr>
            ) : (
              certificates.map((cert) => (
                <tr key={cert.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{cert.certificateNumber}</td>
                  <td className="px-4 py-3">{cert.name}</td>
                  <td className="px-4 py-3 font-mono">{cert.accessCode}</td>
                  <td className="px-4 py-3">{formatDate(cert.dateIssued)}</td>
                  <td className="px-4 py-3">{formatDate(cert.expiryDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/dashboard/certificates/${cert.id}`}
                        className="text-[#386E65] hover:underline"
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No certificates found</div>
        ) : (
          certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{cert.name}</p>
                  <p className="text-xs font-mono text-gray-500">#{cert.certificateNumber}</p>
                </div>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                  {cert.accessCode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                <div>
                  <span className="text-gray-400">Issued:</span> {formatDate(cert.dateIssued)}
                </div>
                <div>
                  <span className="text-gray-400">Expiry:</span> {formatDate(cert.expiryDate)}
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Link
                  href={`/dashboard/certificates/${cert.id}`}
                  className="text-sm text-[#386E65] font-medium"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(cert.id, cert.name)}
                  className="text-sm text-red-600 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
