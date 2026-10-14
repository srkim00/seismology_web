/** Prefix an internal root-relative URL with Astro's configured base path. */
export const withBase = (path: string): string => {
  if (!path.startsWith("/")) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}` || "/";
};
