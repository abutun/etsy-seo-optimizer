export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function sentenceCount(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return Math.max(1, sentences.length);
}

export function syllableCount(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function fleschReadingEase(text: string): number {
  const words = wordCount(text);
  if (words === 0) return 0;

  const sentences = sentenceCount(text);
  const syllables = text.split(/\s+/).reduce((sum, w) => sum + syllableCount(w), 0);

  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

export function keywordDensity(text: string, keyword: string): number {
  const words = wordCount(text);
  if (words === 0) return 0;

  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const regex = new RegExp(`\\b${escapeRegex(lowerKeyword)}\\b`, 'g');
  const matches = lowerText.match(regex);
  const count = matches ? matches.length : 0;

  return (count / words) * 100;
}

export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which',
    'who', 'when', 'where', 'why', 'how', 'not', 'no', 'so', 'if',
    'as', 'into', 'about', 'up', 'out', 'just', 'also', 'than', 'very',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

export function findCommonKeywords(texts: string[]): Map<string, number> {
  const keywordFreq = new Map<string, number>();

  for (const text of texts) {
    const keywords = new Set(extractKeywords(text));
    for (const kw of keywords) {
      keywordFreq.set(kw, (keywordFreq.get(kw) || 0) + 1);
    }
  }

  return new Map(
    [...keywordFreq.entries()].sort((a, b) => b[1] - a[1])
  );
}

export function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hasCallToAction(text: string): boolean {
  const ctaPatterns = [
    /\b(order|buy|shop|add to cart|purchase|get yours)\b/i,
    /\b(message me|contact me|reach out|ask me)\b/i,
    /\b(custom|personalize|customize)\b/i,
    /\b(limited|hurry|don't miss|last chance|while supplies)\b/i,
    /\b(free shipping|fast shipping|ships fast)\b/i,
    /\b(gift|perfect for|great for|ideal for)\b/i,
  ];

  return ctaPatterns.some(pattern => pattern.test(text));
}

export function isKeywordStuffed(text: string): boolean {
  const pipeCount = (text.match(/\|/g) || []).length;
  const commaCount = (text.match(/,/g) || []).length;
  const words = wordCount(text);

  if (pipeCount > 3) return true;
  if (words > 0 && commaCount / words > 0.3) return true;

  const wordList = text.toLowerCase().split(/\s+/);
  const freq = new Map<string, number>();
  for (const w of wordList) {
    if (w.length > 2) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }

  for (const [, count] of freq) {
    if (count > 3 && words > 0 && count / words > 0.15) return true;
  }

  return false;
}
