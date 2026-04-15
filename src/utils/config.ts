import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

dotenvConfig({ path: resolve(PROJECT_ROOT, '.env') });

export interface Config {
  apiKey: string;
  sharedSecret: string;
  shopId: string;
  redirectUri: string;
  authPort: number;
  dataDir: string;
  projectRoot: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill in your values.`);
  }
  return value;
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) return cachedConfig;

  cachedConfig = {
    apiKey: requireEnv('ETSY_API_KEY'),
    sharedSecret: requireEnv('ETSY_SHARED_SECRET'),
    shopId: requireEnv('ETSY_SHOP_ID'),
    redirectUri: process.env['ETSY_REDIRECT_URI'] || 'http://localhost:3737/oauth/callback',
    authPort: parseInt(process.env['ETSY_AUTH_PORT'] || '3737', 10),
    dataDir: resolve(PROJECT_ROOT, process.env['DATA_DIR'] || './data'),
    projectRoot: PROJECT_ROOT,
  };

  return cachedConfig;
}
