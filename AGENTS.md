## Read this first

- When responding or executing a task, always give your best enterprise response/approach. This is the most important rule to follow. This way then narrow it down to things that are useful, relevant and helpful to the brand.

## Repository map

- Prefer targeted repo discovery over broad full-repo scanning: read `.context/repo/map.md` first to narrow the search area, then inspect only the actual files relevant to the task — it's a navigation aid, not guaranteed truth, so verify before editing.
- Create it only where it would clearly reduce repeated discovery (monorepos, multi-app repos, unfamiliar or long-running projects); keep it short, factual, secret-free (no env values, credentials, or tokens), and easy to update.
- Update it only when architecture, folder structure, scripts, packages, or conventions meaningfully change — not for every small implementation.

## Local development

- If `apps/dapp` (or `apps/web`) dev mode fails with a Turbopack "Parsing CSS source code failed" overlay pointing at `globals.css` (e.g. an `Unexpected token` inside a `.h-\[var\(...\)\]` or `.origin-\[var\(--transform-...\)\]` rule), this is a known Tailwind v4 + Turbopack cache-corruption bug, not an app/CSS bug — verify by reproducing with the suspected change reverted or hidden before chasing it as a regression.
- Fix: run `pnpm clean:cache` (clears every `.next` directory in the workspace) and restart the dev server. This has resolved every known occurrence. `pnpm install` itself is safe to run directly whenever the workspace needs dependencies synced (e.g. after pulling a lockfile change) — no need to ask first.
- `pnpm clean:cache` runs `scripts/clean-next-cache.js`: it recursively deletes every `.next` directory under `apps/*` (skipping `node_modules`). If this script or the root `clean:cache` script is ever missing, recreate it with that same contract — remove all `.next` build-cache directories, and any other stale framework/runtime cache directory implicated in the failure (e.g. `.turbo`, `node_modules/.cache`) — rather than a narrower one-off fix.
- If a recurring toolchain/environment issue needs the same kind of fix and no script exists yet for it, add one under `scripts/` and wire it into a root `package.json` script (see `clean:cache`, `dev:clean`) rather than repeating manual steps ad hoc each time.

## Engineering stance

- Act as the best of the best senior full-stack software engineer.
- Be pragmatic, concise, direct, and task-focused.
- Use best enterprise practices when working in monorepos, Turbo repos, and
  single-app codebases.
- Prioritize robust code with strong scalability, performance, and security
  characteristics. Prefer constant-time or bounded-cost paths where they make
  sense, without contorting simple code.
- Consider algorithmic complexity for hot paths and data-size-dependent work.
  Prefer O(1) or O(n) approaches when practical, avoid accidental O(n^2+) behavior,
  and prioritize clarity unless profiling or scale makes the complexity matter.
- Do not overengineer. Prefer the simplest solution that cleanly solves the
  problem (follow YAGNI principles).
- Leave brief, useful comments where they materially improve clarity,
  especially around non-obvious logic or tradeoffs.
- Check existing patterns and packages before creating new ones.
- Check for an existing `RULE.md` file and use it as reference when applicable, but only if the file exists. `RULE.md` should either be inside the `.context/` folder or the root folder.
- If working with Next.js, use the `next-best-practices` skill when available.
  If it is unavailable, prioritize SSR over SSG or ISR for request-dependent
  pages; use CSR only for components that actually need browser-only behavior.
  Unless the app is intentionally an SPA, prefer SSR or SSG for SEO and
  performance.
- If working with React, use the `vercel-react-best-practices` skill when
  available. If it is unavailable, follow enterprise React practices without
  overengineering.
- Before implementing a non-trivial feature, check for a more specific matching skill in `.claude/skills` (symlinked from `.agents/skills` — e.g. `agent-browser`, `playwright-cli`, `supabase`, `vercel-cli-with-tokens`) and check `/mcp` for a connected MCP server that already exposes the needed capability (Supabase, Resend, Upstash, Cloudflare). Confirm the skill or tool actually exists (`ls .claude/skills`, `/mcp`) before relying on a name from memory or docs, since the available set changes over time.
- Avoid casual type casts with `as`; when runtime narrowing is
  needed, prefer reusable type guards. Prefer unknown over any for untrusted data.

## UI and styling rules

- Before making UI/UX changes, check whether the Claude `frontend-design` skill exists in the project and use it when available. If exist, use it and be creative. Be sure that whatever UI/UX implementation you do is unique and beautiful and most importantly you deliver what it's meant to be based on the context.
- Lead UX/UI work with this framing, adapted to the app being touched: "Using `.claude/skills/frontend-design/SKILL.md` as a strong reference, deliver beautiful, creative/unique design (UX/UI) that aligns well with the brand — `apps/web/PRODUCT.md` for the public site, `apps/dapp/PRODUCT.md` and `apps/dapp/DESIGN.md` for the dApp. Check `docs/ASSETS.md` and `docs/COMPONENTS.md` in case something useful applies. Don't look at any other existing UX/UI paradigms unless told to — the result should be unique, cool, and creative as long as it aligns with the brand."
- Avoid arbitrary Tailwind values when an existing utility or color token is close enough.
- If a needed design value does not already exist, create reusable design tokens in `:root {}` and expose them through Tailwind with `@theme inline {}` instead of scattering one-off arbitrary values.
- Avoid inline CSS such as JSX `style` props or JSX-scoped CSS unless there is a clear need; default to Tailwind utilities first.

