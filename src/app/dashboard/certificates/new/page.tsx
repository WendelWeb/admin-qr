"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StaffMember {
  id: number;
  name: string;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function getDaysInMonth(month: string, year: string) {
  if (!month || !year) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

function formatPreview(day: string, month: string, year: string) {
  if (!day || !month || !year) return null;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayOfWeek = d.getDay();
  const dayName = dayOfWeek === 6 ? "Saturday" : dayNames[dayOfWeek];
  return `${dayName}, ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function isWeekendDate(day: string, month: string, year: string) {
  if (!day || !month || !year) return false;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.getDay() === 0 || d.getDay() === 6;
}

const selectClass = "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm";
const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm";

export default function NewCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [physicians, setPhysicians] = useState<StaffMember[]>([]);
  const [officers, setOfficers] = useState<StaffMember[]>([]);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("Turks and Caicos Islands");
  const [examiningPhysician, setExaminingPhysician] = useState("");
  const [medicalOfficer, setMedicalOfficer] = useState("");
  const [validityYears, setValidityYears] = useState("2");

  // DOB
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  // Date Issued
  const [issuedDay, setIssuedDay] = useState("");
  const [issuedMonth, setIssuedMonth] = useState("");
  const [issuedYear, setIssuedYear] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/physicians").then((r) => r.json()),
      fetch("/api/medical-officers").then((r) => r.json()),
    ]).then(([p, o]) => {
      setPhysicians(p);
      setOfficers(o);
    });
  }, []);

  const currentYear = new Date().getFullYear();
  const dobYears = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
  const issuedYears = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  const dobDaysInMonth = getDaysInMonth(dobMonth, dobYear);
  const issuedDaysInMonth = getDaysInMonth(issuedMonth, issuedYear);

  const issuedIsWeekend = isWeekendDate(issuedDay, issuedMonth, issuedYear);

  // Compute expiry preview
  let expiryPreview = "";
  if (issuedDay && issuedMonth && issuedYear) {
    const d = new Date(parseInt(issuedYear), parseInt(issuedMonth) - 1, parseInt(issuedDay));
    d.setFullYear(d.getFullYear() + parseInt(validityYears));
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    expiryPreview = `${String(d.getDate()).padStart(2, "0")}, ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!dobDay || !dobMonth || !dobYear) {
      setError("Please complete the Date of Birth.");
      return;
    }
    if (!issuedDay || !issuedMonth || !issuedYear) {
      setError("Please complete the Date Issued.");
      return;
    }
    if (issuedIsWeekend) {
      setError("Date Issued cannot be a Saturday or Sunday.");
      return;
    }

    setLoading(true);

    const dateOfBirth = `${dobYear}-${dobMonth}-${String(parseInt(dobDay)).padStart(2, "0")}`;
    const dateIssued = `${issuedYear}-${issuedMonth}-${String(parseInt(issuedDay)).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dateOfBirth,
          dateIssued,
          validityYears,
          country,
          examiningPhysician,
          medicalOfficer,
        }),
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
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">New Certificate</h1>
      <p className="text-sm text-gray-500 mb-6">
        Fill in the details below. Certificate number, access code, and QR code will be generated automatically.
      </p>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
              placeholder="e.g. Roudlyn Jean-Pierre"
            />
            <p className="text-xs text-gray-400 mt-1">Enter the person's full legal name as it should appear on the certificate.</p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Day</label>
                <select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className={`w-full ${selectClass}`}>
                  <option value="">Day</option>
                  {Array.from({ length: dobDaysInMonth }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Month</label>
                <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className={`w-full ${selectClass}`}>
                  <option value="">Month</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Year</label>
                <select value={dobYear} onChange={(e) => setDobYear(e.target.value)} className={`w-full ${selectClass}`}>
                  <option value="">Year</option>
                  {dobYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {dobDay && dobMonth && dobYear && (
              <p className="text-xs text-[#386E65] mt-1 font-medium">
                {formatPreview(dobDay, dobMonth, dobYear)}
              </p>
            )}
          </div>

          {/* Date Issued */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued *</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Day</label>
                <select value={issuedDay} onChange={(e) => setIssuedDay(e.target.value)} className={`w-full ${selectClass}`}>
                  <option value="">Day</option>
                  {Array.from({ length: issuedDaysInMonth }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Month</label>
                <select value={issuedMonth} onChange={(e) => setIssuedMonth(e.target.value)} className={`w-full ${selectClass}`}>
                  <option value="">Month</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Year</label>
                <select value={issuedYear} onChange={(e) => setIssuedYear(e.target.value)} className={`w-full ${selectClass}`}>
                  <option value="">Year</option>
                  {issuedYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {issuedDay && issuedMonth && issuedYear && (
              issuedIsWeekend ? (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  This date falls on a weekend. Please choose a weekday (Monday - Friday).
                </p>
              ) : (
                <p className="text-xs text-[#386E65] mt-1 font-medium">
                  {formatPreview(issuedDay, issuedMonth, issuedYear)}
                </p>
              )
            )}
            <p className="text-xs text-gray-400 mt-1">The date the certificate was issued. Weekends are not allowed.</p>
          </div>

          {/* Certificate Validity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Validity *</label>
            <select
              value={validityYears}
              onChange={(e) => setValidityYears(e.target.value)}
              className={`w-full ${selectClass}`}
            >
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
            </select>
            {expiryPreview && !issuedIsWeekend && (
              <p className="text-xs text-[#386E65] mt-1 font-medium">
                Certificate expires: {expiryPreview}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">How long this certificate remains valid from the date issued.</p>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Country of origin or residence.</p>
          </div>

          {/* Examining Physician */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Examining Physician *</label>
            {physicians.length > 0 ? (
              <select
                value={examiningPhysician}
                onChange={(e) => setExaminingPhysician(e.target.value)}
                required
                className={`w-full ${selectClass}`}
              >
                <option value="">Select a physician...</option>
                {physicians.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={examiningPhysician}
                onChange={(e) => setExaminingPhysician(e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. Dr. Ravens Saunders"
              />
            )}
            <p className="text-xs text-gray-400 mt-1">
              The doctor who performed the medical examination.
              {physicians.length === 0 && " Add physicians in Staff Management to use a dropdown."}
            </p>
          </div>

          {/* Medical Officer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Officer *</label>
            {officers.length > 0 ? (
              <select
                value={medicalOfficer}
                onChange={(e) => setMedicalOfficer(e.target.value)}
                required
                className={`w-full ${selectClass}`}
              >
                <option value="">Select an officer...</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.name}>{o.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={medicalOfficer}
                onChange={(e) => setMedicalOfficer(e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. Dr. John Smith"
              />
            )}
            <p className="text-xs text-gray-400 mt-1">
              The TCIG medical officer who verified the examination.
              {officers.length === 0 && " Add officers in Staff Management to use a dropdown."}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || issuedIsWeekend}
              className="px-6 py-2.5 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Certificate"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
