# Etsy SEO Optimizer

A powerful AI-driven Etsy shop SEO analysis and optimization skill for **Claude Code**, **Cursor**, **Codex**, and other AI coding assistants. Analyze your listings, discover competitor strategies, and apply data-backed improvements to boost your Etsy shop's search visibility and sales.

## Features

- **SEO Scoring (0-100)** - Score every listing across title, tags, description, and images with detailed sub-metrics
- **Full Shop Audit** - Audit all active listings at once, identify worst performers, get prioritized recommendations
- **Deep Listing Analysis** - Drill into a single listing with before/after suggestions and competitor context
- **Competitor Research** - Search the Etsy marketplace, analyze competitor tag strategies, find keyword gaps
- **Listing Updates** - Apply SEO improvements via API with a safe preview/confirm workflow
- **Score History** - Track score changes over time to measure improvement
- **Cross-Tool Compatible** - Works with Claude Code (slash commands), Cursor, Codex, or any AI tool that reads `CLAUDE.md`

## Prerequisites

- **Node.js 18+** (for native `fetch` support)
- **Etsy Developer Account** - Create an app at [Etsy Developer Portal](https://www.etsy.com/developers/your-apps)
- **Claude Code**, **Cursor**, **Codex**, or another AI coding assistant (optional - can also be used as a standalone CLI)

## Installation

### Option A: Install as Claude Code Skill (Recommended)

This registers slash commands (`/etsy-audit`, `/etsy-analyze`, etc.) globally so they work from any project.

```bash
# 1. Clone the repository
git clone https://github.com/abutun/etsy-seo-optimizer.git
cd etsy-seo-optimizer

# 2. Run the installer (installs skills to ~/.claude/skills/)
bash install.sh

# 3. Configure your Etsy API credentials
cp .env.example .env
# Edit .env with your API key, shared secret, and shop ID

# 4. Authenticate with Etsy (one-time OAuth flow)
npx tsx src/auth/server.ts
```

That's it. Open any Claude Code session and use `/etsy-overview` to get started.

**To uninstall:** `bash uninstall.sh`

### Option B: Project-Level Usage

If you prefer to work inside the project directory (skills are automatically available):

```bash
git clone https://github.com/abutun/etsy-seo-optimizer.git
cd etsy-seo-optimizer
npm install
cp .env.example .env
# Edit .env with your credentials
npx tsx src/auth/server.ts
```

Open this directory in Claude Code and the `/etsy-*` commands are available.

### Option C: Manual Skill Installation

For fine-grained control, symlink individual skills:

```bash
git clone https://github.com/abutun/etsy-seo-optimizer.git ~/etsy-seo-optimizer
cd ~/etsy-seo-optimizer && npm install

# Symlink only the skills you want
ln -s ~/etsy-seo-optimizer/skills/etsy-audit ~/.claude/skills/etsy-audit
ln -s ~/etsy-seo-optimizer/skills/etsy-analyze ~/.claude/skills/etsy-analyze
ln -s ~/etsy-seo-optimizer/skills/etsy-competitors ~/.claude/skills/etsy-competitors
ln -s ~/etsy-seo-optimizer/skills/etsy-update ~/.claude/skills/etsy-update
ln -s ~/etsy-seo-optimizer/skills/etsy-overview ~/.claude/skills/etsy-overview
```

> **Note:** With symlinks, you'll need to run commands from the project directory. The install script (Option A) handles path resolution automatically.

### Etsy API Setup

1. Go to [developers.etsy.com/your-apps](https://www.etsy.com/developers/your-apps) and create a new app
2. Set the **Callback URL** to `http://localhost:3737/oauth/callback`
3. Copy the **Keystring** (`ETSY_API_KEY`) and **Shared Secret** (`ETSY_SHARED_SECRET`)
4. Find your **Shop ID**: go to your shop page - the numeric ID is in the URL, or use your shop name

```env
ETSY_API_KEY=your_keystring_here
ETSY_SHARED_SECRET=your_shared_secret_here
ETSY_SHOP_ID=your_shop_id_or_name
```

### Authentication

Run the OAuth flow once (tokens auto-refresh for 90 days):

```bash
npx tsx src/auth/server.ts
```

This starts a local server, prints an authorization URL, and waits for the callback. Open the URL in your browser, authorize the app, and tokens are saved to `data/tokens.json` (gitignored).

## Creating Your Etsy Developer App

1. Go to [https://www.etsy.com/developers/your-apps](https://www.etsy.com/developers/your-apps)
2. Click **Create a New App**
3. Fill in the app details (name, description)
4. Set the **Callback URL** to `http://localhost:3737/oauth/callback`
5. Once created, copy the **Keystring** (this is your `ETSY_API_KEY`) and **Shared Secret** (`ETSY_SHARED_SECRET`)

## Commands

All commands output JSON to stdout. When used with an AI assistant, the assistant interprets the JSON and presents results in a human-readable format with tables, scores, and recommendations.

### Shop Overview

```bash
npx tsx src/commands/overview.ts [--sort score|views|favorites|recent]
```

Dashboard showing all active listings with SEO scores, trend arrows, and priority optimization targets.

**Example output summary:**
- Shop name, average SEO score, total views/favorites
- Score distribution (Excellent/Good/Average/Below Average/Poor)
- Listing table sorted by score (worst first by default)
- Top 5 priority targets with their #1 recommendation

### Full SEO Audit

```bash
# Audit all active listings
npx tsx src/commands/audit.ts

# Audit a specific listing
npx tsx src/commands/audit.ts --listing 1234567890
```

Comprehensive SEO audit that scores every listing across four dimensions and generates prioritized recommendations. Scores are saved to history for trend tracking.

### Deep Listing Analysis

```bash
npx tsx src/commands/analyze.ts <listing_id>
```

Deep-dive analysis of a single listing including:
- Detailed score breakdown for each SEO dimension
- Score trend from previous analyses
- Keyword gap analysis against marketplace competitors
- Specific improvement suggestions with before/after examples

### Competitor Research

```bash
# Search by keywords
npx tsx src/commands/competitors.ts "handmade silver earrings"

# Compare against your own listing
npx tsx src/commands/competitors.ts "handmade silver earrings" --listing 1234567890

# Limit results
npx tsx src/commands/competitors.ts "handmade silver earrings" --limit 15
```

Searches the Etsy marketplace for competing listings and analyzes:
- Tag frequency across competitors (what percentage use each tag)
- Price distribution (min, max, median, average)
- Keyword gaps (tags and title keywords competitors use that you don't)
- Engagement comparison (views, favorites)

### Update Listing

```bash
# Step 1: Preview changes (ALWAYS do this first)
npx tsx src/commands/update.ts 1234567890 \
  --title "Handmade Sterling Silver Dangle Earrings - Minimalist Jewelry Gift for Her" \
  --tags "sterling silver earrings,dangle earrings,minimalist jewelry,gift for her,handmade earrings"

# Step 2: Apply after reviewing the preview
npx tsx src/commands/update.ts 1234567890 \
  --title "Handmade Sterling Silver Dangle Earrings - Minimalist Jewelry Gift for Her" \
  --tags "sterling silver earrings,dangle earrings,minimalist jewelry,gift for her,handmade earrings" \
  --confirm
```

**Available fields:**
- `--title "..."` - New listing title (max 140 characters)
- `--tags "tag1,tag2,..."` - Comma-separated tags (max 13)
- `--description "..."` - New description
- `--materials "mat1,mat2,..."` - Comma-separated materials

> **Safety**: The update command always shows a preview with the current vs proposed values and the projected score impact. Changes are only applied when you add `--confirm`.

## Using with AI Assistants

### Claude Code

When you open this project in Claude Code, the skill is automatically available via slash commands:

- `/etsy-overview` - Shop dashboard
- `/etsy-audit` - Full SEO audit
- `/etsy-analyze <listing_id>` - Deep listing analysis
- `/etsy-competitors <keywords>` - Competitor research
- `/etsy-update <listing_id> --title "..." --tags "..."` - Update listing

You can also just describe what you want in natural language:
- *"How are my Etsy listings performing?"*
- *"Analyze listing 1234567890 and suggest improvements"*
- *"Find competitors for handmade silver earrings"*
- *"Update the tags on listing 1234567890 based on the competitor analysis"*

### Cursor / Codex / Other AI Tools

The `CLAUDE.md` file at the project root provides all the context an AI assistant needs. Open the project in your AI tool and it will understand the available commands and how to use them.

## SEO Scoring System

Each listing is scored on a **0-100 scale** across four dimensions:

### Title Score (30 points)

| Metric | Points | What it measures |
|--------|--------|-----------------|
| Length | 8 | Optimal: 80-140 chars. Penalizes short titles that waste keyword space |
| Keyword Position | 8 | Primary keyword should appear in the first 40 characters |
| Keyword Richness | 7 | Number of unique, meaningful keywords (aim for 5+) |
| Readability | 4 | Penalizes keyword stuffing, ALL CAPS, excessive punctuation |
| No Waste | 3 | Penalizes repeated words that waste character space |

### Tag Score (30 points)

| Metric | Points | What it measures |
|--------|--------|-----------------|
| Count | 10 | All 13 tag slots should be used. Every empty slot is a missed opportunity |
| Diversity | 8 | Mix of short-tail (1-2 words) and long-tail (3+ words) tags |
| Relevance | 6 | Tags should echo and reinforce title keywords |
| No Duplicates | 3 | No exact or near-duplicate tags |
| Specificity | 3 | Penalizes generic single-word tags like "gift" or "cute" |

### Description Score (25 points)

| Metric | Points | What it measures |
|--------|--------|-----------------|
| Length | 6 | Optimal: 300-1000 words with product details |
| Keyword Density | 6 | Primary keyword appears 2-4 times per 500 words |
| Structure | 5 | Uses paragraph breaks and sections (not a wall of text) |
| Opening Strength | 4 | First 160 chars contain keywords and a hook (search snippet) |
| Call to Action | 4 | Includes action language (order, customize, message, etc.) |

### Image Score (15 points)

| Metric | Points | What it measures |
|--------|--------|-----------------|
| Count | 8 | All 10 image slots should be used |
| Primary Image | 4 | Has a primary listing image with good aspect ratio |
| Variety | 3 | Different angles, close-ups, lifestyle shots |

### Score Labels

| Score Range | Label | Meaning |
|-------------|-------|---------|
| 90-100 | Excellent | Fully optimized - minor tweaks only |
| 75-89 | Good | Well-optimized with small improvements possible |
| 60-74 | Average | Competitive but not standing out |
| 40-59 | Below Average | Significant room for improvement |
| 0-39 | Poor | Needs immediate attention |

## Project Structure

```
etsy-seo-optimizer/
├── CLAUDE.md                          # AI assistant instructions
├── .env.example                       # Environment variable template
├── package.json                       # Node.js project config
├── tsconfig.json                      # TypeScript config
│
├── .claude/skills/etsy-seo/           # Claude Code main skill
│   └── SKILL.md
├── skills/                            # Individual slash command skills
│   ├── etsy-audit/SKILL.md
│   ├── etsy-analyze/SKILL.md
│   ├── etsy-competitors/SKILL.md
│   ├── etsy-update/SKILL.md
│   └── etsy-overview/SKILL.md
│
├── src/
│   ├── auth/                          # OAuth 2.0 PKCE authentication
│   │   ├── pkce.ts                    # Code verifier/challenge generation
│   │   ├── tokens.ts                  # Token storage and refresh
│   │   └── server.ts                  # Local OAuth callback server
│   ├── api/                           # Etsy API v3 client
│   │   ├── types.ts                   # TypeScript interfaces
│   │   ├── client.ts                  # HTTP client with rate limiting
│   │   ├── shops.ts                   # Shop endpoints
│   │   ├── listings.ts                # Listing CRUD + search
│   │   └── taxonomy.ts               # Category taxonomy
│   ├── seo/                           # SEO analysis engine
│   │   ├── title-analyzer.ts          # Title scoring (30 pts)
│   │   ├── tag-analyzer.ts            # Tag scoring (30 pts)
│   │   ├── description-analyzer.ts    # Description scoring (25 pts)
│   │   ├── image-analyzer.ts          # Image scoring (15 pts)
│   │   └── scorer.ts                  # Orchestrator (0-100)
│   ├── competitor/                    # Competitor analysis
│   │   ├── search.ts                  # Marketplace search
│   │   ├── compare.ts                 # Side-by-side comparison
│   │   └── gaps.ts                    # Keyword gap identification
│   ├── commands/                      # CLI entry points
│   │   ├── audit.ts                   # /etsy-audit
│   │   ├── analyze.ts                 # /etsy-analyze
│   │   ├── competitors.ts            # /etsy-competitors
│   │   ├── update.ts                  # /etsy-update
│   │   └── overview.ts               # /etsy-overview
│   ├── tracking/
│   │   └── history.ts                 # Score history tracking
│   └── utils/
│       ├── config.ts                  # Environment config
│       ├── rate-limiter.ts            # API rate limiting
│       ├── formatter.ts              # Output formatting
│       └── text.ts                    # Text analysis utilities
│
├── references/                        # Detailed documentation
│   ├── etsy-api-v3.md                 # API reference
│   ├── seo-scoring.md                 # Scoring algorithm docs
│   └── oauth-flow.md                  # Authentication docs
│
└── data/                              # Runtime data (gitignored)
    ├── tokens.json                    # OAuth tokens
    └── history/                       # Score snapshots per listing
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ETSY_API_KEY` | Yes | - | Your Etsy app's API key (keystring) |
| `ETSY_SHARED_SECRET` | Yes | - | Your Etsy app's shared secret |
| `ETSY_SHOP_ID` | Yes | - | Your shop ID (numeric) or shop name |
| `ETSY_REDIRECT_URI` | No | `http://localhost:3737/oauth/callback` | OAuth callback URL |
| `ETSY_AUTH_PORT` | No | `3737` | Local auth server port |
| `DATA_DIR` | No | `./data` | Directory for tokens and history |

## API Rate Limits

The Etsy API enforces these limits:

| Limit | Value |
|-------|-------|
| Requests per second | 10 |
| Requests per day | 10,000 |

The built-in rate limiter handles both automatically. A warning is logged at 8,000 daily requests. A full shop audit of 100 listings uses approximately 100-200 API calls.

## Authentication Flow

The skill uses **OAuth 2.0 with PKCE** (required by Etsy):

1. Run `npx tsx src/auth/server.ts`
2. A local server starts on port 3737 and prints an authorization URL
3. Open the URL in your browser and authorize the app
4. Etsy redirects back to `localhost:3737/oauth/callback`
5. Tokens are exchanged and saved to `data/tokens.json`

**Token lifecycle:**
- Access token: expires in 1 hour (auto-refreshed)
- Refresh token: expires in 90 days (re-run auth flow when expired)

## Known Limitations

- **No shop analytics**: Etsy doesn't expose traffic, conversion rates, or revenue data via API. Only available in the seller dashboard.
- **No time-series stats**: Views and favorites are lifetime totals only. No "views this week" data.
- **No keyword ranking**: Can't check where a listing ranks for specific search terms.
- **No search volume**: Can't determine keyword search volume. Scoring uses structural analysis and competitive comparison instead.

## Contributing

Contributions are welcome! Areas for improvement:

- Additional SEO metrics and scoring refinements
- Integration with third-party tools (Marmalead, eRank) for keyword volume data
- Batch update support for applying the same change to multiple listings
- A/B testing support for title/tag variations
- Historical reporting and visualization

## License

MIT
