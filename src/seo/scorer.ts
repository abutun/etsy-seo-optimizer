import { analyzeTitle, type TitleScore } from './title-analyzer.js';
import { analyzeTags, type TagScore } from './tag-analyzer.js';
import { analyzeDescription, type DescriptionScore } from './description-analyzer.js';
import { analyzeImages, type ImageScore } from './image-analyzer.js';
import type { EtsyListing } from '../api/types.js';
import { scoreLabel } from '../utils/formatter.js';

export interface ListingSEOScore {
  listingId: number;
  title: string;
  url: string;
  overall: number;
  label: string;
  titleScore: TitleScore;
  tagScore: TagScore;
  descriptionScore: DescriptionScore;
  imageScore: ImageScore;
  recommendations: RankedRecommendation[];
  scoredAt: string;
}

export interface RankedRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'title' | 'tags' | 'description' | 'images';
  recommendation: string;
}

export interface ShopSEOReport {
  shopId: string;
  totalListings: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;  // 90-100
    good: number;       // 75-89
    average: number;    // 60-74
    belowAverage: number; // 40-59
    poor: number;       // 0-39
  };
  listings: ListingSEOScore[];
  topRecommendations: RankedRecommendation[];
  generatedAt: string;
}

function rankRecommendations(
  titleScore: TitleScore,
  tagScore: TagScore,
  descriptionScore: DescriptionScore,
  imageScore: ImageScore,
): RankedRecommendation[] {
  const recommendations: RankedRecommendation[] = [];

  const addRecs = (
    category: RankedRecommendation['category'],
    recs: string[],
    scoreRatio: number,
  ) => {
    const priority: RankedRecommendation['priority'] =
      scoreRatio < 0.4 ? 'high' : scoreRatio < 0.7 ? 'medium' : 'low';

    for (const rec of recs) {
      recommendations.push({ priority, category, recommendation: rec });
    }
  };

  addRecs('title', titleScore.recommendations, titleScore.total / titleScore.maxScore);
  addRecs('tags', tagScore.recommendations, tagScore.total / tagScore.maxScore);
  addRecs('description', descriptionScore.recommendations, descriptionScore.total / descriptionScore.maxScore);
  addRecs('images', imageScore.recommendations, imageScore.total / imageScore.maxScore);

  // Sort: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

export function scoreListing(listing: EtsyListing): ListingSEOScore {
  const titleScore = analyzeTitle(listing);
  const tagScore = analyzeTags(listing);
  const descriptionScore = analyzeDescription(listing);
  const imageScore = analyzeImages(listing);

  const overall = titleScore.total + tagScore.total + descriptionScore.total + imageScore.total;
  const recommendations = rankRecommendations(titleScore, tagScore, descriptionScore, imageScore);

  return {
    listingId: listing.listing_id,
    title: listing.title,
    url: listing.url,
    overall,
    label: scoreLabel(overall),
    titleScore,
    tagScore,
    descriptionScore,
    imageScore,
    recommendations,
    scoredAt: new Date().toISOString(),
  };
}

export function scoreShop(
  shopId: string,
  listings: EtsyListing[],
): ShopSEOReport {
  const scoredListings = listings.map(listing => scoreListing(listing));

  // Sort worst first
  scoredListings.sort((a, b) => a.overall - b.overall);

  const scores = scoredListings.map(l => l.overall);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const distribution = {
    excellent: scores.filter(s => s >= 90).length,
    good: scores.filter(s => s >= 75 && s < 90).length,
    average: scores.filter(s => s >= 60 && s < 75).length,
    belowAverage: scores.filter(s => s >= 40 && s < 60).length,
    poor: scores.filter(s => s < 40).length,
  };

  // Aggregate top recommendations across all listings
  const recFreq = new Map<string, { count: number; priority: RankedRecommendation['priority']; category: RankedRecommendation['category'] }>();
  for (const listing of scoredListings) {
    for (const rec of listing.recommendations) {
      // Generalize recommendations by removing listing-specific details
      const key = `${rec.category}:${rec.priority}:${rec.recommendation.slice(0, 60)}`;
      const existing = recFreq.get(key);
      if (existing) {
        existing.count++;
      } else {
        recFreq.set(key, { count: 1, priority: rec.priority, category: rec.category });
      }
    }
  }

  const topRecommendations: RankedRecommendation[] = [...recFreq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([key, { priority, category }]) => ({
      priority,
      category,
      recommendation: key.split(':').slice(2).join(':'),
    }));

  return {
    shopId,
    totalListings: listings.length,
    averageScore,
    scoreDistribution: distribution,
    listings: scoredListings,
    topRecommendations,
    generatedAt: new Date().toISOString(),
  };
}
