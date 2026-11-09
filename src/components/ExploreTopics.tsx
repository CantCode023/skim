"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TOPICS } from "@/lib/topics";

export default function ExploreTopics({
  selected,
  onChange,
  loading,
  count,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
  loading: boolean;
  count: number;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const dragRef = useRef<{ dragging: boolean; startX: number; startScroll: number; moved: number }>({
    dragging: false,
    startX: 0,
    startScroll: 0,
    moved: 0,
  });

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const toggle = (slug: string) => {
    if (dragRef.current.moved > 6) return;
    const next = selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug];
    onChange(next);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { dragging: true, startX: e.clientX, startScroll: el.scrollLeft, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.moved = Math.max(dragRef.current.moved, Math.abs(dx));
    if (Math.abs(dx) > 3) el.scrollLeft = dragRef.current.startScroll - dx;
  };
  const onPointerUp = () => {
    dragRef.current.dragging = false;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0f1b3e]">Topics</h2>
          <p className="mt-1 text-sm text-[#2b3352]/70">Pick a few — your feed remixes instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#2b3352]/60">
            {loading ? "Loading…" : `${count} stories ready`}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              aria-label="Scroll topics left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0f1b3e]/15 bg-white text-sm text-[#0f1b3e] transition hover:border-[#0f1b3e]/30 disabled:opacity-30"
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              aria-label="Scroll topics right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0f1b3e]/15 bg-white text-sm text-[#0f1b3e] transition hover:border-[#0f1b3e]/30 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        {canLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#fff6e3] to-transparent" />
        )}
        {canRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#fff6e3] to-transparent" />
        )}
        <div
          ref={scrollRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="no-scrollbar flex cursor-grab select-none gap-2 overflow-x-auto overflow-y-hidden px-0.5 py-1 active:cursor-grabbing"
          style={{ touchAction: "pan-x pan-y" }}
        >
          {TOPICS.map((t) => {
            const active = selected.includes(t.slug);
            return (
              <button
                key={t.slug}
                onClick={() => toggle(t.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  active
                    ? "bg-[#0f1b3e] text-[#ffc94d]"
                    : "border border-[#0f1b3e]/15 bg-white text-[#0f1b3e]/70 hover:border-[#0f1b3e]/30 hover:text-[#0f1b3e]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
