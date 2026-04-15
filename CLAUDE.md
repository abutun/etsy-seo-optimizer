# Etsy SEO Optimization Skill

An AI-powered Etsy shop SEO analyzer and optimizer. Uses the Etsy API v3 to analyze listings, compare against competitors, and apply data-driven improvements.

## Quick Start

1. Copy `.env.example` to `.env` and fill in your Etsy API credentials
2. Run `npm install`
3. Authenticate: `npx tsx src/auth/server.ts` (opens browser for OAuth)
4. Run your first audit: `npx tsx src/commands/overview.ts`

## Commands

All commands output JSON to stdout. Parse the JSON and present results in a human-readable format.

| Command | Script | Purpose |
|---------|--------|---------|
| Overview | `npx tsx src/commands/overview.ts` | Shop dashboard with all listing scores |
| Audit | `npx tsx src/commands/audit.ts` | Full SEO audit with recommendations |
| Analyze | `npx tsx src/commands/analyze.ts <id>` | Deep analysis of one listing |
| Competitors | `npx tsx src/commands/competitors.ts <keywords>` | Marketplace competitor analysis |
| Update | `npx tsx src/commands/update.ts <id> --title "..." --tags "..."` | Update listing (preview first, then --confirm) |
| Auth | `npx tsx src/auth/server.ts` | OAuth 2.0 authentication flow |

## Architecture

```
src/
  auth/       - OAuth 2.0 PKCE authentication
  api/        - Etsy API v3 client (shops, listings, taxonomy)
  seo/        - SEO scoring engine (title, tags, description, images)
  competitor/ - Marketplace search, comparison, keyword gap analysis
  commands/   - CLI entry points
  tracking/   - Local score history
  utils/      - Config, rate limiting, text analysis
```

## SEO Scoring (0-100)

- **Title** (30 pts): Length, keyword position, richness, readability, waste
- **Tags** (30 pts): Count (/13), long-tail ratio, relevance, duplicates, specificity
- **Description** (25 pts): Length, keyword density, structure, opening, CTA
- **Images** (15 pts): Count (/10), primary image, variety

## Update Flow

ALWAYS preview before applying:
1. Run update command WITHOUT `--confirm` to see diff and score impact
2. Present the diff to the user and ask for confirmation
3. Only run with `--confirm` after explicit user approval

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ETSY_API_KEY` | Yes | Etsy OAuth app API key |
| `ETSY_SHARED_SECRET` | Yes | Etsy OAuth app shared secret |
| `ETSY_SHOP_ID` | Yes | Target shop ID or name |
| `ETSY_REDIRECT_URI` | No | OAuth redirect (default: http://localhost:3737/oauth/callback) |
| `ETSY_AUTH_PORT` | No | Auth server port (default: 3737) |
| `DATA_DIR` | No | Data directory (default: ./data) |

## Rate Limits

- 10 requests/second, 10,000 requests/day
- Handled automatically by the built-in rate limiter
- Warning printed at 8,000 daily requests
