import { apiGet } from './client.js';
import type { EtsyShop } from './types.js';

export async function getShop(shopId: string | number): Promise<EtsyShop> {
  return apiGet<EtsyShop>(`/application/shops/${shopId}`);
}

export async function findShops(shopName: string): Promise<{ count: number; results: EtsyShop[] }> {
  return apiGet<{ count: number; results: EtsyShop[] }>(
    '/application/shops',
    { shop_name: shopName },
  );
}

export async function getShopByOwnerUserId(userId: number): Promise<EtsyShop> {
  return apiGet<EtsyShop>(`/application/users/${userId}/shops`);
}
