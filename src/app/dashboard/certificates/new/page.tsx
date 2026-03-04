"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StaffMember {
  id: number;
  name: string;
}

export default function NewCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [physicians, setPhysicians] = useState<StaffMember[]>([]);
  const [officers, setOfficers] = useState<StaffMember[]>([]);

  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    country: "Turks and Caicos Islands",
    examiningPhysician: "",
    medicalOfficer: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/physicians").then((r) => r.json()),
      fetch("/api/medical-officers").then((r) => r.json()),
    ]).then(([p, o]) => {
      setPhysicians(p);
      setOfficers(o);
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create certificate");
        setLoading(false);
        return;
      }

      const cert = await res.json();
      router.push(`/dashboard/certificates/${cert.id}`);
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Certificate</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <p className="text-sm text-gray-500 mb-4">
          Certificate number, access code, QR code, and dates will be generated automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Examining Physician *</label>
            {physicians.length > 0 ? (
              <select
                name="examiningPhysician"
                value={form.examiningPhysician}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              >
                <option value="">Select a physician...</option>
                {physicians.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <input
                  type="text"
                  name="examiningPhysician"
                  value={form.examiningPhysician}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
                  placeholder="Dr. name"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add physicians in Staff Management to use dropdown
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Officer *</label>
            {officers.length > 0 ? (
              <select
                name="medicalOfficer"
                value={form.medicalOfficer}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              >
                <option value="">Select an officer...</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <input
                  type="text"
                  name="medicalOfficer"
                  value={form.medicalOfficer}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
                  placeholder="Officer name"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add officers in Staff Management to use dropdown
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Certificate"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
