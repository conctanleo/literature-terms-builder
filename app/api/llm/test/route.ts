import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, baseUrl, model } = await req.json();

    if (!apiKey || !baseUrl || !model) {
      return NextResponse.json({ error: "Missing apiKey, baseUrl, or model" }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        thinking: { type: "disabled" },
        messages: [{ role: "user", content: "Reply with just the word: connected" }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      model,
      reply: reply.trim(),
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: String(e),
    });
  }
}
