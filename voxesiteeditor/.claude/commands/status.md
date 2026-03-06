---
description: Show pending bugs, last 5 Bug Fix Log entries, and current agent prompt status. Fast read-only check — uses Haiku.
allowed-tools: Read, Grep, Bash
model: haiku
---

# Project Status Check

Run these reads in parallel:

1. Read `CLAUDE.md` — extract only the "Bug Fix Log" section and "Current Roadmap" section.
2. Run `grep -l "VoxeSiteCloneAgent\|VoxeSiteBuilderAgent" packages/ai-adapters/src/ 2>/dev/null || echo "Agents not yet created"`
3. Run `grep -r "supportsTextColor\|supportsTextAlign\|gridColumn" packages/contracts/ 2>/dev/null | head -20 || echo "Contract props not yet added"`
4. Check if `.claude/prompts/site-builder-agent.xml` still contains `{{SNEAKER_STORE_EXAMPLE}}` placeholder.

Then print a compact status report:
```
BUGS:     [x/5 fixed]
AGENTS:   [created / not created]
CONTRACTS: [updated / pending]
EXAMPLES: [injected / pending — run /generate-agent-examples]
```