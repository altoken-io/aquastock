const serverEnv = {
  ARCJET_KEY: process.env.ARCJET_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_NEWSLETTER_AUDIENCE_ID: process.env.RESEND_NEWSLETTER_AUDIENCE_ID,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
};

// Optional environment variables in development
const OPTIONAL_IN_DEV = ['ARCJET_KEY', 'NEXT_PUBLIC_BASE_URL'] as const;

export const env = (key: keyof typeof serverEnv) => {
  const optionalInDevKeys =
    OPTIONAL_IN_DEV as readonly (keyof typeof serverEnv)[];
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  // Make certain keys optional in development or build phase
  if (
    !serverEnv[key] &&
    (process.env.NODE_ENV !== 'production' || isBuildPhase)
  ) {
    if (optionalInDevKeys.includes(key) || isBuildPhase) {
      if (key === 'DATABASE_URL' || key === 'DIRECT_URL') {
        return 'postgresql://postgres:postgres@localhost:5432/db';
      }
      if (key.endsWith('_URL') || key.endsWith('_HOST')) {
        return 'http://localhost:3000';
      }
      return `dev-mode-${key.toLowerCase()}-disabled`;
    }
  }

  if (!serverEnv[key]) {
    throw new Error(
      `Environment variable ${key} is not set in the server environment`,
    );
  }
  return serverEnv[key];
};
