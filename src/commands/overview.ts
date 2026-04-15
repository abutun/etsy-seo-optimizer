import { getConfig } from '../utils/config.js';
import { getAllShopListings } from '../api/listings.js';
import { getShop } from '../api/shops.js';
import { scoreListing } from '../seo/scorer.js';
import { getAllLatestSnapshots, saveSnapshot } from '../tracking/history.js';
import { outputJSON, formatError, trendArrow, truncate, scoreLabel } from '../utils/formatter.js';

interface OverviewArgs {
  sort: 'score' | 'views' | 'favorites' | 'recent';
}

function parseArgs(): OverviewArgs {
  const argv = process.argv.slice(2);
  const args: OverviewArgs = { sort: 'score' };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--sort' && argv[i + 1]) {
      const sortValue = argv[i + 1];
      if (['score', 'views', 'favorites', 'recent'].includes(sortValue)) {
        args.sort = sortValue as OverviewArgs['sort'];
      }
      i++;
    }
  }

  return args;
}

async function main() {
  try {
    const config = getConfig();
    const args = parseArgs();

    // Fetch shop info and all listings
    const [shop, listings] = await Promise.all([
      getShop(config.shopId).catch(() => null),
      getAllShopListings(config.shopId, ['Images']),
    ]);

    // Get previous snapshots for trends
    const previousSnapshots = await getAllLatestSnapshots();

    // Score each listing
    const scoredListings = listings.map(listing => {
      const score = scoreListing(listing);
      const prev = previousSnapshots.get(listing.listing_id);

      return {
        listingId: listing.listing_id,
        title: truncate(listing.title, 60),
        fullTitle: listing.title,
        url: listing.url,
        state: listing.state,
        score: score.overall,
        label: score.label,
        trend: trendArrow(score.overall, prev?.overall),
        previousScore: prev?.overall,
        views: listing.views,
        favorites: listing.num_favorers,
        price: {
          amount: listing.price.amount / listing.price.divisor,
          currency: listing.price.currency_code,
        },
        tagCount: listing.tags.length,
        imageCount: listing.images?.length || 0,
        topRecommendation: score.recommendations[0]?.recommendation || null,
        lastModified: new Date(listing.last_modified_timestamp * 1000).toISOString(),
      };
    });

    // Save new snapshots
    for (const listing of listings) {
      const score = scoreListing(listing);
      await saveSnapshot(score);
    }

    // Sort
    switch (args.sort) {
      case 'score':
        scoredListings.sort((a, b) => a.score - b.score); // worst first
        break;
      case 'views':
        scoredListings.sort((a, b) => b.views - a.views);
        break;
      case 'favorites':
        scoredListings.sort((a, b) => b.favorites - a.favorites);
        break;
      case 'recent':
        scoredListings.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        break;
    }

    // Shop-level stats
    const scores = scoredListings.map(l => l.score);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const totalViews = scoredListings.reduce((sum, l) => sum + l.views, 0);
    const totalFavorites = scoredListings.reduce((sum, l) => sum + l.favorites, 0);

    outputJSON({
      shop: shop ? {
        name: shop.shop_name,
        url: shop.url,
        activeListings: shop.listing_active_count,
        favoriteCount: shop.num_favorers,
        reviewAverage: shop.review_average,
        reviewCount: shop.review_count,
      } : null,
      summary: {
        totalListings: scoredListings.length,
        averageScore,
        averageLabel: scoreLabel(averageScore),
        totalViews,
        totalFavorites,
        distribution: {
          excellent: scores.filter(s => s >= 90).length,
          good: scores.filter(s => s >= 75 && s < 90).length,
          average: scores.filter(s => s >= 60 && s < 75).length,
          belowAverage: scores.filter(s => s >= 40 && s < 60).length,
          poor: scores.filter(s => s < 40).length,
        },
      },
      listings: scoredListings,
      priorityTargets: scoredListings.slice(0, 5).map(l => ({
        listingId: l.listingId,
        title: l.title,
        score: l.score,
        topRecommendation: l.topRecommendation,
      })),
      sortedBy: args.sort,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    outputJSON({ status: 'error', ...formatError(error) });
    process.exit(1);
  }
}

main();
