import Anthropic from "@anthropic-ai/sdk";

export interface AIResponse {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export abstract class AIClient {
  abstract generateText(
    messages: AIMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<AIResponse>;
}

export class AnthropicClient extends AIClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async generateText(
    messages: AIMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<AIResponse> {
    const { maxTokens = 4096, temperature = 0.7 } = options;

    console.log("[AI] Sending request to Claude...");
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        temperature,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      console.log(`[AI] Response received in ${Date.now() - startTime}ms`);

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      return {
        text: textContent.text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error(`[AI] Error after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  }
}

export function createAIClient(): AIClient {
  const provider = process.env.AI_PROVIDER || "anthropic";
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (provider === "anthropic") {
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    return new AnthropicClient(anthropicKey);
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}
