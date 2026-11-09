export default function SkimLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="font-display leading-none">
        <div className="relative inline-block text-2xl font-bold text-[#fff6e3] sm:text-3xl">
          Skim
          <span className="absolute -top-1 right-0 flex gap-1">
            <span className="inline-block h-2 w-1.5 rotate-12 rounded-full bg-[#ffc94d]" />
            <span className="inline-block h-3 w-1.5 -rotate-12 rounded-full bg-[#ffc94d]" />
          </span>
          <svg viewBox="0 0 100 14" className="mt-0.5 h-2 w-full">
            <path d="M4 9 Q50 2 96 9" stroke="#ffc94d" strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <div className="font-display text-center leading-none lg:text-left">
      <div className="relative inline-block text-[84px] font-bold tracking-tight text-[#fff6e3] sm:text-[110px] lg:text-[130px]">
        Skim
        <span className="absolute -top-2 right-2 flex gap-1.5">
          <span className="inline-block h-6 w-3 rotate-[18deg] rounded-full bg-[#ffc94d]" />
          <span className="inline-block h-9 w-3 -rotate-[18deg] rounded-full bg-[#ffc94d]" />
        </span>
        <svg viewBox="0 0 220 24" className="mt-1 h-5 w-full sm:h-7">
          <path d="M10 16 Q110 3 210 16" stroke="#ffc94d" strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}
