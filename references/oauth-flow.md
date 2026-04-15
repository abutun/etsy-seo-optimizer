# Etsy OAuth 2.0 PKCE Flow

## Overview

Etsy API v3 uses OAuth 2.0 Authorization Code Grant with PKCE (Proof Key for Code Exchange). PKCE is mandatory.

## Flow Steps

### 1. Generate PKCE Pair
- `code_verifier`: Random 43-128 character string from `[A-Za-z0-9._~-]`
- `code_challenge`: SHA-256 hash of verifier, base64url-encoded

### 2. Build Authorization URL
```
https://www.etsy.com/oauth/connect
  ?response_type=code
  &client_id={ETSY_API_KEY}
  &redirect_uri={REDIRECT_URI}
  &scope=listings_r%20listings_w%20shops_r%20transactions_r%20profile_r
  &state={RANDOM_STATE}
  &code_challenge={CODE_CHALLENGE}
  &code_challenge_method=S256
```

### 3. User Authorizes
User opens URL in browser, logs into Etsy, approves the app. Etsy redirects to callback URL with `code` and `state` parameters.

### 4. Exchange Code for Tokens
```
POST https://api.etsy.com/v3/public/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={ETSY_API_KEY}
&redirect_uri={REDIRECT_URI}
&code={AUTH_CODE}
&code_verifier={CODE_VERIFIER}
```

### 5. Receive Tokens
```json
{
  "access_token": "12345678.token_string",
  "refresh_token": "12345678.refresh_string",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## Token Lifecycle

| Token | Lifetime | Usage |
|-------|----------|-------|
| Access token | 1 hour | API requests via `Authorization: Bearer` header |
| Refresh token | 90 days | Exchange for new access token |

## Refresh Flow

```
POST https://api.etsy.com/v3/public/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id={ETSY_API_KEY}
&refresh_token={REFRESH_TOKEN}
```

Returns new access and refresh tokens. Previous refresh token is invalidated.

## Token Format

Etsy tokens include the user ID: `{numeric_user_id}.{token_string}`

## Error Handling

- 401 Unauthorized: Token expired or invalid. Try refresh, then re-auth.
- State mismatch: CSRF protection. Restart auth flow.
- Invalid grant: Code expired (10 minutes) or already used. Restart auth flow.

## Local Auth Server

The skill runs a temporary HTTP server on `localhost:3737` to receive the OAuth callback. The server:
1. Starts and prints the authorization URL
2. Waits for ONE request to `/oauth/callback`
3. Validates state parameter
4. Exchanges code for tokens
5. Saves tokens to `data/tokens.json`
6. Shuts down

## Security Notes

- Tokens stored in plaintext in gitignored `data/tokens.json`
- PKCE prevents authorization code interception
- State parameter prevents CSRF attacks
- Redirect URI must match exactly what's registered in the Etsy app
