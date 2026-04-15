---
name: etsy-seo
description: |
  Etsy shop SEO optimization toolkit. This skill should be used when the user asks to "analyze my Etsy shop", "optimize my Etsy listings", "check my Etsy SEO", "audit Etsy tags", "improve my Etsy sales", "compare Etsy competitors", "update Etsy listing", or mentions anything related to Etsy shop optimization, listing SEO scores, tag analysis, or marketplace competitor research. Also use when the user references Etsy product titles, descriptions, tags, or wants to understand how to rank better on Etsy search.
user-invocable: false
allowed-tools: [Read, Write, Bash, Edit, Grep, Glob, WebSearch, WebFetch]
---

# Etsy SEO Optimization Skill

This skill provides comprehensive Etsy shop SEO analysis, competitor research, and listing optimization using the Etsy API v3.

## Available Commands

All commands output JSON to stdout. Interpret the JSON and present results to the user in a clear, actionable format with tables, scores, and prioritized recommendations.

### Setup (First Time)

Before using any command, ensure the user has:
1. Created an Etsy developer app at https://www.etsy.com/developers/your-apps
2. Copied `.env.example` to `.env` and filled in their API credentials
3. Run `npm install` to install dependencies

### `/etsy-overview` - Shop Dashboard
```bash
npx tsx src/commands/overview.ts [--sort score|views|favorites|recent]
```
Shows all active listings with SEO scores, trends, and priority optimization targets. Default sort is by score (worst first).

### `/etsy-audit` - Full SEO Audit
```bash
npx tsx src/commands/audit.ts [--listing <listing_id>]
```
Comprehensive SEO audit of all active listings (or a specific one). Scores each listing 0-100 across title, tags, description, and images. Saves scores to history for trend tracking.

### `/etsy-analyze` - Deep Listing Analysis
```bash
npx tsx src/commands/analyze.ts <listing_id>
```
Deep-dive analysis of a single listing with detailed breakdown of each SEO dimension, keyword gap analysis against competitors, and specific before/after improvement suggestions.

### `/etsy-competitors` - Competitor Research
```bash
npx tsx src/commands/competitors.ts <keywords> [--listing <listing_id>] [--limit <n>]
```
Search the Etsy marketplace for competing listings. Analyzes tag frequency, pricing distribution, and engagement metrics. If `--listing` is provided, performs direct comparison and keyword gap analysis.

### `/etsy-update` - Update Listing
```bash
# Preview changes (always do this first):
npx tsx src/commands/update.ts <listing_id> --title "New Title" --tags "tag1,tag2,..." [--description "..."] [--materials "..."]

# Apply changes (after user confirms preview):
npx tsx src/commands/update.ts <listing_id> --title "New Title" --tags "tag1,tag2,..." --confirm
```
Updates listing fields with a two-phase preview/confirm flow. Always show the preview diff and score impact before applying.

### `/etsy-auth` - Authenticate
```bash
npx tsx src/auth/server.ts
```
Runs the OAuth 2.0 PKCE flow. Opens a local callback server and prints the authorization URL. User opens URL in browser, authorizes, and tokens are saved automatically.

## SEO Scoring System (0-100)

| Dimension | Points | Key Metrics |
|-----------|--------|-------------|
| Title | 30 | Length (80-140 chars), keyword position, keyword richness, readability, no waste |
| Tags | 30 | Count (/13), long-tail ratio, title relevance, no duplicates, specificity |
| Description | 25 | Length (300-1000 words), keyword density, structure, opening strength, CTA |
| Images | 15 | Count (/10), primary image, variety |

**Score Labels**: Poor (0-39), Below Average (40-59), Average (60-74), Good (75-89), Excellent (90-100)

## Interpreting Results

When presenting results to the user:
1. Start with the overall score and label
2. Highlight the weakest dimension (biggest opportunity)
3. List top 3-5 prioritized recommendations
4. For competitor analysis, emphasize keyword gaps and pricing insights
5. For updates, always show the diff and projected score change before confirming

## Rate Limits

The Etsy API allows 10 requests/second and 10,000 requests/day. Commands handle rate limiting automatically. A full shop audit of 100 listings uses approximately 100-200 API calls.

## File Structure

- `src/commands/` - CLI entry points (audit, analyze, competitors, update, overview)
- `src/api/` - Etsy API v3 client layer
- `src/seo/` - SEO scoring engine (title, tag, description, image analyzers)
- `src/competitor/` - Competitor analysis (search, compare, gap analysis)
- `src/auth/` - OAuth 2.0 PKCE authentication
- `src/tracking/` - Local score history tracking
- `data/` - Gitignored runtime data (tokens, history)
