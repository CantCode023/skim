"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Clock, Eye, Flame, Lock, Sparkles, Star, Trash2 } from "lucide-react";
import { loadReflections, setVisibility, deleteReflection, type Reflection } from "@/lib/reflections";
import { loadBookmarks } from "@/lib/bookmarks";
import { loadSignals } from "@/lib/personalize";
import { loadStreak } from "@/lib/streaks";
import Nav from "@/components/Nav";
import Reader from "@/components/Reader";
import InfiniteFeed from "@/components/Feed";
import GoToTop from "@/components/GoToTop";
import SkimLogo from "@/components/SkimLogo";

export default function ProfilePage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());
  const [signals, setSignals] = useState(() => loadSignals());
  const [streakInfo, setStreakInfo] = useState(() => loadStreak());
  const [hydrated, setHydrated] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Disable global TikTok-style snap on Profile (feed cards shouldn't snap here)
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.scrollSnapType;
    el.style.scrollSnapType = "none";
    window.scrollTo(0, 0);
    return () => {
      el.style.scrollSnapType = prev;
    };
  }, []);

  useEffect(() => {
    setReflections(loadReflections());
    setBookmarks(loadBookmarks());
    setSignals(loadSignals());
    setStreakInfo(loadStreak());
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    const read = signals.viewed.length;
    const quizzed = reflections.length;
    const scores = reflections.map((r) => r.score).filter((s): s is number => typeof s === "number");
    const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
    const authors = new Set<string>([...signals.authors, ...reflections.map((r) => "")].filter(Boolean)).size;
    const topics = new Set(bookmarks.map((b) => b.article.tag)).size;
    return { read, quizzed, avg, authors, topics, bookmarked: bookmarks.length };
  }, [signals, reflections, bookmarks]);

  const flipVis = (id: string) => {
    const cur = reflections.find((r) => r.articleId === id);
    if (!cur) return;
    setVisibility(id, cur.visibility === "private" ? "public" : "private");
    setReflections(loadReflections());
  };

  const remove = (id: string) => {
    deleteReflection(id);
    setReflections(loadReflections());
  };

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0f1b3e]">
        <SkimLogo compact />
      </div>
    );
  }

  return (
    <div className="skim-doodle min-h-dvh bg-[#0f1b3e]">
      <div className="sticky top-0 z-40 bg-[#0f1b3e]">
        <Nav />
      </div>

      {/* header — yellow, bento stats, mascot */}
      <section className="mx-auto mt-2 max-w-6xl px-4 pb-6 pt-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#ffc94d] via-[#ffc94d] to-[#ffb020] px-6 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:px-9 sm:py-9">
          {/* confetti dots */}

          <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0f1b3e]/60">
                <span className="h-2 w-2 rounded-full bg-[#0f1b3e]" aria-hidden="true" />
                Your reading life
              </p>
              <h1 className="mt-1 text-5xl font-bold tracking-tight text-[#0f1b3e] sm:text-6xl">
                Profile
                <span className="ml-3 inline-block animate-floaty align-top text-2xl text-[#0f1b3e]">✦</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#2b3352]">
                Everything you saved, read, and concluded — kept on this device, private by default.
              </p>

              {/* streak banner */}
              <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-[#0f1b3e] px-4 py-3 shadow-lg">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffc94d] text-[#0f1b3e]">
                  <Flame className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-black text-white">
                    {streakInfo.current === 0 ? "Start your streak" : `${streakInfo.current} day${streakInfo.current === 1 ? "" : "s"} in a row`}
                  </p>
                  <p className="text-xs font-semibold text-white/60">
                    {streakInfo.current === 0
                      ? "Open a story to light the flame"
                      : streakInfo.current >= 3
                      ? "Keep it going — momentum is a superpower"
                      : streakInfo.current === 1
                      ? "Nice start. Come back tomorrow."
                      : "Two days! One more to make it a habit."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/50 px-3 py-1.5 text-xs font-bold text-[#0f1b3e]">Read</span>
                <span className="rounded-full bg-white/50 px-3 py-1.5 text-xs font-bold text-[#0f1b3e]">Quiz</span>
                <span className="rounded-full bg-white/50 px-3 py-1.5 text-xs font-bold text-[#0f1b3e]">Reflect</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Reading stats">
              <Stat label="Articles read" value={String(stats.read)} icon={<Eye className="h-5 w-5" strokeWidth={2} />} tilt="-rotate-1" featured />
              <Stat label="Quizzes" value={String(stats.quizzed)} icon={<Sparkles className="h-5 w-5" strokeWidth={2} />} tilt="rotate-1" />
              <Stat label="Avg score" value={stats.avg !== null ? `${stats.avg}/3` : "—"} icon={<Star className="h-5 w-5" strokeWidth={2} />} tilt="-rotate-1" />
              <Stat label="Bookmarks" value={String(stats.bookmarked)} icon={<Bookmark className="h-5 w-5" strokeWidth={2} />} tilt="rotate-1" />
              <Stat label="Streak" value={String(streakInfo.current)} icon={<Flame className="h-5 w-5" strokeWidth={2} />} tilt="-rotate-1" />
              <Stat label="Longest" value={String(streakInfo.longest)} icon={<Flame className="h-5 w-5" strokeWidth={2} />} tilt="rotate-1" />
            </div>
          </div>
        </div>
      </section>

      {/* reflections */}
      <section className="relative mt-6 rounded-t-[32px] bg-[#fff6e3] px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#0f1b3e] sm:text-3xl">Your conclusions</h2>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f1b3e]/50">
              {reflections.length} saved
            </span>
          </div>

          {reflections.length === 0 && (
            <div className="mt-6 rounded-3xl border-2 border-dashed border-[#ffc94d]/60 bg-white/60 p-8 text-center">
              <p className="text-xl font-bold text-[#0f1b3e]">No conclusions yet</p>
              <p className="mt-1 text-sm text-[#2b3352]">
                Finish a story, tap <strong>Test yourself</strong>, and write your takeaway. It&apos;ll live here.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            {reflections.map((r) => (
              <article key={r.articleId} className="animate-rise rounded-3xl border border-black/5 bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#0f1b3e]">{r.articleTitle}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0f1b3e]/55">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {typeof r.score === "number" && <span>· Quiz {r.score}/3</span>}
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          r.visibility === "public"
                            ? "bg-[#0f1b3e] text-[#ffc94d]"
                            : "bg-black/5 text-[#0f1b3e]/60"
                        }`}
                      >
                        {r.visibility === "public" ? "Public" : "Private"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => flipVis(r.articleId)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#0f1b3e] transition hover:bg-[#ffc94d]"
                      title={r.visibility === "private" ? "Make public" : "Make private"}
                      aria-label="Toggle visibility"
                    >
                      <Lock className="h-4 w-4" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => remove(r.articleId)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-red-600 transition hover:bg-red-50"
                      title="Delete"
                      aria-label="Delete conclusion"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.7] text-[#2b3352]">{r.text}</p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setReaderUrl(r.articleUrl)}
                    className="rounded-full bg-[#0f1b3e] px-4 py-2 text-xs font-bold text-[#ffc94d]"
                  >
                    Re-read →
                  </button>
                  <button
                    onClick={() => flipVis(r.articleId)}
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold text-[#0f1b3e] hover:bg-black/5"
                  >
                    {r.visibility === "private" ? "Make public" : "Make private"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* bookmarks preview */}
          <h2 className="mb-6 mt-12 text-2xl font-bold text-[#0f1b3e] sm:text-3xl">Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p className="mt-3 text-sm text-[#2b3352]">
              Nothing saved yet. Tap the bookmark icon on any story to keep it here.
            </p>
          ) : (
            <InfiniteFeed
              articles={bookmarks.map((b) => b.article)}
              hasMore={false}
              exhausted
              loadingMore={false}
              loadMoreError={null}
              sentinelRef={sentinelRef}
              onOpen={setReaderUrl}
              onBookmarkChange={() => {
                setBookmarks(loadBookmarks());
                setSignals(loadSignals());
              }}
              title="Your shelf"
              tags={[]}
            />
          )}

          <p className="mt-8 flex items-center gap-2 text-xs text-[#0f1b3e]/50">
            <Eye className="h-4 w-4" />
            Private means only visible on this device. Public is ready for the future profile sharing layer.
          </p>
        </div>
      </section>

      <footer className="bg-[#fff6e3] pb-12 pt-2 text-center text-sm text-[#0f1b3e]/50">
        Skim · Swipe. Read. Grow. · Kept on this device.
      </footer>

      {readerUrl && (
        <Reader
          url={readerUrl}
          onClose={() => {
            setReaderUrl(null);
            // Reader may have bookmarked — refresh shelf + stats instantly
            setBookmarks(loadBookmarks());
            setSignals(loadSignals());
            setReflections(loadReflections());
          }}
        />
      )}
      <GoToTop />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tilt = "",
  featured = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tilt?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`group rounded-2xl p-4 transition-transform duration-300 hover:scale-105 hover:rotate-0 ${tilt} ${
        featured
          ? "bg-[#fff6e3] text-[#0f1b3e] shadow-[0_0_36px_rgba(255,201,77,0.55),0_12px_30px_rgba(0,0,0,0.15)] ring-2 ring-white/60"
          : "bg-white/60 text-[#0f1b3e] ring-1 ring-black/5 hover:bg-white/80"
      }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${featured ? "bg-[#0f1b3e] text-[#ffc94d]" : "bg-[#0f1b3e]/10 text-[#b7791f]"}`}>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0f1b3e]/55">{label}</p>
    </div>
  );
}
