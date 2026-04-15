import { wordCount, extractKeywords, keywordDensity, hasCallToAction } from '../utils/text.js';
import type { EtsyListing } from '../api/types.js';

export interface DescriptionScore {
  total: number;
  maxScore: 25;
  breakdown: {
    length: { score: number; max: 6; detail: string };
    keywordDensity: { score: number; max: 6; detail: string };
    structure: { score: number; max: 5; detail: string };
    openingStrength: { score: number; max: 4; detail: string };
    callToAction: { score: number; max: 4; detail: string };
  };
  recommendations: string[];
}

const OPTIMAL_MIN_WORDS = 300;
const OPTIMAL_MAX_WORDS = 1000;
const MIN_ACCEPTABLE_WORDS = 100;
const SNIPPET_LENGTH = 160;

export function analyzeDescription(listing: EtsyListing): DescriptionScore {
  const description = listing.description || '';
  const title = listing.title;
  const recommendations: string[] = [];

  // Strip basic HTML for analysis
  const cleanDescription = description
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const words = wordCount(cleanDescription);

  // 1. Length (6 points)
  let lengthScore: number;
  let lengthDetail: string;

  if (words === 0) {
    lengthScore = 0;
    lengthDetail = 'Description is empty';
    recommendations.push('Add a description. Listings without descriptions are almost invisible in search.');
  } else if (words < MIN_ACCEPTABLE_WORDS) {
    lengthScore = Math.round((words / OPTIMAL_MIN_WORDS) * 6);
    lengthDetail = `Very short (${words} words)`;
    recommendations.push(`Description is only ${words} words. Aim for ${OPTIMAL_MIN_WORDS}-${OPTIMAL_MAX_WORDS} words with product details, materials, sizing, and use cases.`);
  } else if (words < OPTIMAL_MIN_WORDS) {
    lengthScore = Math.round((words / OPTIMAL_MIN_WORDS) * 6);
    lengthDetail = `Short (${words} words). Aim for ${OPTIMAL_MIN_WORDS}+`;
    recommendations.push(`Description is ${words} words. Add more detail (dimensions, care instructions, shipping info) to reach ${OPTIMAL_MIN_WORDS}+ words.`);
  } else if (words <= OPTIMAL_MAX_WORDS) {
    lengthScore = 6;
    lengthDetail = `Good length (${words} words)`;
  } else {
    lengthScore = 6;
    lengthDetail = `Long description (${words} words). Good for SEO.`;
  }

  // 2. Keyword density (6 points)
  const titleKeywords = extractKeywords(title);
  let densityScore: number;
  let densityDetail: string;

  if (words === 0 || titleKeywords.length === 0) {
    densityScore = 0;
    densityDetail = 'No content to analyze';
  } else {
    const primaryKeyword = titleKeywords[0];
    const density = keywordDensity(cleanDescription, primaryKeyword);
    const keywordOccurrences = Math.round((density / 100) * words);

    if (density >= 0.4 && density <= 2.0) {
      densityScore = 6;
      densityDetail = `Good keyword density (${density.toFixed(1)}%, "${primaryKeyword}" appears ${keywordOccurrences}x)`;
    } else if (density > 2.0 && density <= 4.0) {
      densityScore = 4;
      densityDetail = `Slightly high keyword density (${density.toFixed(1)}%)`;
      recommendations.push(`Primary keyword "${primaryKeyword}" appears ${keywordOccurrences} times (${density.toFixed(1)}% density). Reduce to 2-4 occurrences per 500 words.`);
    } else if (density > 4.0) {
      densityScore = 2;
      densityDetail = `Over-optimized keyword density (${density.toFixed(1)}%)`;
      recommendations.push(`Keyword "${primaryKeyword}" is overused (${keywordOccurrences} times). This can hurt search ranking. Use synonyms and natural language.`);
    } else if (density > 0) {
      densityScore = 3;
      densityDetail = `Low keyword density (${density.toFixed(1)}%)`;
      recommendations.push(`Primary keyword "${primaryKeyword}" appears only ${keywordOccurrences} time(s). Naturally work it into the description 2-4 times per 500 words.`);
    } else {
      densityScore = 0;
      densityDetail = `Primary keyword "${primaryKeyword}" not found in description`;
      recommendations.push(`Your primary keyword "${primaryKeyword}" doesn't appear in the description. Include it naturally 2-4 times.`);
    }
  }

  // 3. Structure (5 points)
  let structureScore: number;
  let structureDetail: string;

  if (words === 0) {
    structureScore = 0;
    structureDetail = 'No content';
  } else {
    const paragraphs = cleanDescription.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const hasLineBreaks = description.includes('\n');
    const hasSections = paragraphs.length >= 3;

    if (hasSections) {
      structureScore = 5;
      structureDetail = `Well-structured (${paragraphs.length} sections/paragraphs)`;
    } else if (hasLineBreaks && paragraphs.length >= 2) {
      structureScore = 3;
      structureDetail = `Some structure (${paragraphs.length} paragraphs)`;
      recommendations.push('Break your description into more distinct sections (e.g., Product Details, Materials, Dimensions, Care Instructions, Shipping).');
    } else {
      structureScore = 1;
      structureDetail = 'Wall of text - no paragraph breaks';
      recommendations.push('Description is a single block of text. Break it into clear sections with line breaks for better readability and SEO.');
    }
  }

  // 4. Opening strength (4 points)
  let openingScore: number;
  let openingDetail: string;

  if (words === 0) {
    openingScore = 0;
    openingDetail = 'No content';
  } else {
    const opening = cleanDescription.slice(0, SNIPPET_LENGTH);
    const openingKeywords = extractKeywords(opening);
    const titleInOpening = titleKeywords.some(kw =>
      opening.toLowerCase().includes(kw)
    );

    if (titleInOpening && openingKeywords.length >= 3) {
      openingScore = 4;
      openingDetail = 'Strong opening with keywords and context';
    } else if (titleInOpening) {
      openingScore = 3;
      openingDetail = 'Opening contains title keywords';
    } else if (openingKeywords.length >= 2) {
      openingScore = 2;
      openingDetail = 'Opening has some keywords but misses primary terms';
      recommendations.push('Include your main product keyword in the first 160 characters. This appears as the search snippet on Etsy.');
    } else {
      openingScore = 1;
      openingDetail = 'Weak opening - no relevant keywords';
      recommendations.push('Rewrite your opening sentence to include your primary keyword and a clear product benefit within the first 160 characters.');
    }
  }

  // 5. Call to action (4 points)
  let ctaScore: number;
  let ctaDetail: string;

  if (words === 0) {
    ctaScore = 0;
    ctaDetail = 'No content';
  } else if (hasCallToAction(cleanDescription)) {
    ctaScore = 4;
    ctaDetail = 'Contains call-to-action language';
  } else {
    ctaScore = 1;
    ctaDetail = 'No call-to-action detected';
    recommendations.push('Add a call-to-action: "Add to cart today", "Message me for custom orders", "Perfect gift for...", or mention free/fast shipping.');
  }

  const total = lengthScore + densityScore + structureScore + openingScore + ctaScore;

  return {
    total: Math.min(25, total),
    maxScore: 25,
    breakdown: {
      length: { score: lengthScore, max: 6, detail: lengthDetail },
      keywordDensity: { score: densityScore, max: 6, detail: densityDetail },
      structure: { score: structureScore, max: 5, detail: structureDetail },
      openingStrength: { score: openingScore, max: 4, detail: openingDetail },
      callToAction: { score: ctaScore, max: 4, detail: ctaDetail },
    },
    recommendations,
  };
}
