export interface TranslationResult {
  text: string;
  provider: 'openai' | 'anthropic';
}

interface LlmConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
}

function getLlmConfig(): LlmConfig | undefined {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiKey) {
    return { provider: 'openai', apiKey: openaiKey };
  }

  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return { provider: 'anthropic', apiKey: anthropicKey };
  }

  return undefined;
}

function buildPrompt(text: string): string {
  return `Translate the following film synopsis into natural, concise German suitable for a cinema website. Preserve the tone and meaning. Do not add extra commentary or labels.

Synopsis:
${text}`;
}

async function translateWithOpenAI(apiKey: string, text: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful translator. Translate film synopses into natural German for a Berlin cinema audience. Keep the translation concise and faithful to the original.',
        },
        { role: 'user', content: buildPrompt(text) },
      ],
      temperature: 0.3,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const translated = data.choices?.[0]?.message?.content?.trim();

  if (!translated) {
    throw new Error('OpenAI returned an empty translation');
  }

  return translated;
}

async function translateWithAnthropic(apiKey: string, text: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      temperature: 0.3,
      system:
        'You are a helpful translator. Translate film synopses into natural German for a Berlin cinema audience. Keep the translation concise and faithful to the original.',
      messages: [{ role: 'user', content: buildPrompt(text) }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${body}`);
  }

  const data = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const translated = data.content?.find((c) => c.type === 'text')?.text?.trim();

  if (!translated) {
    throw new Error('Anthropic returned an empty translation');
  }

  return translated;
}

export async function translateToGerman(text: string): Promise<TranslationResult | null> {
  const config = getLlmConfig();
  if (!config) {
    return null;
  }

  if (config.provider === 'openai') {
    const translated = await translateWithOpenAI(config.apiKey, text);
    return { text: translated, provider: 'openai' };
  }

  const translated = await translateWithAnthropic(config.apiKey, text);
  return { text: translated, provider: 'anthropic' };
}

export function hasLlmKey(): boolean {
  return Boolean(getLlmConfig());
}
