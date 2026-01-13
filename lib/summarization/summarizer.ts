import type { AIClient } from "../ai/client";
import type {
  TextChunk,
  SummaryBlock,
  SummaryOptions,
  Glossary,
  Flashcard,
  Takeaway,
} from "../types";
import { buildSummarizationPrompt } from "./prompts";

export async function summarizeChunk(
  client: AIClient,
  chunk: TextChunk,
  options: SummaryOptions
): Promise<SummaryBlock> {
  const prompt = buildSummarizationPrompt(
    options.style,
    options.language,
    options.detailLevel,
    chunk.sectionTitle || "Content",
    chunk.text,
    chunk.pageRange
  );

  const response = await client.generateText(
    [{ role: "user", content: prompt }],
    {
      maxTokens: 2048,
      temperature: 0.7,
    }
  );

  const parsed = parseSummaryResponse(response.text);

  return {
    id: chunk.id,
    nodeId: chunk.id.split("-chunk-")[0],
    title: chunk.sectionTitle || "Content",
    level: chunk.level,
    content: parsed.summary,
    keyPoints: parsed.keyPoints,
    importantDetails: parsed.importantDetails,
    citations: chunk.pageRange
      ? [`Pages ${chunk.pageRange[0]}-${chunk.pageRange[1]}`]
      : undefined,
  };
}

function parseSummaryResponse(text: string): {
  summary: string;
  keyPoints: string[];
  importantDetails: string[];
} {
  const result = {
    summary: "",
    keyPoints: [] as string[],
    importantDetails: [] as string[],
  };

  // Extract main summary
  const summaryMatch = text.match(/## Summary\s+([\s\S]*?)(?=\n## |$)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  } else {
    // If no section markers, treat first paragraph as summary
    result.summary = text.split("\n\n")[0];
  }

  // Extract key points
  const keyPointsMatch = text.match(/## Key Points\s+([\s\S]*?)(?=\n## |$)/i);
  if (keyPointsMatch) {
    const points = keyPointsMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("•"))
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
    result.keyPoints = points;
  }

  // Extract important details
  const detailsMatch = text.match(/## Important Details\s+([\s\S]*?)(?=\n## |$)/i);
  if (detailsMatch) {
    const details = detailsMatch[1].trim();
    result.importantDetails = details.split("\n\n").filter(Boolean);
  }

  return result;
}

export async function mergeSummaries(
  summaries: SummaryBlock[],
  options: SummaryOptions
): Promise<SummaryBlock[]> {
  // Group summaries by node (section)
  const byNode = new Map<string, SummaryBlock[]>();

  for (const summary of summaries) {
    const existing = byNode.get(summary.nodeId) || [];
    existing.push(summary);
    byNode.set(summary.nodeId, existing);
  }

  const merged: SummaryBlock[] = [];

  // Merge chunks for each node
  for (const [nodeId, chunks] of byNode.entries()) {
    if (chunks.length === 1) {
      merged.push(chunks[0]);
    } else {
      // Combine multiple chunks
      const combined: SummaryBlock = {
        id: nodeId,
        nodeId: nodeId,
        title: chunks[0].title.replace(/ \(Part \d+\/\d+\)/, ""),
        level: chunks[0].level,
        content: chunks.map((c) => c.content).join("\n\n"),
        keyPoints: Array.from(
          new Set(chunks.flatMap((c) => c.keyPoints || []))
        ),
        importantDetails: chunks.flatMap((c) => c.importantDetails || []),
        citations: chunks[0].citations,
      };

      merged.push(combined);
    }
  }

  // Sort by original position
  return merged.sort((a, b) => {
    const aPos = parseInt(a.id.split("-")[1]);
    const bPos = parseInt(b.id.split("-")[1]);
    return aPos - bPos;
  });
}

export async function generateExtras(
  client: AIClient,
  summaries: SummaryBlock[],
  options: SummaryOptions
): Promise<{
  glossary?: Glossary[];
  flashcards?: Flashcard[];
  takeaways?: Takeaway[];
}> {
  const extras: {
    glossary?: Glossary[];
    flashcards?: Flashcard[];
    takeaways?: Takeaway[];
  } = {};

  const fullText = summaries.map((s) => s.content).join("\n\n");
  const textSlice = fullText.slice(0, 8000);

  // Build all promises to run in parallel
  const promises: Promise<void>[] = [];

  if (options.style === "study-notes" || options.style === "full-context") {
    const glossaryPromise = (async () => {
      const glossaryPrompt = `Based on the following text, extract key terms and their definitions. Return ONLY a JSON array in this format:
[{"term": "term name", "definition": "clear definition"}]

Text:
${textSlice}

Return ONLY valid JSON, no additional text.`;

      try {
        const response = await client.generateText(
          [{ role: "user", content: glossaryPrompt }],
          { maxTokens: 1024 }
        );

        const glossary = JSON.parse(response.text.trim());
        if (Array.isArray(glossary)) {
          extras.glossary = glossary;
        }
      } catch (error) {
        console.error("Failed to generate glossary:", error);
      }
    })();
    promises.push(glossaryPromise);
  }

  if (options.style === "flashcards") {
    const flashcardsPromise = (async () => {
      const flashcardsPrompt = `Based on the following text, create flashcard Q&A pairs for key concepts. Return ONLY a JSON array in this format:
[{"question": "question text", "answer": "answer text"}]

Text:
${textSlice}

Return ONLY valid JSON, no additional text.`;

      try {
        const response = await client.generateText(
          [{ role: "user", content: flashcardsPrompt }],
          { maxTokens: 1024 }
        );

        const flashcards = JSON.parse(response.text.trim());
        if (Array.isArray(flashcards)) {
          extras.flashcards = flashcards;
        }
      } catch (error) {
        console.error("Failed to generate flashcards:", error);
      }
    })();
    promises.push(flashcardsPromise);
  }

  if (options.style === "actionable-takeaways") {
    const takeawaysPromise = (async () => {
      const takeawaysPrompt = `Based on the following text, extract actionable takeaways organized by category. Return ONLY a JSON array in this format:
[{"category": "category name", "items": ["item 1", "item 2"]}]

Text:
${textSlice}

Return ONLY valid JSON, no additional text.`;

      try {
        const response = await client.generateText(
          [{ role: "user", content: takeawaysPrompt }],
          { maxTokens: 1024 }
        );

        const takeaways = JSON.parse(response.text.trim());
        if (Array.isArray(takeaways)) {
          extras.takeaways = takeaways;
        }
      } catch (error) {
        console.error("Failed to generate takeaways:", error);
      }
    })();
    promises.push(takeawaysPromise);
  }

  // Run all extra generation in parallel
  await Promise.all(promises);

  return extras;
}
