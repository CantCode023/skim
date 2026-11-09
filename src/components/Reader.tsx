"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Sparkles } from "lucide-react";
import SkimLogo from "./SkimLogo";
import QuizModal from "./QuizModal";
import { articleCache } from "@/lib/article-cache";
import { recordViewed } from "@/lib/personalize";
import { bumpStreak } from "@/lib/streaks";
import { toggleBookmark, isBookmarked } from "@/lib/bookmarks";
import type { Article } from "@/lib/medium";

export default function Reader({ url, onClose }: { url: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Bookmark lookup: feed cards cache the full Article; fall back to entry from cache if present
  useEffect(() => {
    setBookmarked(isBookmarked(url, url));
  }, [url]);

  const flipBookmark = () => {
    const cached: any = articleCache.get(url);
    const isFullArticle = cached && typeof cached.link === "string" && typeof cached.id === "string";
    const article: Article = isFullArticle
      ? cached
      : {
          id: url,
          title: data?.title || cached?.title || "Saved story",
          link: url,
          author: data?.author || cached?.author || "Medium",
          pubDate: (() => {
            const t = Date.parse(data?.date || "") || Date.parse(cached?.date || "");
            return isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
          })(),
          thumbnail: null,
          snippet: data?.subtitle || cached?.subtitle || "",
          categories: [],
          tag: "saved",
        };
    const now = toggleBookmark(article);
    setBookmarked(now);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setData(null);
    const cached = articleCache.get(url);
    const fetcher = cached
      ? Promise.resolve(cached)
      : fetch(`/api/article?url=${encodeURIComponent(url)}`)
          .then(async (r) => {
            const text = await r.text().catch(() => "");
            if (!r.ok) {
              try {
                const d = JSON.parse(text);
                throw new Error(d.error || `Server error (${r.status})`);
              } catch {
                throw new Error(`Server error (${r.status})`);
              }
            }
            if (!text.trim()) throw new Error("Server returned an empty response");
            return JSON.parse(text);
          })
          .then((d) => {
            articleCache.set(url, d);
            return d;
          });
    fetcher
      .then((d) => {
        if (cancelled) return;
        if (d.error) setErr(d.error);
        else {
          setData(d);
          // Phase C: learn from what you actually read
          try {
            recordViewed(url, d.author || undefined);
            bumpStreak();
          } catch {}
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="skim-doodle fixed inset-0 z-50 overflow-y-auto bg-[#0f1b3e]">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0f1b3e]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-full bg-[#ffc94d] px-4 py-2 text-sm font-bold text-[#0f1b3e]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back
          </button>
          <SkimLogo compact />
          <div className="flex items-center gap-2">
            <button
              onClick={flipBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                bookmarked
                  ? "animate-pop border-[#ffc94d] bg-[#ffc94d] text-[#0f1b3e]"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {bookmarked ? <BookmarkCheck className="h-4 w-4" strokeWidth={2} /> : <Bookmark className="h-4 w-4" strokeWidth={2} />}
            </button>
            {data?.freediumUrl ? (
              <a
                href={data.freediumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-[#fff6e3]/80 hover:bg-white/10"
              >
                Original
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
            ) : (
              <span className="w-9" />
            )}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
        <div className="animate-slideup overflow-hidden rounded-[28px] bg-[#fff6e3] px-5 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:px-10 sm:py-10">
          {loading && (
            <div className="py-20 text-center text-[#2b3352]">
              <div className="animate-pulse text-3xl">✦</div>
              <p className="mt-2 font-bold">Opening your read…</p>
            </div>
          )}
          {err && (
            <div className="py-20 text-center text-[#0f1b3e]">
              <p className="font-display text-lg font-bold">That page drifted away</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#2b3352]">{err}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-full bg-[#0f1b3e] px-6 py-3 text-sm font-bold text-[#ffc94d]"
              >
                Try again
              </button>
            </div>
          )}
          {data && (
            <>
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-sm font-bold text-white">
                  M
                </span>
                <span className="text-base font-bold">Medium</span>
                <span className="text-xs font-semibold text-[#2b3352]">via Freedium</span>
              </div>

              <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-[#0f1b3e] sm:text-4xl">
                {data.title}
              </h1>
              {data.subtitle && <p className="mt-3 text-lg leading-relaxed text-[#2b3352]">{data.subtitle}</p>}

              <div className="mt-5 flex items-center gap-3 border-y border-black/10 py-4">
                {data.authorAvatar && (
                  <img
                    src={data.authorAvatar}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-[#ffc94d]"
                  />
                )}
                <div>
                  <p className="text-sm font-bold text-[#0f1b3e]">{data.author || "Medium author"}</p>
                  <p className="text-xs font-medium text-[#2b3352]">
                    {[data.date, data.readTime].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              <article
                className="skim-prose prose prose-zinc mt-6 max-w-none prose-headings:font-display prose-img:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
              />

              <div className="mt-10 rounded-2xl bg-[#ffc94d] p-5 text-center shadow-[0_12px_32px_rgba(255,201,77,0.35)]">
                <p className="text-lg font-bold text-[#0f1b3e]">Think you got it?</p>
                <p className="mt-0.5 text-sm text-[#2b3352]">3 quick questions + your own takeaway. New quiz every time.</p>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0f1b3e] px-6 py-3 text-sm font-bold text-[#ffc94d]"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                  Test yourself
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-[#0f1b3e] p-5 text-center">
                <p className="text-sm font-bold text-[#fff6e3]">Enjoyed this? Swipe for the next one.</p>
                <p className="mt-1 text-sm text-[#fff6e3]/70">Skim. Read. Grow.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <QuizModal
        open={showQuiz && !!data}
        articleUrl={url}
        articleTitle={data?.title || ""}
        bodyHtml={data?.bodyHtml}
        onClose={() => setShowQuiz(false)}
      />
    </div>
  );
}
