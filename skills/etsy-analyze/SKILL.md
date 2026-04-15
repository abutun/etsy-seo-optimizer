---
name: etsy-analyze
description: |
  Deep analysis of a single Etsy listing with detailed SEO breakdown, keyword gap analysis against competitors, and specific improvement suggestions. Use when the user says "analyze this listing", "what's wrong with listing X", "how can I improve this listing", or provides a listing ID for review.
user-invocable: true
argument-hint: <listing_id>
allowed-tools: [Read, Bash, Grep, Glob]
---

# Etsy Analyze

Deep-dive SEO analysis of a single listing with competitor context.

## Usage

```bash
npx tsx src/commands/analyze.ts <listing_id>
```

## Output

The command outputs JSON with:
- **Listing details**: Title, URL, state, views, favorites, price, tags, image count
- **SEO score**: Overall score + breakdown for each dimension with specific sub-metrics
- **Trend**: Score change from last analysis (if history exists)
- **Gap analysis**: Keywords and tags that competitors use but this listing doesn't

Present the results as:
1. Listing header with score and trend arrow
2. Dimension-by-dimension breakdown with specific findings
3. Keyword gap findings from competitor analysis
4. Concrete, actionable recommendations with before/after examples
5. Suggested title/tag improvements based on gaps
