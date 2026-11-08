const DEFAULT_PUBLIC_APP_URL = "https://sprint-2.adityatambe.ca";

export function isLocalURL(url?: string) {
  return Boolean(url && /(localhost|127\.0\.0\.1)/i.test(url));
}

function normalizeURL(url: string) {
  return url.replace(/\/$/, "");
}

export function resolveAppURL({
  browserOrigin,
  requestOrigin,
}: {
  browserOrigin?: string;
  requestOrigin?: string;
} = {}) {
  const envAppURL = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  const inferredVercelURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined;

  const preferredOrigin = browserOrigin || requestOrigin;

  if (preferredOrigin && !isLocalURL(preferredOrigin)) {
    return normalizeURL(preferredOrigin);
  }

  if (envAppURL && !isLocalURL(envAppURL)) {
    return normalizeURL(envAppURL);
  }

  if (inferredVercelURL) {
    return normalizeURL(inferredVercelURL);
  }

  if (preferredOrigin) {
    return normalizeURL(preferredOrigin);
  }

  if (envAppURL) {
    return normalizeURL(envAppURL);
  }

  return DEFAULT_PUBLIC_APP_URL;
}
