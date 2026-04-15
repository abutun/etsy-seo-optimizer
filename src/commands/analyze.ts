import { getListing } from '../api/listings.js';
import { scoreListing } from '../seo/scorer.js';
import { saveSnapshot, getHistory } from '../tracking/history.js';
import { searchCompetitors } from '../competitor/search.js';
import { analyzeKeywordGaps } from '../competitor/gaps.js';
import { extractKeywords } from '../utils/text.js';
import { outputJSON, formatError, trendArrow } from '../utils/formatter.js';

function parseArgs(): { listingId: number } {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    throw new Error('Usage: analyze <listing_id>');
  }

  const listingId = parseInt(argv[0], 10);
  if (isNaN(listingId)) {
    throw new Error(`Invalid listing ID: ${argv[0]}`);
  }

  return { listingId };
}

async function main() {
  try {
    const { listingId } = parseArgs();

    // Fetch listing with images
    const listing = await getListing(listingId, ['Images']);

    // Score the listing
    const score = scoreListing(listing);
    await saveSnapshot(score);

    // Get history for trend
    const history = await getHistory(listingId);
    const previousScore = history.length > 1
      ? history[history.length - 2]?.overall
      : undefined;

    // Find competitor context using title keywords
    const titleKeywords = extractKeywords(listing.title).slice(0, 5).join(' ');
    let gapAnalysis = null;

    if (titleKeywords.length > 0) {
      try {
        const competitors = await searchCompetitors(titleKeywords, { limit: 15 });
        // Filter out own listing from competitors
        const filteredCompetitors = competitors.listings.filter(
          c => c.listingId !== listingId
        );
        if (filteredCompetitors.length > 0) {
          gapAnalysis = analyzeKeywordGaps(listing, filteredCompetitors);
        }
      } catch {
        // Non-critical: competitor analysis may fail for rate limits
      }
    }

    outputJSON({
      listing: {
        id: listing.listing_id,
        title: listing.title,
        url: listing.url,
        state: listing.state,
        views: listing.views,
        favorites: listing.num_favorers,
        tags: listing.tags,
        materials: listing.materials,
        imageCount: listing.images?.length || 0,
        price: {
          amount: listing.price.amount / listing.price.divisor,
          currency: listing.price.currency_code,
        },
        created: new Date(listing.creation_timestamp * 1000).toISOString(),
      },
      score,
      trend: trendArrow(score.overall, previousScore),
      previousScore,
      gapAnalysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    outputJSON({ status: 'error', ...formatError(error) });
    process.exit(1);
  }
}

main();
