import { parsePDF } from "./pdf";
import { parseDOCX } from "./docx";
import { parseTXT } from "./txt";
import type { ParsedDocument } from "../types";

export async function parseDocument(
  buffer: Buffer,
  fileType: string
): Promise<ParsedDocument> {
  const lowerType = fileType.toLowerCase();

  if (lowerType === "pdf" || lowerType === "application/pdf") {
    return parsePDF(buffer);
  } else if (
    lowerType === "docx" ||
    lowerType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDOCX(buffer);
  } else if (lowerType === "txt" || lowerType === "text/plain") {
    return parseTXT(buffer);
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

export { parsePDF, parseDOCX, parseTXT };
