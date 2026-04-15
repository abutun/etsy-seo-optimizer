import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { apiGet } from './client.js';
import { getConfig } from '../utils/config.js';
import type { EtsyTaxonomyNode, EtsyTaxonomyResponse } from './types.js';

let cachedTaxonomy: EtsyTaxonomyNode[] | null = null;

export async function getTaxonomyNodes(): Promise<EtsyTaxonomyNode[]> {
  if (cachedTaxonomy) return cachedTaxonomy;

  const config = getConfig();
  const cachePath = join(config.dataDir, 'taxonomy-cache.json');

  // Try loading from local cache (refreshed daily)
  try {
    const raw = await readFile(cachePath, 'utf-8');
    const cached = JSON.parse(raw) as { timestamp: number; data: EtsyTaxonomyNode[] };
    const ageMs = Date.now() - cached.timestamp;
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (ageMs < oneDayMs) {
      cachedTaxonomy = cached.data;
      return cached.data;
    }
  } catch {
    // Cache miss or invalid, fetch from API
  }

  const response = await apiGet<EtsyTaxonomyResponse>('/application/seller-taxonomy/nodes');
  cachedTaxonomy = response.results;

  // Save to local cache
  try {
    await mkdir(config.dataDir, { recursive: true });
    await writeFile(cachePath, JSON.stringify({
      timestamp: Date.now(),
      data: response.results,
    }), 'utf-8');
  } catch {
    // Non-critical, continue without caching
  }

  return response.results;
}

export function findTaxonomyNode(
  nodes: EtsyTaxonomyNode[],
  taxonomyId: number,
): EtsyTaxonomyNode | null {
  for (const node of nodes) {
    if (node.id === taxonomyId) return node;
    const found = findTaxonomyNode(node.children, taxonomyId);
    if (found) return found;
  }
  return null;
}

export function getTaxonomyPath(
  nodes: EtsyTaxonomyNode[],
  taxonomyId: number,
): string[] {
  const node = findTaxonomyNode(nodes, taxonomyId);
  if (!node) return [];

  const path: string[] = [];
  let current: EtsyTaxonomyNode | null = node;

  // Build path by following full_path_taxonomy_ids
  for (const id of node.full_path_taxonomy_ids) {
    const pathNode = findTaxonomyNode(nodes, id);
    if (pathNode) path.push(pathNode.name);
  }

  return path.length > 0 ? path : [node.name];
}
