"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TOPICS } from "@/lib/topics";
import type { Article } from "@/lib/medium";

const BATCH = 6;

export function useFeed(enabled = true) {
  const [selected, setSelected] = useState<string[] | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const reqIdRef = useRef(0);
  const loadMoreInflightRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("topics");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setSelected(parsed);
        else setSelected(null);
      } else {
        // first visit: load the balanced defaults so the feed isn't empty
        setSelected([...DEFAULT_TOPICS]);
      }
    } catch {
      setSelected([...DEFAULT_TOPICS]);
    }
    setHydrated(true);
  }, []);

  const loadFeed = useCallback(async (tags: string[]) => {
    const myReq = ++reqIdRef.current;
    loadMoreInflightRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setLoadMoreError(null);
    setExhausted(false);
    try {
      const params = new URLSearchParams({ tags: tags.join(",") });
      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (myReq !== reqIdRef.current) return;
      if (!res.ok || data.error) {
        throw new Error(data.error || `Feed request failed (${res.status})`);
      }
      setArticles(data.articles || []);
      setVisibleCount(BATCH);
      if ((data.articles || []).length === 0) setExhausted(true);
    } catch (e) {
      if (myReq !== reqIdRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      const clean = msg.replace(/^Error:\s*/i, "");
      if (/429|rate limit|Just a moment/i.test(clean)) {
        setError("Medium is busy right now (rate limited). Wait a few seconds and hit Try again.");
      } else {
        setError(clean);
      }
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  }, []);

  // Fetch "more" of the same selected topics: re-poll the feeds and append only unseen articles.
  const loadMore = useCallback(async () => {
    if (!selected || selected.length === 0 || loadingMore || loading || loadMoreInflightRef.current) return;
    loadMoreInflightRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const params = new URLSearchParams({ tags: selected.join(",") });
      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || `Feed request failed (${res.status})`);
      }
      const incoming: Article[] = data.articles || [];
      setArticles((prev) => {
        const seen = new Set(prev.map((a) => a.id || a.link));
        const fresh = incoming.filter((a) => !seen.has(a.id || a.link));
        if (fresh.length === 0) {
          setExhausted(true);
          return prev;
        }
        const merged = [...prev, ...fresh];
        merged.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        // reveal the fresh batch right away
        setVisibleCount((c) => Math.min(c + fresh.length, merged.length));
        return merged;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoadMoreError(msg.replace(/^Error:\s*/i, ""));
      // don't mark exhausted on transient errors — allow retry
    } finally {
      loadMoreInflightRef.current = false;
      setLoadingMore(false);
    }
  }, [selected, loadingMore, loading]);

  useEffect(() => {
    if (!hydrated || !enabled) return;
    const empty = !selected || selected.length === 0;
    if (empty) {
      reqIdRef.current++;
      setArticles([]);
      setError(null);
      setLoadMoreError(null);
      setLoading(false);
      setLoadingMore(false);
      setExhausted(false);
      return;
    }
    // debounce rapid pill toggles so deselect-all doesn't hammer Medium (429s)
    const t = setTimeout(() => loadFeed(selected ?? []), 300);
    return () => clearTimeout(t);
  }, [selected, hydrated, enabled, loadFeed]);

  const saveTopics = useCallback((tags: string[]) => {
    setSelected((prev) => {
      if (tags.length) localStorage.setItem("topics", JSON.stringify(tags));
      else localStorage.removeItem("topics");
      // only auto-scroll when picking your first topic from empty
      if ((!prev || prev.length === 0) && tags.length > 0) {
        setTimeout(() => {
          feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
      return tags;
    });
  }, []);

  const hasMoreLocal = visibleCount < articles.length;
  const hasMore = hasMoreLocal || !exhausted;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (hasMoreLocal) {
          setVisibleCount((c) => Math.min(c + BATCH, articles.length));
        } else if (!exhausted) {
          // everything visible — try to fetch more of the selected topics
          void loadMore();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMoreLocal, articles.length, exhausted, loadMore]);

  return {
    selected,
    hydrated,
    articles,
    visibleCount,
    hasMore,
    hasMoreLocal,
    exhausted,
    loading,
    loadingMore,
    loadMoreError,
    error,
    feedRef,
    sentinelRef,
    saveTopics,
    loadFeed,
    loadMore,
  };
}
