export type SummaryStyle =
  | "one-page"
  | "full-context"
  | "eli5"
  | "study-notes"
  | "actionable-takeaways"
  | "flashcards"
  | "executive-brief"
  | "lecture-mode";

export type OutputLanguage = "english" | "persian";

export type DetailLevel = "short" | "medium" | "high";

export interface SummaryOptions {
  style: SummaryStyle;
  language: OutputLanguage;
  detailLevel: DetailLevel;
  preserveStructure: boolean;
}

export interface OutlineNode {
  id: string;
  title: string;
  level: number;
  pageRange?: [number, number];
  startPage?: number;
  endPage?: number;
}

export interface SummaryBlock {
  id: string;
  nodeId: string;
  title: string;
  level: number;
  content: string;
  keyPoints?: string[];
  importantDetails?: string[];
  citations?: string[];
}

export interface Glossary {
  term: string;
  definition: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface Takeaway {
  category: string;
  items: string[];
}

export interface SummaryMetadata {
  title?: string;
  author?: string;
  language: OutputLanguage;
  wordCount: number;
  originalWordCount: number;
  structureConfidence: number;
  generatedAt: string;
  style: SummaryStyle;
  detailLevel: DetailLevel;
}

export interface SummaryResult {
  metadata: SummaryMetadata;
  outline: OutlineNode[];
  summary: SummaryBlock[];
  extras?: {
    glossary?: Glossary[];
    flashcards?: Flashcard[];
    takeaways?: Takeaway[];
  };
}

export interface ParsedDocument {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    pageCount?: number;
  };
  structure: {
    headings: Array<{
      text: string;
      level: number;
      page?: number;
      position: number;
    }>;
    pages: Array<{
      number: number;
      text: string;
      startPosition: number;
      endPosition: number;
    }>;
  };
}

export interface TextChunk {
  id: string;
  text: string;
  sectionTitle?: string;
  level: number;
  pageRange?: [number, number];
  position: number;
}
