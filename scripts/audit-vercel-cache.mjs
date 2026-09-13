#!/usr/bin/env node

const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error(
    'Usage: node scripts/audit-vercel-cache.mjs <base-url> [path1 path2 ...]',
  );
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.endsWith('/')
  ? baseUrl.slice(0, -1)
  : baseUrl;

const paths = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ['/en', '/es', '/en/staking', '/en/portfolio', '/en/vaults'];

const getHeader = (headers, key) => headers.get(key) ?? '-';

const run = async () => {
  console.log(`Cache audit for ${normalizedBaseUrl}\n`);

  for (const path of paths) {
    const url = `${normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let response;

    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'user-agent': 'aquastock-cache-audit/1.0',
          accept: 'text/html',
        },
      });
    } catch (error) {
      console.log(`${path} -> request failed: ${String(error)}`);
      continue;
    }

    console.log(`${path}`);
    console.log(`  status:         ${response.status}`);
    console.log(
      `  x-vercel-cache: ${getHeader(response.headers, 'x-vercel-cache')}`,
    );
    console.log(
      `  cache-control:  ${getHeader(response.headers, 'cache-control')}`,
    );
    console.log(`  age:            ${getHeader(response.headers, 'age')}`);
    console.log(`  location:       ${getHeader(response.headers, 'location')}`);
    console.log('');
  }
};

run();
