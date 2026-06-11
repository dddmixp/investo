# Investo — Project Constitution

## Product Summary

**Investo** is a personal real estate investment tracking web system for a solo owner.
It covers the full lifecycle of property investments: acquisition, bank loans, renovation,
renting, selling, accounting, invoicing, payments, and renter management.
A companion mobile app (Expo/React Native) provides notifications, on-the-go tracking,
and document uploads. AI automatically reads uploaded documents (contracts, invoices, loan
agreements) and populates structured data — minimising manual data entry.

**Target user:** Single owner managing a personal property portfolio.

**Core features (MVP):**
- Property dashboard (portfolio overview, valuations, status)
- Transaction ledger (purchases, loans, renovations, rent income, sale proceeds)
- Renter management (contracts, payments, contact info)
- Document vault (upload + AI extraction)
- Invoicing & basic accounting
- Mobile app (Expo) for notifications + document capture
- AI document parser (Claude API) — reads PDFs/images, populates forms

---

## Tech Stack

| Layer | Choice |
|---|---|
| Web framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (Postgres + Auth + Storage) — free tier |
| AI | Claude API (document parsing) |
| Mobile | Expo / React Native |
| Tests | Vitest (unit/integration), Playwright (e2e) |
| Linting | ESLint (eslint-config-next), Prettier |
| CI/CD | GitHub Actions + Vercel (personal/non-commercial) |

---

## Architecture Decisions

Full ADR at `docs/adr/0001-architecture.md`. Key decisions:

- **Money:** stored as integer EUR cents everywhere. Display via `formatEUR()` in `src/lib/format.ts`
- **Auth:** Supabase Auth (email+password), single owner. `auth.uid() = owner_id` RLS on every table
- **Storage:** Supabase Storage, private bucket `documents`. Path: `{owner_id}/{entity_type}/{entity_id}/{uuid}.{ext}`
- **Documents:** polymorphic — single `documents` table with `entity_type` + `entity_id` columns
- **AI extraction:** async — upload first, then POST `/api/documents/extract`, owner reviews pre-filled form
- **Mobile comms:** WhatsApp deep-links only (`https://wa.me/{number}`), no Business API
- **Supabase region:** EU Frankfurt (data residency for Bulgarian properties)
- **Mobile:** Expo managed workflow, NativeWind, shared Supabase JS client

Key contracts in `docs/adr/0001-architecture.md` — Interface Contract section.

---

## Folder Structure

```
investo/
  src/
    app/              # Next.js App Router pages & layouts
    components/       # Shared UI components
    lib/              # Business logic, utilities, API clients
    hooks/            # React hooks
    types/            # Shared TypeScript types
    test/             # Test setup & shared fixtures
  tests/
    e2e/              # Playwright end-to-end tests
  docs/
    adr/              # Architecture Decision Records
    specs/            # Feature specs & PRDs
  .github/
    workflows/        # CI/CD workflows
  .claude/
    agents/           # Subagent role definitions
```

---

## Conventions

### Code
- **Language:** TypeScript everywhere. No `any`. Strict mode on.
- **Components:** React functional components, named exports.
- **Imports:** use `@/` alias for src-relative imports.
- **Env vars:** all via `process.env`, documented in `.env.example`. Never hardcoded.
- **Secrets:** never in code or logs. Use Supabase RLS for data security.

### Commit Messages — Conventional Commits
```
<type>(<scope>): <short description>

feat(properties): add property valuation chart
fix(auth): handle expired session redirect
chore(deps): bump next to 16.3.0
test(invoices): add coverage for overdue calculation
docs(adr): record Supabase choice
```
Types: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`, `perf`, `ci`

### Branch Naming
```
agent/<issue-number>-<kebab-slug>
# e.g. agent/12-property-valuation-chart
```

---

## Definition of Done

A PR is mergeable only when ALL of the following are true:

- [ ] Code implements the issue's acceptance criteria
- [ ] Unit/integration tests cover ≥80% of **changed lines**
- [ ] `npm run lint` — zero errors
- [ ] `npm run typecheck` — zero errors
- [ ] `npm run test` — all pass
- [ ] PR description explains **what** changed and **why**
- [ ] No secrets, no `console.log`, no commented-out code left in
- [ ] `docs/` updated if public interfaces changed

---

## Rules for Agents

1. **One issue per PR.** Keep diffs small and focused.
2. **Never push directly to `main`.** Always open a PR from `agent/<n>-<slug>`.
3. **Never modify `.github/workflows/` or `CLAUDE.md`** without a `needs-human` label on the issue.
4. **Never store secrets in code.** Use env vars; document in `.env.example`.
5. **When blocked**, add comment to the PR/issue explaining the blocker and add `agent-blocked` label. Do not guess.
6. **When uncertain about scope**, label `needs-human` and stop. Do not expand scope.
7. **Prefer Sonnet** for routine implementation. Reserve Opus for architecture and security review.
8. **Read `docs/adr/` and `docs/specs/`** before starting any issue. Follow the contracts.
9. **Run tests before opening PR.** A PR that fails CI should not be opened.
10. **No backwards-compat shims.** If something is removed, delete it.
