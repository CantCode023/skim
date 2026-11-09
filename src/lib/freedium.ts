import * as cheerio from "cheerio";

const FREEDIUM_HOST = "https://freedium-mirror.cfd";

export type ParsedArticle = {
  title: string;
  subtitle: string;
  author: string;
  authorAvatar: string | null;
  date: string;
  readTime: string;
  bodyHtml: string;
  freediumUrl: string;
  originalUrl: string;
};

function absolutize(html: string): string {
  // rewrite relative src/href to freedium host
  return html
    .replace(/(src|href)=["']\/(?!\/)/g, `$1="${FREEDIUM_HOST}/`)
    .replace(/srcset=["']\/(?!\/)/g, `srcset="${FREEDIUM_HOST}/`);
}

export async function parseArticle(mediumUrl: string): Promise<ParsedArticle> {
  const freediumUrl = `${FREEDIUM_HOST}/${mediumUrl}`;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(freediumUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Freedium timed out");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`Freedium fetch failed ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // header info lives near h1
  const h1 = $("h1").first();
  const title = h1.text().trim() || $("title").text().replace(/\s*-\s*Freedium\s*$/i, "").trim();

  // date: first p before h1
  let date = "";
  const prevP = h1.prev("p");
  if (prevP.length) date = prevP.text().trim();

  // subtitle: next p after h1 (if not author row)
  let subtitle = "";
  const nextP = h1.next("p");
  if (nextP.length) subtitle = nextP.text().trim();

  // author
  let author = "";
  let authorAvatar: string | null = null;
  let readTime = "";
  $("p.font-semibold, p.font-medium").each((_, el) => {
    const t = $(el).text().trim();
    if (/^By /i.test(t)) author = t.replace(/^By /i, "").trim();
  });
  // fallback: search text "By "
  if (!author) {
    const m = html.match(/By ([A-Za-z][A-Za-z .'-]{1,60})<\/p>/);
    if (m) author = m[1].trim();
  }
  $("img").each((_, el) => {
    const cls = $(el).attr("class") || "";
    if (/rounded-full/.test(cls) && !authorAvatar) {
      authorAvatar = $(el).attr("src") || null;
    }
  });
  const rtMatch = html.match(/(\d+\s*min\s*read)/i);
  if (rtMatch) readTime = rtMatch[1];

  // body
  const prose = $(".prose").first();
  // remove copy buttons
  prose.find("button.code-copy-btn").remove();
  // remove the "Show all sections" button area? keep.

  let bodyHtml = prose.html() || "";
  bodyHtml = absolutize(bodyHtml);

  // lightweight sanitize (no jsdom — the old DOMPurify dependency is a known serverless crash source)
  const clean = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");

  if (authorAvatar && (authorAvatar as string).startsWith("/")) {
    authorAvatar = `${FREEDIUM_HOST}${authorAvatar}`;
  }

  return {
    title,
    subtitle,
    author,
    authorAvatar,
    date,
    readTime,
    bodyHtml: clean,
    freediumUrl,
    originalUrl: mediumUrl,
  };
}

export { FREEDIUM_HOST };
