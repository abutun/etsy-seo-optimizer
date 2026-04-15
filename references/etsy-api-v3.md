# Etsy API v3 Reference

## Base URL
`https://openapi.etsy.com/v3` or `https://api.etsy.com/v3`

## Authentication

### Headers
- `x-api-key: {API_KEY}` - Required on ALL requests
- `Authorization: Bearer {access_token}` - Required on OAuth-protected endpoints

### OAuth 2.0 PKCE Flow
1. Generate code_verifier (43-128 chars) and code_challenge (SHA256, base64url)
2. Redirect to `https://www.etsy.com/oauth/connect?response_type=code&client_id={KEY}&redirect_uri={URI}&scope={SCOPES}&state={STATE}&code_challenge={CHALLENGE}&code_challenge_method=S256`
3. Exchange code at `POST https://api.etsy.com/v3/public/oauth/token`
4. Access tokens expire in 1 hour, refresh tokens in 90 days

### Scopes
- `listings_r` - Read listings (all states)
- `listings_w` - Create/update listings
- `shops_r` - Read shop details
- `transactions_r` - Read sales data
- `profile_r` - Read private profile

## Key Endpoints

### Shop
- `GET /application/shops/{shop_id}` - Shop details (public)
- `GET /application/shops?shop_name=X` - Search shops (public)

### Listings
- `GET /application/shops/{shop_id}/listings` - All listings (OAuth: listings_r)
- `GET /application/shops/{shop_id}/listings/active` - Active listings (public)
- `GET /application/listings/{listing_id}` - Single listing (public)
- `PATCH /application/shops/{shop_id}/listings/{listing_id}` - Update (OAuth: listings_w)
- `GET /application/listings/active?keywords=X` - Marketplace search (public)

### Images
- `GET /application/shops/{shop_id}/listings/{listing_id}/images` - Listing images

### Taxonomy
- `GET /application/seller-taxonomy/nodes` - Full category tree

### Reviews
- `GET /application/listings/{listing_id}/reviews` - Listing reviews
- `GET /application/shops/{shop_id}/reviews` - Shop reviews

## Pagination
- `limit` - Max 100 per page
- `offset` - Start position
- Response includes `count` for total results

## Includes Parameter
Embed related data: `?includes=Images,Shop,Inventory,Videos`

## Rate Limits
- 10 requests/second (QPS)
- 10,000 requests/day (QPD)
- Response headers: `x-remaining-this-second`, `x-remaining-today`
- HTTP 429 when exceeded

## Listing Fields (SEO-relevant)
- `title` (string, max 140 chars)
- `description` (string)
- `tags` (array, max 13 items)
- `materials` (array)
- `taxonomy_id` (integer)
- `views` (integer, lifetime total)
- `num_favorers` (integer)
- `state` (active/inactive/sold_out/draft/expired)
- `price` (Money: amount, divisor, currency_code)

## Update Payload (PATCH)
All fields are optional: title, description, tags, materials, state, taxonomy_id, who_made, when_made, is_supply, shipping_profile_id, return_policy_id, shop_section_id, item_weight/length/width/height, should_auto_renew, featured_rank, is_taxable, type.

## Known Limitations
- No shop analytics API (views, conversion, traffic only in seller dashboard)
- No time-series listing stats (views/favorites are lifetime totals only)
- No keyword ranking data
- No search volume data
