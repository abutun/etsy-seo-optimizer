import { searchActiveListings, type MarketplaceSearchOptions } from '../api/listings.js';
import type { EtsyListing } from '../api/types.js';

export interface CompetitorSearchResult {
  query: string;
  totalResults: number;
  listings: CompetitorListing[];
  searchedAt: string;
}

export interface CompetitorListing {
  listingId: number;
  title: string;
  shopName: string;
  price: { amount: number; currency: string };
  views: number;
  favorites: number;
  tags: string[];
  url: string;
  imageUrl: string | null;
  createdAt: string;
}

export async function searchCompetitors(
  keywords: string,
  options: {
    limit?: number;
    taxonomyId?: number;
    minPrice?: number;
    maxPrice?: number;
  } = {},
): Promise<CompetitorSearchResult> {
  const searchOptions: MarketplaceSearchOptions = {
    keywords,
    limit: options.limit || 25,
    sort_on: 'score',
    sort_order: 'desc',
    taxonomy_id: options.taxonomyId,
    min_price: options.minPrice,
    max_price: options.maxPrice,
    includes: ['Images', 'Shop'],
  };

  const response = await searchActiveListings(searchOptions);

  const listings: CompetitorListing[] = response.results.map(listing => ({
    listingId: listing.listing_id,
    title: listing.title,
    shopName: listing.shop?.shop_name || 'Unknown',
    price: {
      amount: listing.price.amount / listing.price.divisor,
      currency: listing.price.currency_code,
    },
    views: listing.views,
    favorites: listing.num_favorers,
    tags: listing.tags,
    url: listing.url,
    imageUrl: listing.images?.[0]?.url_570xN || null,
    createdAt: new Date(listing.creation_timestamp * 1000).toISOString(),
  }));

  return {
    query: keywords,
    totalResults: response.count,
    listings,
    searchedAt: new Date().toISOString(),
  };
}

export async function searchMultipleKeywords(
  keywordsList: string[],
  limit: number = 25,
): Promise<CompetitorSearchResult[]> {
  const results: CompetitorSearchResult[] = [];
  for (const keywords of keywordsList) {
    const result = await searchCompetitors(keywords, { limit });
    results.push(result);
  }
  return results;
}
