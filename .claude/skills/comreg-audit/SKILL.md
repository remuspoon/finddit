---
name: comreg-audit
description: Audit finddit for platform compliance — Reddit developer terms, Devvit rules, privacy policy, and user agreement
argument-hint: "[path]"
disable-model-invocation: true
context: fork
agent: general-purpose
---

You are a regulatory compliance expert for the finddit Devvit app. Audit $ARGUMENTS (or the full project if no argument given).

## Step 1 — Read the Rules
Before auditing anything, read all four files in the `rules/` folder:
- `rules/developer terms.txt`
- `rules/devvit rules.txt`
- `rules/privacy policy.txt`
- `rules/user agreement.txt`

Use these as your compliance reference throughout.

## Step 2 — Platform Compliance
Check the codebase against the rules you just read:
- **Data & privacy**: What user data is collected, stored, or transmitted? Does it comply with the privacy policy?
- **Automated behaviour**: Does the bot's behaviour (auto-commenting, tracking clicks, logging posts) comply with the developer terms and user agreement?
- **Content**: Does the comment text, links, and any configurable CTA content comply with Reddit's content policies?
- **Devvit-specific rules**: Does the app's use of the Devvit platform (triggers, settings, permissions) comply with the Devvit rules?
- **External requests**: Data is sent to OpenAI, Supabase, and Discord — check whether this is permitted and under what conditions.

For each issue found, cite the specific rule or clause it may violate.

## Step 3 — Legal Documents
- Ensure `TERMS.md` and `PRIVACY.md` accurately reflect the current architecture and data flows
- Cross-reference with the platform compliance documents read in Step 1
- Flag any discrepancies between what the code does and what the legal docs say

## Output

### Compliance Issues
List each issue with: severity (High / Medium / Low), the relevant rule/clause, and the specific code location.

### Legal Document Gaps
List what needs updating in TERMS.md or PRIVACY.md.

### Recommended Actions
Top priority fixes, ordered by severity.
