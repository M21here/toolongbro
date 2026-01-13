import type { AIClient } from "../ai/client";
import type {
  ParsedDocument,
  SummaryOptions,
  SummaryResult,
  OutlineNode,
} from "../types";
import { buildOutline, chunkDocument } from "./chunker";
import { summarizeChunk, mergeSummaries, generateExtras } from "./summarizer";
import { countWords } from "../utils";

export interface PipelineProgress {
  stage: string;
  progress: number;
  message: string;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

// Process chunks in parallel batches for speed
const PARALLEL_BATCH_SIZE = 3;

async function processChunksInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = PARALLEL_BATCH_SIZE
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

export async function runSummarizationPipeline(
  client: AIClient,
  document: ParsedDocument,
  options: SummaryOptions,
  onProgress?: ProgressCallback
): Promise<SummaryResult> {
  // Stage 1: Build outline
  onProgress?.({
    stage: "outline",
    progress: 10,
    message: "Building document outline...",
  });

  const outline = buildOutline(document);

  // Stage 2: Chunk document
  onProgress?.({
    stage: "chunking",
    progress: 20,
    message: "Chunking document for processing...",
  });

  const chunks = chunkDocument(document, outline);

  // Stage 3: Summarize chunks in parallel batches
  onProgress?.({
    stage: "summarizing",
    progress: 30,
    message: `Summarizing ${chunks.length} sections in parallel...`,
  });

  const summaries = await processChunksInParallel(
    chunks,
    (chunk) => summarizeChunk(client, chunk, options),
    PARALLEL_BATCH_SIZE
  );

  onProgress?.({
    stage: "summarizing",
    progress: 70,
    message: "Summaries complete",
  });

  // Stage 4: Merge summaries
  onProgress?.({
    stage: "merging",
    progress: 75,
    message: "Merging section summaries...",
  });

  const mergedSummaries = await mergeSummaries(summaries, options);

  // Stage 5: Generate extras (glossary, flashcards, etc.) - only if needed
  let extras;
  if (
    options.style === "study-notes" ||
    options.style === "flashcards" ||
    options.style === "actionable-takeaways"
  ) {
    onProgress?.({
      stage: "extras",
      progress: 85,
      message: "Generating additional content...",
    });
    extras = await generateExtras(client, mergedSummaries, options);
  }

  // Stage 6: Final result
  onProgress?.({
    stage: "finalizing",
    progress: 95,
    message: "Finalizing...",
  });

  const result = performConsistencyCheck(
    outline,
    mergedSummaries,
    document,
    options
  );

  onProgress?.({
    stage: "complete",
    progress: 100,
    message: "Summary generation complete!",
  });

  return {
    ...result,
    extras,
  };
}

function performConsistencyCheck(
  outline: OutlineNode[],
  summaries: any[],
  document: ParsedDocument,
  options: SummaryOptions
): SummaryResult {
  // Calculate confidence based on structure detection
  const structureConfidence =
    document.structure.headings.length > 0
      ? Math.min(0.95, 0.5 + document.structure.headings.length * 0.05)
      : 0.3;

  // Count words
  const summaryText = summaries.map((s) => s.content).join(" ");
  const wordCount = countWords(summaryText);
  const originalWordCount = countWords(document.text);

  return {
    metadata: {
      title: document.metadata.title,
      author: document.metadata.author,
      language: options.language,
      wordCount,
      originalWordCount,
      structureConfidence,
      generatedAt: new Date().toISOString(),
      style: options.style,
      detailLevel: options.detailLevel,
    },
    outline,
    summary: summaries,
  };
}
