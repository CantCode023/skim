import { NextRequest, NextResponse } from "next/server";
import { fetchFeeds } from "@/lib/medium";

export async function GET(req: NextRequest) {
  const tagsParam = req.nextUrl.searchParams.get("tags") || "";
  const tags = tagsParam
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tags.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  try {
    const articles = await fetchFeeds(tags);
    return NextResponse.json({ articles });
  } catch (e) {
    return NextResponse.json({ articles: [], error: String(e) }, { status: 500 });
  }
}
