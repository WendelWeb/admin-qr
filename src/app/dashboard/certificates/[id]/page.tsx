"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  qrCode: string | null;
  createdAt: string;
}

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!cert) {
    return <div className="text-red-600">Certificate not found</div>;
  }

  const fields = [
    { label: "Certificate Number", value: cert.certificateNumber },
    { label: "Full Name", value: cert.name },
    { label: "Date of Birth", value: formatDate(cert.dateOfBirth) },
    { label: "Country", value: cert.country },
    { label: "Examining Physician", value: cert.examiningPhysician },
    { label: "Date Issued", value: formatDate(cert.dateIssued) },
    { label: "Expiry Date", value: formatDate(cert.expiryDate) },
    { label: "Medical Officer", value: cert.medicalOfficer },
    { label: "Access Code", value: cert.accessCode },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 hover:text-gray-700 self-start"
        >
          &larr; Back
        </button>
        <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
          Certificate #{cert.certificateNumber}
        </h1>
        <button
          onClick={async () => {
            if (!confirm(`Delete certificate #${cert.certificateNumber} for "${cert.name}"?`)) return;
            const res = await fetch(`/api/certificates/${cert.id}`, { method: "DELETE" });
            if (res.ok) router.push("/dashboard");
          }}
          className="sm:ml-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm self-start"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-2">
                <span className="text-xs sm:text-sm text-gray-500 sm:w-48 sm:flex-shrink-0 mb-0.5 sm:mb-0">{f.label}</span>
                <span className="text-sm font-medium text-gray-800">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-4">QR Code</h3>
          {cert.qrCode ? (
            <>
              <img
                src={cert.qrCode}
                alt="Certificate QR Code"
                className="mx-auto mb-4 w-40 h-40 sm:w-[200px] sm:h-[200px]"
              />
              <div className="flex flex-col gap-2">
                <a
                  href={cert.qrCode}
                  download={`qr-${cert.certificateNumber}.png`}
                  className="inline-block px-4 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm"
                >
                  Download QR
                </a>
                <a
                  href={`/api/certificates/${cert.id}/download`}
                  className="inline-block px-4 py-2 bg-[#1a2a3a] text-white rounded-md hover:bg-[#2a3a4a] transition-colors text-sm"
                >
                  Download PDF
                </a>
              </div>

              {/* QR Image Link */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500 mb-1">QR Image Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/qr/${cert.certificateNumber}`}
                    className="flex-1 min-w-0 text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-700"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/qr/${cert.certificateNumber}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors shrink-0"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No QR code available</p>
          )}
        </div>
      </div>
    </div>
  );
}
