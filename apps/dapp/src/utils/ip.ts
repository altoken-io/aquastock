export const getIpFromHeaders = (h: Headers) => {
  // Common headers to typically store ip-address
  const rawIp =
    h.get('x-forwarded-for') || // standard/proxies
    h.get('x-vercel-forwarded-for') || // Vercel alias of XFF
    h.get('x-real-ip') || // some proxies
    h.get('cf-connecting-ip') || // Cloudflare
    h.get('fly-client-ip') || // Fly.io
    h.get('forwarded'); // RFC 7239: Forwarded: for=...

  if (!rawIp) {
    return null;
  }

  if (rawIp.includes('for=')) {
    // Forwarded: for=203.0.113.7 or for="[2001:db8::1]"
    const m = rawIp.match(/for=(?:"?\[?)([^"\];, ]+)/i);
    return m?.[1] ?? null;
  }

  const firstIp = rawIp.split(',')[0];
  return firstIp ? firstIp.trim() || null : null;
};
