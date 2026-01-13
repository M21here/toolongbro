"use server";

import { parseDocument } from "@/lib/parsers";
import { createAIClient } from "@/lib/ai/client";
import { runSummarizationPipeline } from "@/lib/summarization";
import type { SummaryOptions, SummaryResult } from "@/lib/types";
import { verifyPrivyToken } from "@/lib/privy-server";
import { syncPrivyUser } from "@/lib/user-sync";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds (reduced for testing)
const RATE_LIMIT_MAX = parseInt(
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || "1"
);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip) || 0;

  if (now - lastRequest < RATE_LIMIT_WINDOW) {
    return false;
  }

  rateLimitMap.set(ip, now);
  return true;
}

export async function processSummarization(
  formData: FormData,
  options: SummaryOptions
): Promise<{ success: true; result: SummaryResult } | { success: false; error: string }> {
  try {
    // Verify authentication with Privy
    const user = await verifyPrivyToken();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized. Please log in to continue.",
      };
    }

    // Sync user to database
    await syncPrivyUser(user.userId, user.email);

    // Rate limiting (simplified - in production use a proper solution)
    const ip = user.userId; // Use userId for rate limiting
    if (!checkRateLimit(ip)) {
      return {
        success: false,
        error: "Rate limit exceeded. Please wait before trying again.",
      };
    }

    // Get file from form data
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { success: false, error: "File size exceeds 50MB limit" };
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type" };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse document
    const fileType = file.type;
    const parsedDoc = await parseDocument(buffer, fileType);

    // Create AI client
    const aiClient = createAIClient();

    // Run summarization pipeline
    const result = await runSummarizationPipeline(
      aiClient,
      parsedDoc,
      options
    );

    return { success: true, result };
  } catch (error) {
    console.error("Summarization error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during processing",
    };
  }
}

export async function exportToMarkdown(result: SummaryResult): Promise<string> {
  let markdown = `# ${result.metadata.title || "Summary"}\n\n`;

  if (result.metadata.author) {
    markdown += `**Author:** ${result.metadata.author}\n\n`;
  }

  markdown += `**Generated:** ${new Date(result.metadata.generatedAt).toLocaleDateString()}\n`;
  markdown += `**Style:** ${result.metadata.style}\n`;
  markdown += `**Detail Level:** ${result.metadata.detailLevel}\n`;
  markdown += `**Word Count:** ${result.metadata.wordCount.toLocaleString()}\n\n`;

  markdown += `---\n\n`;

  // Add outline
  markdown += `## Table of Contents\n\n`;
  for (const node of result.outline) {
    const indent = "  ".repeat(node.level - 1);
    markdown += `${indent}- [${node.title}](#${node.id})\n`;
  }
  markdown += `\n`;

  // Add summary content
  for (const block of result.summary) {
    const heading = "#".repeat(block.level + 1);
    markdown += `${heading} ${block.title} {#${block.nodeId}}\n\n`;

    if (block.citations) {
      markdown += `*${block.citations.join(", ")}*\n\n`;
    }

    markdown += `${block.content}\n\n`;

    if (block.keyPoints && block.keyPoints.length > 0) {
      markdown += `**Key Points:**\n\n`;
      for (const point of block.keyPoints) {
        markdown += `- ${point}\n`;
      }
      markdown += `\n`;
    }

    if (block.importantDetails && block.importantDetails.length > 0) {
      markdown += `**Important Details:**\n\n`;
      for (const detail of block.importantDetails) {
        markdown += `> ${detail}\n\n`;
      }
    }
  }

  // Add extras
  if (result.extras) {
    if (result.extras.glossary && result.extras.glossary.length > 0) {
      markdown += `## Glossary\n\n`;
      for (const item of result.extras.glossary) {
        markdown += `**${item.term}:** ${item.definition}\n\n`;
      }
    }

    if (result.extras.flashcards && result.extras.flashcards.length > 0) {
      markdown += `## Flashcards\n\n`;
      for (let i = 0; i < result.extras.flashcards.length; i++) {
        const card = result.extras.flashcards[i];
        markdown += `### Card ${i + 1}\n\n`;
        markdown += `**Q:** ${card.question}\n\n`;
        markdown += `**A:** ${card.answer}\n\n`;
      }
    }

    if (result.extras.takeaways && result.extras.takeaways.length > 0) {
      markdown += `## Actionable Takeaways\n\n`;
      for (const takeaway of result.extras.takeaways) {
        markdown += `### ${takeaway.category}\n\n`;
        for (const item of takeaway.items) {
          markdown += `- ${item}\n`;
        }
        markdown += `\n`;
      }
    }
  }

  return markdown;
}
