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
  const [credits, setCredits] = useState<number | null>(null);
  const [billingExpired, setBillingExpired] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
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
      fetch("/api/credits").then((r) => r.json()),
      fetch("/api/billing").then((r) => r.json()),
    ]).then(([p, o, c, b]) => {
      setPhysicians(p);
      setOfficers(o);
      if (p.length === 1) setExaminingPhysician(p[0].name);
      if (o.length === 1) setMedicalOfficer(o[0].name);
      if (typeof c.credits === "number") setCredits(c.credits);
      setBillingExpired(!!b.isExpired);
      setMaintenance(!!b.maintenanceMode);
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

      {/* System maintenance block */}
      {maintenance && (
        <div className="max-w-2xl mb-6">
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.66-5.66a8 8 0 1111.31 0l-5.65 5.66zM12 9v2m0 4h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">System Under Maintenance</h3>
            <p className="text-sm text-amber-700 mb-3">
              The certificate management system is currently undergoing scheduled maintenance. All certificate generation services have been temporarily suspended to ensure system integrity and data security during this process.
            </p>
            <p className="text-sm text-amber-600 mb-4">
              Our infrastructure team is performing critical updates to improve system reliability and performance. This is a routine procedure that helps maintain the highest standards of service quality.
            </p>
            <div className="bg-amber-100/60 rounded-lg p-4 text-left mb-4">
              <p className="text-xs text-amber-700 font-medium mb-2">Why does this happen?</p>
              <p className="text-xs text-amber-600">
                As a government-grade system handling sensitive health certification data, periodic maintenance is essential. This is why it is strongly recommended to invest in redundant server infrastructure — multiple servers ensure that if one node requires maintenance, the remaining nodes can continue serving requests without any service interruption. A multi-server architecture provides high availability, load balancing, and zero-downtime deployments.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-medium text-amber-700">Maintenance in progress</span>
            </div>
          </div>
        </div>
      )}

      {/* Service suspended block */}
      {!maintenance && billingExpired && (
        <div className="max-w-2xl mb-6">
          <div className="bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 border border-red-200 rounded-xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Service Suspended</h3>
            <p className="text-sm text-red-600 mb-3">
              The monthly service payment has not been confirmed. Certificate generation is temporarily disabled until payment is processed.
            </p>
            <p className="text-xs text-red-500">
              Please contact the super administrator to confirm payment and restore service.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-700">Payment overdue</span>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient credits block */}
      {!billingExpired && credits !== null && credits <= 0 && (
        <div className="max-w-2xl mb-6">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Insufficient Credits</h3>
            <p className="text-sm text-red-600 mb-4">
              There are no credits remaining to create new certificates. Additional credits must be purchased before certificate generation can resume. Each credit allows the creation of one certificate.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
              <span className="text-2xl font-bold text-red-500">0</span>
              <span className="text-sm text-red-600">credits available</span>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-lg shadow p-4 sm:p-6 max-w-2xl ${maintenance || billingExpired || (credits !== null && credits <= 0) ? "opacity-50 pointer-events-none" : ""}`}>
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
              readOnly
              disabled
              className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-400 mt-1">This field is fixed and cannot be modified.</p>
          </div>

          {/* Examining Physician */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Examining Physician *</label>
            {physicians.length === 1 ? (
              <input
                type="text"
                value={examiningPhysician}
                readOnly
                disabled
                className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
              />
            ) : physicians.length > 1 ? (
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
              {physicians.length === 1 ? "Only one physician available — auto-selected." : "The doctor who performed the medical examination."}
              {physicians.length === 0 && " Add physicians in Staff Management to use a dropdown."}
            </p>
          </div>

          {/* Medical Officer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Officer *</label>
            {officers.length === 1 ? (
              <input
                type="text"
                value={medicalOfficer}
                readOnly
                disabled
                className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
              />
            ) : officers.length > 1 ? (
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
              {officers.length === 1 ? "Only one officer available — auto-selected." : "The TCIG medical officer who verified the examination."}
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
