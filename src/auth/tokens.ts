import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getConfig } from '../utils/config.js';
import type { TokenData } from '../api/types.js';

function getTokenPath(): string {
  return join(getConfig().dataDir, 'tokens.json');
}

export async function loadTokens(): Promise<TokenData | null> {
  try {
    const raw = await readFile(getTokenPath(), 'utf-8');
    return JSON.parse(raw) as TokenData;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: TokenData): Promise<void> {
  const config = getConfig();
  await mkdir(config.dataDir, { recursive: true });
  await writeFile(getTokenPath(), JSON.stringify(tokens, null, 2), 'utf-8');
}

export function isTokenExpired(tokens: TokenData): boolean {
  const bufferMs = 60_000; // 1 minute buffer
  return Date.now() >= (tokens.expires_at - bufferMs);
}

export async function refreshAccessToken(tokens: TokenData): Promise<TokenData> {
  const config = getConfig();

  const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.apiKey,
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  const newTokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  await saveTokens(newTokens);
  return newTokens;
}

export async function getValidAccessToken(): Promise<string> {
  let tokens = await loadTokens();

  if (!tokens) {
    throw new Error('AUTH_REQUIRED');
  }

  if (isTokenExpired(tokens)) {
    try {
      tokens = await refreshAccessToken(tokens);
    } catch (error) {
      throw new Error('AUTH_REQUIRED');
    }
  }

  return tokens.access_token;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<TokenData> {
  const config = getConfig();

  const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.apiKey,
      redirect_uri: config.redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  const tokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  await saveTokens(tokens);
  return tokens;
}
