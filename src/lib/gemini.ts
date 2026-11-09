import * as cheerio from "cheerio";

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type Quiz = {
  questions: QuizQuestion[];
  conclusionPrompt: string;
};

function htmlToText(html: string, maxChars = 9000): string {
  const $ = cheerio.load(html || "");
  // drop scripts/styles
  $("script, style").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text.slice(0, maxChars);
}

function shuffle<T>(arr: T[], seed: string): T[] {
  // deterministic shuffle seeded by article so answers vary per article but stay stable on refresh
  const a = [...arr];
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function withShuffledOptions(
  question: string,
  correct: string,
  distractors: string[],
  explanation: string,
  seed: string
): QuizQuestion {
  // Build 4 options all derived from article language, then shuffle so answer isn't always A
  const all = [correct, ...distractors].slice(0, 4);
  const shuffled = shuffle(all, seed + question);
  const answerIndex = shuffled.indexOf(correct);
  return { question, options: shuffled, answerIndex, explanation };
}

export function extractiveQuiz(opts: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
}): Quiz {
  const text = htmlToText(opts.bodyHtml, 6000);
  const sentences = text
    .split(/[\.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 240)
    .slice(0, 12);

  const title = opts.title || "this article";
  const topic = title.split(":")[0].trim();
  const s0 = sentences[0] || `This article discusses ${topic}.`;
  const s1 = sentences[1] || "The author gives an example to explain the idea in practice.";
  const s2 = sentences[2] || "The author explains why the idea matters for everyday choices.";
  const s3 = sentences[3] || "The conclusion suggests applying the idea step by step.";
  const s4 = sentences[4] || "The author notes a common mistake that hides the real benefit.";

  // Q1: main idea — all options use article framing, one is accurate, three invert/overgeneralize
  const correct1 = `The author argues that ${s0.charAt(0).toLowerCase() + s0.slice(1).replace(/\.$/, "")}`;
  const d1a = `The author argues the opposite — that ${s0.charAt(0).toLowerCase() + s0.slice(1).replace(/\.$/, "").replace(/\b(is|are|can|will|should)\b/i, "$1 not")}`;
  const d1b = `The author mainly describes ${s1.charAt(0).toLowerCase() + s1.slice(1).replace(/\.$/, "")} as the entire point.`;
  const d1c = `The author suggests ${s2.charAt(0).toLowerCase() + s2.slice(1).replace(/\.$/, "")} but says it only applies in rare cases.`;

  // Q2: supporting detail — all options are sentence-like, one is supported, others misattribute
  const correct2 = s1.length > 140 ? s1.slice(0, 137) + "…" : s1;
  const d2a = s3.length > 140 ? s3.slice(0, 137) + "…" : s3;
  const d2b = s4.length > 140 ? s4.slice(0, 137) + "…" : s4;
  const d2c = `${s0.slice(0, 90)} — but only when the opposite condition holds.`;

  // Q3: implication — all plausible takeaways, one matches article's 'so what', others overreach
  const correct3 = `You can apply this by ${s3.charAt(0).toLowerCase() + s3.slice(1).replace(/\.$/, "")}`;
  const d3a = `You should always do the opposite of what the article suggests, since ${s2.charAt(0).toLowerCase() + s2.slice(1).replace(/\.$/, "").slice(0, 80)}.`;
  const d3b = `Nothing changes — ${s4.charAt(0).toLowerCase() + s4.slice(1).replace(/\.$/, "").slice(0, 80)}.`;
  const d3c = `The only action is to memorize ${s1.charAt(0).toLowerCase() + s1.slice(1).replace(/\.$/, "").slice(0, 80)}.`;

  const q1 = withShuffledOptions(
    `What is the main idea of “${topic}”?`,
    correct1,
    [d1a, d1b, d1c],
    `The opening sentence states the thesis directly. The distractors invert or narrow it — a skimmer who only saw the title picks them.`,
    title + ":q1"
  );

  const q2 = withShuffledOptions(
    "Which detail best supports the article's argument?",
    correct2,
    [d2a, d2b, d2c],
    `That sentence is the evidence the author actually uses to back the claim. The others describe different parts of the article (or invert the condition), so they sound familiar but don't support this claim.`,
    title + ":q2"
  );

  const q3 = withShuffledOptions(
    "What does the author most want you to do with this idea?",
    correct3,
    [d3a, d3b, d3c],
    `The closing frames the practical 'so what'. The distractors overreach (always do the opposite) or trivialize it (memorize a sentence), which the article never recommends.`,
    title + ":q3"
  );

  return {
    questions: [q1, q2, q3],
    conclusionPrompt: "In your own words, what will you remember from this article tomorrow — and why does it matter to you?",
  };
}

export async function generateQuizWithGemini(opts: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
}): Promise<Quiz> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const articleText = `${opts.title}\n${opts.subtitle || ""}\n\n${htmlToText(opts.bodyHtml)}`.slice(0, 4000);

  // gemini-2.0-flash was retired (404). Google recommends gemini-3.8-flash.
  const preferred = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const candidates = [preferred];

  const prompt = [
    "You are creating a challenging reading-comprehension quiz for an article. The quiz must be genuinely hard — a skimmer should NOT get them right by guessing.",
    "Return ONLY valid JSON with this exact shape:",
    '{"questions":[{"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."},...],"conclusionPrompt":"..."}',
    "Rules:",
    "- Exactly 3 multiple-choice questions, each with 4 options and one correct answerIndex (0-3).",
    "- Difficulty: HIGH. Test inference, nuance, and application — not literal recall of phrases from the article.",
    "- Distractors MUST be plausible and tempting: same length, same tone, same grammatical form as the answer. Each wrong option should be something a careless reader would choose, or a subtle misreading (overgeneralization, wrong cause/effect, confusing two ideas, distorting a number/condition).",
    "- NEVER make the correct option the longest, most detailed, or most 'positive' — randomize answer positions across the 3 questions (vary answerIndex, e.g. 2, 0, 3 — never all the same).",
    "- Include at least one 'BEST answer' style question where two options are defensible, but one fits the author's actual claim better.",
    "- Avoid meta-patterns: no 'all of the above', no 'none of the above', no joke/absurd options, no options that contradict each other obviously.",
    "- Vary coverage: Q1 = main argument (inference), Q2 = author's evidence / cause-effect, Q3 = implication or counter-argument nuance.",
    "- explanation: 1-2 sentences tied to the article, explaining WHY the answer is right AND why the most tempting distractor is wrong.",
    "- conclusionPrompt: one open-ended prompt asking the reader to write their own takeaway in 1-2 sentences.",
    `Article:\n${articleText}`,
  ].join("\n");

  let lastError = "";
  const errors: string[] = [];
  for (const model of candidates) {
    // Single attempt, fast path — the old "fast" quizzes were instant because they 404'd and fell back
    for (let attempt = 1; attempt <= 1; attempt++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.55,
              maxOutputTokens: 900,
              responseMimeType: "application/json",
            },
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
      } catch (e) {
        lastError = `Gemini request failed (${model}, attempt ${attempt}): ${String(e).slice(0, 200)}`;
        errors.push(lastError);
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        break;
      }

      if (!res.ok) {
        const status = res.status;
        lastError = `Gemini ${status} (${model}, attempt ${attempt}): ${(await res.text().catch(() => "")).slice(0, 300)}`;
        errors.push(lastError);
        const retryable = status === 503 || status === 500 || status === 429;
        if (retryable && attempt < 1) {
          await new Promise((r) => setTimeout(r, 2500 * attempt));
          continue;
        }
        break;
      }

      let json: any;
      try {
        json = await res.json();
      } catch {
        lastError = `Gemini returned non-JSON (${model})`;
        errors.push(lastError);
        break;
      }

      const text =
        json?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("") || "";
      if (!text.trim()) {
        lastError = `Gemini returned empty response (${model})`;
        errors.push(lastError);
        break;
      }

      try {
        const parsed = JSON.parse(text) as Quiz;
        if (!Array.isArray(parsed.questions) || parsed.questions.length !== 3) {
          lastError = `Gemini returned invalid quiz shape (${model})`;
          errors.push(lastError);
          break;
        }
        let valid = true;
        for (const q of parsed.questions) {
          if (
            !q.question ||
            !Array.isArray(q.options) ||
            q.options.length !== 4 ||
            typeof q.answerIndex !== "number" ||
            q.answerIndex < 0 ||
            q.answerIndex > 3
          ) {
            valid = false;
            break;
          }
        }
        if (!valid) {
          lastError = `Gemini returned invalid question (${model})`;
          errors.push(lastError);
          break;
        }
        // If Gemini clustered all answers in one position (common failure), reshuffle deterministically
        const indices = parsed.questions.map((q) => q.answerIndex);
        if (new Set(indices).size === 1) {
          parsed.questions = parsed.questions.map((q, qi) => {
            const target = qi % 4;
            const optsArr = [...q.options];
            const correct = optsArr[q.answerIndex];
            optsArr.splice(q.answerIndex, 1);
            optsArr.splice(target, 0, correct);
            return { ...q, options: optsArr, answerIndex: target };
          });
        }
        return {
          questions: parsed.questions,
          conclusionPrompt:
            (parsed as Quiz).conclusionPrompt ||
            "In your own words, what's the main takeaway from this article?",
        };
      } catch (e) {
        lastError = `Gemini returned unparsable quiz (${model}): ${String(e).slice(0, 200)}`;
        errors.push(lastError);
        break;
      }
    }
  }

  throw new Error(errors.join(" | ") || lastError || "Gemini failed on all models");
}
