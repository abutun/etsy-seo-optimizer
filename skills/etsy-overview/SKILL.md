---
name: etsy-overview
description: |
  Shop dashboard showing all active listings with SEO scores, trend indicators, and quick recommendations. Identifies priority optimization targets. Use when the user says "show my shop", "shop overview", "how's my shop doing", "dashboard", or "list my listings with scores".
user-invocable: true
argument-hint: [--sort score|views|favorites|recent]
allowed-tools: [Read, Bash, Grep, Glob]
---

# Etsy Overview

Shop-level dashboard with scores and trends.

## Usage

```bash
# Default: sort by score (worst first)
npx tsx src/commands/overview.ts

# Sort by views, favorites, or recency
npx tsx src/commands/overview.ts --sort views
npx tsx src/commands/overview.ts --sort favorites
npx tsx src/commands/overview.ts --sort recent
```

## Output

The command outputs JSON with:
- **Shop info**: Name, URL, active listings count, favorites, review average
- **Summary**: Total listings, average score, score distribution, total views/favorites
- **Listings**: Each listing with title, score, trend, views, favorites, price, top recommendation
- **Priority targets**: Top 5 worst-scoring listings that need immediate attention

Present the results as:
1. Shop header: Name, average SEO score, total views/favorites
2. Score distribution: Excellent/Good/Average/Below Average/Poor counts
3. Listing table: Title (truncated), Score, Trend, Views, Favorites, Price
4. Priority section: Bottom 5 listings with their top recommendation
5. Offer to run `/etsy-analyze` on any specific listing for deeper analysis
