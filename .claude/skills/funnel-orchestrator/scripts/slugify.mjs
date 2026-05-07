// Convert a client/business name into a filesystem-safe slug.
// "Strong Method Coaching" → "strong-method-coaching"
export function slugify(name) {
  return String(name || 'client')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'client';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(slugify(process.argv[2] || ''));
}
