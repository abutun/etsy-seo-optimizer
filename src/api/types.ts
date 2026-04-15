export interface EtsyMoney {
  amount: number;
  divisor: number;
  currency_code: string;
}

export interface EtsyImage {
  listing_id: number;
  listing_image_id: number;
  hex_code: string | null;
  red: number | null;
  green: number | null;
  blue: number | null;
  hue: number | null;
  saturation: number | null;
  brightness: number | null;
  is_black_and_white: boolean | null;
  creation_tsz: number;
  created_timestamp: number;
  rank: number;
  url_75x75: string;
  url_170x135: string;
  url_570xN: string;
  url_fullxfull: string;
  full_height: number | null;
  full_width: number | null;
  alt_text: string | null;
}

export interface EtsyVideo {
  video_id: number;
  height: number;
  width: number;
  thumbnail_url: string;
  video_url: string;
  video_state: string;
}

export interface EtsyShop {
  shop_id: number;
  user_id: number;
  shop_name: string;
  create_date: number;
  created_timestamp: number;
  title: string | null;
  announcement: string | null;
  currency_code: string;
  is_vacation: boolean;
  vacation_message: string | null;
  sale_message: string | null;
  digital_sale_message: string | null;
  update_date: number;
  updated_timestamp: number;
  listing_active_count: number;
  digital_listing_count: number;
  login_name: string;
  accepts_custom_requests: boolean;
  policy_welcome: string | null;
  vacation_autoreply: string | null;
  url: string;
  image_url_760x100: string | null;
  num_favorers: number;
  languages: string[];
  icon_url_fullxfull: string | null;
  is_using_structured_policies: boolean;
  has_onboarded_structured_policies: boolean;
  include_dispute_form_link: boolean;
  review_average: number | null;
  review_count: number | null;
}

export type ListingState = 'active' | 'inactive' | 'sold_out' | 'draft' | 'expired';
export type WhoMade = 'i_did' | 'someone_else' | 'collective';
export type WhenMade =
  | 'made_to_order'
  | '2020_2024'
  | '2010_2019'
  | '2005_2009'
  | 'before_2005'
  | '2000_2004'
  | '1990s'
  | '1980s'
  | '1970s'
  | '1960s'
  | '1950s'
  | '1940s'
  | '1930s'
  | '1920s'
  | '1910s'
  | '1900s'
  | '1800s'
  | '1700s'
  | 'before_1700';

export interface EtsyListing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: ListingState;
  creation_timestamp: number;
  created_timestamp: number;
  ending_timestamp: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  updated_timestamp: number;
  state_timestamp: number;
  quantity: number;
  shop_section_id: number | null;
  featured_rank: number;
  url: string;
  num_favorers: number;
  non_taxable: boolean;
  is_taxable: boolean;
  is_customizable: boolean;
  is_personalizable: boolean;
  personalization_is_required: boolean;
  personalization_char_count_max: number | null;
  personalization_instructions: string | null;
  listing_type: string;
  tags: string[];
  materials: string[];
  shipping_profile_id: number | null;
  return_policy_id: number | null;
  processing_min: number | null;
  processing_max: number | null;
  who_made: WhoMade;
  when_made: WhenMade;
  is_supply: boolean;
  item_weight: number | null;
  item_weight_unit: string | null;
  item_length: number | null;
  item_width: number | null;
  item_height: number | null;
  item_dimensions_unit: string | null;
  is_private: boolean;
  style: string[];
  file_data: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  price: EtsyMoney;
  taxonomy_id: number | null;
  taxonomy_path?: string[];
  views: number;
  currency_code?: string;
  sku: string[];
  images?: EtsyImage[];
  videos?: EtsyVideo[];
  shop?: EtsyShop;
}

export interface EtsyListingsResponse {
  count: number;
  results: EtsyListing[];
}

export interface EtsyShopResponse {
  shop_id: number;
  [key: string]: unknown;
}

export interface EtsyTaxonomyNode {
  id: number;
  level: number;
  name: string;
  parent_id: number | null;
  children: EtsyTaxonomyNode[];
  full_path_taxonomy_ids: number[];
}

export interface EtsyTaxonomyResponse {
  count: number;
  results: EtsyTaxonomyNode[];
}

export interface EtsyReview {
  shop_id: number;
  listing_id: number;
  rating: number;
  review: string | null;
  language: string;
  image_url_fullxfull: string | null;
  create_timestamp: number;
  created_timestamp: number;
  update_timestamp: number;
  updated_timestamp: number;
}

export interface EtsyReviewsResponse {
  count: number;
  results: EtsyReview[];
}

export interface ListingUpdatePayload {
  title?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  state?: ListingState;
  taxonomy_id?: number;
  who_made?: WhoMade;
  when_made?: WhenMade;
  is_supply?: boolean;
  is_personalizable?: boolean;
  personalization_is_required?: boolean;
  personalization_char_count_max?: number;
  personalization_instructions?: string;
  shipping_profile_id?: number;
  return_policy_id?: number;
  shop_section_id?: number;
  item_weight?: number;
  item_weight_unit?: string;
  item_length?: number;
  item_width?: number;
  item_height?: number;
  item_dimensions_unit?: string;
  should_auto_renew?: boolean;
  featured_rank?: number;
  is_taxable?: boolean;
  type?: 'physical' | 'download' | 'both';
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

export interface AuthStatus {
  status: 'auth_required' | 'auth_complete';
  authUrl?: string;
  message?: string;
}
