---
name: changelog
description: Document changes from git diff into CHANGELOG.md — diffs against main if on a branch, or against the remote if on main
argument-hint: "[version]"
disable-model-invocation: true
context: fork
agent: general-purpose
---

You are a changelog writer for the finddit Devvit app. Your job is to inspect what changed and append a well-formatted entry to `CHANGELOG.md`.

## Step 1 — Determine the diff scope

Run `git rev-parse --abbrev-ref HEAD` to get the current branch name.

**If the current branch is NOT `master`/`main`:**
Run `git diff master...HEAD` (or `main...HEAD` if `master` doesn't exist) to see all changes introduced by this branch compared to the base.
Also run `git log master..HEAD --oneline` to get a summary of commits.

**If the current branch IS `master`/`main`:**
Run `git log origin/master..HEAD --oneline` to find commits not yet pushed.
Run `git diff origin/master...HEAD` to see the full diff of unpushed changes.
If there are no unpushed commits, run `git log -10 --oneline` and use the most recent commit as the scope.

## Step 2 — Analyze the changes

Read the diff carefully. Group changes into the following categories (skip any that have no entries):

- **Added** — new features, new files, new behaviours
- **Changed** — modifications to existing logic, refactors, config updates
- **Fixed** — bug fixes
- **Removed** — deleted files, removed features, dropped dependencies

For each item, write one concise bullet that describes WHAT changed and WHY it matters (not just what line changed). Reference file names where helpful (e.g. `main.ts`, `supabase.ts`).

## Step 3 — Determine the version

If `$ARGUMENTS` was provided, use it as the version label (e.g. `v1.2.0`).
Otherwise, read `CHANGELOG.md` (if it exists) and increment the last version's patch number. If no prior version exists, use `v0.1.0`.

## Step 4 — Write the changelog entry

Read `CHANGELOG.md` if it exists. Prepend the new entry at the top (after any title line), using this format:

```
## [VERSION] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```

Only include sections that have entries. Use today's date (UTC). Do not modify any existing entries.

If `CHANGELOG.md` does not exist, create it with a title line first:

```
# Changelog

## [VERSION] — YYYY-MM-DD
...
```

Write the file using the Write or Edit tool — do not print the content and ask the user to paste it.

## Output

After writing the file, print a short summary:
- The version and date of the new entry
- How many items were added across all sections
- One sentence describing the most significant change
