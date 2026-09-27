/**
 * Resolves a public asset path against Vite's base URL (e.g. '/Venn/' on GitHub Pages).
 * Handles leading slashes, existing base prefixes, and absolute URLs gracefully.
 */
export function resolveAssetUrl(path: string): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const base = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BASE_URL : '') || '/';
  if (base !== '/' && path.startsWith(base)) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
