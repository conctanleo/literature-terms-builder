import { NextRequest, NextResponse } from "next/server";
import { generateExcelBuffer } from "@/lib/export/excel";
import { generateCSV } from "@/lib/export/csv";
import { generateJSON } from "@/lib/export/json-export";

export async function POST(
  req: NextRequest,
  { params }: { params: { format: string } }
) {
  try {
    const body = await req.json();
    const { results, concepts } = body;

    if (!results) {
      return NextResponse.json({ error: "Missing results" }, { status: 400 });
    }

    switch (params.format) {
      case "xlsx": {
        const buffer = await generateExcelBuffer(results);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=search-queries.xlsx",
          },
        });
      }
      case "csv": {
        const csv = generateCSV(results);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=search-queries.csv",
          },
        });
      }
      case "json": {
        const json = generateJSON(results, concepts);
        return NextResponse.json(json, {
          headers: {
            "Content-Disposition": "attachment; filename=search-queries.json",
          },
        });
      }
      default:
        return NextResponse.json({ error: `Unsupported format: ${params.format}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Export failed", details: String(e) }, { status: 500 });
  }
}
