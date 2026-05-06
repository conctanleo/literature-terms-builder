import { NextRequest, NextResponse } from "next/server";
import { findBilingualSynonyms } from "@/lib/synonyms/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { term, llmConfig } = body as {
      term: string;
      llmConfig?: { apiKey?: string; baseUrl?: string; model?: string };
    };

    if (!term) {
      return NextResponse.json({ error: "Missing 'term'" }, { status: 400 });
    }

    const result = await findBilingualSynonyms(term, llmConfig);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Synonym lookup failed", details: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get("term");

  if (!term) {
    return NextResponse.json({ error: "Missing 'term' parameter" }, { status: 400 });
  }

  try {
    const result = await findBilingualSynonyms(term);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Synonym lookup failed", details: String(e) }, { status: 500 });
  }
}
