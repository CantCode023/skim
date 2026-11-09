import type { Article } from "./medium";

const KEY = "skim_bookmarks";

export type BookmarkEntry = {
  savedAt: string;
  article: Article;
};

export function loadBookmarks(): BookmarkEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // Sanitize legacy/invalid entries (e.g. from Reader before fix) so cards never render "Invalid Date"
    return arr
      .filter((b: any) => b && b.article && (b.article.link || b.article.id) && b.article.title)
      .map((b: any) => {
        const article = b.article;
        const t = Date.parse(article.pubDate || "");
        const pubDate = isNaN(t) ? new Date().toISOString() : new Date(t).toISOString();
        return {
          ...b,
          article: {
            ...article,
            id: article.id || article.link,
            link: article.link || article.id,
            title: article.title || "Saved story",
            author: article.author || "Medium",
            pubDate,
            thumbnail: article.thumbnail ?? null,
            snippet: article.snippet || "",
            categories: Array.isArray(article.categories) ? article.categories : [],
            tag: article.tag || "saved",
          },
        };
      });
  } catch {
    return [];
  }
}

export function isBookmarked(articleId: string, link: string): boolean {
  return loadBookmarks().some((b) => b.article.id === articleId || b.article.link === link);
}

export function toggleBookmark(article: Article): boolean {
  const all = loadBookmarks();
  const idx = all.findIndex((b) => b.article.id === article.id || b.article.link === article.link);
  if (idx >= 0) {
    all.splice(idx, 1);
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
    return false; // now unbookmarked
  }
  all.unshift({ savedAt: new Date().toISOString(), article });
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  // also record signal for For You personalization
  try {
    const raw = localStorage.getItem("skim_signals");
    const sig = raw ? JSON.parse(raw) : { viewed: [], liked: [], bookmarked: [], dismissed: [], authors: [] };
    if (!sig.bookmarked?.includes(article.id)) {
      sig.bookmarked = [...(sig.bookmarked || []), article.id];
      if (article.author && !sig.authors?.includes(article.author)) {
        sig.authors = [...(sig.authors || []), article.author];
      }
      localStorage.setItem("skim_signals", JSON.stringify(sig));
    }
  } catch {}
  return true;
}

export function bookmarkCount(): number {
  return loadBookmarks().length;
}
