import { randomBytes, createHash } from 'crypto';

export function generateCodeVerifier(): string {
  return randomBytes(64)
    .toString('base64url')
    .slice(0, 128);
}

export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

export function generateState(): string {
  return randomBytes(16).toString('hex');
}

export function buildAuthorizationUrl(params: {
  apiKey: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  scopes: string[];
}): string {
  const url = new URL('https://www.etsy.com/oauth/connect');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.apiKey);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', params.scopes.join(' '));
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export const REQUIRED_SCOPES = [
  'listings_r',
  'listings_w',
  'shops_r',
  'transactions_r',
  'profile_r',
];
