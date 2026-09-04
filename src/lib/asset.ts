/**
 * Resolve a path in `public/` against the deployed base.
 *
 * On GitHub Pages the site is served from `/<repo>/`, not `/`, so a hard-coded
 * `/img/work-01.webp` 404s there. Vite substitutes `import.meta.env.BASE_URL` at
 * build time, so this is the one place that needs to know.
 */
export function asset(path: string) {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
