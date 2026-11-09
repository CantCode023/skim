export const articleCache = new Map<string, any>();

export function firstWords(html: string, n = 100): string {
  if (typeof document === "undefined") return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean);
  if (words.length <= n) return text;
  return words.slice(0, n).join(" ") + "…";
}
