import ExcelJS from "exceljs";
import { GeneratedQueries } from "@/lib/query-builder/generator";

export async function generateExcelBuffer(results: GeneratedQueries[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Search Queries");

  // Headers
  const headers = ["Step", "Concept", ...results.map((r) => r.database)];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFE9DE" },
  };
  headerRow.alignment = { wrapText: true };

  // Data rows
  const maxLines = Math.max(...results.map((r) => r.lines.length));
  for (let i = 0; i < maxLines; i++) {
    const row: string[] = [];
    const firstLine = results[0]?.lines[i];
    row.push(firstLine ? `#${firstLine.step}` : "");
    row.push(firstLine?.concept || "");
    results.forEach((r) => row.push(r.lines[i]?.query || ""));
    const dataRow = sheet.addRow(row);
    dataRow.font = { name: "JetBrains Mono", size: 11 };
    dataRow.alignment = { wrapText: true };
    if (i % 2 === 0) {
      dataRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFAF9F5" },
      };
    }
  }

  // Final row
  const finalRowData = ["Final", "AND"];
  results.forEach((r) => finalRowData.push(r.final));
  const finalRow = sheet.addRow(finalRowData);
  finalRow.font = { bold: true, name: "JetBrains Mono", size: 11 };
  finalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFE9DE" },
  };
  finalRow.alignment = { wrapText: true };

  // Column widths
  sheet.getColumn(1).width = 10;
  sheet.getColumn(2).width = 14;
  for (let i = 0; i < results.length; i++) {
    sheet.getColumn(3 + i).width = 55;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
