# Etsy SEO Scoring Algorithm

## Overview

The scoring system evaluates listings on a 0-100 scale across four weighted dimensions. Each dimension has sub-metrics with specific point allocations.

## Score Labels

| Range | Label |
|-------|-------|
| 90-100 | Excellent |
| 75-89 | Good |
| 60-74 | Average |
| 40-59 | Below Average |
| 0-39 | Poor |

## Title Score (30 points max)

### Length (8 pts)
- Optimal: 80-140 characters (Etsy max is 140)
- Under 40 chars: heavy penalty
- 40-79 chars: proportional scoring
- 80-140 chars: full points

### Keyword Position (8 pts)
- Primary keyword in first 40 chars: 8 pts
- In first 80 chars: 4 pts
- Beyond 80 chars: 1 pt
- No keywords detected: 0 pts

### Keyword Richness (7 pts)
- 5+ unique meaningful keywords: 7 pts
- Scaled linearly below 5

### Readability (4 pts)
- Deductions for: keyword stuffing (pipes, excessive commas), ALL CAPS, excessive punctuation

### No Waste (3 pts)
- Deductions for: repeated words (1 pt per repeated word)

## Tag Score (30 points max)

### Count (10 pts)
- 13/13 tags: 10 pts
- Linear scaling: (count / 13) * 10

### Diversity (8 pts)
- Ideal mix: 40% short-tail (1-2 words), 60% long-tail (3+ words)
- Good mix: 8 pts
- Moderate (30%+ long-tail): 5 pts
- Poor (mostly short-tail): 2 pts

### Relevance (6 pts)
- Tags that echo title keywords
- 4+ matching: 6 pts
- Scaled linearly below 4

### No Duplicates (3 pts)
- Exact duplicates: -1 pt each
- Near-duplicates (>80% similarity): -1 pt each

### No Waste (3 pts)
- Single-word generic tags ("gift", "cute", "cool"): -1 pt each

## Description Score (25 points max)

### Length (6 pts)
- Optimal: 300-1000 words
- Under 100 words: poor
- Scaled proportionally

### Keyword Density (6 pts)
- Optimal: 0.4-2.0% for primary keyword
- Over 4%: over-optimized (2 pts)
- 0%: keyword missing (0 pts)

### Structure (5 pts)
- 3+ paragraphs/sections: 5 pts
- 2 paragraphs: 3 pts
- Wall of text: 1 pt

### Opening Strength (4 pts)
- First 160 chars contain title keywords + product context
- Keywords + richness: 4 pts
- Keywords only: 3 pts
- Some keywords: 2 pts
- Weak opening: 1 pt

### Call to Action (4 pts)
- Contains action language (order, buy, message, customize, etc.): 4 pts
- No CTA detected: 1 pt

## Image Score (15 points max)

### Count (8 pts)
- 10/10 images: 8 pts
- Linear scaling: (count / 10) * 8

### Primary Image (4 pts)
- Has first/primary image: 4 pts
- Bonus note for non-square aspect ratio

### Variety (3 pts)
- Multiple aspect ratios or 5+ images: 3 pts
- All same dimensions: 2 pts
- Single image: 1 pt
- Additional check: alt text coverage

## Recommendation Priority

Recommendations are ranked by dimension score ratio:
- Score ratio < 0.4 (under 40% of max): **High** priority
- Score ratio 0.4-0.7: **Medium** priority
- Score ratio > 0.7: **Low** priority

Within each priority level, sort by impact (title/tags before description/images).
