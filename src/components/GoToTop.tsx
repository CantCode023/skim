"use client";

import { useEffect, useState } from "react";

export default function GoToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVisible(window.scrollY > 400);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Go to top"
      className="font-display fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#ffc94d] px-4 py-3 text-sm font-bold text-[#0f1b3e] shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <span className="text-base leading-none">↑</span>
      <span className="hidden sm:inline">Top</span>
    </button>
  );
}
