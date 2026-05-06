import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/llm/client";
import { buildSystemPrompt, buildUserMessage } from "@/lib/llm/prompts";
import { validateQuery } from "@/lib/llm/validator";
import { getDatabaseConfig } from "@/lib/db-config/registry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { concepts, topic, databaseId, synonymRefs } = body as {
      concepts: { name: string; terms: string[] }[];
      topic: string;
      databaseId: string;
      synonymRefs: Record<string, string[]>;
    };

    if (!databaseId || !concepts) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const config = getDatabaseConfig(databaseId);
    if (!config) {
      return NextResponse.json({ error: `Unknown database: ${databaseId}` }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(config);
    const userMessage = buildUserMessage(concepts, synonymRefs || {}, topic || "");

    let retries = 0;
    const MAX_RETRIES = 2;
    let lastResult = "";

    while (retries <= MAX_RETRIES) {
      const raw = await callLLM(systemPrompt, userMessage);
      lastResult = raw;

      // Extract JSON from markdown code block
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : raw;
      try {
        const parsed = JSON.parse(jsonStr);

        // Validate output syntax against database rules
        const allQueries = [
          ...parsed.lines.map((l: { query: string }) => l.query),
          parsed.final || "",
        ].join("\n");
        const errors = validateQuery(allQueries, config);

        if (errors.length === 0 || retries === MAX_RETRIES) {
          return NextResponse.json({
            ...parsed,
            databaseId,
            validationErrors: errors,
          });
        }

        retries++;
      } catch {
        if (retries === MAX_RETRIES) {
          return NextResponse.json(
            { error: "LLM generation failed after retries", raw: lastResult },
            { status: 500 }
          );
        }
        retries++;
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: "LLM generation failed", details: String(e) },
      { status: 500 }
    );
  }
}
