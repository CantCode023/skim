import Parser from "rss-parser";
import type { Topic } from "./topics";

const FREEDIUM_HOST = "https://freedium-mirror.cfd";

export type Article = {
  id: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  thumbnail: string | null;
  snippet: string;
  categories: string[];
  tag: string;
};

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
    ],
  },
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractThumb(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export async function fetchTagFeed(tag: string): Promise<Article[]> {
  const url = `https://medium.com/feed/tag/${encodeURIComponent(tag)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DoomscrollMedium/1.0)" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed ${res.status} for ${tag}`);
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  const out: Article[] = [];
  for (const item of (feed.items || []) as any[]) {
    const link = (item.link || "").split("?")[0];
    if (!link) continue;
    const desc = item.description || item.contentEncoded || "";
    const thumb = extractThumb(desc) || extractThumb(item.contentEncoded || ""); const snippet = stripHtml(item.contentSnippet || desc).slice(0, 220); out.push({ id: item.guid || link, title: (item.title || "Untitled").trim(), link,
      author: (item.creator || item["dc:creator"] || "Unknown").trim(),
      pubDate: item.pubDate || new Date().toISOString(),
      thumbnail: thumb,
      snippet,
      categories: (item.categories || []).map(String),
      tag,
    });
  }
  return out;
}

export async function fetchUserFeed(handle: string): Promise<Article[]> {
  const clean = handle.replace(/^@/, "").trim();
  const url = `https://medium.com/feed/@${encodeURIComponent(clean)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DoomscrollMedium/1.0)" },
  });
  if (!res.ok) throw new Error(`User feed failed ${res.status} for @${clean}`);
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  const out: Article[] = [];
  for (const item of (feed.items || []) as any[]) {
    const link = (item.link || "").split("?")[0];
    if (!link) continue;
    const desc = item.description || item.contentEncoded || "";
    const thumb = extractThumb(desc) || extractThumb(item.contentEncoded || "");
    const snippet = stripHtml(item.contentSnippet || desc).slice(0, 220);
    out.push({
      id: item.guid || link,
      title: (item.title || "Untitled").trim(),
      link,
      author: (item.creator || item["dc:creator"] || clean).trim(),
      pubDate: item.pubDate || new Date().toISOString(),
      thumbnail: thumb,
      snippet,
      categories: (item.categories || []).map(String),
      tag: `@${clean}`,
    });
  }
  return out;
}

export async function fetchFeeds(tags: string[]): Promise<Article[]> {
  const results = await Promise.allSettled(tags.map(fetchTagFeed));
  const all: Article[] = [];
  let rejected = 0;
  let lastError: unknown = null;
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
    else {
      rejected++;
      lastError = r.reason;
    }
  }
  if (rejected === results.length && results.length > 0) {
    throw new Error(String((lastError as any)?.message || lastError || "RSS fetch failed"));
  }
  // dedupe by link/id
  const seen = new Set<string>();
  const deduped = all.filter((a) => {
    const key = a.id || a.link;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return deduped;
}

export { FREEDIUM_HOST };
