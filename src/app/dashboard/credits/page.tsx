"use client";

import { useEffect, useState } from "react";

export default function CreditsPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Add credits form
  const [amount, setAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/credits").then((r) => r.json()),
    ]).then(([me, cred]) => {
      setRole(me.role || "");
      setCredits(cred.credits ?? 0);
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const num = parseInt(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }

    setAdding(true);

    try {
      const res = await fetch("/api/credits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add credits");
      } else {
        setCredits(data.credits);
        setSuccess(`${num} credits added successfully! New balance: ${data.credits}`);
        setAmount("");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
    setAdding(false);
  }

  const presets = [10, 25, 50, 100];

  if (role !== "super_admin" && !loading) {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Credits</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm">Only the super admin can manage credits.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Credit Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Balance */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className={`p-6 sm:p-8 text-center ${
            credits === 0
              ? "bg-gradient-to-br from-red-50 to-red-100"
              : "bg-gradient-to-br from-emerald-50 to-teal-50"
          }`}>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Current Balance</p>
            <p className={`text-5xl sm:text-6xl font-bold ${
              credits === 0 ? "text-red-500" : "text-[#386E65]"
            }`}>
              {credits}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {credits === 0
                ? "No credits remaining — certificate creation is blocked"
                : credits === 1
                  ? "credit remaining"
                  : "credits remaining"
              }
            </p>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className={`w-3 h-3 rounded-full ${credits === 0 ? "bg-red-500" : "bg-emerald-500"}`} />
              <span>
                {credits === 0
                  ? "Certificate creation is currently blocked"
                  : "Certificate creation is active"
                }
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Each certificate created uses 1 credit. When credits reach 0, admins will not be able to create new certificates until more credits are added.
            </p>
          </div>
        </div>

        {/* Add Credits */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Add Credits</h2>
          <p className="text-xs text-gray-400 mb-5">
            Credits will be added to the current balance. Each credit allows the creation of one certificate.
          </p>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(String(p))}
                className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  amount === String(p)
                    ? "bg-[#386E65] text-white border-[#386E65]"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-[#386E65] hover:text-[#386E65]"
                }`}
              >
                +{p}
              </button>
            ))}
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Amount</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="Enter number of credits to add"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#386E65] focus:border-transparent text-sm"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                <p className="text-emerald-700 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={adding || !amount}
              className="w-full py-2.5 bg-[#386E65] text-white rounded-md hover:bg-[#2d5a53] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {adding ? "Adding..." : `Add ${amount ? amount : "0"} Credits`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
