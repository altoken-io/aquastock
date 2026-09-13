# apps/web

Marketing and public web experience for AquaStock.

## Responsibilities

- Public landing pages and product narrative
- Localized content (`en`, `es`) via `next-intl`
- Shared footer/navbar/SEO metadata content

## Run Locally

```bash
pnpm --filter web dev
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
```

Default local URL: `http://localhost:3000`

## Important Paths

- `src/app/(frontend)/[locale]/*` localized routes
- `src/lib/i18n/*` routing/request config
- `src/modules/*` feature modules
- `src/app/globals.css` global design utilities

## Environment Notes

- `NEXT_PUBLIC_BASE_URL` used for metadata canonical/base URLs
- Keep `.env` local-only; do not commit secrets

## Content and i18n

- Messages are sourced from `@aquastock/locales` (`packages/locales/src/messages`)
- Add new namespaces in both `en` and `es` and export them in locale `index.ts`
