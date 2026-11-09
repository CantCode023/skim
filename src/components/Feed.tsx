"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Share, X } from "lucide-react";
import type { Article } from "@/lib/medium";
import { articleCache, firstWords } from "@/lib/article-cache";
import { toggleBookmark, isBookmarked } from "@/lib/bookmarks";
import ShareModal from "./ShareModal";

function prettyTag(tag: string): string {
  if (!tag) return "Medium";
  if (tag.startsWith("@")) return "Your post";
  return tag.replace(/-/g, " ");
}

function estReadMinutes(snippet: string, fallback = 5): number {
  const words = (snippet || "").split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.min(9, Math.round(words / 3) + 3 || fallback));
}

function FeedCard({
  article,
  onOpen,
  onBookmarkChange,
  onDismiss,
}: {
  article: Article;
  onOpen: () => void;
  onBookmarkChange?: () => void;
  onDismiss?: (article: Article) => void;
}) {
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(article.id, article.link));
  }, [article.id, article.link]);

  useEffect(() => {
    let cancelled = false;
    if (articleCache.has(article.link)) {
      const cached = articleCache.get(article.link);
      if (cached?.bodyHtml) setSummary(firstWords(cached.bodyHtml));
      else setSummary(article.snippet);
      return;
    }
    setLoadingSummary(true);
    fetch(`/api/article?url=${encodeURIComponent(article.link)}`)
      .then((r) => r.json())
      .then((d) => {
        articleCache.set(article.link, d);
        if (cancelled) return;
        if (d?.bodyHtml) setSummary(firstWords(d.bodyHtml));
        else setSummary(article.snippet);
      })
      .catch(() => {
        if (!cancelled) setSummary(article.snippet);
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [article.link, article.snippet]);

  const readDate = new Date(article.pubDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const readMin = estReadMinutes(article.snippet);
  const tagLabel = prettyTag(article.tag);

  const flipBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = toggleBookmark(article);
    setBookmarked(now);
    onBookmarkChange?.();
  };

  return (
    <>
    <article
      onClick={onOpen}
      className="group relative min-h-[72vh] w-full cursor-pointer snap-start snap-stop-always overflow-hidden rounded-2xl bg-[#0f1b3e] text-white shadow-[var(--shadow-md)] transition-transform duration-300 hover:-translate-y-1"
    >
      {article.thumbnail ? (
        <img
          src={article.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="skim-doodle absolute inset-0 bg-[#18275a]" />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.88] via-black/40 to-black/10" />

      {/* actions in the top-right corner */}
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <div className="group/btn relative">
          <button
            type="button"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={flipBookmark}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full backdrop-blur-md transition hover:scale-110 active:scale-90 ${bookmarked ? "animate-pop bg-[#ffc94d] text-[#0f1b3e]" : "bg-black/40 text-white hover:bg-black/65"}`}
          >
            {bookmarked ? <BookmarkCheck className="h-4 w-4" strokeWidth={2} /> : <Bookmark className="h-4 w-4" strokeWidth={2} />}
          </button>
          <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition group-hover/btn:opacity-100">
            {bookmarked ? "Remove bookmark" : "Bookmark"}
          </span>
        </div>
        <div className="group/btn relative">
          <button
            type="button"
            aria-label="Share"
            title="Share"
            onClick={(e) => {
              e.stopPropagation();
              setShowShare(true);
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:scale-110 hover:bg-black/70 active:scale-90"
          >
            <Share className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition group-hover/btn:opacity-100">
            Share
          </span>
        </div>
        <div className="group/btn relative">
          <button
            type="button"
            aria-label="Not interested"
            title="Not interested"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.(article);
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:scale-110 hover:bg-black/70 active:scale-90"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition group-hover/btn:opacity-100">
            Not interested
          </span>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[72vh] flex-col justify-end p-6 sm:p-8">
        <div className="w-full">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            {tagLabel} · {readMin} min read
          </p>
          <h2 className="mt-2 text-[32px] font-bold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-white/85">
            {article.snippet}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/75">
            <span>{article.author}</span>
            <span aria-hidden className="text-white/30">·</span>
            <span>{readDate}</span>
            <span aria-hidden className="text-white/30">·</span>
            <span>Medium</span>
          </div>

          {(summary || loadingSummary) && (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/45 p-4 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">Summary</p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-[1.65] text-white/90">
                {loadingSummary && !summary ? "Loading summary…" : summary || article.snippet}
              </p>
            </div>
          )}

          <div className="mt-4">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#ffc94d] px-6 py-3 text-sm font-bold text-[#0f1b3e] shadow-[0_8px_20px_rgba(255,201,77,0.45)] transition hover:scale-[1.03] active:scale-[0.98]"
            >
              Read now →
            </span>
          </div>
        </div>
      </div>
    </article>

      <ShareModal
        open={showShare}
        article={{ title: article.title, link: article.link, snippet: article.snippet, thumbnail: article.thumbnail, author: article.author }}
        onClose={() => setShowShare(false)}
      />
    </>
  );
}

export default function InfiniteFeed({
  articles,
  hasMore,
  exhausted,
  loadingMore,
  loadMoreError,
  sentinelRef,
  onOpen,
  onLoadMore,
  onDismiss,
  onBookmarkChange,
  hiddenIds,
  onUndoDismiss,
  title = "For You",
  tags = [],
}: {
  articles: Article[];
  hasMore: boolean;
  exhausted?: boolean;
  loadingMore?: boolean;
  loadMoreError?: string | null;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  onOpen: (url: string) => void;
  onLoadMore?: () => void;
  onDismiss?: (article: Article) => void;
  onBookmarkChange?: () => void;
  hiddenIds?: string[];
  onUndoDismiss?: (id: string) => void;
  title?: string;
  tags?: string[];
}) {
  const visibleArticles = hiddenIds?.length
    ? articles.filter((a) => !hiddenIds.includes(a.id) && !hiddenIds.includes(a.link))
    : articles;
  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {visibleArticles.map((a, i) => (
          <div
            key={a.id + i}
            className="animate-rise"
            style={{ animationDelay: `${Math.min(i, 5) * 90}ms` }}
          >
            <FeedCard article={a} onOpen={() => onOpen(a.link)} onDismiss={onDismiss} onBookmarkChange={onBookmarkChange} />
            <div className="mt-6 flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0f1b3e]/60">
              <span className="h-px flex-1 bg-[#0f1b3e]/15" />
              <span>↓ scroll to discover the next article ↓</span>
              <span className="h-px flex-1 bg-[#0f1b3e]/15" />
            </div>
          </div>
        ))}

        {hasMore && <div ref={sentinelRef} className="h-10" />}

        {loadingMore && (
          <div className="flex flex-col items-center gap-2 py-8 text-[#0f1b3e]/60">
            <div className="animate-pulse text-2xl">✦</div>
            <p className="font-display text-sm font-bold">Finding more reads from your topics…</p>
          </div>
        )}

        {loadMoreError && !loadingMore && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-semibold text-[#0f1b3e]/70">Couldn&apos;t load more — {loadMoreError}</p>
            {onLoadMore && (
              <button
                onClick={onLoadMore}
                className="font-display rounded-full bg-[#0f1b3e] px-5 py-2 text-sm font-bold text-[#ffc94d]"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {exhausted && !loadingMore && (
          <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-[#ffc94d]/60 bg-white/60 px-6 py-8 text-center">
            <p className="text-3xl">🌱</p>
            <p className="font-display text-lg font-bold text-[#0f1b3e]">You&apos;ve seen everything for now</p>
            <p className="max-w-sm text-sm text-[#2b3352]">
              Medium only returns the latest ~10 posts per topic. Pick more topics above to keep scrolling — new posts
              will appear here as they publish.
            </p>
            {hiddenIds && hiddenIds.length > 0 && onUndoDismiss && (
              <button
                onClick={() => hiddenIds.forEach((id) => onUndoDismiss(id))}
                className="mt-2 text-xs font-bold text-[#0f1b3e]/60 underline underline-offset-4"
              >
                Undo {hiddenIds.length} hidden {hiddenIds.length === 1 ? "article" : "articles"}
              </button>
            )}
          </div>
        )}

        {!hasMore && !exhausted && !loadingMore && articles.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="font-display text-sm font-bold text-[#0f1b3e]/50">› Swipe for more inspiration ‹</p>
          </div>
        )}
      </div>
    </div>
  );
}
