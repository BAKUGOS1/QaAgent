import type { AppConfig } from "../config.js";

export interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface GroqToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface GroqResponse {
  content: string;
  toolCalls: GroqToolCall[];
}

export class GroqClient {
  constructor(private readonly config: AppConfig) {}

  assertReady(): void {
    if (!this.config.groqApiKey) {
      throw new Error("GROQ_API_KEY is missing. Add it to .env.local or .env, then rerun npm run agent:api.");
    }
  }

  async chat(messages: GroqMessage[], tools: unknown[], model: string): Promise<GroqResponse> {
    this.assertReady();
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.groqApiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2
      })
    });
    if (!response.ok) {
      throw new Error(`Groq request failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json() as {
      choices: Array<{ message: { content?: string; tool_calls?: GroqToolCall[] } }>;
    };
    const message = data.choices[0]?.message;
    return { content: message?.content || "", toolCalls: message?.tool_calls || [] };
  }
}
