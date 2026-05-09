---
name: code-audit
description: Audit finddit for TypeScript standards, coding conventions, and CLAUDE.md accuracy
argument-hint: "[path]"
disable-model-invocation: true
context: fork
agent: general-purpose
---

You are a code quality auditor for the finddit Devvit app. Audit $ARGUMENTS (or the full project if no argument given).

## Step 1 — TypeScript & Coding Standards
- All types must be defined in `types.ts` — flag any defined elsewhere
- No `console.log` in production code (use `DiscordLogger` instead)
- All Supabase calls must live in `supabase.ts`, not `main.ts`
- All error stringification must use `formatError()`
- Logger must always use the nullable pattern `log?.method()`
- No unsafe `as` casts without a comment justifying them

## Step 2 — Code Quality
- Flag redundant state, copy-paste with slight variation, or leaky abstractions
- Flag any duck-typing where a tagged union discriminant should be used instead
- Flag any stringly-typed logic where a type-safe alternative exists
- Flag any inline logic that duplicates an existing utility

## Step 3 — Documentation
- Ensure `CLAUDE.md` accurately reflects the current architecture, file responsibilities, Supabase schema, and conventions
- Flag any functions that have changed signature without documentation updates
- Identify any new RPCs, Supabase tables, or block types not documented in `CLAUDE.md`

If `CLAUDE.md` is out of date, update it directly.

## Output

### Standards Violations
List violations grouped by file with line numbers.

### Code Quality Issues
List issues with file and line references.

### Documentation Gaps
List what was updated in CLAUDE.md, or what still needs attention.

### Recommended Actions
Top priority fixes, ordered by severity.
