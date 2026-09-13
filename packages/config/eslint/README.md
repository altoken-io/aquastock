# @aquastock/config/eslint

Shared ESLint config entrypoints used across the monorepo.

## Exports

- `@aquastock/config/eslint/base`
- `@aquastock/config/eslint/next`
- `@aquastock/config/eslint/react-internal`

## Usage

Example in an app/package `eslint.config.mjs`:

```js
import config from '@aquastock/config/eslint/next';

export default config;
```

## Guidelines

- Prefer extending these shared presets instead of copying rules per app.
- Put global rule changes here so behavior stays consistent across workspaces.
