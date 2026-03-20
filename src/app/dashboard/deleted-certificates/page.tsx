"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DeletedCertificate {
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
  createdBy: string;
  createdAt: string;
  deletedAt: string;
  deletedBy: string;
}

export default function DeletedCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<DeletedCertificate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.role !== "super_admin") {
          router.push("/dashboard");
          return;
        }
        setRole(d.role);
      });
    fetchCertificates();
  }, [router]);

  async function fetchCertificates(query = "") {
    setLoading(true);
    const url = query
      ? `/api/certificates/deleted?search=${encodeURIComponent(query)}`
      : "/api/certificates/deleted";
    const res = await fetch(url);
    if (res.ok) {
      setCertificates(await res.json());
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCertificates(search);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (role !== "super_admin") return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Deleted Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Certificates deleted by admins — still counted for billing
          </p>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          {certificates.length} deleted
        </span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, cert #, deleted by..."
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
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Date Issued</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Created By</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Deleted By</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Deleted At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">No deleted certificates</td>
              </tr>
            ) : (
              certificates.map((cert) => (
                <tr key={cert.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{cert.certificateNumber}</td>
                  <td className="px-4 py-3">{cert.name}</td>
                  <td className="px-4 py-3">{formatDate(cert.dateIssued)}</td>
                  <td className="px-4 py-3 text-gray-500">{cert.createdBy || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                      {cert.deletedBy || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(cert.deletedAt)}</td>
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
          <div className="text-center py-8 text-gray-500">No deleted certificates</div>
        ) : (
          certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">{cert.name}</p>
                  <p className="text-xs font-mono text-gray-500">#{cert.certificateNumber}</p>
                </div>
                <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded font-medium">
                  Deleted
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                <div>
                  <span className="text-gray-400">Issued:</span> {formatDate(cert.dateIssued)}
                </div>
                <div>
                  <span className="text-gray-400">Created by:</span> {cert.createdBy || "—"}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                <span className="text-red-600 font-medium">Deleted by {cert.deletedBy || "—"}</span>
                {" "}on {formatDateTime(cert.deletedAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
