import { searchCompetitors } from '../competitor/search.js';
import { compareListings } from '../competitor/compare.js';
import { analyzeKeywordGaps } from '../competitor/gaps.js';
import { getListing } from '../api/listings.js';
import { outputJSON, formatError } from '../utils/formatter.js';

interface CompetitorArgs {
  keywords: string;
  listingId?: number;
  limit?: number;
}

function parseArgs(): CompetitorArgs {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    throw new Error('Usage: competitors <keywords> [--listing <id>] [--limit <n>]');
  }

  const args: CompetitorArgs = { keywords: '' };
  const keywordParts: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--listing' && argv[i + 1]) {
      args.listingId = parseInt(argv[i + 1], 10);
      i++;
    } else if (argv[i] === '--limit' && argv[i + 1]) {
      args.limit = parseInt(argv[i + 1], 10);
      i++;
    } else if (!argv[i].startsWith('--')) {
      keywordParts.push(argv[i]);
    }
  }

  args.keywords = keywordParts.join(' ');
  if (!args.keywords) {
    throw new Error('Keywords are required. Usage: competitors <keywords> [--listing <id>]');
  }

  return args;
}

async function main() {
  try {
    const args = parseArgs();

    // Search for competitors
    const searchResult = await searchCompetitors(args.keywords, {
      limit: args.limit || 25,
    });

    let comparison = null;
    let gapAnalysis = null;

    // If own listing provided, do comparison and gap analysis
    if (args.listingId) {
      const ownListing = await getListing(args.listingId, ['Images']);

      // Filter out own listing from competitors
      const filteredCompetitors = searchResult.listings.filter(
        c => c.listingId !== args.listingId
      );

      comparison = compareListings(ownListing, filteredCompetitors);
      gapAnalysis = analyzeKeywordGaps(ownListing, filteredCompetitors);
    }

    // Tag frequency across all competitors
    const tagFrequency = new Map<string, number>();
    for (const listing of searchResult.listings) {
      for (const tag of listing.tags) {
        const lower = tag.toLowerCase();
        tagFrequency.set(lower, (tagFrequency.get(lower) || 0) + 1);
      }
    }

    const topTags = [...tagFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / searchResult.listings.length) * 100),
      }));

    // Price distribution
    const prices = searchResult.listings
      .map(l => l.price.amount)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    const priceStats = prices.length > 0 ? {
      min: prices[0],
      max: prices[prices.length - 1],
      median: prices[Math.floor(prices.length / 2)],
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100,
    } : null;

    outputJSON({
      search: searchResult,
      topTags,
      priceStats,
      comparison,
      gapAnalysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    outputJSON({ status: 'error', ...formatError(error) });
    process.exit(1);
  }
}

main();
