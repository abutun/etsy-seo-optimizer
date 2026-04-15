import type { EtsyListing } from '../api/types.js';
import type { CompetitorListing } from './search.js';
import { scoreListing, type ListingSEOScore } from '../seo/scorer.js';

export interface CompetitorComparison {
  targetListing: {
    listingId: number;
    title: string;
    score: number;
    price: number;
    views: number;
    favorites: number;
    tagCount: number;
  };
  competitors: CompetitorSummary[];
  insights: ComparisonInsight[];
  comparedAt: string;
}

export interface CompetitorSummary {
  listingId: number;
  title: string;
  shopName: string;
  price: number;
  views: number;
  favorites: number;
  tagCount: number;
  url: string;
}

export interface ComparisonInsight {
  category: 'pricing' | 'engagement' | 'tags' | 'title' | 'general';
  type: 'advantage' | 'disadvantage' | 'neutral';
  insight: string;
}

export function compareListings(
  targetListing: EtsyListing,
  competitors: CompetitorListing[],
): CompetitorComparison {
  const targetPrice = targetListing.price.amount / targetListing.price.divisor;
  const insights: ComparisonInsight[] = [];

  const competitorSummaries: CompetitorSummary[] = competitors.map(c => ({
    listingId: c.listingId,
    title: c.title,
    shopName: c.shopName,
    price: c.price.amount,
    views: c.views,
    favorites: c.favorites,
    tagCount: c.tags.length,
    url: c.url,
  }));

  // Pricing analysis
  const competitorPrices = competitors.map(c => c.price.amount).filter(p => p > 0);
  if (competitorPrices.length > 0) {
    const avgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const medianPrice = competitorPrices.sort((a, b) => a - b)[Math.floor(competitorPrices.length / 2)];
    const minPrice = Math.min(...competitorPrices);
    const maxPrice = Math.max(...competitorPrices);

    if (targetPrice < avgPrice * 0.7) {
      insights.push({
        category: 'pricing',
        type: 'neutral',
        insight: `Your price ($${targetPrice.toFixed(2)}) is significantly below the competitor average ($${avgPrice.toFixed(2)}). Consider if you're undervaluing your product or if this is a competitive strategy.`,
      });
    } else if (targetPrice > avgPrice * 1.3) {
      insights.push({
        category: 'pricing',
        type: 'neutral',
        insight: `Your price ($${targetPrice.toFixed(2)}) is above the competitor average ($${avgPrice.toFixed(2)}). Ensure your listing communicates premium value through better photos, description, and branding.`,
      });
    } else {
      insights.push({
        category: 'pricing',
        type: 'advantage',
        insight: `Your price ($${targetPrice.toFixed(2)}) is competitive with the market average ($${avgPrice.toFixed(2)}). Price range: $${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}.`,
      });
    }
  }

  // Views/favorites analysis
  const competitorViews = competitors.map(c => c.views).filter(v => v > 0);
  const competitorFavs = competitors.map(c => c.favorites).filter(f => f > 0);

  if (competitorViews.length > 0) {
    const avgViews = Math.round(competitorViews.reduce((a, b) => a + b, 0) / competitorViews.length);
    if (targetListing.views < avgViews * 0.5) {
      insights.push({
        category: 'engagement',
        type: 'disadvantage',
        insight: `Your views (${targetListing.views}) are well below the competitor average (${avgViews}). Focus on improving title keywords and tags for better search visibility.`,
      });
    } else if (targetListing.views > avgViews * 1.5) {
      insights.push({
        category: 'engagement',
        type: 'advantage',
        insight: `Your views (${targetListing.views}) significantly exceed the competitor average (${avgViews}). Your listing has strong search visibility.`,
      });
    }
  }

  if (competitorFavs.length > 0) {
    const avgFavs = Math.round(competitorFavs.reduce((a, b) => a + b, 0) / competitorFavs.length);
    if (targetListing.num_favorers < avgFavs * 0.5 && targetListing.views > 0) {
      const conversionRate = ((targetListing.num_favorers / targetListing.views) * 100).toFixed(1);
      insights.push({
        category: 'engagement',
        type: 'disadvantage',
        insight: `Your favorites (${targetListing.num_favorers}) are below competitor average (${avgFavs}). Favorite-to-view ratio is ${conversionRate}%. Improve photos and pricing to increase conversion.`,
      });
    }
  }

  // Tag count analysis
  const competitorTagCounts = competitors.map(c => c.tags.length);
  const avgTagCount = competitorTagCounts.length > 0
    ? Math.round(competitorTagCounts.reduce((a, b) => a + b, 0) / competitorTagCounts.length)
    : 0;

  if (targetListing.tags.length < avgTagCount - 2) {
    insights.push({
      category: 'tags',
      type: 'disadvantage',
      insight: `You're using ${targetListing.tags.length} tags vs competitor average of ${avgTagCount}. Add more tags to match competitor coverage.`,
    });
  }

  // Title length analysis
  const competitorTitleLengths = competitors.map(c => c.title.length);
  const avgTitleLength = competitorTitleLengths.length > 0
    ? Math.round(competitorTitleLengths.reduce((a, b) => a + b, 0) / competitorTitleLengths.length)
    : 0;

  if (targetListing.title.length < avgTitleLength * 0.7) {
    insights.push({
      category: 'title',
      type: 'disadvantage',
      insight: `Your title (${targetListing.title.length} chars) is shorter than competitor average (${avgTitleLength} chars). Consider adding more descriptive keywords.`,
    });
  }

  return {
    targetListing: {
      listingId: targetListing.listing_id,
      title: targetListing.title,
      score: 0, // Will be filled by caller if needed
      price: targetPrice,
      views: targetListing.views,
      favorites: targetListing.num_favorers,
      tagCount: targetListing.tags.length,
    },
    competitors: competitorSummaries,
    insights,
    comparedAt: new Date().toISOString(),
  };
}
