export function outputJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Poor';
}

export function trendArrow(current: number, previous: number | undefined): string {
  if (previous === undefined) return '-';
  const diff = current - previous;
  if (diff > 2) return `+${diff}`;
  if (diff < -2) return `${diff}`;
  return '=';
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function formatError(error: unknown): { error: string; details?: string } {
  if (error instanceof Error) {
    return { error: error.message, details: error.stack };
  }
  return { error: String(error) };
}
