const clientEnv = {
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  NEXT_PUBLIC_ANCHOR_PROGRAM_ID: process.env.NEXT_PUBLIC_ANCHOR_PROGRAM_ID,
};

export const env = (key: keyof typeof clientEnv, optional = false) => {
  if (!clientEnv[key] && !optional) {
    throw new Error(
      `Environment variable ${key} is not set in the client environment`,
    );
  }
  return clientEnv[key];
};
