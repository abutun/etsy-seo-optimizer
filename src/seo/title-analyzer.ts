import { extractKeywords, isKeywordStuffed, wordCount } from '../utils/text.js';
import type { EtsyListing } from '../api/types.js';

export interface TitleScore {
  total: number;
  maxScore: 30;
  breakdown: {
    length: { score: number; max: 8; detail: string };
    keywordPosition: { score: number; max: 8; detail: string };
    keywordRichness: { score: number; max: 7; detail: string };
    readability: { score: number; max: 4; detail: string };
    noWaste: { score: number; max: 3; detail: string };
  };
  recommendations: string[];
}

const MAX_TITLE_LENGTH = 140;
const OPTIMAL_MIN_LENGTH = 80;
const MIN_ACCEPTABLE_LENGTH = 40;

export function analyzeTitle(listing: EtsyListing): TitleScore {
  const title = listing.title;
  const recommendations: string[] = [];

  // 1. Length (8 points)
  let lengthScore: number;
  let lengthDetail: string;
  const titleLength = title.length;

  if (titleLength >= OPTIMAL_MIN_LENGTH && titleLength <= MAX_TITLE_LENGTH) {
    lengthScore = 8;
    lengthDetail = `Good length (${titleLength}/${MAX_TITLE_LENGTH} chars)`;
  } else if (titleLength < MIN_ACCEPTABLE_LENGTH) {
    lengthScore = Math.round((titleLength / OPTIMAL_MIN_LENGTH) * 8 * 0.5);
    lengthDetail = `Too short (${titleLength} chars). Aim for ${OPTIMAL_MIN_LENGTH}-${MAX_TITLE_LENGTH} chars`;
    recommendations.push(`Title is too short (${titleLength} chars). Add more descriptive keywords to reach ${OPTIMAL_MIN_LENGTH}+ chars.`);
  } else if (titleLength < OPTIMAL_MIN_LENGTH) {
    lengthScore = Math.round((titleLength / OPTIMAL_MIN_LENGTH) * 8);
    lengthDetail = `Could be longer (${titleLength}/${MAX_TITLE_LENGTH} chars)`;
    recommendations.push(`Title could be longer (${titleLength} chars). You have room for ${MAX_TITLE_LENGTH - titleLength} more characters.`);
  } else {
    lengthScore = 8;
    lengthDetail = `At maximum length (${titleLength}/${MAX_TITLE_LENGTH} chars)`;
  }

  // 2. Primary keyword position (8 points)
  const keywords = extractKeywords(title);
  let keywordPositionScore: number;
  let keywordPositionDetail: string;

  if (keywords.length === 0) {
    keywordPositionScore = 0;
    keywordPositionDetail = 'No meaningful keywords detected';
    recommendations.push('Add descriptive keywords to your title.');
  } else {
    const primaryKeyword = keywords[0];
    const position = title.toLowerCase().indexOf(primaryKeyword);

    if (position <= 40) {
      keywordPositionScore = 8;
      keywordPositionDetail = `Primary keyword "${primaryKeyword}" appears early (position ${position})`;
    } else if (position <= 80) {
      keywordPositionScore = 4;
      keywordPositionDetail = `Primary keyword "${primaryKeyword}" appears mid-title (position ${position})`;
      recommendations.push(`Move your primary keyword "${primaryKeyword}" closer to the beginning of the title.`);
    } else {
      keywordPositionScore = 1;
      keywordPositionDetail = `Primary keyword "${primaryKeyword}" appears late (position ${position})`;
      recommendations.push(`Primary keyword "${primaryKeyword}" is buried at position ${position}. Move it to the first 40 characters.`);
    }
  }

  // 3. Keyword richness (7 points)
  const uniqueKeywords = new Set(keywords);
  let keywordRichnessScore: number;
  let keywordRichnessDetail: string;

  if (uniqueKeywords.size >= 5) {
    keywordRichnessScore = 7;
    keywordRichnessDetail = `Good keyword variety (${uniqueKeywords.size} unique keywords)`;
  } else if (uniqueKeywords.size >= 3) {
    keywordRichnessScore = Math.round((uniqueKeywords.size / 5) * 7);
    keywordRichnessDetail = `Moderate keyword variety (${uniqueKeywords.size} unique keywords)`;
    recommendations.push(`Add more descriptive keywords. Currently ${uniqueKeywords.size}, aim for 5+ unique keywords.`);
  } else {
    keywordRichnessScore = Math.round((uniqueKeywords.size / 5) * 7);
    keywordRichnessDetail = `Low keyword variety (${uniqueKeywords.size} unique keywords)`;
    recommendations.push(`Title lacks keyword variety. Add more descriptive terms (material, style, use case, color).`);
  }

  // 4. Readability (4 points)
  let readabilityScore = 4;
  let readabilityDetail = 'Good readability';

  if (isKeywordStuffed(title)) {
    readabilityScore = 1;
    readabilityDetail = 'Title appears keyword-stuffed';
    recommendations.push('Title appears keyword-stuffed. Use natural language with commas or dashes as separators instead of pipes.');
  }

  if (title === title.toUpperCase() && title.length > 10) {
    readabilityScore = Math.max(0, readabilityScore - 2);
    readabilityDetail = 'ALL CAPS hurts readability';
    recommendations.push('Avoid ALL CAPS in titles. Use title case instead for better readability.');
  }

  const excessivePunctuation = (title.match(/[!?]{2,}/g) || []).length;
  if (excessivePunctuation > 0) {
    readabilityScore = Math.max(0, readabilityScore - 1);
    readabilityDetail = 'Excessive punctuation detected';
    recommendations.push('Remove excessive punctuation (!! or ??). Keep punctuation minimal and professional.');
  }

  // 5. No waste (3 points)
  let noWasteScore = 3;
  let noWasteDetail = 'No wasted characters';

  // Check for repeated keywords
  const wordList = title.toLowerCase().split(/[\s,\-|]+/).filter(w => w.length > 2);
  const wordFreq = new Map<string, number>();
  for (const w of wordList) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }

  const repeatedWords = [...wordFreq.entries()].filter(([, count]) => count > 1);
  if (repeatedWords.length > 0) {
    noWasteScore = Math.max(0, 3 - repeatedWords.length);
    const repeated = repeatedWords.map(([w, c]) => `"${w}" (${c}x)`).join(', ');
    noWasteDetail = `Repeated words: ${repeated}`;
    recommendations.push(`Remove repeated words in title: ${repeated}. Each word should appear only once.`);
  }

  const total = lengthScore + keywordPositionScore + keywordRichnessScore + readabilityScore + noWasteScore;

  return {
    total: Math.min(30, total),
    maxScore: 30,
    breakdown: {
      length: { score: lengthScore, max: 8, detail: lengthDetail },
      keywordPosition: { score: keywordPositionScore, max: 8, detail: keywordPositionDetail },
      keywordRichness: { score: keywordRichnessScore, max: 7, detail: keywordRichnessDetail },
      readability: { score: readabilityScore, max: 4, detail: readabilityDetail },
      noWaste: { score: noWasteScore, max: 3, detail: noWasteDetail },
    },
    recommendations,
  };
}
