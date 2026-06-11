# PROJECT KICKOFF BRIEF — Autonomous Agent Development Pipeline

> **Instructions for Claude Code:** You are bootstrapping a solo-developer project that will be
> built largely by autonomous Claude Code agents with quality gates. Read this entire file,
> then execute the phases in order. Ask the user the questions in Phase 0 before touching anything.
> Work step by step and confirm completion of each phase before moving to the next.

---

## Context (decided in prior planning)

- **Owner:** single developer, no team.
- **Hosting:** GitHub (public repo, to get unlimited free Actions minutes) + Vercel **Hobby** plan.
- **Constraint: $0 additional spend.** Claude usage runs on the owner's existing subscription via
  `CLAUDE_CODE_OAUTH_TOKEN` (generated with `claude setup-token`) — never an API key.
- **Operating model:** "autonomous in bursts, quota-aware" — NOT literal 24/7 parallel teams.
  Scheduled GitHub Actions pick up one backlog task at a time with a single headless agent.
  Parallel agent teams are reserved for occasional interactive big pushes by the owner.
- **Human gate:** production deploys ALWAYS require the owner's manual approval
  (GitHub environment protection rule). Staging deploys are automatic.
- **Vercel quota protection:** preview deploys are disabled for agent branches; only `main`
  (staging) and the production promotion deploy. Hobby caps: 100GB bandwidth, 100K function
  invocations, 1 concurrent build, 100 deploys/day, no overages — the pipeline must stay
  well under these.

## Phase 0 — Interview the owner (do this FIRST, before any setup)

Ask, one at a time, and record answers at the top of CLAUDE.md later:
1. What is the project? (one-paragraph product description, target users, core features)
2. Tech stack preference? (default if unsure: Next.js + TypeScript + Tailwind on Vercel,
   Vitest + Playwright for tests, ESLint + Prettier)
3. Is this commercial or personal/non-commercial? (If commercial → warn that Vercel Hobby
   prohibits commercial use; plan a later upgrade to Vercel Pro, but proceed.)
4. Database / backend needs? (prefer free tiers: e.g., Neon/Supabase free Postgres, or none)
5. Project name (kebab-case, used for repo + Vercel project).
6. Confirm `gh` CLI and `vercel` CLI are installed and authenticated
   (`gh auth status`, `vercel whoami`). If not, give the user the exact commands and wait.

## Phase 1 — Repository bootstrap

1. `git init`, create the stack scaffold from Phase 0 answers (e.g. `create-next-app`).
2. Create a **public** GitHub repo with `gh repo create <name> --public`, push `main`.
3. Configure branch protection on `main`: require PRs, require status checks (`ci`), no force push.
4. Create a `production` GitHub Environment with **required reviewer = the owner**.
5. Create labels for the agent backlog: `agent-ready`, `agent-blocked`, `needs-human`,
   `bug`, `feature`, `tech-debt`, `drift`.

## Phase 2 — CLAUDE.md (project constitution)

Create `CLAUDE.md` at the repo root containing:
- Product summary + goals (from Phase 0).
- Architecture decisions & interface contracts (fill in during Phase 6 planning).
- Conventions: language, framework, folder structure, naming, commit message format
  (Conventional Commits), branch naming (`agent/<issue-number>-<slug>`).
- **Definition of Done:** code + tests (≥80% coverage on changed lines) + lint clean +
  types clean + docs updated + PR description explains what/why.
- Rules for agents: small PRs (one issue per PR), never touch `main` directly, never
  modify CI workflows or CLAUDE.md without a `needs-human` label, never store secrets in code,
  ask via PR comment when blocked instead of guessing.

## Phase 3 — Agent role definitions (`.claude/agents/`)

Create these subagent definition files (Markdown with YAML frontmatter: name, description,
tools, model). Keep read-only roles restricted to read/search tools only.

