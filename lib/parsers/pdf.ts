import type { ParsedDocument } from "../types";
import pdf from "pdf-parse";

interface PDFPage {
  pageNumber: number;
  text: string;
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  const data = await pdf(buffer);

  const textContent = data.text;
  const numPages = data.numpages || 1;

  // Extract pages with their content
  const pages: PDFPage[] = [];
  const estimatedPageLength = Math.ceil(textContent.length / numPages);

  for (let i = 0; i < numPages; i++) {
    const start = i * estimatedPageLength;
    const end = Math.min((i + 1) * estimatedPageLength, textContent.length);
    const pageText = textContent.slice(start, end);

    pages.push({
      pageNumber: i + 1,
      text: pageText,
    });
  }

  // Detect headings using heuristics
  const headings: Array<{
    text: string;
    level: number;
    page?: number;
    position: number;
  }> = [];

  const lines = textContent.split("\n");
  let position = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    position += line.length + 1;

    if (!trimmed || trimmed.length < 3 || trimmed.length > 200) {
      continue;
    }

    // Detect headings based on various patterns
    let level = 0;

    // All caps (potential heading)
    if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      level = 1;
    }
    // Starts with Chapter, Section, Part, etc.
    else if (/^(Chapter|CHAPTER|Section|SECTION|Part|PART)\s+\d+/i.test(trimmed)) {
      level = 1;
    }
    // Numbered headings (1., 1.1, etc.)
    else if (/^\d+(\.\d+)*\.?\s+[A-Z]/.test(trimmed)) {
      const dots = (trimmed.match(/\./g) || []).length;
      level = Math.min(dots + 1, 4);
    }
    // Title case with no punctuation at end
    else if (
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed) &&
      !trimmed.endsWith(".") &&
      !trimmed.endsWith(",")
    ) {
      level = 2;
    }

    if (level > 0) {
      // Find which page this heading is on
      let pageNum = 1;
      let accumulated = 0;
      for (const page of pages) {
        accumulated += page.text.length;
        if (position <= accumulated) {
          pageNum = page.pageNumber;
          break;
        }
      }

      headings.push({
        text: trimmed,
        level,
        page: pageNum,
        position,
      });
    }
  }

  // Extract metadata
  const metadata = {
    title: data.info?.Title || undefined,
    author: data.info?.Author || undefined,
    pageCount: numPages,
  };

  return {
    text: textContent,
    metadata,
    structure: {
      headings,
      pages: pages.map((p, idx) => ({
        number: p.pageNumber,
        text: p.text,
        startPosition: idx * estimatedPageLength,
        endPosition: Math.min((idx + 1) * estimatedPageLength, textContent.length),
      })),
    },
  };
}
