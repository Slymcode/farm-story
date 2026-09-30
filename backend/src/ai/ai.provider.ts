import Anthropic from '@anthropic-ai/sdk';

export const AI_PROVIDER = 'AI_PROVIDER';

/** Swap providers by implementing this interface and changing the factory in AiModule. */
export interface AiProvider {
  isConfigured(): boolean;
  complete(args: { system: string; prompt: string; maxTokens?: number }): Promise<string>;
}

export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic | null;
  constructor(apiKey: string | undefined, private readonly model: string) {
    // 20s timeout and a single retry keep the UI responsive on poor connections.
    this.client = apiKey ? new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 }) : null;
  }
  isConfigured() { return this.client !== null; }
  async complete({ system, prompt, maxTokens = 700 }: { system: string; prompt: string; maxTokens?: number }) {
    if (!this.client) throw new Error('AI provider not configured');
    const res = await this.client.messages.create({ model: this.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: prompt }] });
    return res.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  }
}