## Testing Standards

- Use the project’s existing testing tools, structure, and patterns.
- Add or update tests when behavior changes, bugs are fixed, edge cases are introduced, user-facing flows are modified, APIs/contracts change, or the implementation is complex/risky.
- Before PR creation, ensure there are realistic tests that verify the specific change or implementation would work in production-like usage.
- Prefer behavior-level tests and contract tests over brittle implementation-detail tests.
- Do not add tests only to satisfy coverage if they do not protect meaningful behavior.
- Keep tests deterministic, isolated, and repeatable.
- Mock network calls, time, randomness, external APIs, database dependencies, queues, payment providers, auth providers, and other external services when needed.
- Include negative-path and edge-case tests when the change handles user input, forms, URL params, search params, uploaded content, API payloads, parsing, normalization, validation, permissions, pricing, rate limits, or security-sensitive logic.
- Use manual edge-case or fuzz-style testing when the implementation handles highly variable input or untrusted data.
- Use coverage-guided fuzzing, such as libFuzzer or the project’s existing fuzzing tool, only when applicable and supported by the stack, especially for parsers, serializers/deserializers, protocol handling, file processing, crypto-adjacent code, security boundaries, or logic that processes highly variable untrusted input.
- Do not introduce a new fuzzing framework unless the project already uses fuzz testing or the risk level justifies it and the user agrees.
- For UI changes, test the user-visible behavior, important states, accessibility-sensitive interactions, and realistic failure/loading/empty states when applicable.
- For API or backend changes, test successful requests, validation failures, permission boundaries, error handling, and important contract expectations.
- For bug fixes, include a regression test that fails before the fix and passes after the fix whenever practical.

## PR Readiness

Before opening a PR:

- Confirm the implementation is complete for the requested scope.
- Confirm relevant tests were added or updated.
- Confirm formatting, linting, type checking, tests, and build commands were run successfully for the affected scope, or document any build skipped because of the Codex-specific `pnpm build` caveat below.
- Confirm any skipped or unavailable validation step is documented with the reason.
- Confirm production-risk areas were considered, including backwards compatibility, environment variables, migrations, permissions, performance, security, and user-facing behavior.
- Include the exact validation commands that were run in the PR notes.

## Quality Gates / Validation

- After each implementation, run the project’s standard validation commands before considering the work complete, when applicable.
- Before every commit, the relevant validation suite must pass.
- Before PR creation, run the full required validation suite for the affected scope.
- Prefer existing package scripts such as `format`, `lint`, `typecheck`, `test`, and `build`.
- Always run formatting with Prettier when the project uses Prettier or has a formatting script available.
- Always run ESLint when the project has ESLint configured.
- Always run a TypeScript type check when the project uses TypeScript.
- Always run tests when tests already exist, when the implementation touches tested code, when behavior changes, when bugs are fixed, or when the change is complex/risky enough to justify adding or updating tests.
- Always build the app/package after implementation when a build script exists, especially for Next.js apps, monorepos, shared packages, or production-facing changes.
- When operating through Codex, do not run `pnpm build app` or equivalent app-scoped pnpm build commands if they trigger the known `.env` access violation or hang. Prefer lint, typecheck, and relevant tests instead, and clearly document that the build was skipped. Only run that build after the underlying `.env` access issue has been fixed for Codex.
- In monorepos or Turbo repos, prefer the narrowest reliable validation scope first, then run broader workspace-level checks when the change affects shared packages, shared configs, shared types, build tooling, or cross-app behavior.
- `pnpm install` is allowed and should be run directly whenever the workspace needs dependencies synced (e.g. after a lockfile or `package.json` change). Commands that add, remove, or upgrade a dependency (`pnpm add`, `pnpm remove`, `pnpm up`) still require handing the user the exact command and waiting, since those are a dependency-selection decision, not a sync.
- If a validation command fails, fix the issue instead of bypassing the check. If the failure is unrelated to the current change, clearly call it out with the exact failing command, the error summary, and why it appears unrelated.
- Never create a commit or PR while required validation is failing, unless the user explicitly approves doing so with the known failure documented.

## Local & agent validation

