import { NextRequest, NextResponse } from "next/server";
import { parseArticle } from "@/lib/freedium";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !/medium\.com/.test(url)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  try {
    const article = await parseArticle(url);
    return NextResponse.json(article);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
