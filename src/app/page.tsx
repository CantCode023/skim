"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TOPICS, DEFAULT_TOPICS } from "@/lib/topics";
import { rankArticles, loadSignals, recordDismissed, undismiss } from "@/lib/personalize";
import { useFeed } from "@/hooks/useFeed";
import Nav from "@/components/Nav";
import ExploreTopics from "@/components/ExploreTopics";
import InfiniteFeed from "@/components/Feed";
import Reader from "@/components/Reader";
import GoToTop from "@/components/GoToTop";
import SkimLogo from "@/components/SkimLogo";

export default function Home() {
  const router = useRouter();
  const feed = useFeed();
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const deep = params.get("article");
      if (deep) {
        try {
          localStorage.setItem("skim_visited", "1");
        } catch {}
        setReaderUrl(decodeURIComponent(deep));
        return;
      }
      const visited = localStorage.getItem("skim_visited");
      if (!visited) router.replace("/welcome");
    } catch {}
  }, [router]);

  useEffect(() => {
    setHiddenIds(loadSignals().dismissed);
  }, [feed.hydrated]);

  const signals = useMemo(() => loadSignals(), [feed.articles.length, hiddenIds.length]);
  const ranked = useMemo(() => rankArticles(feed.articles, signals), [feed.articles, signals]);
  const visible = useMemo(() => ranked.slice(0, feed.visibleCount), [ranked, feed.visibleCount]);
  const selectedLabels = useMemo(
    () =>
      (feed.selected ?? [])
        .map((slug) => TOPICS.find((t) => t.slug === slug)?.label)
        .filter((x): x is string => !!x),
    [feed.selected]
  );

  if (!feed.hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0f1b3e]">
        <SkimLogo compact />
      </div>
    );
  }

  const selected = feed.selected;

  return (
    <div className="skim-doodle min-h-dvh bg-[#0f1b3e]">
      <div className="sticky top-0 z-40 bg-[#0f1b3e]">
        <Nav />
      </div>

      <CollapsibleHero onStart={() => feed.feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      <section
        ref={feed.feedRef}
        className="relative -mt-6 rounded-t-[32px] bg-[#fff6e3] px-4 pb-16 pt-8 sm:px-6"
      >
        <div className="snap-start">
          <ExploreTopics
            selected={selected ?? DEFAULT_TOPICS}
            onChange={feed.saveTopics}
            loading={feed.loading}
            count={feed.articles.length}
          />
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          {feed.loading && (
            <div className="flex flex-col items-center gap-3 py-20 text-[#0f1b3e]/60">
              <div className="animate-pulse text-4xl">✦</div>
              <p className="font-display font-bold">Fetching inspiring reads…</p>
            </div>
          )}
          {feed.error && (
            <div className="rounded-3xl bg-[#0f1b3e] p-6 text-center">
              <p className="font-display text-lg font-bold text-[#fff6e3]">Oh no, we lost the trail</p>
              <p className="mt-1 text-sm text-[#fff6e3]/70">{feed.error}</p>
              <button
                onClick={() => selected && feed.loadFeed(selected)}
                className="mt-4 rounded-full bg-[#ffc94d] px-5 py-2 text-sm font-bold text-[#0f1b3e]"
              >
                Try again
              </button>
            </div>
          )}
          {!feed.loading && !feed.error && (!selected || selected.length === 0) && (
            <div className="rounded-3xl border-2 border-dashed border-[#ffc94d]/60 bg-white/60 p-8 text-center">
              <p className="text-4xl">📚</p>
              <p className="font-display mt-2 text-xl font-bold text-[#0f1b3e]">Pick your topics to start</p>
              <p className="mt-1 text-sm text-[#2b3352]">Tap some topics above, then hit Start Skimming.</p>
            </div>
          )}
          {!feed.loading && !feed.error && selected && selected.length > 0 && feed.articles.length === 0 && (
            <div className="py-16 text-center text-[#0f1b3e]/60">No articles yet — try other topics ✨</div>
          )}

          {feed.articles.length > 0 && (
            <InfiniteFeed
              articles={visible}
              hasMore={feed.hasMore}
              exhausted={feed.exhausted}
              loadingMore={feed.loadingMore}
              loadMoreError={feed.loadMoreError}
              sentinelRef={feed.sentinelRef}
              onOpen={setReaderUrl}
              onLoadMore={() => void feed.loadMore()}
              onDismiss={(a) => {
                recordDismissed(a.id);
                setHiddenIds(loadSignals().dismissed);
              }}
              hiddenIds={hiddenIds}
              onUndoDismiss={(id) => {
                undismiss(id);
                setHiddenIds(loadSignals().dismissed);
              }}
              title="Today's Skim"
              tags={selectedLabels}
            />
          )}
        </div>
      </section>

      <footer className="bg-[#fff6e3] pb-10 pt-2 text-center text-sm text-[#0f1b3e]/50">
        Skim · Swipe. Read. Grow. · Endless Medium reads, just for you.
      </footer>

      {readerUrl && <Reader url={readerUrl} onClose={() => setReaderUrl(null)} />}
      <GoToTop />
    </div>
  );
}

function CollapsibleHero({ onStart }: { onStart: () => void }) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = heroRef.current;
        const scrollY = window.scrollY;
        const heroH = el?.offsetHeight || 420;
        const p = Math.min(1, Math.max(0, scrollY / (heroH * 0.9)));
        setProgress((prev) => (Math.abs(prev - p) < 0.005 ? prev : p));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const hidden = progress >= 1;
  const translateY = -(progress * 140);
  const opacity = 1 - Math.min(1, progress * 1.15);
  const scale = 1 - progress * 0.04;

  return (
    <div
      ref={heroRef}
      className="skim-doodle relative z-0 snap-start overflow-hidden bg-[#0f1b3e]"
    >
      <div
        aria-hidden={hidden}
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          transformOrigin: "top center",
          pointerEvents: hidden ? "none" : "auto",
          visibility: hidden ? "hidden" : "visible",
          willChange: "transform, opacity",
        }}
        className="relative flex min-h-[calc(100dvh-68px)] flex-col px-4 pb-24 pt-10 sm:px-6 sm:pt-14"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center gap-16 lg:grid-cols-[1.1fr_1fr] lg:grid">
          {/* Left — copy + CTA */}
          <div>
            <h1 className="text-6xl font-bold leading-[0.98] tracking-tight text-white sm:text-7xl">
              Read something
              <br />
              that sticks.
            </h1>
            <p className="mt-5 text-base text-white/65">
              Stories from Medium. Skim fast, remember more.
            </p>
            <div className="mt-8">
              <button
                onClick={onStart}
                className="rounded-full bg-[#ffc94d] px-7 py-3.5 text-sm font-bold text-[#0f1b3e] shadow-[0_12px_32px_rgba(255,201,77,0.35)] transition hover:scale-[1.02] active:scale-[0.99]"
              >
                Start reading
              </button>
            </div>
          </div>

          {/* Right — mascot + story (your image) */}
          <figure className="mx-auto w-full max-w-[720px]" aria-hidden="true">
            <img src="/hero-blob.png" alt="Skim mascot reading beside a Medium story" className="animate-floaty w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]" />
          </figure>
        </div>
      </div>

      {/* Static wave — plain shape, no parallax, no fade */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-[#fff6e3] sm:h-24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,64 C120,32 240,32 360,56 C480,80 600,80 720,60 C840,40 960,32 1080,48 C1200,64 1320,48 1440,56 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}
