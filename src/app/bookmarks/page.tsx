"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import InfiniteFeed from "@/components/Feed";
import Reader from "@/components/Reader";
import GoToTop from "@/components/GoToTop";
import SkimLogo from "@/components/SkimLogo";
import { loadBookmarks, type BookmarkEntry } from "@/lib/bookmarks";

export default function BookmarksPage() {
  const [entries, setEntries] = useState<BookmarkEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEntries(loadBookmarks());
    setHydrated(true);
  }, []);

  const articles = useMemo(() => entries.map((e) => e.article), [entries]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#0f1b3e]">
        <SkimLogo compact />
      </div>
    );
  }

  return (
    <div className="skim-doodle min-h-dvh bg-[#0f1b3e]">
      <div className="sticky top-0 z-40 bg-[#0f1b3e]/95 backdrop-blur-md">
        <Nav />
      </div>

      <section className="mx-auto mt-2 max-w-6xl px-4 pb-6 pt-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#ffc94d] via-[#ffc94d] to-[#ffb020] px-6 py-7 text-[#0f1b3e] shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:px-9 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f1b3e]/60">Saved for later</p>
          <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Bookmarks</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#2b3352] sm:text-base">
            Your private shelf — saved on this device only. Tap any card to read it, or tap the bookmark to remove it.
          </p>
          <span className="mt-3 inline-block text-xs font-bold text-[#0f1b3e]/60">
            {articles.length} {articles.length === 1 ? "saved article" : "saved articles"}
          </span>
        </div>
      </section>

      <section className="relative mt-6 rounded-t-[32px] bg-[#fff6e3] px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto mt-2 max-w-5xl">
          {articles.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-[#ffc94d]/60 bg-white/60 p-8 text-center">
              <p className="text-4xl">🔖</p>
              <p className="font-display mt-2 text-xl font-bold text-[#0f1b3e]">Nothing saved yet</p>
              <p className="mt-1 text-sm text-[#2b3352]">
                Tap the bookmark icon at the top-right of any story to save it here.
              </p>
            </div>
          )}

          {articles.length > 0 && (
            <InfiniteFeed
              articles={articles}
              hasMore={false}
              exhausted
              loadingMore={false}
              loadMoreError={null}
              sentinelRef={sentinelRef}
              onOpen={setReaderUrl}
              onBookmarkChange={() => setEntries(loadBookmarks())}
              title="Your shelf"
              tags={[]}
            />
          )}
        </div>
      </section>

      <footer className="bg-[#fff6e3] pb-10 pt-2 text-center text-sm text-[#0f1b3e]/50">
        Skim · Swipe. Read. Grow. · Kept on this device.
      </footer>

      {readerUrl && (
        <Reader
          url={readerUrl}
          onClose={() => {
            setReaderUrl(null);
            setEntries(loadBookmarks());
          }}
        />
      )}
      <GoToTop />
    </div>
  );
}
