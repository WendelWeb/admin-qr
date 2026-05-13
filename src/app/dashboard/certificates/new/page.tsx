"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";

interface StaffMember {
  id: number;
  name: string;
}

type CertSystem = "legacy" | "new";

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

const selectClass = "px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all";
const inputClass = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65] text-sm transition-all";

export default function NewCertificatePage() {
  const router = useRouter();
  const [system, setSystem] = useState<CertSystem | null>(null);
  const [transitioning, setTransitioning] = useState<CertSystem | null>(null);
  const [loading, setLoading] = useState(false);

  function pickSystem(choice: CertSystem) {
    if (transitioning) return;
    setTransitioning(choice);
    setTimeout(() => {
      setSystem(choice);
      setTransitioning(null);
    }, 650);
  }

  // Random sample names for the Simulate button
  const SAMPLE_NAMES = [
    "Alex Johnson", "Maria Lopez", "Jean Pierre", "Sarah Miller", "Ahmed Hassan",
    "Lucia Ferreira", "Daniel Kim", "Fatou Diop", "Marco Rossi", "Priya Patel",
    "Tomás García", "Aisha Bello", "Liam O'Connor", "Yuki Tanaka", "Carlos Mendes",
  ];

  function pad2(n: number) { return String(n).padStart(2, "0"); }

  function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

  async function handleSimulate() {
    setError("");

    // Fill all fields with valid random values
    const fakeName = pickRandom(SAMPLE_NAMES);
    setName(fakeName);

    // DOB: 20–60 years ago, any day/month
    const today = new Date();
    const age = 20 + Math.floor(Math.random() * 40);
    const dob = new Date(today);
    dob.setFullYear(today.getFullYear() - age);
    dob.setMonth(Math.floor(Math.random() * 12));
    dob.setDate(1 + Math.floor(Math.random() * 28));
    setDobYear(String(dob.getFullYear()));
    setDobMonth(pad2(dob.getMonth() + 1));
    setDobDay(pad2(dob.getDate()));

    // Date issued: today, but if weekend pick the nearest previous weekday
    const issued = new Date(today);
    while (issued.getDay() === 0 || issued.getDay() === 6) {
      issued.setDate(issued.getDate() - 1);
    }
    setIssuedYear(String(issued.getFullYear()));
    setIssuedMonth(pad2(issued.getMonth() + 1));
    setIssuedDay(pad2(issued.getDate()));

    // Make sure physicians/officers fall back to a name even if empty in DB
    if (!examiningPhysician) {
      setExaminingPhysician(physicians[0]?.name || "Dr. Ravens Saunders");
    }
    if (!medicalOfficer) {
      setMedicalOfficer(officers[0]?.name || "Dr. John Smith");
    }

    if (system === "new") {
      setEmployerName("Acme Caribbean Holdings");
      if (purposes.length > 0 && !purposeOfResidency) {
        setPurposeOfResidency(purposes[0].value);
      }
    }

    // Submit directly with the simulated values (not from state, since
    // state updates won't be visible inside this same tick).
    setLoading(true);
    const dateOfBirth = `${dob.getFullYear()}-${pad2(dob.getMonth() + 1)}-${pad2(dob.getDate())}`;
    const dateIssued = `${issued.getFullYear()}-${pad2(issued.getMonth() + 1)}-${pad2(issued.getDate())}`;
    const simEmployer = system === "new" ? "Acme Caribbean Holdings" : undefined;
    const simPurpose = system === "new"
      ? (purposeOfResidency || purposes[0]?.value || "Work Permit")
      : undefined;

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fakeName,
          dateOfBirth,
          dateIssued,
          validityYears,
          country,
          examiningPhysician: examiningPhysician || physicians[0]?.name || "Dr. Ravens Saunders",
          medicalOfficer: medicalOfficer || officers[0]?.name || "Dr. John Smith",
          system: system === "new" ? "new" : "legacy",
          employerName: simEmployer,
          purposeOfResidency: simPurpose,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Simulate failed");
        setLoading(false);
        return;
      }
      const cert = await res.json();
      router.push(`/dashboard/certificates/${cert.id}`);
    } catch {
      setError("An error occurred during simulate.");
      setLoading(false);
    }
  }
  const [error, setError] = useState("");
  const [, setCredits] = useState<number | null>(null);
  const [, setBillingExpired] = useState(false);
  const [role, setRole] = useState("");
  const [physicians, setPhysicians] = useState<StaffMember[]>([]);
  const [officers, setOfficers] = useState<StaffMember[]>([]);
  const [purposes, setPurposes] = useState<{ id: number; value: string }[]>([]);

  const [name, setName] = useState("");
  const [country] = useState("Turks and Caicos Islands");
  const [examiningPhysician, setExaminingPhysician] = useState("");
  const [medicalOfficer, setMedicalOfficer] = useState("");
  const [validityYears, setValidityYears] = useState("2");
  const [employerName, setEmployerName] = useState("");
  const [purposeOfResidency, setPurposeOfResidency] = useState("");

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
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/purposes").then((r) => r.json()),
    ]).then(([p, o, c, b, me, pu]) => {
      setPhysicians(p);
      setOfficers(o);
      if (p.length === 1) setExaminingPhysician(p[0].name);
      if (o.length === 1) setMedicalOfficer(o[0].name);
      if (typeof c.credits === "number") setCredits(c.credits);
      setBillingExpired(!!b.isExpired);
      if (me.role) setRole(me.role);
      if (Array.isArray(pu)) {
        setPurposes(pu);
        if (pu.length > 0) setPurposeOfResidency(pu[0].value);
      }
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
    if (system === "new") {
      if (!employerName.trim()) {
        setError("Please enter the Employer Name.");
        return;
      }
      if (!purposeOfResidency.trim()) {
        setError("Please choose a Purpose of Residency.");
        return;
      }
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
          system: system === "new" ? "new" : "legacy",
          employerName: system === "new" ? employerName.trim() : undefined,
          purposeOfResidency: system === "new" ? purposeOfResidency : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "BILLING_BLOCKED") {
          await new Promise((r) => setTimeout(r, 4000));
          setError("Certificate creation failed.");
          setLoading(false);
          return;
        }
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

  // ─────────────────────────────────────────────────────────
  // STEP 1 — System Selector
  // ─────────────────────────────────────────────────────────
  if (system === null) {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">New Certificate</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose which certificate system you want to use. Both options issue a fully valid certificate.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
          {/* ─── LEGACY CARD ─── */}
          <button
            type="button"
            onClick={() => pickSystem("legacy")}
            disabled={transitioning !== null}
            className={`group relative text-left bg-white rounded-2xl border border-gray-200 hover:border-[#386E65] hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer disabled:cursor-wait ${
              transitioning === "legacy" ? "ring-2 ring-[#386E65] shadow-xl" : ""
            } ${transitioning && transitioning !== "legacy" ? "opacity-40" : ""}`}
          >
            {transitioning === "legacy" && (
              <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-7 h-7 text-[#386E65] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs font-semibold text-[#386E65] uppercase tracking-widest">Loading…</span>
                </div>
              </div>
            )}
            <div className="absolute top-4 right-4 px-2.5 py-1 bg-[#386E65]/10 text-[#386E65] text-[11px] font-semibold rounded-full uppercase tracking-wide">
              Currently Active
            </div>

            <div className="p-6 sm:p-7">
              <div className="w-12 h-12 rounded-xl bg-[#386E65]/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#386E65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">Old System</h3>
              <p className="text-sm text-gray-500 mb-5">
                The original certificate format you already know — proven, fast, and battle-tested.
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-[#386E65] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Familiar layout, identical to the certificates you issue today
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-[#386E65] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Auto-generated certificate number, access code, and QR
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-[#386E65] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant generation — ready to download in seconds
                </li>
              </ul>

              <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                <div>
                  <div className="text-2xl font-bold text-gray-900">$249<span className="text-sm font-medium text-gray-500">/mo</span></div>
                  <div className="text-xs text-gray-400">per month</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#386E65] group-hover:gap-2.5 transition-all">
                  Use this system
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </button>

          {/* ─── NEW CARD ─── */}
          <button
            type="button"
            onClick={() => pickSystem("new")}
            disabled={transitioning !== null}
            className={`group relative text-left bg-gradient-to-br from-[#386E65] to-[#1f4640] rounded-2xl text-white hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer disabled:cursor-wait ${
              transitioning === "new" ? "ring-2 ring-white/40 shadow-2xl" : ""
            } ${transitioning && transitioning !== "new" ? "opacity-40" : ""}`}
          >
            {transitioning === "new" && (
              <div className="absolute inset-0 z-10 bg-[#1f4640]/70 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs font-semibold text-white uppercase tracking-widest">Loading…</span>
                </div>
              </div>
            )}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-white/5 blur-3xl" />

            <div className="absolute top-4 right-4 px-2.5 py-1 bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              New
            </div>

            <div className="relative p-6 sm:p-7">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 ring-1 ring-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">New System</h3>
              <p className="text-sm text-white/70 mb-5">
                Next-generation certificate engine — pixel-perfect templates, richer formatting, smarter delivery.
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-white/90">
                  <svg className="w-4 h-4 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Powered by a professional document engine (DocSpring)
                </li>
                <li className="flex items-start gap-2 text-sm text-white/90">
                  <svg className="w-4 h-4 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Crisp, refined typography and a modernized layout
                </li>
                <li className="flex items-start gap-2 text-sm text-white/90">
                  <svg className="w-4 h-4 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Same workflow you already know — zero learning curve
                </li>
              </ul>

              <div className="flex items-end justify-between pt-4 border-t border-white/15">
                <div>
                  <div className="text-2xl font-bold text-white">$249<span className="text-sm font-medium text-white/70">/mo</span></div>
                  <div className="text-xs text-white/60">per month</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white group-hover:gap-2.5 transition-all">
                  Try the new system
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-5 max-w-5xl flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Both systems issue legally identical certificates and bill the same flat $249/month. Pick whichever fits your preference — you can switch any time.
          </span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // STEP 2 — Either system: full form (extra fields shown for New System)
  // ─────────────────────────────────────────────────────────
  const isNewSystem = system === "new";
  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          type="button"
          onClick={() => setSystem(null)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#386E65] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Choose a different system
        </button>

        {role === "super_admin" && (
          <button
            type="button"
            onClick={handleSimulate}
            disabled={loading}
            title="Auto-fill all fields with test data and create the certificate"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/30 hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simulating…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Simulate · Quick Test
              </>
            )}
          </button>
        )}
      </div>

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
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Issue Certificate · {isNewSystem ? "New System" : "Old System"}</div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/90 ring-1 ring-white/20">
            $249/mo
          </div>
        </div>

        <div className="relative px-6 sm:px-10 py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">New Certificate</h1>
          <p className="text-sm sm:text-base text-white/65 mt-2 max-w-xl">
            Fill in the holder, examination, and validity details. Certificate number, access code, and QR code will be generated automatically.
          </p>
        </div>

        {expiryPreview && !issuedIsWeekend && (
          <div className="relative px-6 sm:px-10 pb-6 sm:pb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 ring-1 ring-emerald-300/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Will expire on</div>
                <div className="text-sm font-semibold text-white">{expiryPreview}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
        {/* ─── SECTION: Holder ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#386E65]/10 text-[#386E65] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Certificate Holder</h2>
              <p className="text-xs text-gray-500">Identifying information about the person.</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-[#386E65]">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. Roudlyn Jean-Pierre"
              />
              <p className="text-xs text-gray-400 mt-1.5">Enter the person&apos;s full legal name as it should appear on the certificate.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-[#386E65]">*</span></label>
              <DatePicker
                value={dobDay && dobMonth && dobYear ? `${dobYear}-${dobMonth}-${dobDay}` : ""}
                onChange={(v) => {
                  if (!v) { setDobDay(""); setDobMonth(""); setDobYear(""); return; }
                  const [y, m, d] = v.split("-");
                  setDobYear(y);
                  setDobMonth(m);
                  setDobDay(d);
                }}
                placeholder="Select date of birth"
                minYear={currentYear - 100}
                maxYear={currentYear}
                ariaLabel="Date of birth"
              />
              <p className="text-xs text-gray-400 mt-1.5">Click to open the calendar. The header lets you jump to a specific year.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <div className={`${inputClass} bg-gray-50 text-gray-600 cursor-not-allowed flex items-center gap-2`}>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{country}</span>
                <span className="ml-auto text-[10px] uppercase tracking-widest font-semibold text-gray-400">Fixed</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION: Issuance ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Issuance</h2>
              <p className="text-xs text-gray-500">When and by whom the certificate was issued.</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Issued <span className="text-[#386E65]">*</span></label>
              <DatePicker
                value={issuedDay && issuedMonth && issuedYear ? `${issuedYear}-${issuedMonth}-${issuedDay}` : ""}
                onChange={(v) => {
                  if (!v) { setIssuedDay(""); setIssuedMonth(""); setIssuedYear(""); return; }
                  const [y, m, d] = v.split("-");
                  setIssuedYear(y);
                  setIssuedMonth(m);
                  setIssuedDay(d);
                }}
                placeholder="Select issuance date"
                minYear={currentYear - 2}
                maxYear={currentYear + 2}
                disableWeekends
                invalid={issuedIsWeekend}
                ariaLabel="Date issued"
              />
              {issuedIsWeekend && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-full font-medium ring-1 ring-red-100">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                  Weekend dates are not allowed.
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">Weekends (Saturday & Sunday) are blocked in the calendar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Examining Physician <span className="text-[#386E65]">*</span></label>
                {physicians.length === 1 ? (
                  <div className={`${inputClass} bg-gray-50 text-gray-700 cursor-not-allowed flex items-center gap-2`}>
                    <div className="w-6 h-6 rounded-md bg-[#386E65]/10 text-[#386E65] flex items-center justify-center text-[10px] font-bold shrink-0">
                      {examiningPhysician.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "—"}
                    </div>
                    <span className="truncate">{examiningPhysician}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-widest font-semibold text-gray-400">Auto</span>
                  </div>
                ) : physicians.length > 1 ? (
                  <select
                    value={examiningPhysician}
                    onChange={(e) => setExaminingPhysician(e.target.value)}
                    required
                    className={`w-full ${selectClass}`}
                  >
                    <option value="">Select a physician...</option>
                    {physicians.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
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
                <p className="text-xs text-gray-400 mt-1.5">
                  {physicians.length === 1 ? "Only one physician available — auto-selected." : "The doctor who performed the medical examination."}
                  {physicians.length === 0 && " Add physicians in Staff Management."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical Officer <span className="text-[#386E65]">*</span></label>
                {officers.length === 1 ? (
                  <div className={`${inputClass} bg-gray-50 text-gray-700 cursor-not-allowed flex items-center gap-2`}>
                    <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {medicalOfficer.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "—"}
                    </div>
                    <span className="truncate">{medicalOfficer}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-widest font-semibold text-gray-400">Auto</span>
                  </div>
                ) : officers.length > 1 ? (
                  <select
                    value={medicalOfficer}
                    onChange={(e) => setMedicalOfficer(e.target.value)}
                    required
                    className={`w-full ${selectClass}`}
                  >
                    <option value="">Select an officer...</option>
                    {officers.map((o) => (<option key={o.id} value={o.name}>{o.name}</option>))}
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
                <p className="text-xs text-gray-400 mt-1.5">
                  {officers.length === 1 ? "Only one officer available — auto-selected." : "The TCIG medical officer who verified the examination."}
                  {officers.length === 0 && " Add officers in Staff Management."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION: Residency (new system only) ─── */}
        {isNewSystem && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Residency</h2>
                <p className="text-xs text-gray-500">Employer and purpose of stay — printed on the New System certificate.</p>
              </div>
            </div>

            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employer Name <span className="text-[#386E65]">*</span></label>
                <input
                  type="text"
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  required={isNewSystem}
                  className={inputClass}
                  placeholder="e.g. Acme Caribbean Holdings"
                />
                <p className="text-xs text-gray-400 mt-1.5">The company or person employing the holder.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose of Residency <span className="text-[#386E65]">*</span></label>
                {purposes.length > 0 ? (
                  <select
                    value={purposeOfResidency}
                    onChange={(e) => setPurposeOfResidency(e.target.value)}
                    required={isNewSystem}
                    className={`w-full ${selectClass}`}
                  >
                    {purposes.map((p) => (
                      <option key={p.id} value={p.value}>{p.value}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    No options configured. Add some in <strong>Settings → Purposes of Residency</strong>.
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1.5">Manage these values in Settings.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── SECTION: Validity ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Validity</h2>
              <p className="text-xs text-gray-500">How long this certificate remains valid.</p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Validity <span className="text-[#386E65]">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {(["1", "2", "3"] as const).map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setValidityYears(years)}
                  className={`relative py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    validityYears === years
                      ? "bg-[#386E65] text-white border-[#386E65] shadow-sm shadow-[#386E65]/20"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#386E65]/40 hover:text-[#386E65]"
                  }`}
                >
                  <span className="block text-lg font-bold tabular-nums">{years}</span>
                  <span className={`block text-[11px] uppercase tracking-widest font-semibold mt-0.5 ${
                    validityYears === years ? "text-white/70" : "text-gray-400"
                  }`}>{years === "1" ? "year" : "years"}</span>
                </button>
              ))}
            </div>
            {expiryPreview && !issuedIsWeekend && (
              <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl ring-1 ring-emerald-100">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Certificate expires on <strong>{expiryPreview}</strong></span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2 max-w-3xl">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ─── ACTIONS ─── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || issuedIsWeekend}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-gradient-to-br from-[#386E65] to-[#2d5a53] text-white rounded-xl hover:from-[#2d5a53] hover:to-[#244540] active:scale-[0.98] transition-all text-sm font-semibold shadow-md shadow-[#386E65]/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating certificate…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Create Certificate
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
