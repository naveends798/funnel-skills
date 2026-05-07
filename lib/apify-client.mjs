// Thin Apify client. Synchronous run-and-wait — fine for our use case (a few searches per skill).
// Docs: https://docs.apify.com/api/v2

const API = 'https://api.apify.com/v2';

function token() {
  return process.env.APIFY_TOKEN;
}

export function hasApify() {
  return Boolean(token());
}

// Run an actor and wait for the dataset. Returns the items array.
// actorId examples:
//   'apify/google-search-scraper'
//   'apify/cheerio-scraper'
//   'trudax/reddit-scraper-lite'
//   'clockworks/free-tiktok-scraper'
export async function runActor(actorId, input, { timeoutSecs = 90 } = {}) {
  if (!token()) throw new Error('APIFY_TOKEN not set');
  const url = `${API}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token()}&timeout=${timeoutSecs}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Apify ${actorId} ${r.status}: ${body.slice(0, 300)}`);
  }
  return r.json();
}

// Convenience: Google Search via apify/google-search-scraper
export async function googleSearch(query, { maxResults = 10, country = 'us' } = {}) {
  return runActor('apify/google-search-scraper', {
    queries: query,
    maxPagesPerQuery: 1,
    resultsPerPage: maxResults,
    countryCode: country.toLowerCase(),
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
  });
}

// Convenience: fetch and parse a single URL via apify/cheerio-scraper
export async function fetchUrl(url) {
  const items = await runActor('apify/cheerio-scraper', {
    startUrls: [{ url }],
    pageFunction: `async ({ $, request }) => ({
      url: request.url,
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content') || '',
      h1: $('h1').first().text(),
      bodyText: $('body').text().replace(/\\s+/g, ' ').trim().slice(0, 5000),
    })`,
    maxRequestsPerCrawl: 1,
  });
  return items[0] || null;
}

// Convenience: Reddit search via trudax/reddit-scraper-lite
export async function redditSearch(query, { maxItems = 20 } = {}) {
  return runActor('trudax/reddit-scraper-lite', {
    searches: [query],
    type: 'posts',
    sort: 'relevance',
    time: 'year',
    maxItems,
  });
}
