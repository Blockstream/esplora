// './' paths are same-origin static files from flavor config (e.g. ASSET_MAP_URL), not API paths
export const resolveRequestUrl = (path, apiBase) =>
  path.includes('://') || path.startsWith('./') ? path : apiBase + path
