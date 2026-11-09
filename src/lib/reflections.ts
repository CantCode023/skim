"use client";

export type Reflection = {
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  text: string;
  visibility: "private" | "public";
  createdAt: string;
  score?: number;
};

const KEY = "skim_reflections";

export function loadReflections(): Reflection[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setVisibility(articleId: string, visibility: "private" | "public") {
  try {
    const all = loadReflections().map((r) =>
      r.articleId === articleId ? { ...r, visibility } : r
    );
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function deleteReflection(articleId: string) {
  try {
    const all = loadReflections().filter((r) => r.articleId !== articleId);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function saveReflection(r: Omit<Reflection, "visibility" | "createdAt"> & { visibility?: "private" | "public" }): Reflection {
  const entry: Reflection = {
    ...r,
    visibility: r.visibility || "private",
    createdAt: new Date().toISOString(),
  };
  try {
    const all = loadReflections();
    const idx = all.findIndex((x) => x.articleId === entry.articleId);
    if (idx >= 0) all[idx] = entry;
    else all.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  return entry;
}
