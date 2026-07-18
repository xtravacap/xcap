import "server-only";

/** Best-effort plain-text extraction for non-PDF/image formats (the OpenAI
 * Responses API can read PDFs/images directly, but .docx/.xlsx/.csv need to
 * be converted to text first). */
export async function extractPlainText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();

  if (mimeType.includes("word") || lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (mimeType.includes("sheet") || mimeType.includes("excel") || lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return `# Sheet: ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
  }

  // csv, txt, or anything else we don't have a dedicated parser for.
  return buffer.toString("utf-8");
}
