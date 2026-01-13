import mammoth from "mammoth";
import type { ParsedDocument } from "../types";

export async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  // Extract HTML with structure
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
      ],
    }
  );

  const html = result.value;

  // Also get plain text
  const textResult = await mammoth.extractRawText({ buffer });
  const plainText = textResult.value;

  // Parse HTML to extract headings
  const headings: Array<{
    text: string;
    level: number;
    position: number;
  }> = [];

  // Simple HTML parsing for headings
  const headingRegex = /<h([1-6])>(.*?)<\/h\1>/gi;
  let match;
  let position = 0;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, "").trim();

    // Find position in plain text
    const textPos = plainText.indexOf(text, position);
    if (textPos !== -1) {
      position = textPos;
    }

    headings.push({
      text,
      level,
      position,
    });
  }

  // If no headings found via HTML, try heuristics on plain text
  if (headings.length === 0) {
    const lines = plainText.split("\n");
    position = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      position += line.length + 1;

      if (!trimmed || trimmed.length < 3 || trimmed.length > 200) {
        continue;
      }

      let level = 0;

      // All caps
      if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
        level = 1;
      }
      // Chapter/Section markers
      else if (/^(Chapter|Section|Part)\s+\d+/i.test(trimmed)) {
        level = 1;
      }
      // Numbered headings
      else if (/^\d+(\.\d+)*\.?\s+[A-Z]/.test(trimmed)) {
        const dots = (trimmed.match(/\./g) || []).length;
        level = Math.min(dots + 1, 4);
      }

      if (level > 0) {
        headings.push({
          text: trimmed,
          level,
          position,
        });
      }
    }
  }

  // Estimate pages (assuming ~500 words per page)
  const wordCount = plainText.split(/\s+/).length;
  const estimatedPages = Math.ceil(wordCount / 500);

  return {
    text: plainText,
    metadata: {
      pageCount: estimatedPages,
    },
    structure: {
      headings,
      pages: Array.from({ length: estimatedPages }, (_, i) => {
        const wordsPerPage = 500;
        const charsPerPage = Math.ceil(plainText.length / estimatedPages);
        return {
          number: i + 1,
          text: plainText.slice(i * charsPerPage, (i + 1) * charsPerPage),
          startPosition: i * charsPerPage,
          endPosition: Math.min((i + 1) * charsPerPage, plainText.length),
        };
      }),
    },
  };
}
