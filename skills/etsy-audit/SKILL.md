---
name: etsy-audit
description: |
  Full SEO audit of an Etsy shop. Scores every active listing on title, tags, description, and images (0-100). Identifies worst performers and provides prioritized recommendations. Use when the user says "audit my Etsy shop", "check my Etsy SEO scores", "how are my listings performing", or "which listings need work".
user-invocable: true
argument-hint: [--listing <id>]
allowed-tools: [Read, Bash, Grep, Glob]
---

# Etsy Audit

Run a full SEO audit of the shop or a specific listing.

## Usage

```bash
# Audit all active listings
npx tsx src/commands/audit.ts

# Audit a specific listing
npx tsx src/commands/audit.ts --listing 1234567890
```

## Output

The command outputs JSON to stdout. Present the results as:

1. **Shop summary** (if full audit): Average score, score distribution, total listings
2. **Listing table**: Sort by score ascending (worst first), show: title, score, label, top recommendation
3. **Top recommendations**: Aggregated across all listings, sorted by frequency and priority
4. **Priority targets**: The 5 worst-scoring listings that need immediate attention

## Scoring

Each listing is scored 0-100 across four dimensions:
- Title (30 pts): Length, keyword position, richness, readability
- Tags (30 pts): Count, diversity, relevance, uniqueness
- Description (25 pts): Length, keyword density, structure, CTA
- Images (15 pts): Count, primary image, variety

Scores are saved to local history for trend tracking on subsequent audits.
