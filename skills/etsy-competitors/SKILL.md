---
name: etsy-competitors
description: |
  Search the Etsy marketplace for competing listings and analyze their SEO strategies. Identifies keyword gaps, pricing patterns, and title strategies. Use when the user says "find competitors", "competitor analysis", "what are others doing", "keyword gaps", or "how do I compare to competitors".
user-invocable: true
argument-hint: <keywords> [--listing <id>] [--limit <n>]
allowed-tools: [Read, Bash, Grep, Glob]
---

# Etsy Competitors

Search and analyze competing listings on the Etsy marketplace.

## Usage

```bash
# Search for competitors by keywords
npx tsx src/commands/competitors.ts "handmade silver earrings"

# Compare against your own listing
npx tsx src/commands/competitors.ts "handmade silver earrings" --listing 1234567890

# Limit results
npx tsx src/commands/competitors.ts "handmade silver earrings" --limit 15
```

## Output

The command outputs JSON with:
- **Search results**: Competing listings sorted by Etsy relevance score
- **Top tags**: Most frequently used tags across competitors with percentages
- **Price stats**: Min, max, median, average pricing
- **Comparison** (if --listing provided): Side-by-side comparison with insights
- **Gap analysis** (if --listing provided): Missing high-value tags and title keywords

Present the results as:
1. Competitor overview: Top 10 listings with title, shop, price, views, favorites
2. Tag frequency table: Most popular tags and what percentage of competitors use them
3. Pricing analysis: Where the target listing falls in the price range
4. Keyword gaps: Specific tags and title keywords to add, ranked by confidence
5. Strategic recommendations based on patterns
