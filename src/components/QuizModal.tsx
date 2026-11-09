"use client";

import { useState } from "react";
import type { Quiz, QuizQuestion } from "@/lib/gemini";
import { saveReflection } from "@/lib/reflections";

type Phase = "loading" | "quiz" | "conclusion" | "result";

export default function QuizModal({
  open,
  articleUrl,
  articleTitle,
  bodyHtml,
  onClose,
}: {
  open: boolean;
  articleUrl: string;
  articleTitle: string;
  bodyHtml?: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [conclusion, setConclusion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);

  // kick off fetch when opened (and not already loaded for this article)
  // we track loading via phase so re-opening reuses quiz if present
  const ensureLoaded = async () => {
    if (quiz) return;
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl, title: articleTitle, bodyHtml }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error && !data.quiz) {
        setError(String(data.error));
        setPhase("loading");
        return;
      }
      if (!data.quiz) {
        setError(String(data.error || "Could not generate quiz"));
        return;
      }
      if (data.fallback) setFallbackNote(String(data.error || ""));
      setQuiz(data.quiz as Quiz);
      setAnswers(new Array((data.quiz as Quiz).questions.length).fill(-1));
      setStep(0);
      setPhase("quiz");
    } catch (e) {
      setError(String(e));
    }
  };

  if (!open) return null;

  const totalQuestions = quiz?.questions.length ?? 3;
  const progress = quiz ? ((step + (phase === "result" ? 1 : 0)) / (totalQuestions + 1)) * 100 : 0;

  const pick = (idx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = idx;
      return next;
    });
  };

  const nextStep = () => {
    if (step < (quiz?.questions.length ?? 0) - 1) {
      setStep((s) => s + 1);
    } else {
      setPhase("conclusion");
    }
  };

  const score = quiz ? quiz.questions.reduce((n, q, i) => n + (answers[i] === q.answerIndex ? 1 : 0), 0) : 0;

  const submitConclusion = () => {
    saveReflection({
      articleId: articleUrl,
      articleUrl,
      articleTitle,
      text: conclusion.trim(),
      score,
    });
    setPhase("result");
  };

  const q: QuizQuestion | undefined = quiz?.questions[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-zoom-in flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-[#fff6e3] text-[#0f1b3e] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-black/10 bg-[#0f1b3e] px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffc94d]">Test your retention</p>
            <p className="font-display mt-0.5 line-clamp-1 text-sm font-bold text-white">{articleTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close quiz"
          >
            ✕
          </button>
        </div>

        {/* progress */}
        {quiz && (
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#0f1b3e]/60">
              <span>
                {phase === "quiz" && `Question ${step + 1} of ${totalQuestions}`}
                {phase === "conclusion" && "Your conclusion"}
                {phase === "result" && "Results"}
              </span>
              <span className="font-display text-[#0f1b3e]">{score}/{totalQuestions}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-[#ffc94d] transition-all duration-500"
                style={{ width: `${Math.max(6, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="animate-pulse text-3xl">✦</div>
              <p className="font-display font-bold">Crafting your quiz…</p>
              <p className="text-xs text-[#2b3352]">Gemini is reading the article</p>
              {!quiz && (
                <button
                  onClick={ensureLoaded}
                  className="font-display mt-2 rounded-full bg-[#ffc94d] px-5 py-2.5 text-sm font-bold text-[#0f1b3e]"
                >
                  Start quiz →
                </button>
              )}
              {error && <p className="max-w-xs text-sm font-semibold text-red-600">{error}</p>}
            </div>
          )}

          {phase === "quiz" && quiz && q && (
            <div>
              <h3 className="font-display text-lg font-bold leading-snug">{q.question}</h3>
              <div className="mt-4 flex flex-col gap-2.5">
                {q.options.map((opt, i) => {
                  const selected = answers[step] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                        selected
                          ? "border-[#0f1b3e] bg-[#0f1b3e] text-white"
                          : "border-black/10 bg-white/70 text-[#0f1b3e] hover:border-[#ffc94d]"
                      }`}
                    >
                      <span className="mr-2 font-black text-[#ffc94d]">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={nextStep}
                  disabled={answers[step] === -1}
                  className="font-display flex-1 rounded-full bg-[#0f1b3e] py-3 text-sm font-bold text-[#ffc94d] disabled:opacity-40"
                >
                  {step === (quiz?.questions.length ?? 0) - 1 ? "Next: Conclusion →" : "Next →"}
                </button>
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-full border-2 border-black/10 px-4 py-3 text-sm font-bold"
                  >
                    Back
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[11px] text-[#0f1b3e]/50">Pick an answer to continue</p>
            </div>
          )}

          {phase === "conclusion" && quiz && (
            <div>
              <h3 className="font-display text-lg font-bold leading-snug">{quiz.conclusionPrompt}</h3>
              <p className="mt-1 text-xs text-[#2b3352]">Write in your own words — this is saved for your future profile (private by default).</p>
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Your takeaway…"
                rows={5}
                className="mt-3 w-full rounded-2xl border-2 border-black/10 bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#ffc94d]"
              />
              <p className="mt-1 text-right text-[11px] font-bold text-[#0f1b3e]/50">{conclusion.trim().length} chars</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={submitConclusion}
                  disabled={!conclusion.trim()}
                  className="font-display flex-1 rounded-full bg-[#ffc94d] py-3 text-base font-bold text-[#0f1b3e] disabled:opacity-40"
                >
                  See my score →
                </button>
                <button onClick={() => setPhase("quiz")} className="rounded-full border-2 border-black/10 px-4 py-3 text-sm font-bold">
                  Back
                </button>
              </div>
            </div>
          )}

          {phase === "result" && quiz && (
            <div>
              <div className="rounded-2xl bg-[#0f1b3e] p-5 text-center">
                <p className="font-display text-4xl font-bold text-[#ffc94d]">{score}/{totalQuestions}</p>
                <p className="mt-1 text-sm text-white/80">
                  {score === totalQuestions && "Perfect — you really got it."}
                  {score === 2 && "Nice — solid grasp of this story."}
                  {score === 1 && "Good start — revisit the article for the gaps."}
                  {score === 0 && "Tough one — skim again and retry."}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {quiz.questions.map((qq, i) => {
                  const correct = answers[i] === qq.answerIndex;
                  return (
                    <div key={i} className="rounded-2xl border border-black/10 bg-white/70 p-4">
                      <p className="text-sm font-bold leading-snug">{qq.question}</p>
                      <p className={`mt-1 text-xs font-bold ${correct ? "text-green-700" : "text-red-600"}`}>
                        {correct ? "✓ Correct" : `✗ You picked ${String.fromCharCode(65 + (answers[i] ?? 0))} — correct was ${String.fromCharCode(65 + qq.answerIndex)}`}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#2b3352]">{qq.options[qq.answerIndex]} — {qq.explanation}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-[#ffc94d]/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#b7791f]">Your conclusion</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#0f1b3e]">{conclusion || "—"}</p>
                <p className="mt-2 text-[11px] text-[#0f1b3e]/50">Saved privately for your future profile.</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setStep(0);
                    setAnswers(new Array(quiz.questions.length).fill(-1));
                    setConclusion("");
                    setPhase("quiz");
                  }}
                  className="rounded-full border-2 border-black/10 px-5 py-3 text-sm font-bold"
                >
                  Retry
                </button>
                <button onClick={onClose} className="font-display flex-1 rounded-full bg-[#0f1b3e] py-3 text-sm font-bold text-[#ffc94d]">
                  Keep reading →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* auto-start when opened first time */}
      {!quiz && phase === "loading" && (
        <AutoStart onStart={ensureLoaded} />
      )}
    </div>
  );
}

function AutoStart({ onStart }: { onStart: () => void }) {
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffectOnlyOnce(onStart);
  return null;
}

import { useEffect } from "react";
function useEffectOnlyOnce(fn: () => void) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
