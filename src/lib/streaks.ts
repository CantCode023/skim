const KEY = "skim_streaks";

export type Streak = {
  lastReadDate: string | null; // YYYY-MM-DD (local)
  current: number;
  longest: number;
  totalActiveDays: number;
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadStreak(): Streak {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        lastReadDate: p.lastReadDate || null,
        current: p.current || 0,
        longest: p.longest || 0,
        totalActiveDays: p.totalActiveDays || 0,
      };
    }
  } catch {}
  return { lastReadDate: null, current: 0, longest: 0, totalActiveDays: 0 };
}

export function bumpStreak(): Streak {
  const today = todayKey();
  const cur = loadStreak();
  let next: Streak;
  if (cur.lastReadDate === today) {
    next = cur; // already counted today
  } else {
    const yesterday = todayKey(new Date(Date.now() - 86400000));
    const continues = cur.lastReadDate === yesterday;
    const current = continues ? cur.current + 1 : 1;
    next = {
      lastReadDate: today,
      current,
      longest: Math.max(cur.longest, current),
      totalActiveDays: cur.totalActiveDays + 1,
    };
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}
