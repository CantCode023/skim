"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import SkimLogo from "./SkimLogo";
import { loadStreak } from "@/lib/streaks";

export default function Nav() {
  const pathname = usePathname();
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setStreak(loadStreak().current);
    const onFocus = () => {
      setStreak(loadStreak().current);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [pathname]);
  const links = [
    { href: "/", label: "Home" },
    { href: "/bookmarks", label: "Bookmarks" },
    { href: "/profile", label: "Profile" },
    { href: "/welcome", label: "About" },
  ];

  return (
    <header className="relative z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Skim home"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <SkimLogo compact />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          {links.map((l) => {
            const active = l.href === pathname;
            return (
              <Link
                key={l.label}
                href={l.href}
                className={
                  active
                    ? "text-[#fff6e3]"
                    : "text-[#fff6e3]/60 transition-colors hover:text-[#fff6e3]"
                }
              >
                {l.label}
                {active && <span className="mt-1 block h-[2px] w-full rounded bg-[#ffc94d]" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {streak > 0 && (
            <Link
              href="/profile"
              className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-[#ffc94d]"
              title={`${streak} day streak`}
            >
              <Flame className="h-4 w-4" strokeWidth={2} />
              {streak}
            </Link>
          )}
          <Link
            href={pathname === "/profile" ? "/" : "/profile"}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[#fff6e3]/80 md:hidden"
          >
            {pathname === "/profile" ? "Home" : "Profile"}
          </Link>
          <Link
            href="/profile"
            className="btn-primary hidden sm:inline-flex"
          >
            Your Profile
          </Link>
        </div>
      </div>
    </header>
  );
}
