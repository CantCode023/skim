"use client";

import { useCallback, useState } from "react";
import Nav from "./Nav";
import ExploreTopics from "./ExploreTopics";
import SkimLogo from "./SkimLogo";

export default function Landing() {
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem("skim_visited", "1");
    } catch {}
    // Hard navigation is more reliable here than router.push during hydration.
    window.location.assign("/");
  }, []);

  return (
    <div className="skim-doodle min-h-dvh bg-[#0f1b3e]">
      <Nav />

      <Hero onStart={dismiss} />
      <Features />

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-2 text-center sm:px-6">
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem("skim_visited", "1");
            } catch {}
            window.location.assign("/");
          }}
          className="font-display rounded-full bg-[#ffc94d] px-8 py-4 text-base font-bold text-[#0f1b3e] shadow-[0_12px_32px_rgba(255,201,77,0.4)] transition hover:scale-[1.02] active:scale-[0.99]"
        >
          Start Skimming →
        </button>
        <p className="mt-3 text-xs text-[#fff6e3]/60">No account needed to start. Connect Medium anytime for a personal feed.</p>
      </section>

      <footer className="bg-[#0f1b3e] pb-10 pt-2 text-center text-sm text-[#fff6e3]/40">
        Skim · Swipe. Read. Grow. · Endless Medium reads, just for you.
      </footer>
    </div>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative overflow-hidden px-4 pb-14 pt-6 sm:px-6 sm:pt-8">
      <span className="pointer-events-none absolute left-[8%] top-[32%] text-xl text-[#ffc94d]/70">✦</span>
      <span className="pointer-events-none absolute left-[32%] top-[12%] text-sm text-[#fff6e3]/40">✦</span>
      <span className="pointer-events-none absolute right-[38%] top-[8%] text-lg text-[#ffc94d]/80">✦</span>
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-[#2b2a5e]/50 blur-2xl" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <SkimLogo />
          <h1 className="font-display mt-3 text-3xl font-semibold leading-snug text-white sm:text-4xl">
            <span className="mr-2 inline-block -rotate-6 text-[#ffc94d]">›</span>
            Swipe. Read.{" "}
            <span className="relative text-[#ffc94d]">
              Grow.
              <svg viewBox="0 0 120 16" className="absolute -bottom-2 left-0 h-3 w-full">
                <path d="M4 10 Q60 2 116 10" stroke="#ffc94d" strokeWidth="4" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#fff6e3]/80 lg:mx-0 lg:text-lg">
            Endless inspiring articles from Medium, just for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <button
              onClick={onStart}
              className="font-display rounded-full bg-[#ffc94d] px-7 py-3.5 text-base font-bold text-[#0f1b3e] shadow-[0_12px_32px_rgba(255,201,77,0.4)] transition hover:scale-[1.02] active:scale-[0.99]"
            >
              Start Reading →
            </button>
          </div>

          <div className="mt-8 hidden justify-center lg:flex lg:justify-start">
            <div className="relative">
              <div className="mx-auto flex h-28 w-32 items-end justify-center">
                <div className="relative h-20 w-20 rounded-t-full bg-[#fff6e3]">
                  <span className="absolute left-5 top-9 h-4 w-2.5 rounded-full bg-[#0f1b3e]" />
                  <span className="absolute right-5 top-9 h-4 w-2.5 rounded-full bg-[#0f1b3e]" />
                  <span className="absolute -right-2 top-2 h-4 w-2 rotate-[20deg] rounded-full bg-[#ffc94d]" />
                  <span className="absolute -right-5 top-4 h-3 w-2 -rotate-[20deg] rounded-full bg-[#ffc94d]" />
                </div>
              </div>
              <div className="relative -mt-4 flex h-10 w-40 items-center justify-center gap-1 rounded-b-3xl bg-[#1a2455] shadow-xl">
                <span className="h-6 w-16 rounded-l-xl border-r border-white/20 bg-[#0f1b3e] pr-2 text-right text-xs font-bold leading-6 text-white/40">
                  M
                </span>
                <span className="h-6 w-16 rounded-r-xl bg-[#0f1b3e]" />
              </div>
              <span className="absolute -left-8 bottom-0 text-[#ffc94d]">✦</span>
              <span className="absolute -right-6 top-10 text-[#ffc94d]">✦</span>
            </div>
          </div>
        </div>

        <PhoneMockup />
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto hidden w-full max-w-[380px] select-none sm:block">
      <div className="pointer-events-none absolute -right-6 top-2 rotate-12 text-3xl text-[#ffc94d]">✦</div>
      <div className="pointer-events-none absolute -left-8 top-20 text-2xl text-[#ffc94d]/80">✦</div>
      <svg className="absolute -left-10 top-16 h-16 w-16 text-[#fff6e3]/70" viewBox="0 0 64 64" fill="none">
        <path d="M8 8 C24 40, 40 44, 56 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 6" />
        <path d="M48 24 L57 31 L46 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="relative rotate-[3deg] rounded-[32px] border-[3px] border-[#2a345f] bg-[#0b1230] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="rounded-[24px] bg-[#121c45] p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white/90">9:41</span>
            <span className="flex items-center gap-1 text-xs text-white/70">📶 🔋</span>
          </div>
          <div className="flex items-center justify-between">
            <SkimLogo compact />
            <span className="text-lg text-white/70">🔖</span>
          </div>
          <div className="mt-4 flex gap-2 overflow-hidden text-xs">
            <span className="shrink-0 rounded-full bg-[#ffc94d] px-3 py-1 font-bold text-[#0f1b3e]">For You</span>
            <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-white/70">Self-Improvement</span>
            <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-white/70">Psychology</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl bg-[#0f1b3e]">
            <div className="h-36 bg-gradient-to-br from-orange-300 via-purple-400 to-blue-600" />
            <div className="bg-[#1a2455] p-4">
              <h3 className="font-display text-xl font-bold leading-tight text-white">
                Small Habits,
                <br />
                Big Changes
              </h3>
              <p className="mt-1 text-sm text-white/70">A simple guide to building a better you.</p>
              <p className="mt-3 flex items-center gap-2 text-xs font-bold text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] font-black text-black">
                  M
                </span>{" "}
                Medium · 6 min read
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: "⚡", title: "Curated for You", text: "Thought-provoking reads, handpicked from Medium." },
    { icon: "🧠", title: "Grow Your Mind", text: "Learn new ideas, build better habits." },
    { icon: "❤️", title: "A Healthier You", text: "Reduce mindless scrolling, boost your well-being." },
    { icon: "📊", title: "One Swipe at a Time", text: "Small reads. Big impact." },
  ];
  return (
    <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 rounded-[24px] bg-[#fff6e3] px-6 py-8 text-[#0f1b3e] shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:grid-cols-2 lg:mx-6 lg:grid-cols-4 xl:mx-auto">
      {items.map((it) => (
        <div key={it.title} className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffc94d]/35 text-xl">
            {it.icon}
          </span>
          <div>
            <h3 className="font-display text-base font-bold leading-tight">{it.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#2b3352]">{it.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
