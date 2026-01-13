import type { SummaryStyle, OutputLanguage, DetailLevel } from "../types";

export function buildSummarizationPrompt(
  style: SummaryStyle,
  language: OutputLanguage,
  detailLevel: DetailLevel,
  sectionTitle: string,
  textChunk: string,
  pageRange?: [number, number]
): string {
  const styleInstructions = getStyleInstructions(style);
  const detailInstructions = getDetailInstructions(detailLevel);
  const languageInstructions = getLanguageInstructions(language);

  const pageInfo = pageRange ? `Pages ${pageRange[0]}-${pageRange[1]}` : "";

  return `You are an expert summarizer. Your task is to create a ${style} summary of the following text section.

${styleInstructions}

${detailInstructions}

${languageInstructions}

Section: ${sectionTitle}
${pageInfo}

Text to summarize:
"""
${textChunk}
"""

Please provide the summary in the following structured format:

## Summary

[Your main summary here]

## Key Points

- [Key point 1]
- [Key point 2]
- [etc.]

## Important Details

[Any crucial details, nuances, or context that should not be lost]

${style === "full-context" ? `\n## Nothing Important Lost Check\n\n[List any concepts, definitions, or arguments that might have been omitted or oversimplified. If nothing important was lost, state "No significant omissions."]` : ""}

Remember: ${getStyleReminder(style)}`;
}

function getStyleInstructions(style: SummaryStyle): string {
  const instructions: Record<SummaryStyle, string> = {
    "one-page": `Create a concise overview that captures the essence of the content in 500-1000 words maximum. Focus on the most important insights and conclusions.`,

    "full-context": `Create a high-fidelity summary that preserves ALL important concepts, arguments, definitions, mechanisms, and conclusions. Remove only:
- Repeated examples that don't add new information
- Filler stories without substantive meaning
- Long anecdotes that don't advance the argument
- Redundant rephrasings
Maintain the logical flow and structure of the original.`,

    "eli5": `Explain this content as if explaining to a 5-year-old child. Use:
- Simple, everyday language (avoid jargon)
- Concrete analogies and relatable examples
- Short sentences and clear structure
- Focus on helping someone with no background understand the core ideas`,

    "study-notes": `Create comprehensive study notes with:
- Bullet points organized by key topics
- Important definitions clearly stated
- Main concepts with supporting details
- Relationships between ideas
Format for easy review and memorization.`,

    "actionable-takeaways": `Extract practical, actionable insights:
- Decisions that can be made
- Steps that can be taken
- Frameworks that can be applied
- Specific recommendations or best practices
Focus on what readers can DO with this information.`,

    "flashcards": `Create Q&A pairs suitable for memorization:
- Each question should test understanding of one concept
- Answers should be clear and concise
- Cover key facts, definitions, and relationships
Format each as "Q: [question]\nA: [answer]"`,

    "executive-brief": `Create a high-level executive summary (3-5 minute read) that:
- Focuses on strategic insights and implications
- Highlights key findings and conclusions
- Avoids unnecessary details
- Presents information for quick decision-making
Written for busy professionals who need the essence quickly.`,

    "lecture-mode": `Teach this content step-by-step like a tutor:
- Break down complex ideas into simple building blocks
- Use clear examples for each concept
- Explain the "why" behind ideas, not just the "what"
- Build from fundamentals to more advanced points
- Check understanding with rhetorical questions
Guide the reader through learning the material.`,
  };

  return instructions[style];
}

function getDetailInstructions(level: DetailLevel): string {
  const instructions: Record<DetailLevel, string> = {
    short: "Aim for ~30% of the original length. Be very selective about what to include.",
    medium: "Aim for ~50% of the original length. Balance between brevity and completeness.",
    high: "Aim for ~70% of the original length. Preserve most details and nuances.",
  };

  return instructions[level];
}

function getLanguageInstructions(language: OutputLanguage): string {
  if (language === "persian") {
    return "IMPORTANT: Write your entire response in Persian (Farsi). Use proper Persian grammar and vocabulary.";
  }
  return "Write your response in clear, professional English.";
}

function getStyleReminder(style: SummaryStyle): string {
  const reminders: Record<SummaryStyle, string> = {
    "one-page": "Focus on the big picture and most impactful insights.",
    "full-context": "Preserve all important information - completeness over brevity.",
    "eli5": "Keep it simple and relatable for a complete beginner.",
    "study-notes": "Organize for easy learning and review.",
    "actionable-takeaways": "Focus on practical application and action items.",
    "flashcards": "Make questions clear and answers memorable.",
    "executive-brief": "Strategic insights for decision-makers.",
    "lecture-mode": "Teach clearly and progressively build understanding.",
  };

  return reminders[style];
}

export function buildOutlinePrompt(documentText: string): string {
  return `Analyze the following document and extract its structural outline. Identify all major sections, chapters, and subsections.

Document:
"""
${documentText.slice(0, 10000)}...
"""

Provide a structured outline in the following JSON format:
{
  "outline": [
    {
      "title": "Section title",
      "level": 1,
      "position": 0
    }
  ],
  "confidence": 0.85
}

Where:
- level: 1 for top-level sections, 2 for subsections, etc.
- position: character position in document where section starts
- confidence: 0-1 score indicating how confident you are about the structure

Return ONLY valid JSON, no additional text.`;
}
