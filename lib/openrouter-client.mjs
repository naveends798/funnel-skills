// OpenRouter client — used for Perplexity Sonar fallback when Apify isn't available.
// Docs: https://openrouter.ai/docs

const API = 'https://openrouter.ai/api/v1';

function key() {
  return process.env.OPENROUTER_API_KEY;
}

export function hasOpenRouter() {
  return Boolean(key());
}

// Query Perplexity Sonar Pro via OpenRouter. Returns the assistant's text + citations.
export async function perplexitySonar(query, { model = 'perplexity/sonar-pro' } = {}) {
  if (!key()) throw new Error('OPENROUTER_API_KEY not set');
  const r = await fetch(`${API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/naveends798/funnel-skills',
      'X-Title': 'funnel-skills',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a research assistant. Be precise, cite sources, prefer recent data.' },
        { role: 'user', content: query },
      ],
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`OpenRouter ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = await r.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    citations: data.citations || data.choices?.[0]?.message?.citations || [],
    raw: data,
  };
}
