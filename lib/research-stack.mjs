// Tiered research: Apify → OpenRouter Perplexity → tell caller to use WebSearch.
//
// This module returns structured results. When neither paid source is available,
// it returns { source: 'fallback' } with hints — the calling skill should then
// use the Claude Code-native WebSearch / WebFetch tools (which are free + built-in
// but require the LLM to drive, not a Node script).

import { hasApify, googleSearch, fetchUrl, redditSearch } from './apify-client.mjs';
import { hasOpenRouter, perplexitySonar } from './openrouter-client.mjs';

/**
 * @param {string} query - Natural language research question
 * @param {object} opts
 * @param {'standard'|'deep'} opts.depth
 * @param {'general'|'competitor'|'reviews'|'pain_points'|'pricing'} opts.intent
 */
export async function research(query, { depth = 'standard', intent = 'general' } = {}) {
  if (hasApify()) return researchWithApify(query, { depth, intent });
  if (hasOpenRouter()) return researchWithOpenRouter(query);
  return {
    source: 'fallback',
    query,
    hint: 'Neither APIFY_TOKEN nor OPENROUTER_API_KEY is set. The calling skill should now use WebSearch / WebFetch tools to research this query.',
    suggested_websearch_queries: suggestWebSearchQueries(query, intent),
  };
}

async function researchWithApify(query, { depth, intent }) {
  const out = { source: 'apify', query, depth, intent, results: {} };
  try {
    if (intent === 'pain_points' || intent === 'reviews') {
      const reddit = await redditSearch(query, { maxItems: depth === 'deep' ? 30 : 15 });
      out.results.reddit = (reddit || []).slice(0, 30).map((p) => ({
        title: p.title || p.heading || '',
        url: p.url || p.link || '',
        score: p.score || p.upvotes || 0,
        text: (p.text || p.body || '').slice(0, 800),
        comments: p.numberOfComments || 0,
      }));
    }
    const search = await googleSearch(query, { maxResults: depth === 'deep' ? 15 : 10 });
    const flat = [];
    for (const page of search || []) {
      for (const item of page.organicResults || []) {
        flat.push({
          title: item.title,
          url: item.url,
          description: item.description,
        });
      }
    }
    out.results.google = flat.slice(0, depth === 'deep' ? 20 : 10);
  } catch (err) {
    out.partial_failure = err.message;
  }
  return out;
}

async function researchWithOpenRouter(query) {
  try {
    const { text, citations } = await perplexitySonar(query);
    return { source: 'perplexity', query, results: { summary: text, citations } };
  } catch (err) {
    return { source: 'perplexity', query, error: err.message };
  }
}

function suggestWebSearchQueries(query, intent) {
  switch (intent) {
    case 'competitor':
      return [`${query} competitors`, `${query} alternatives 2026`, `${query} vs comparison`];
    case 'reviews':
      return [`${query} review`, `${query} reddit complaints`, `${query} trustpilot`];
    case 'pain_points':
      return [`${query} biggest problem`, `${query} struggles reddit`, `${query} frustration`];
    case 'pricing':
      return [`${query} pricing`, `${query} price comparison`, `${query} cost 2026`];
    default:
      return [query, `${query} 2026`, `${query} guide`];
  }
}

// Quick CLI for skills that want a one-shot research call from Bash.
// Usage: node lib/research-stack.mjs "<query>" [--intent=competitor] [--depth=deep]
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const query = args.find((a) => !a.startsWith('--')) || '';
  const intent = (args.find((a) => a.startsWith('--intent='))?.split('=')[1]) || 'general';
  const depth = (args.find((a) => a.startsWith('--depth='))?.split('=')[1]) || 'standard';
  if (!query) {
    console.error('usage: node lib/research-stack.mjs "<query>" [--intent=...] [--depth=...]');
    process.exit(1);
  }
  research(query, { intent, depth }).then((r) => console.log(JSON.stringify(r, null, 2)));
}
