# Investo — Runbook

## How the system works

```
GitHub Issues (agent-ready)
        ↓  every 4 hours
  agent-worker.yml
        ↓  claims issue, creates branch agent/<n>-<slug>
  Claude Code (developer agent)
        ↓  writes code, opens PR
  CI (ci.yml)
        ↓  lint + typecheck + tests + build
  Claude Review (claude-review.yml)
        ↓  APPROVE / REQUEST CHANGES / BLOCK
  You merge the PR
        ↓
  Deploy to staging (deploy.yml)
        ↓  e2e smoke tests pass
  You approve production gate
        ↓
  Production deploy (Vercel promote)
```

---

## Daily operations

### Add a new feature to the backlog
1. Go to github.com/dddmixp/investo/issues/new
2. Write title + body with context and acceptance criteria
3. Add label **agent-ready** and **phase-1** (or phase-2/3)
4. Done — agent picks it up within 4 hours

### Check agent progress
```bash
gh run list --repo dddmixp/investo --workflow agent-worker.yml
gh issue list --repo dddmixp/investo --label agent-in-progress
gh pr list --repo dddmixp/investo
```

### Merge a PR
1. Check Claude's review comment on the PR (APPROVE / REQUEST CHANGES / BLOCK)
2. Review the diff yourself
3. Merge — staging deploy triggers automatically
4. Watch staging smoke tests pass: `gh run list --repo dddmixp/investo --workflow deploy.yml`
5. Go to github.com/dddmixp/investo/actions → Deploy run → Approve production gate

### Manually trigger the agent worker (don't wait for cron)
```bash
gh workflow run agent-worker.yml --repo dddmixp/investo
```

---

## When things go wrong

### Agent opened a PR that fails CI
1. Check CI logs: `gh run view <run-id> --repo dddmixp/investo --log-failed`
2. Comment on the PR with the error
3. Re-trigger the developer agent on the same branch:
   ```bash
   gh pr comment <pr-number> --repo dddmixp/investo --body "@claude Fix the CI failure: <paste error>"
   ```
   Claude Review workflow responds to `@claude` mentions.

### Agent is blocked
- Issue will have label `agent-blocked` and a comment explaining the blocker
- Read the comment, resolve the ambiguity, remove `agent-blocked`, add `agent-ready`
- Agent picks it up next cron cycle

### Claude quota exhausted (rate limit)
- Agent worker exits gracefully, resets issue to `agent-ready`
- Next scheduled run (up to 4h) retries automatically
- To check quota: console.anthropic.com → Usage

### Staging deploy failed
```bash
gh run view --repo dddmixp/investo --log-failed
# Common causes:
# - NEXT_PUBLIC_SUPABASE_URL or ANON_KEY not set → check secrets
# - Build error → fix in a new PR
# - e2e tests failing → check PLAYWRIGHT_BASE_URL secret
```

### Production deploy failed
- Staging must pass before production gate appears
- If staging passed but production gate approval timed out, re-run the deploy workflow:
  ```bash
  gh workflow run deploy.yml --repo dddmixp/investo
  ```

---

## Running a parallel agent burst (local)

When you want to implement multiple issues simultaneously:

```bash
cd ~/ccode/investo
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --agent developer \
  "Implement issues #1, #2, #3 in parallel. Create separate branches for each."
```

Or trigger manually per issue:
```bash
for issue in 1 2 3 4; do
  gh workflow run agent-worker.yml --repo dddmixp/investo
  sleep 30  # stagger to avoid branch conflicts
done
```

---

## Weekly maintenance

### Architect drift review
Once a week, check if the code drifted from ADR-0001 conventions:
```bash
cd ~/ccode/investo
claude "Act as architect. Read docs/adr/0001-architecture.md and scan the current src/ code.
Report any deviations from the interface contracts, naming conventions, or architectural decisions.
Output as a list of findings with file:line references."
```

### Backlog grooming
1. Review open issues at github.com/dddmixp/investo/issues
2. Prioritise by adding/removing `agent-ready` label
3. Close issues that are no longer relevant
4. Add Phase 2 issues when Phase 1 is mostly merged

---

## Secrets reference

All secrets at github.com/dddmixp/investo/settings/secrets/actions

| Secret | Purpose | Rotate at |
|---|---|---|
| CLAUDE_CODE_OAUTH_TOKEN | Agent worker + Claude review | If compromised |
| VERCEL_TOKEN | Deployment | Annually |
| VERCEL_ORG_ID | Deployment config | Never (stable) |
| VERCEL_PROJECT_ID | Deployment config | Never (stable) |
| NEXT_PUBLIC_SUPABASE_URL | DB connection | Never (stable) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | DB public access | If RLS is compromised |
| SUPABASE_SERVICE_ROLE_KEY | Server-side DB admin | If compromised |
| ANTHROPIC_API_KEY | AI document extraction | Annually |
| PLAYWRIGHT_BASE_URL | e2e test target | After Vercel URL changes |

---

## Environments

| Environment | URL | Gate |
|---|---|---|
| Staging | Vercel preview URL (changes per deploy) | Auto (no approval) |
| Production | investo.vercel.app (or custom domain) | Required: dddmixp approval |

Set PLAYWRIGHT_BASE_URL secret to the staging URL after first successful deploy.
