"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const selectClass = "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm";
const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm";

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
  const [error, setError] = useState("");
  const [, setCredits] = useState<number | null>(null);
  const [, setBillingExpired] = useState(false);
  const [, setRole] = useState("");
  const [physicians, setPhysicians] = useState<StaffMember[]>([]);
  const [officers, setOfficers] = useState<StaffMember[]>([]);

  const [name, setName] = useState("");
  const [country] = useState("Turks and Caicos Islands");
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
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([p, o, c, b, me]) => {
      setPhysicians(p);
      setOfficers(o);
      if (p.length === 1) setExaminingPhysician(p[0].name);
      if (o.length === 1) setMedicalOfficer(o[0].name);
      if (typeof c.credits === "number") setCredits(c.credits);
      setBillingExpired(!!b.isExpired);
      if (me.role) setRole(me.role);
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
  // STEP 2A — New (Premium) System: in preparation
  // ─────────────────────────────────────────────────────────
  if (system === "new") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSystem(null)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#386E65] transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Choose a different system
        </button>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">New System</h1>
        <p className="text-sm text-gray-500 mb-6">
          The new certificate engine — almost ready to generate your first document.
        </p>

        <div className="relative max-w-3xl bg-gradient-to-br from-[#386E65] to-[#1f4640] rounded-2xl text-white overflow-hidden shadow-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

          <div className="relative p-6 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Status</div>
                <div className="text-lg font-bold">Final setup in progress</div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
              We&apos;re putting the finishing touches on your premium template.
            </h2>
            <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
              The new system uses a professional document engine to render your certificates with the
              quality of a printed legal document. As soon as the master template ID is wired in, every
              field on this page will produce a polished, ready-to-send PDF in seconds.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-2.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold mb-0.5">Legally identical</div>
                <div className="text-xs text-white/60">Same data, same validity, same QR verification.</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-2.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="text-sm font-semibold mb-0.5">Beautifully rendered</div>
                <div className="text-xs text-white/60">Pixel-perfect typography and layout, every time.</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center mb-2.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold mb-0.5">Just as fast</div>
                <div className="text-xs text-white/60">Generation in seconds — no extra steps for you.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-white/15">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-1">Pricing</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">$249</span>
                  <span className="text-sm text-white/60">per month</span>
                </div>
                <div className="text-xs text-white/50 mt-1">Same flat rate as the Old System — no upcharge.</div>
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-300/15 border border-amber-200/30 text-amber-100 text-xs font-medium rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
                  </span>
                  Awaiting template ID
                </div>
                <button
                  type="button"
                  onClick={() => setSystem("legacy")}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white text-[#386E65] rounded-lg hover:bg-white/90 transition-colors text-sm font-semibold shadow-sm"
                >
                  Use Old System for now
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 max-w-3xl">
          You&apos;ll see the new option go live the moment the master template is registered. Nothing else changes — the form, the fields, and the price all stay the same.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // STEP 2B — Classic (Legacy) System: existing form
  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <button
        type="button"
        onClick={() => setSystem(null)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#386E65] transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Choose a different system
      </button>

      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">New Certificate</h1>
        <span className="px-2 py-0.5 bg-[#386E65]/10 text-[#386E65] text-[10px] font-semibold rounded-full uppercase tracking-wide">
          Old System · $249/mo
        </span>
      </div>
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
            <p className="text-xs text-gray-400 mt-1">Enter the person&apos;s full legal name as it should appear on the certificate.</p>
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
