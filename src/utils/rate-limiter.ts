const MAX_QPS = 10;
const MAX_QPD = 10_000;
const QPD_WARNING_THRESHOLD = 8_000;

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private dailyCount: number;
  private dailyResetTime: number;

  constructor() {
    this.tokens = MAX_QPS;
    this.lastRefill = Date.now();
    this.dailyCount = 0;
    this.dailyResetTime = this.getNextMidnight();
  }

  private getNextMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(MAX_QPS, this.tokens + elapsed * MAX_QPS);
    this.lastRefill = now;

    if (now >= this.dailyResetTime) {
      this.dailyCount = 0;
      this.dailyResetTime = this.getNextMidnight();
    }
  }

  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.dailyCount >= MAX_QPD) {
      throw new Error(`Daily API quota exceeded (${MAX_QPD} requests). Try again tomorrow.`);
    }

    if (this.tokens < 1) {
      const waitMs = ((1 - this.tokens) / MAX_QPS) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitMs));
      this.refillTokens();
    }

    this.tokens -= 1;
    this.dailyCount += 1;

    if (this.dailyCount === QPD_WARNING_THRESHOLD) {
      console.error(`[rate-limiter] Warning: ${QPD_WARNING_THRESHOLD}/${MAX_QPD} daily API requests used.`);
    }
  }

  getUsage(): { dailyUsed: number; dailyLimit: number; remainingToday: number } {
    this.refillTokens();
    return {
      dailyUsed: this.dailyCount,
      dailyLimit: MAX_QPD,
      remainingToday: MAX_QPD - this.dailyCount,
    };
  }
}

export const rateLimiter = new RateLimiter();
