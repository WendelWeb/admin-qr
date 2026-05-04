"use client";

import { useEffect, useRef, useState } from "react";

const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatLong(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dt.getDay()];
  return `${dayOfWeek}, ${MONTH_FULL[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export interface DatePickerProps {
  value: string;                 // YYYY-MM-DD or ""
  onChange: (v: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  disableWeekends?: boolean;
  iconColor?: string;            // tailwind class for the calendar icon
  invalid?: boolean;             // red ring when true
  ariaLabel?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  minYear,
  maxYear,
  disableWeekends = false,
  iconColor = "text-[#386E65]",
  invalid = false,
  ariaLabel,
}: DatePickerProps) {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "year">("day");

  // Cursor (the month being viewed)
  const initial = value ? value.split("-").map(Number) : [todayY, todayM + 1, todayD];
  const [cursorY, setCursorY] = useState(initial[0]);
  const [cursorM, setCursorM] = useState(initial[1] - 1);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // When the value changes externally, sync cursor
  useEffect(() => {
    if (!value) return;
    const [y, m] = value.split("-").map(Number);
    setCursorY(y);
    setCursorM(m - 1);
  }, [value]);

  // Outside click + Escape close
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("day");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMode("day");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Compute visible day cells
  const firstOfMonth = new Date(cursorY, cursorM, 1);
  const startDow = firstOfMonth.getDay(); // 0..6 (Sun..Sat)
  const daysInMonth = new Date(cursorY, cursorM + 1, 0).getDate();
  const cells: ({ d: number; weekend: boolean } | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(cursorY, cursorM, d).getDay();
    cells.push({ d, weekend: dow === 0 || dow === 6 });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const selected = value ? value.split("-").map(Number) : null;
  const selY = selected?.[0];
  const selM = selected ? selected[1] - 1 : null;
  const selD = selected?.[2];

  function selectDay(d: number, weekend: boolean) {
    if (disableWeekends && weekend) return;
    onChange(isoOf(cursorY, cursorM, d));
    setOpen(false);
    setMode("day");
  }

  function prevMonth() {
    if (cursorM === 0) {
      setCursorM(11);
      setCursorY((y) => y - 1);
    } else {
      setCursorM((m) => m - 1);
    }
  }
  function nextMonth() {
    if (cursorM === 11) {
      setCursorM(0);
      setCursorY((y) => y + 1);
    } else {
      setCursorM((m) => m + 1);
    }
  }

  // Year list bounds
  const years: number[] = [];
  const lo = minYear ?? todayY - 100;
  const hi = maxYear ?? todayY + 5;
  for (let y = hi; y >= lo; y--) years.push(y);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        className={`group w-full flex items-center gap-2.5 px-3 py-2.5 bg-white border rounded-xl text-sm transition-all text-left ${
          invalid
            ? "border-red-300 focus:ring-2 focus:ring-red-300/40"
            : open
              ? "border-[#386E65] ring-2 ring-[#386E65]/40"
              : "border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#386E65]/40 focus:border-[#386E65]"
        }`}
      >
        <svg className={`w-4 h-4 shrink-0 ${value ? iconColor : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={`flex-1 truncate ${value ? "text-gray-900 font-medium" : "text-gray-400"}`}>
          {value ? formatLong(value) : placeholder}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 right-0 sm:right-auto sm:w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden animate-in">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-br from-[#386E65] to-[#1f4640] text-white flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setMode((m) => (m === "day" ? "year" : "day"))}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-white/15 transition-colors text-sm font-semibold"
            >
              <span>{MONTH_FULL[cursorM]} {cursorY}</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${mode === "year" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Next month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day or year body */}
          {mode === "day" ? (
            <div className="p-3">
              {/* DOW row */}
              <div className="grid grid-cols-7 mb-1">
                {DOW_SHORT.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400 py-1">
                    {d.slice(0, 1)}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                  if (!cell) return <div key={i} />;
                  const isSelected = selY === cursorY && selM === cursorM && selD === cell.d;
                  const isToday = todayY === cursorY && todayM === cursorM && todayD === cell.d;
                  const isDisabled = disableWeekends && cell.weekend;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectDay(cell.d, cell.weekend)}
                      disabled={isDisabled}
                      className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                        isSelected
                          ? "bg-[#386E65] text-white font-bold shadow-sm shadow-[#386E65]/30"
                          : isDisabled
                            ? "text-gray-300 cursor-not-allowed line-through"
                            : isToday
                              ? "ring-1 ring-[#386E65]/40 text-[#386E65] font-semibold hover:bg-[#386E65]/10"
                              : cell.weekend
                                ? "text-gray-400 hover:bg-gray-100"
                                : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {cell.d}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const todayWeekend = today.getDay() === 0 || today.getDay() === 6;
                    if (disableWeekends && todayWeekend) {
                      // just navigate to today's month
                      setCursorY(todayY);
                      setCursorM(todayM);
                      return;
                    }
                    onChange(isoOf(todayY, todayM, todayD));
                    setCursorY(todayY);
                    setCursorM(todayM);
                    setOpen(false);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-[#386E65] hover:bg-[#386E65]/10 font-semibold transition-colors"
                >
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 max-h-72 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1">
                {years.map((y) => {
                  const isSelected = y === cursorY;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setCursorY(y);
                        setMode("day");
                      }}
                      className={`py-2 rounded-lg text-sm tabular-nums transition-all ${
                        isSelected
                          ? "bg-[#386E65] text-white font-bold shadow-sm shadow-[#386E65]/30"
                          : y === todayY
                            ? "ring-1 ring-[#386E65]/40 text-[#386E65] font-semibold hover:bg-[#386E65]/10"
                            : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick month strip */}
          {mode === "day" && (
            <div className="px-3 py-2 border-t border-gray-100 grid grid-cols-6 gap-1">
              {MONTH_SHORT.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCursorM(i)}
                  className={`text-[11px] py-1 rounded transition-colors ${
                    i === cursorM
                      ? "bg-[#386E65]/10 text-[#386E65] font-semibold"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