| File | Role | Tools | Notes |
|---|---|---|---|
| `analyst.md` | BA: turns ideas into specs in `docs/specs/`, acceptance criteria, edge cases | read-only + write to docs/ | asks clarifying questions |
| `architect.md` | Writes/updates ADRs in `docs/adr/`, decomposes epics into small independent GitHub issues with interface contracts | read-only + docs | plan-mode mindset |
| `developer.md` | Implements one issue per branch/PR, follows CLAUDE.md DoD | full edit + bash | small diffs |
| `test-engineer.md` | Writes/repairs unit, integration, e2e tests; raises coverage | full edit + bash | owns test quality |
| `code-reviewer.md` | Reviews diffs for correctness, security, conventions, performance | read-only | outputs structured review |
| `debugger.md` | Investigates failing CI / bugs, produces root-cause + fix PR | full edit + bash | triggered by failures |
| `devops.md` | Maintains workflows, vercel.json, scripts | edit limited to .github/, scripts/ | changes need `needs-human` review |

## Phase 4 — Hooks (`.claude/settings.json`)

- `PostToolUse` on Edit/Write: run Prettier + ESLint --fix on the touched file.
- `PostToolUse` on Edit/Write of source files: run the affected tests (fast scope).
- `PreToolUse` on Bash: block destructive commands (`rm -rf`, `git push --force`,
  `vercel --prod`, anything touching `.env`).

## Phase 5 — CI/CD (GitHub Actions) and Vercel

Create:
1. **`.github/workflows/ci.yml`** — on every PR: install, lint, typecheck, unit + integration
   tests, coverage gate (fail < 80% on changed lines), build.
2. **`.github/workflows/claude-review.yml`** — official `anthropics/claude-code-action@v1` with
   `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` reviewing every PR
   (security, logic, conventions vs CLAUDE.md). Also responds to `@claude` mentions.
3. **`.github/workflows/agent-worker.yml`** — `schedule:` cron every 4 hours + manual dispatch:
   - finds the oldest open issue labeled `agent-ready` not already claimed,
   - comments "claimed", creates branch `agent/<n>-<slug>`,
   - runs headless Claude Code (OAuth token) with the developer agent prompt + issue body,
   - opens a PR referencing the issue; on quota/rate-limit failure exits gracefully
     (next scheduled run retries).
4. **`.github/workflows/deploy.yml`** — on merge to `main`: deploy to Vercel (staging),
   run Playwright smoke tests against the staging URL; then a `production` environment job
   (waits for owner approval) that promotes to production via `vercel promote`.
5. **`vercel.json` + Vercel project settings** — link the repo with `vercel link`; set
   `git.deploymentEnabled` so ONLY `main` auto-deploys (no preview deploys for `agent/*`
   branches); document required Vercel env vars.
6. Tell the user exactly which secrets to add and how:
   - `CLAUDE_CODE_OAUTH_TOKEN` → run `claude setup-token` locally, paste into
     repo Settings → Secrets → Actions.
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (from `vercel link` output / dashboard).

## Phase 6 — Planning sprint (interactive, with the owner)

1. Run as `analyst`: interview the owner, produce `docs/specs/PRD.md`.
2. Run as `architect`: produce `docs/adr/0001-architecture.md` + system design, then decompose
   the MVP into 10–25 SMALL GitHub issues (each ≤ ~half a day of agent work, independent,
   with explicit acceptance criteria and interface contracts). Label the unblocked ones
   `agent-ready`.
3. Update CLAUDE.md with the decided architecture + contracts.

## Phase 7 — Dry run & handoff

1. Manually trigger `agent-worker.yml` once; watch it claim an issue, open a PR, pass CI,
   get Claude review. Owner merges; verify staging deploy + smoke tests; approve production once.
2. Write `docs/RUNBOOK.md`: how to add backlog items, how the schedule works, what to do on
   quota exhaustion, how to run a parallel agent-team burst locally
   (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), weekly "architect drift review" instructions.
3. Summarize for the owner: what runs automatically, what needs them (production approvals,
   `needs-human` PRs, backlog grooming).

## Standing rules (apply throughout)

- Prefer Sonnet for routine work; reserve the strongest model for architecture and review.
- Never create or commit secrets. Never bypass the production approval gate.
- Keep every change small and reversible. When uncertain → label `needs-human` and stop.
