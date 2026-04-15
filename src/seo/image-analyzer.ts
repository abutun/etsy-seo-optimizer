import type { EtsyListing } from '../api/types.js';

export interface ImageScore {
  total: number;
  maxScore: 15;
  breakdown: {
    count: { score: number; max: 8; detail: string };
    hasPrimary: { score: number; max: 4; detail: string };
    variety: { score: number; max: 3; detail: string };
  };
  recommendations: string[];
}

const MAX_IMAGES = 10;
const MIN_RECOMMENDED = 5;

export function analyzeImages(listing: EtsyListing): ImageScore {
  const images = listing.images || [];
  const recommendations: string[] = [];

  // 1. Count (8 points)
  const imageCount = images.length;
  let countScore: number;
  let countDetail: string;

  if (imageCount >= MAX_IMAGES) {
    countScore = 8;
    countDetail = `All ${MAX_IMAGES} image slots used`;
  } else if (imageCount >= MIN_RECOMMENDED) {
    countScore = Math.round((imageCount / MAX_IMAGES) * 8);
    countDetail = `${imageCount}/${MAX_IMAGES} images`;
    recommendations.push(`Add ${MAX_IMAGES - imageCount} more images. Listings with ${MAX_IMAGES} images get significantly more views and sales.`);
  } else if (imageCount > 0) {
    countScore = Math.round((imageCount / MAX_IMAGES) * 8);
    countDetail = `Only ${imageCount}/${MAX_IMAGES} images`;
    recommendations.push(`Only ${imageCount} images. Add more showing: different angles, scale/size reference, lifestyle/in-use shots, detail close-ups, and packaging.`);
  } else {
    countScore = 0;
    countDetail = 'No images';
    recommendations.push('Add images immediately. Listings without images are nearly invisible in search results.');
  }

  // 2. Has primary image (4 points)
  let hasPrimaryScore: number;
  let hasPrimaryDetail: string;

  if (images.length > 0) {
    const primaryImage = images.find(img => img.rank === 1) || images[0];
    if (primaryImage) {
      hasPrimaryScore = 4;
      hasPrimaryDetail = 'Primary listing image present';

      // Check if primary image is square-ish (good for thumbnails)
      if (primaryImage.full_width && primaryImage.full_height) {
        const ratio = primaryImage.full_width / primaryImage.full_height;
        if (ratio < 0.8 || ratio > 1.25) {
          hasPrimaryDetail += ' (non-square aspect ratio)';
          recommendations.push('Your primary image is not close to square (4:5 to 1:1 ratio). Square images display better in Etsy search results and grids.');
        }
      }
    } else {
      hasPrimaryScore = 0;
      hasPrimaryDetail = 'No primary image set';
    }
  } else {
    hasPrimaryScore = 0;
    hasPrimaryDetail = 'No images uploaded';
  }

  // 3. Variety (3 points)
  let varietyScore: number;
  let varietyDetail: string;

  if (images.length <= 1) {
    varietyScore = images.length > 0 ? 1 : 0;
    varietyDetail = images.length > 0 ? 'Only one image - no variety' : 'No images';
    if (images.length === 1) {
      recommendations.push('Add multiple images showing different views, details, and the product in use.');
    }
  } else {
    // Check variety via aspect ratios and alt text
    const aspectRatios = images
      .filter(img => img.full_width && img.full_height)
      .map(img => Math.round((img.full_width! / img.full_height!) * 100) / 100);

    const uniqueRatios = new Set(aspectRatios);
    const hasAltText = images.filter(img => img.alt_text && img.alt_text.length > 0).length;

    if (uniqueRatios.size >= 2 || images.length >= 5) {
      varietyScore = 3;
      varietyDetail = `Good image variety (${images.length} images, ${uniqueRatios.size} aspect ratios)`;
    } else {
      varietyScore = 2;
      varietyDetail = `All images have same dimensions - may lack variety`;
      recommendations.push('Include different types of images: close-ups, lifestyle shots, size comparisons, and detail views.');
    }

    if (hasAltText === 0 && images.length > 0) {
      recommendations.push('Add alt text to your listing images. Alt text improves accessibility and may help with SEO.');
    } else if (hasAltText < images.length) {
      recommendations.push(`Only ${hasAltText}/${images.length} images have alt text. Add descriptive alt text to all images.`);
    }
  }

  const total = countScore + hasPrimaryScore + varietyScore;

  return {
    total: Math.min(15, total),
    maxScore: 15,
    breakdown: {
      count: { score: countScore, max: 8, detail: countDetail },
      hasPrimary: { score: hasPrimaryScore, max: 4, detail: hasPrimaryDetail },
      variety: { score: varietyScore, max: 3, detail: varietyDetail },
    },
    recommendations,
  };
}
