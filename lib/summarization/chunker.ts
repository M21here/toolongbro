import type { ParsedDocument, TextChunk, OutlineNode } from "../types";

const MAX_CHUNK_TOKENS = 12000; // Leave room for prompt overhead
const CHARS_PER_TOKEN = 4; // Rough estimate
const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN;

export function buildOutline(doc: ParsedDocument): OutlineNode[] {
  const outline: OutlineNode[] = [];

  // If no headings detected, create a single section
  if (doc.structure.headings.length === 0) {
    outline.push({
      id: "section-0",
      title: doc.metadata.title || "Document Content",
      level: 1,
      startPage: 1,
      endPage: doc.metadata.pageCount || 1,
    });
    return outline;
  }

  // Group headings into outline nodes
  for (let i = 0; i < doc.structure.headings.length; i++) {
    const heading = doc.structure.headings[i];

    // Find page range for this section
    const startPage = heading.page || findPageForPosition(doc, heading.position);
    const nextHeading = doc.structure.headings[i + 1];
    const endPage = nextHeading
      ? (nextHeading.page || findPageForPosition(doc, nextHeading.position)) - 1
      : doc.metadata.pageCount || 1;

    outline.push({
      id: `section-${i}`,
      title: heading.text,
      level: heading.level,
      startPage,
      endPage: Math.max(startPage, endPage),
    });
  }

  return outline;
}

function findPageForPosition(doc: ParsedDocument, position: number): number {
  for (const page of doc.structure.pages) {
    if (position >= page.startPosition && position < page.endPosition) {
      return page.number;
    }
  }
  return 1;
}

export function chunkDocument(
  doc: ParsedDocument,
  outline: OutlineNode[]
): TextChunk[] {
  const chunks: TextChunk[] = [];

  for (const node of outline) {
    // Extract text for this section
    const sectionText = extractSectionText(doc, node);

    if (sectionText.length <= MAX_CHUNK_CHARS) {
      // Section fits in one chunk
      chunks.push({
        id: `${node.id}-chunk-0`,
        text: sectionText,
        sectionTitle: node.title,
        level: node.level,
        pageRange: [node.startPage!, node.endPage!],
        position: chunks.length,
      });
    } else {
      // Need to sub-chunk this section
      const subChunks = splitIntoSubChunks(sectionText, MAX_CHUNK_CHARS);

      for (let i = 0; i < subChunks.length; i++) {
        chunks.push({
          id: `${node.id}-chunk-${i}`,
          text: subChunks[i],
          sectionTitle: `${node.title} (Part ${i + 1}/${subChunks.length})`,
          level: node.level,
          pageRange: [node.startPage!, node.endPage!],
          position: chunks.length,
        });
      }
    }
  }

  return chunks;
}

function extractSectionText(doc: ParsedDocument, node: OutlineNode): string {
  // Find heading in document
  const heading = doc.structure.headings.find((h) => h.text === node.title);

  if (!heading) {
    // Fallback: extract by page range
    const pages = doc.structure.pages.filter(
      (p) => p.number >= node.startPage! && p.number <= node.endPage!
    );
    return pages.map((p) => p.text).join("\n");
  }

  // Find end position (next heading of same or higher level, or end of document)
  const headingIndex = doc.structure.headings.indexOf(heading);
  let endPosition = doc.text.length;

  for (let i = headingIndex + 1; i < doc.structure.headings.length; i++) {
    if (doc.structure.headings[i].level <= heading.level) {
      endPosition = doc.structure.headings[i].position;
      break;
    }
  }

  return doc.text.slice(heading.position, endPosition).trim();
}

function splitIntoSubChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = [];

  // Try to split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 <= maxChars) {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // If single paragraph is too large, split by sentences
      if (para.length > maxChars) {
        const sentences = para.split(/(?<=[.!?])\s+/);
        let sentenceChunk = "";

        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length + 1 <= maxChars) {
            sentenceChunk += (sentenceChunk ? " " : "") + sentence;
          } else {
            if (sentenceChunk) {
              chunks.push(sentenceChunk);
            }
            // If single sentence is too large, hard split
            if (sentence.length > maxChars) {
              for (let i = 0; i < sentence.length; i += maxChars) {
                chunks.push(sentence.slice(i, i + maxChars));
              }
              sentenceChunk = "";
            } else {
              sentenceChunk = sentence;
            }
          }
        }

        if (sentenceChunk) {
          currentChunk = sentenceChunk;
        } else {
          currentChunk = "";
        }
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
