import type { ParsedDocument } from "../types";

export async function parseTXT(buffer: Buffer): Promise<ParsedDocument> {
  const text = buffer.toString("utf-8");

  // Detect headings using multiple heuristics
  const headings: Array<{
    text: string;
    level: number;
    position: number;
  }> = [];

  const lines = text.split("\n");
  let position = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    position += line.length + 1;

    if (!trimmed || trimmed.length < 3 || trimmed.length > 200) {
      continue;
    }

    let level = 0;

    // Markdown-style headings
    if (/^#{1,6}\s+/.test(trimmed)) {
      const hashes = trimmed.match(/^(#+)/)?.[1].length || 0;
      level = hashes;
    }
    // All caps (potential heading)
    else if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      level = 1;
    }
    // Underlined headings (next line is ===== or -----)
    else if (
      i < lines.length - 1 &&
      /^[=\-]{3,}$/.test(lines[i + 1].trim())
    ) {
      level = lines[i + 1].includes("=") ? 1 : 2;
    }
    // Chapter/Section/Part markers
    else if (/^(Chapter|CHAPTER|Section|SECTION|Part|PART)\s+\d+/i.test(trimmed)) {
      level = 1;
    }
    // Numbered headings (1., 1.1, 1.1.1, etc.)
    else if (/^\d+(\.\d+)*\.?\s+[A-Z]/.test(trimmed)) {
      const dots = (trimmed.match(/\./g) || []).length;
      level = Math.min(dots + 1, 4);
    }
    // Title case standalone lines (short, no ending punctuation)
    else if (
      trimmed.length < 100 &&
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed) &&
      !trimmed.endsWith(".") &&
      !trimmed.endsWith(",") &&
      (i === 0 || lines[i - 1].trim() === "") &&
      (i === lines.length - 1 || lines[i + 1].trim() === "" || /^[A-Z]/.test(lines[i + 1].trim()))
    ) {
      level = 2;
    }

    if (level > 0) {
      // Clean markdown syntax from heading text
      let cleanText = trimmed.replace(/^#{1,6}\s+/, "");

      headings.push({
        text: cleanText,
        level,
        position,
      });
    }
  }

  // Estimate pages (assuming ~500 words per page)
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const estimatedPages = Math.ceil(wordCount / 500);
  const charsPerPage = Math.ceil(text.length / estimatedPages);

  return {
    text,
    metadata: {
      pageCount: estimatedPages,
    },
    structure: {
      headings,
      pages: Array.from({ length: estimatedPages }, (_, i) => ({
        number: i + 1,
        text: text.slice(i * charsPerPage, (i + 1) * charsPerPage),
        startPosition: i * charsPerPage,
        endPosition: Math.min((i + 1) * charsPerPage, text.length),
      })),
    },
  };
}
