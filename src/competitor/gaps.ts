import type { EtsyListing } from '../api/types.js';
import type { CompetitorListing } from './search.js';
import { extractKeywords } from '../utils/text.js';

export interface KeywordGapAnalysis {
  targetTags: string[];
  competitorTagFrequency: TagFrequency[];
  missingHighValueTags: string[];
  missingTitleKeywords: string[];
  overlapTags: string[];
  uniqueTargetTags: string[];
  suggestions: GapSuggestion[];
  analyzedAt: string;
}

export interface TagFrequency {
  tag: string;
  count: number;
  percentage: number;
}

export interface GapSuggestion {
  type: 'add_tag' | 'add_title_keyword' | 'replace_tag';
  current?: string;
  suggested: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export function analyzeKeywordGaps(
  targetListing: EtsyListing,
  competitors: CompetitorListing[],
): KeywordGapAnalysis {
  const targetTags = new Set(targetListing.tags.map(t => t.toLowerCase()));

  // Count tag frequency across competitors
  const tagCounts = new Map<string, number>();
  for (const competitor of competitors) {
    for (const tag of competitor.tags) {
      const lower = tag.toLowerCase();
      tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
    }
  }

  const totalCompetitors = competitors.length;
  const tagFrequency: TagFrequency[] = [...tagCounts.entries()]
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / totalCompetitors) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Missing high-value tags: used by 30%+ of competitors but not by target
  const missingHighValueTags = tagFrequency
    .filter(tf => tf.percentage >= 30 && !targetTags.has(tf.tag))
    .map(tf => tf.tag);

  // Title keyword analysis
  const competitorTitleKeywords = new Map<string, number>();
  for (const competitor of competitors) {
    const keywords = extractKeywords(competitor.title);
    for (const kw of keywords.slice(0, 10)) {
      competitorTitleKeywords.set(kw, (competitorTitleKeywords.get(kw) || 0) + 1);
    }
  }

  const targetTitleKeywords = new Set(extractKeywords(targetListing.title));
  const missingTitleKeywords = [...competitorTitleKeywords.entries()]
    .filter(([kw, count]) => count >= totalCompetitors * 0.3 && !targetTitleKeywords.has(kw))
    .sort((a, b) => b[1] - a[1])
    .map(([kw]) => kw);

  // Overlap and unique tags
  const overlapTags = [...targetTags].filter(t => tagCounts.has(t));
  const uniqueTargetTags = [...targetTags].filter(t => !tagCounts.has(t));

  // Generate suggestions
  const suggestions: GapSuggestion[] = [];

  // Suggest adding missing high-value tags
  for (const tag of missingHighValueTags.slice(0, 5)) {
    const freq = tagFrequency.find(tf => tf.tag === tag);
    suggestions.push({
      type: 'add_tag',
      suggested: tag,
      reason: `Used by ${freq?.percentage}% of competing listings`,
      confidence: freq && freq.percentage >= 50 ? 'high' : 'medium',
    });
  }

  // Suggest replacing unique (not used by any competitor) tags with popular ones
  if (uniqueTargetTags.length > 0 && missingHighValueTags.length > 0) {
    const tagSlotsAvailable = 13 - targetListing.tags.length;

    if (tagSlotsAvailable === 0) {
      // Need to replace tags
      for (let i = 0; i < Math.min(uniqueTargetTags.length, missingHighValueTags.length, 3); i++) {
        suggestions.push({
          type: 'replace_tag',
          current: uniqueTargetTags[i],
          suggested: missingHighValueTags[i],
          reason: `"${uniqueTargetTags[i]}" is not used by any competitor. Replace with "${missingHighValueTags[i]}" which is used by ${tagFrequency.find(tf => tf.tag === missingHighValueTags[i])?.percentage}% of competitors.`,
          confidence: 'medium',
        });
      }
    }
  }

  // Suggest title keyword additions
  for (const kw of missingTitleKeywords.slice(0, 3)) {
    const count = competitorTitleKeywords.get(kw) || 0;
    suggestions.push({
      type: 'add_title_keyword',
      suggested: kw,
      reason: `Found in ${Math.round((count / totalCompetitors) * 100)}% of competitor titles`,
      confidence: count >= totalCompetitors * 0.5 ? 'high' : 'medium',
    });
  }

  return {
    targetTags: targetListing.tags,
    competitorTagFrequency: tagFrequency.slice(0, 30),
    missingHighValueTags,
    missingTitleKeywords,
    overlapTags,
    uniqueTargetTags,
    suggestions,
    analyzedAt: new Date().toISOString(),
  };
}
