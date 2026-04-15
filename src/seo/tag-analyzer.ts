import { extractKeywords, similarity } from '../utils/text.js';
import type { EtsyListing } from '../api/types.js';

export interface TagScore {
  total: number;
  maxScore: 30;
  breakdown: {
    count: { score: number; max: 10; detail: string };
    diversity: { score: number; max: 8; detail: string };
    relevance: { score: number; max: 6; detail: string };
    noDuplicates: { score: number; max: 3; detail: string };
    noWaste: { score: number; max: 3; detail: string };
  };
  recommendations: string[];
}

const MAX_TAGS = 13;
const GENERIC_TAGS = new Set([
  'gift', 'cute', 'cool', 'nice', 'beautiful', 'pretty', 'good',
  'best', 'new', 'sale', 'free', 'love', 'awesome', 'amazing',
  'great', 'perfect', 'unique', 'special', 'trendy', 'popular',
]);

export function analyzeTags(listing: EtsyListing): TagScore {
  const tags = listing.tags || [];
  const title = listing.title;
  const recommendations: string[] = [];

  // 1. Count (10 points)
  const countScore = Math.round((tags.length / MAX_TAGS) * 10);
  let countDetail: string;

  if (tags.length === MAX_TAGS) {
    countDetail = `All ${MAX_TAGS} tag slots used`;
  } else if (tags.length >= 10) {
    countDetail = `${tags.length}/${MAX_TAGS} tags used`;
    recommendations.push(`Add ${MAX_TAGS - tags.length} more tags. Every unused slot is a missed search opportunity.`);
  } else {
    countDetail = `Only ${tags.length}/${MAX_TAGS} tags used`;
    recommendations.push(`Only ${tags.length}/${MAX_TAGS} tag slots used. Add ${MAX_TAGS - tags.length} more tags to maximize search visibility.`);
  }

  // 2. Diversity - mix of short-tail and long-tail (8 points)
  const shortTail = tags.filter(t => t.split(/\s+/).length <= 2);
  const longTail = tags.filter(t => t.split(/\s+/).length >= 3);
  const shortRatio = tags.length > 0 ? shortTail.length / tags.length : 0;
  const longRatio = tags.length > 0 ? longTail.length / tags.length : 0;

  let diversityScore: number;
  let diversityDetail: string;

  if (tags.length === 0) {
    diversityScore = 0;
    diversityDetail = 'No tags to analyze';
  } else if (longRatio >= 0.5 && shortRatio >= 0.2) {
    diversityScore = 8;
    diversityDetail = `Good mix: ${shortTail.length} short-tail, ${longTail.length} long-tail tags`;
  } else if (longRatio >= 0.3) {
    diversityScore = 5;
    diversityDetail = `Moderate mix: ${shortTail.length} short-tail, ${longTail.length} long-tail`;
    recommendations.push(`Add more long-tail tags (3+ words). Currently ${longTail.length}/${tags.length} are long-tail. Aim for 50%+.`);
  } else {
    diversityScore = 2;
    diversityDetail = `Poor mix: ${shortTail.length} short-tail, ${longTail.length} long-tail`;
    recommendations.push(`Most tags are short-tail (1-2 words). Add specific long-tail phrases like "handmade sterling silver necklace" instead of just "necklace".`);
  }

  // 3. Relevance to title (6 points)
  const titleKeywords = extractKeywords(title);
  let matchingTags = 0;

  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    for (const keyword of titleKeywords.slice(0, 8)) {
      if (tagLower.includes(keyword)) {
        matchingTags++;
        break;
      }
    }
  }

  let relevanceScore: number;
  let relevanceDetail: string;

  if (tags.length === 0) {
    relevanceScore = 0;
    relevanceDetail = 'No tags to analyze';
  } else if (matchingTags >= 4) {
    relevanceScore = 6;
    relevanceDetail = `${matchingTags} tags echo title keywords`;
  } else if (matchingTags >= 2) {
    relevanceScore = Math.round((matchingTags / 4) * 6);
    relevanceDetail = `${matchingTags} tags echo title keywords`;
    recommendations.push(`Only ${matchingTags} tags relate to title keywords. Ensure at least 4 tags reinforce your title's main terms.`);
  } else {
    relevanceScore = Math.round((matchingTags / 4) * 6);
    relevanceDetail = `Only ${matchingTags} tags echo title keywords`;
    recommendations.push(`Tags are disconnected from your title. Add tags that include your title's main keywords to reinforce search relevance.`);
  }

  // 4. No duplicates (3 points)
  const normalizedTags = tags.map(t => t.toLowerCase().trim());
  const uniqueTags = new Set(normalizedTags);
  const duplicates: string[] = [];

  if (uniqueTags.size < normalizedTags.length) {
    const seen = new Set<string>();
    for (const tag of normalizedTags) {
      if (seen.has(tag)) duplicates.push(tag);
      seen.add(tag);
    }
  }

  // Check near-duplicates (singular/plural, very similar)
  const nearDuplicates: string[] = [];
  for (let i = 0; i < normalizedTags.length; i++) {
    for (let j = i + 1; j < normalizedTags.length; j++) {
      if (similarity(normalizedTags[i], normalizedTags[j]) > 0.8) {
        nearDuplicates.push(`"${tags[i]}" ~ "${tags[j]}"`);
      }
    }
  }

  let noDuplicatesScore = 3;
  let noDuplicatesDetail = 'No duplicate tags';

  if (duplicates.length > 0) {
    noDuplicatesScore = Math.max(0, 3 - duplicates.length);
    noDuplicatesDetail = `Exact duplicates: ${duplicates.join(', ')}`;
    recommendations.push(`Remove duplicate tags: ${duplicates.join(', ')}. Replace with new, unique keywords.`);
  } else if (nearDuplicates.length > 0) {
    noDuplicatesScore = Math.max(1, 3 - nearDuplicates.length);
    noDuplicatesDetail = `Near-duplicates: ${nearDuplicates.join('; ')}`;
    recommendations.push(`Near-duplicate tags found: ${nearDuplicates.join('; ')}. Diversify to cover more search terms.`);
  }

  // 5. No wasted tags (3 points)
  const genericTags = tags.filter(t => {
    const words = t.toLowerCase().split(/\s+/);
    return words.length === 1 && GENERIC_TAGS.has(words[0]);
  });

  let noWasteScore = 3;
  let noWasteDetail = 'All tags are specific';

  if (genericTags.length > 0) {
    noWasteScore = Math.max(0, 3 - genericTags.length);
    noWasteDetail = `Generic tags: ${genericTags.join(', ')}`;
    recommendations.push(`Replace generic single-word tags (${genericTags.join(', ')}) with specific phrases like "${genericTags[0]} for her" or "unique ${genericTags[0]} idea".`);
  }

  const total = countScore + diversityScore + relevanceScore + noDuplicatesScore + noWasteScore;

  return {
    total: Math.min(30, total),
    maxScore: 30,
    breakdown: {
      count: { score: countScore, max: 10, detail: countDetail },
      diversity: { score: diversityScore, max: 8, detail: diversityDetail },
      relevance: { score: relevanceScore, max: 6, detail: relevanceDetail },
      noDuplicates: { score: noDuplicatesScore, max: 3, detail: noDuplicatesDetail },
      noWaste: { score: noWasteScore, max: 3, detail: noWasteDetail },
    },
    recommendations,
  };
}
