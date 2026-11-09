import type { Article } from "./medium";

/**
 * Skim's own For You ranking — no Medium API, no account needed.
 * Uses topics the reader picked + local reading signals if present.
 */

export type Signals = {
  viewed: string[]; // article ids opened
  liked: string[];
  bookmarked: string[];
  dismissed: string[];
  authors: string[]; // authors the reader has engaged with
};

export function loadSignals(): Signals {
  try {
    const raw = localStorage.getItem("skim_signals");
    if (raw) {
      const p = JSON.parse(raw);
      return {
        viewed: Array.isArray(p.viewed) ? p.viewed : [],
        liked: Array.isArray(p.liked) ? p.liked : [],
        bookmarked: Array.isArray(p.bookmarked) ? p.bookmarked : [],
        dismissed: Array.isArray(p.dismissed) ? p.dismissed : [],
        authors: Array.isArray(p.authors) ? p.authors : [],
      };
    }
  } catch {}
  return { viewed: [], liked: [], bookmarked: [], dismissed: [], authors: [] };
}

export function saveSignal(partial: Partial<Signals>) {
  try {
    const cur = loadSignals();
    const next = { ...cur, ...partial };
    localStorage.setItem("skim_signals", JSON.stringify(next));
  } catch {}
}

export function recordViewed(articleId: string, author?: string) {
  try {
    const cur = loadSignals();
    const viewed = cur.viewed.includes(articleId) ? cur.viewed : [...cur.viewed, articleId];
    const authors = author && !cur.authors.includes(author) ? [...cur.authors, author] : cur.authors;
    localStorage.setItem("skim_signals", JSON.stringify({ ...cur, viewed, authors }));
  } catch {}
}

export function recordDismissed(articleId: string) {
  try {
    const cur = loadSignals();
    if (cur.dismissed.includes(articleId)) return;
    localStorage.setItem(
      "skim_signals",
      JSON.stringify({ ...cur, dismissed: [...cur.dismissed, articleId] })
    );
  } catch {}
}

export function undismiss(articleId: string) {
  try {
    const cur = loadSignals();
    localStorage.setItem(
      "skim_signals",
      JSON.stringify({ ...cur, dismissed: cur.dismissed.filter((id) => id !== articleId) })
    );
  } catch {}
}

function recencyScore(pubDate: string): number {
  const t = new Date(pubDate).getTime();
  if (isNaN(t)) return 0;
  const ageDays = (Date.now() - t) / 86400000;
  if (ageDays < 0) return 100;
  if (ageDays < 2) return 80;
  if (ageDays < 7) return 60;
  if (ageDays < 30) return 35;
  return 15;
}

export function rankArticles(articles: Article[], signals?: Signals): Article[] {
  if (!articles.length) return articles;
  const sig = signals || { viewed: [], liked: [], bookmarked: [], dismissed: [], authors: [] };
  const dismissedSet = new Set(sig.dismissed);
  const likedSet = new Set(sig.liked);
  const bmSet = new Set(sig.bookmarked);
  const viewedSet = new Set(sig.viewed);
  const authorBoost = new Set(sig.authors.map((a) => a.toLowerCase()));

  // Dismissed articles sink to bottom
  const scored = articles
    .map((a) => {
      let s = recencyScore(a.pubDate);
      if (authorBoost.has((a.author || "").toLowerCase())) s += 35;
      if (viewedSet.has(a.id)) s += 8;
      if (likedSet.has(a.id)) s += 40;
      if (bmSet.has(a.id)) s += 45;
      if (dismissedSet.has(a.id)) s -= 200;
      if (a.thumbnail) s += 6;
      // slight boost for longer snippets (more substantial reads)
      s += Math.min(5, (a.snippet?.length || 0) / 120);
      return { a, s };
    })
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a);

  // Diversity pass: limit consecutive same-author to 2
  const diversified: Article[] = [];
  const queue = [...scored];
  let lastAuthor = "";
  let run = 0;
  while (queue.length) {
    const idx = queue.findIndex((a) => a.author !== lastAuthor || run < 2);
    const pickIdx = idx === -1 ? 0 : idx;
    const [pick] = queue.splice(pickIdx, 1);
    if (pick.author === lastAuthor) run += 1;
    else {
      lastAuthor = pick.author;
      run = 1;
    }
    diversified.push(pick);
  }

  // Round-robin by tag so one topic doesn't dominate
  const byTag = new Map<string, Article[]>();
  for (const a of diversified) {
    const arr = byTag.get(a.tag) || [];
    arr.push(a);
    byTag.set(a.tag, arr);
  }
  const interleaved: Article[] = [];
  let moved = true;
  while (moved) {
    moved = false;
    for (const arr of byTag.values()) {
      const nxt = arr.shift();
      if (nxt) {
        interleaved.push(nxt);
        moved = true;
      }
    }
  }

  return interleaved;
}
