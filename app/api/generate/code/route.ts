import { NextRequest, NextResponse } from "next/server";
import { generateForMultipleDatabases, ConceptGroup } from "@/lib/query-builder/generator";
import { getAllDatabasesWithCustom } from "@/lib/db-config/storage";
import { DatabaseConfig } from "@/lib/db-config/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { concepts, databaseIds } = body as {
      concepts: ConceptGroup[];
      databaseIds: string[];
    };

    if (!concepts || !databaseIds) {
      return NextResponse.json({ error: "Missing 'concepts' or 'databaseIds'" }, { status: 400 });
    }

    const allDbs = getAllDatabasesWithCustom();
    const configs: DatabaseConfig[] = databaseIds
      .map((id) => allDbs.find((db) => db.id === id))
      .filter(Boolean) as DatabaseConfig[];

    if (configs.length === 0) {
      return NextResponse.json({ error: "No valid databases selected" }, { status: 400 });
    }

    const results = generateForMultipleDatabases(concepts, configs);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "Generation failed", details: String(e) }, { status: 500 });
  }
}
