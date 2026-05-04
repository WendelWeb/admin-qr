"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef<number | null>(null);
  const fadeRef = useRef<number | null>(null);
  const prev = useRef(pathname);

  function clearTick() {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function clearFade() {
    if (fadeRef.current !== null) {
      window.clearTimeout(fadeRef.current);
      fadeRef.current = null;
    }
  }

  // When pathname changes, finish the bar
  useEffect(() => {
    if (prev.current !== pathname) {
      prev.current = pathname;
      clearTick();
      setProgress(100);
      clearFade();
      fadeRef.current = window.setTimeout(() => {
        setVisible(false);
        // small delay before reset so the fade out completes
        fadeRef.current = window.setTimeout(() => setProgress(0), 220);
      }, 180);
    }
  }, [pathname]);

  // Listen for link clicks to start progress
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
      if (link.target === "_blank") return;
      // Don't start if already on that path
      if (href === pathname) return;

      // Start progress
      setVisible(true);
      setProgress(12);
      clearTick();
      tickRef.current = window.setInterval(() => {
        setProgress((p) => {
          if (p >= 88) return p + 0.4;
          return Math.min(p + Math.random() * 9, 88);
        });
      }, 220);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTick();
      clearFade();
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={`fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-400 via-[#386E65] to-teal-400 shadow-[0_0_8px_rgba(56,110,101,0.6)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