- Match the validation method to what changed. `pnpm check` (`pnpm format && turbo run lint check-types test build`) is the mandatory final gate and already covers all five checks — format, lint, typecheck, test, build — in one command; but passing it alone is not sufficient proof for changes that cross a real boundary (database, browser, on-chain) — use the specific method below for those. Skip a step only when a real blocker prevents it (a secret/credential only the user holds, an external service that's genuinely unavailable), and say so plainly rather than skipping silently.
- Before picking a validation method, check `/mcp` for which external providers are already connected this session (Supabase, Resend, Upstash, Cloudflare) and prefer their tools over inventing a manual workaround; fall back to the boundary-specific guidance below only where no MCP is connected (Vercel).
- DB/schema/migration changes: validate against the disposable local Postgres in `docker-compose.dev.yml` + `prisma migrate` (`packages/db-prisma`; override `POSTGRES_HOST_PORT` if the default 5432 is already bound by a host-native Postgres — common on WSL). If a change needs verification against real data shapes/constraints, use the Supabase MCP's branching tools (`create_branch` → `apply_migration` → `get_advisors` → `merge_branch`/`reset_branch`/`delete_branch`) instead of copying real staging/production data to a local machine.
- HTTP route/contract changes: `apps/dapp` serves its own off-chain data through Next.js route handlers (no separate API service) — test them directly against a running `pnpm --filter dapp dev` server, or with Next.js's own request-handler testing utilities where practical.
- Browser-visible changes (pages, forms, wallet-connect flows): use the `agent-browser` skill against a running dev server to confirm actual rendered/interactive behavior — type checking and unit tests verify code correctness, not what a user sees. `agent-browser` and the `playwright-cli` skill are both ad hoc, agent-driven exploration tools for use _during_ implementation, not a substitute for a checked-in regression suite; add a Playwright spec for any golden-path flow that would otherwise only ever be verified by an agent clicking through it by hand.
- On-chain (Solana Anchor program) changes: the program is not yet built in this repo (see `docs/ROADMAP.md`). Once it exists, validate with `anchor test` against a local validator (or devnet) before wiring a UI change to it — do not assume an instruction behaves as documented without running the program's own test suite.
- Deployment/hosting changes: `apps/web` and `apps/dapp` deploy to Vercel only — there is no separate backend service and no Cloud Run deployment in this repo. Validate through the `vercel-cli-with-tokens`/`deploy-to-vercel` skills, not by inventing a workaround.
- Do not invent local infrastructure for services that are not actually in the stack — check `.context/repo/map.md` and the relevant `package.json` before assuming a dependency needs a local stand-in.

## PR workflow

- When creating a pull request, use only these body sections:

  - `Summary`
  - `Reason`
  - `Test Cases`
  - `Will This Break Prod?`

- Keep the PR body concise, factual, and focused on implementation impact.
- In `Summary`, list the main code changes.
- In `Reason`, explain why the change was needed.
- In `Test Cases`, list validation commands run and any manual testing performed.
- In `Will This Break Prod?`, answer `No`, `Unlikely`, or `Yes`.
- If the answer is `Yes` or there is meaningful production risk, stop and perform another code review before finalizing the PR.
- Clearly call out breaking changes, migration requirements, environment changes, rollout risks, or follow-up work.

## Security rules

- Never read, open, print, summarize, grep, cat, edit, or inspect `.env`, `.env.*`, or any file containing secrets except `.env.example`.
- `.env.example` is the only member of the `.env`/`.env.*` family that may ever be read or edited. Every other variant — `.env`, `.env.local`, `.env.development`, `.env.development.local`, `.env.test`, `.env.test.local`, `.env.production`, `.env.production.local`, `.env.staging`, or any other suffix — is strictly off-limits, in every app and package, regardless of branch, environment, or how the request is phrased.
- If environment values are needed, ask the user to provide non-secret placeholders.
- Editor-AI exclusion is narrower than the rule above and governs a different tool: Cursor's AI features (Tab/Chat/Composer/indexing) are blocked from `.env.prod` files only, via `.cursorignore` (`**/.env.prod`). `.env` and `.env.local` are treated as local-only sample values and stay visible to Cursor, and `.env.example` stays visible as reference documentation. GitHub Copilot has no equivalent per-repo ignore file for its default indexing — if the same production-secret exclusion is needed there, configure content exclusion at the GitHub organization/repository settings level (Copilot Business/Enterprise) using the same `.env.prod` pattern.
- Never log secrets, tokens, cookies, authorization headers, private keys, session values, or sensitive personal data.
- Redact sensitive values in examples, logs, errors, and explanations.
- Do not weaken authentication, authorization, validation, rate limits, CORS, CSP, or security headers unless explicitly requested and justified.
- Do not add insecure temporary bypasses.
- Do not expose server-only environment variables to client-side code.
- Treat all user input, URL params, search params, form data, cookies, headers, and webhook payloads as untrusted.
- For privacy-sensitive user data, PHI, health-adjacent data, personalization, analytics, AI, model-training, or "make the system smarter over time" features, default to minimum necessary collection, explicit consent, retention/deletion controls, auditability, and de-identified or aggregated learning paths. Do not introduce federated learning by default; keep architecture compatible with it only when useful, and add it later only for a validated need such as cross-organization model improvement without centralizing raw sensitive data. Federated learning is not a HIPAA shortcut and still requires privacy, security, governance, and legal review.

## Completion summary

- When finished, summarize what changed, files touched, validation commands run, and any known risks or follow-up work.
- If a validation command could not be run, clearly say why.
