---
name: etsy-update
description: |
  Update an Etsy listing's title, description, tags, or materials with a two-phase preview/confirm flow. Shows score impact before applying. Use when the user says "update listing", "change title", "fix tags", "improve listing", or wants to apply SEO improvements.
user-invocable: true
argument-hint: <listing_id> [--title "..."] [--tags "..."] [--description "..."] [--materials "..."]
allowed-tools: [Read, Bash, Grep, Glob]
---

# Etsy Update

Update listing fields with preview and confirmation.

## Usage

```bash
# Preview changes (ALWAYS do this first)
npx tsx src/commands/update.ts 1234567890 --title "New Optimized Title" --tags "tag1,tag2,tag3"

# Apply after user confirms
npx tsx src/commands/update.ts 1234567890 --title "New Optimized Title" --tags "tag1,tag2,tag3" --confirm
```

## IMPORTANT: Two-Phase Flow

1. **Phase 1 - Preview**: Run WITHOUT `--confirm`. Present the diff and score impact to the user.
2. **Phase 2 - Apply**: Only run WITH `--confirm` AFTER the user explicitly approves the changes.

NEVER skip the preview phase. Always ask the user to confirm before applying.

## Output

**Preview mode** returns: current vs proposed values, current score, projected score, score delta.

**Apply mode** returns: applied changes, previous score, new actual score, delta.

Present the preview as:
1. Side-by-side diff of each changed field
2. Score impact: "Current: 62 (Average) -> Projected: 78 (Good) [+16]"
3. Clear prompt: "Apply these changes? (y/n)"

## Parameters

- `--title "..."`: New listing title (max 140 chars)
- `--tags "tag1,tag2,..."`: Comma-separated tags (max 13)
- `--description "..."`: New description text
- `--materials "mat1,mat2,..."`: Comma-separated materials
- `--confirm`: Apply changes (skip preview)
