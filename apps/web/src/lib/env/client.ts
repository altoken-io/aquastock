const clientEnv = {
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_DAPP_URL: process.env.NEXT_PUBLIC_DAPP_URL,
};

export const env = (key: keyof typeof clientEnv, optional = false) => {
  if (!clientEnv[key] && !optional) {
    throw new Error(
      `Environment variable ${key} is not set in the client environment`,
    );
  }
  return clientEnv[key];
};
