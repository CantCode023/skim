import { NextRequest, NextResponse } from "next/server";
import { parseArticle } from "@/lib/freedium";
import { generateQuizWithGemini, extractiveQuiz } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url: string = body?.url || "";
  if (!url || !/medium\.com/.test(url)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Reuse the article we already fetched for the Reader when possible
  let article: { title?: string; subtitle?: string; bodyHtml?: string } | null = null;
  if (body?.bodyHtml) {
    article = { title: body.title, subtitle: body.subtitle, bodyHtml: body.bodyHtml };
  } else {
    try {
      article = await parseArticle(url);
    } catch (e) {
      return NextResponse.json({ error: `Could not load article: ${String(e)}` }, { status: 500 });
    }
  }

  const title = (article.title as string) || "Untitled";
  const subtitle = (article.subtitle as string) || "";
  const bodyHtml = (article.bodyHtml as string) || "";

  if (!bodyHtml.replace(/<[^>]*>/g, "").trim()) {
    return NextResponse.json({ error: "Article body is empty — cannot generate a quiz" }, { status: 400 });
  }

  try {
    const quiz = await generateQuizWithGemini({ title, subtitle, bodyHtml });
    return NextResponse.json({ quiz, title });
  } catch (e: any) {
    const msg = String(e?.message || e);
    // Fallback: extractive quiz so the feature works without a Gemini key
    const fallbackQuiz = extractiveQuiz({ title, subtitle, bodyHtml });
    return NextResponse.json({
      quiz: fallbackQuiz,
      title,
      fallback: true,
      error: `Gemini unavailable (${msg}). Showing a basic quiz — add GEMINI_API_KEY for AI questions.`,
    });
  }
}
