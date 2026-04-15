import { apiGet, apiPatch } from './client.js';
import type { EtsyListing, EtsyListingsResponse, EtsyImage, ListingUpdatePayload } from './types.js';

export interface ListingQueryOptions {
  limit?: number;
  offset?: number;
  includes?: string[];
  sort_on?: 'created' | 'price' | 'updated' | 'score';
  sort_order?: 'asc' | 'desc';
  state?: string;
}

export async function getShopListings(
  shopId: string | number,
  options: ListingQueryOptions = {},
): Promise<EtsyListingsResponse> {
  const params: Record<string, string | number | boolean | undefined> = {
    limit: options.limit || 100,
    offset: options.offset || 0,
    state: options.state,
  };

  if (options.includes?.length) {
    params['includes'] = options.includes.join(',');
  }
  if (options.sort_on) {
    params['sort_on'] = options.sort_on;
    params['sort_order'] = options.sort_order || 'desc';
  }

  return apiGet<EtsyListingsResponse>(
    `/application/shops/${shopId}/listings`,
    params,
    true, // requires auth to see all states
  );
}

export async function getActiveShopListings(
  shopId: string | number,
  options: ListingQueryOptions = {},
): Promise<EtsyListingsResponse> {
  const params: Record<string, string | number | boolean | undefined> = {
    limit: options.limit || 100,
    offset: options.offset || 0,
  };

  if (options.includes?.length) {
    params['includes'] = options.includes.join(',');
  }
  if (options.sort_on) {
    params['sort_on'] = options.sort_on;
    params['sort_order'] = options.sort_order || 'desc';
  }

  return apiGet<EtsyListingsResponse>(
    `/application/shops/${shopId}/listings/active`,
    params,
  );
}

export async function getAllShopListings(
  shopId: string | number,
  includes: string[] = ['Images'],
): Promise<EtsyListing[]> {
  const allListings: EtsyListing[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await getActiveShopListings(shopId, { limit, offset, includes });
    allListings.push(...response.results);

    if (allListings.length >= response.count || response.results.length < limit) {
      break;
    }
    offset += limit;
  }

  return allListings;
}

export async function getListing(
  listingId: number,
  includes: string[] = ['Images'],
): Promise<EtsyListing> {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (includes.length) {
    params['includes'] = includes.join(',');
  }

  return apiGet<EtsyListing>(
    `/application/listings/${listingId}`,
    params,
  );
}

export async function getListingImages(
  shopId: string | number,
  listingId: number,
): Promise<{ count: number; results: EtsyImage[] }> {
  return apiGet<{ count: number; results: EtsyImage[] }>(
    `/application/shops/${shopId}/listings/${listingId}/images`,
  );
}

export async function updateListing(
  shopId: string | number,
  listingId: number,
  payload: ListingUpdatePayload,
): Promise<EtsyListing> {
  return apiPatch<EtsyListing>(
    `/application/shops/${shopId}/listings/${listingId}`,
    payload as Record<string, unknown>,
  );
}

export interface MarketplaceSearchOptions {
  keywords: string;
  limit?: number;
  offset?: number;
  sort_on?: 'created' | 'price' | 'updated' | 'score';
  sort_order?: 'asc' | 'desc';
  taxonomy_id?: number;
  min_price?: number;
  max_price?: number;
  includes?: string[];
}

export async function searchActiveListings(
  options: MarketplaceSearchOptions,
): Promise<EtsyListingsResponse> {
  const params: Record<string, string | number | boolean | undefined> = {
    keywords: options.keywords,
    limit: options.limit || 25,
    offset: options.offset || 0,
    sort_on: options.sort_on || 'score',
    sort_order: options.sort_order || 'desc',
    taxonomy_id: options.taxonomy_id,
    min_price: options.min_price,
    max_price: options.max_price,
  };

  if (options.includes?.length) {
    params['includes'] = options.includes.join(',');
  }

  return apiGet<EtsyListingsResponse>(
    '/application/listings/active',
    params,
  );
}
