"use client";

import { useState } from "react";
import {
  AtSign,
  Code2,
  Globe,
  Link2,
  Mail,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";

export type ShareArticle = {
  title: string;
  link: string;
  snippet?: string;
  thumbnail?: string | null;
  author?: string;
};

export default function ShareModal({
  open,
  article,
  onClose,
}: {
  open: boolean;
  article: ShareArticle | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"share" | "embed">("share");
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  if (!open || !article) return null;

  const skimUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?article=${encodeURIComponent(article.link)}`
      : `/?article=${encodeURIComponent(article.link)}`;
  const text = `${article.title} — via Skim`;
  const embedCode = `<iframe src="${skimUrl}" width="100%" height="300" style="border:0" loading="lazy" allowfullscreen></iframe>\n<!-- via Skim -->`;

  const copy = async (kind: "link" | "embed", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(ta);
    }
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  };

  const shareNative = async () => {
    if (typeof navigator === "undefined") return;
    const nav: any = navigator as any;
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: article.title, text, url: skimUrl });
      } catch {}
    } else {
      copy("link", skimUrl);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slideup flex max-h-[92dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[28px] bg-[#fff6e3] shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:rounded-[28px]"
      >
        {/* header */}
        <div className="skim-doodle relative shrink-0 bg-[#0f1b3e] px-6 pb-5 pt-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:scale-110 hover:bg-white/25 active:scale-90"
            aria-label="Close share"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="flex items-start gap-4">
            {article.thumbnail ? (
              <img src={article.thumbnail} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-white/20" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#1a2455] text-lg font-black text-white">
                M
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffc94d]">Share this story</p>
              <p className="mt-1 line-clamp-3 text-base font-bold leading-snug text-white">{article.title}</p>
              {article.author && <p className="mt-1 text-xs font-semibold text-white/60">by {article.author} · Medium</p>}
            </div>
          </div>

          {/* tabs */}
          <div className="mt-5 flex rounded-full bg-white/10 p-1 text-sm font-bold">
            <button
              onClick={() => setTab("share")}
              className={`flex-1 cursor-pointer rounded-full py-2 transition hover:scale-[1.02] active:scale-[0.98] ${tab === "share" ? "bg-[#ffc94d] text-[#0f1b3e]" : "text-white/80 hover:text-white"}`}
            >
              Share
            </button>
            <button
              onClick={() => setTab("embed")}
              className={`flex-1 cursor-pointer rounded-full py-2 transition hover:scale-[1.02] active:scale-[0.98] ${tab === "embed" ? "bg-[#ffc94d] text-[#0f1b3e]" : "text-white/80 hover:text-white"}`}
            >
              Embed
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "share" ? (
            <>
              {/* primary actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={shareNative}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#0f1b3e] p-4 text-left text-[#ffc94d] transition hover:scale-[1.03] hover:shadow-lg active:scale-[0.97]"
                >
                  <Share2 className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold leading-tight">Share elsewhere</p>
                    <p className="text-[11px] font-semibold text-white/60">Your apps & devices</p>
                  </div>
                </button>

                <button
                  onClick={() => copy("link", skimUrl)}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#0f1b3e]/10 bg-white p-4 text-left text-[#0f1b3e] transition hover:scale-[1.03] hover:border-[#ffc94d] hover:bg-[#ffc94d]/10 hover:shadow-md active:scale-[0.97]"
                >
                  <Link2 className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold leading-tight">{copied === "link" ? "Copied!" : "Copy link"}</p>
                    <p className="text-[11px] font-semibold text-[#0f1b3e]/50">Paste anywhere</p>
                  </div>
                </button>
              </div>

              {/* app row */}
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0f1b3e]/50">Send to</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <AppBtn icon={<MessageCircle className="h-5 w-5" strokeWidth={2} />} label="Messages" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + skimUrl)}`, "_blank", "noopener,noreferrer")} />
                <AppBtn icon={<AtSign className="h-5 w-5" strokeWidth={2} />} label="X" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(skimUrl)}`, "_blank", "noopener,noreferrer")} />
                <AppBtn icon={<Globe className="h-5 w-5" strokeWidth={2} />} label="Facebook" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(skimUrl)}`, "_blank", "noopener,noreferrer")} />
                <AppBtn icon={<Mail className="h-5 w-5" strokeWidth={2} />} label="Email" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(text + "\n\n" + skimUrl)}`)} />
              </div>

              {/* link row */}
              <div className="mt-6 rounded-2xl border border-black/10 bg-white p-2 pl-4">
                <p className="truncate text-sm font-semibold text-[#0f1b3e]/70">{skimUrl}</p>
                <button
                  onClick={() => copy("link", skimUrl)}
                  className={`mt-2 w-full cursor-pointer rounded-xl py-2.5 text-sm font-bold transition hover:scale-[1.02] active:scale-[0.98] ${copied === "link" ? "bg-green-600 text-white" : "bg-[#ffc94d] text-[#0f1b3e]"}`}
                >
                  {copied === "link" ? "Copied!" : "Copy"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-[#2b3352]">
                Paste this where you publish — it frames the Skim reader inside your page.
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl bg-[#0f1b3e]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                  <Code2 className="h-4 w-4 text-[#ffc94d]" strokeWidth={2} />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">Embed code</span>
                </div>
                <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-white/85">{embedCode}</pre>
              </div>
              <button
                onClick={() => copy("embed", embedCode)}
                className={`mt-4 w-full cursor-pointer rounded-2xl py-3.5 text-sm font-bold transition hover:scale-[1.02] active:scale-[0.98] ${copied === "embed" ? "bg-green-600 text-white" : "bg-[#ffc94d] text-[#0f1b3e]"}`}
              >
                {copied === "embed" ? "Embed copied!" : "Copy embed code"}
              </button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-[#0f1b3e]/50">
                Opens the story in Skim — readers stay on your page until they tap through.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AppBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-black/10 bg-white px-2 py-4 transition hover:-translate-y-1 hover:scale-[1.03] hover:border-[#ffc94d] hover:shadow-md active:scale-[0.96]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f1b3e] text-[#ffc94d]">{icon}</span>
      <span className="text-[11px] font-bold text-[#0f1b3e]">{label}</span>
    </button>
  );
}
