import { getConfig } from '../utils/config.js';
import { getListing, updateListing } from '../api/listings.js';
import { scoreListing } from '../seo/scorer.js';
import { saveSnapshot } from '../tracking/history.js';
import { outputJSON, formatError } from '../utils/formatter.js';
import type { ListingUpdatePayload } from '../api/types.js';

interface UpdateArgs {
  listingId: number;
  title?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  confirm: boolean;
}

function parseArgs(): UpdateArgs {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    throw new Error('Usage: update <listing_id> [--title "..."] [--description "..."] [--tags "tag1,tag2,..."] [--materials "mat1,mat2,..."] [--confirm]');
  }

  const listingId = parseInt(argv[0], 10);
  if (isNaN(listingId)) {
    throw new Error(`Invalid listing ID: ${argv[0]}`);
  }

  const args: UpdateArgs = { listingId, confirm: false };

  for (let i = 1; i < argv.length; i++) {
    switch (argv[i]) {
      case '--title':
        args.title = argv[++i];
        break;
      case '--description':
        args.description = argv[++i];
        break;
      case '--tags':
        args.tags = argv[++i]?.split(',').map(t => t.trim()).filter(t => t.length > 0);
        break;
      case '--materials':
        args.materials = argv[++i]?.split(',').map(m => m.trim()).filter(m => m.length > 0);
        break;
      case '--confirm':
        args.confirm = true;
        break;
    }
  }

  if (!args.title && !args.description && !args.tags && !args.materials) {
    throw new Error('At least one field to update is required: --title, --description, --tags, or --materials');
  }

  return args;
}

async function main() {
  try {
    const config = getConfig();
    const args = parseArgs();

    // Fetch current listing
    const currentListing = await getListing(args.listingId, ['Images']);
    const currentScore = scoreListing(currentListing);

    // Build the proposed changes
    const changes: Record<string, { current: unknown; proposed: unknown }> = {};

    if (args.title !== undefined) {
      changes['title'] = { current: currentListing.title, proposed: args.title };
    }
    if (args.description !== undefined) {
      changes['description'] = {
        current: currentListing.description.slice(0, 200) + (currentListing.description.length > 200 ? '...' : ''),
        proposed: args.description.slice(0, 200) + (args.description.length > 200 ? '...' : ''),
      };
    }
    if (args.tags !== undefined) {
      changes['tags'] = { current: currentListing.tags, proposed: args.tags };
    }
    if (args.materials !== undefined) {
      changes['materials'] = { current: currentListing.materials, proposed: args.materials };
    }

    // Validate tag count
    if (args.tags && args.tags.length > 13) {
      throw new Error(`Too many tags: ${args.tags.length}. Maximum is 13.`);
    }

    // Score the proposed version (create a mock listing)
    const proposedListing = {
      ...currentListing,
      title: args.title || currentListing.title,
      description: args.description || currentListing.description,
      tags: args.tags || currentListing.tags,
      materials: args.materials || currentListing.materials,
    };
    const proposedScore = scoreListing(proposedListing);

    if (!args.confirm) {
      // Preview mode
      outputJSON({
        mode: 'preview',
        listingId: args.listingId,
        changes,
        scoring: {
          currentScore: currentScore.overall,
          projectedScore: proposedScore.overall,
          delta: proposedScore.overall - currentScore.overall,
          currentLabel: currentScore.label,
          projectedLabel: proposedScore.label,
        },
        message: 'Run with --confirm to apply these changes.',
      });
    } else {
      // Apply mode
      const payload: ListingUpdatePayload = {};
      if (args.title) payload.title = args.title;
      if (args.description) payload.description = args.description;
      if (args.tags) payload.tags = args.tags;
      if (args.materials) payload.materials = args.materials;

      const updatedListing = await updateListing(config.shopId, args.listingId, payload);
      const updatedFullListing = await getListing(args.listingId, ['Images']);
      const updatedScore = scoreListing(updatedFullListing);
      await saveSnapshot(updatedScore);

      outputJSON({
        mode: 'applied',
        listingId: args.listingId,
        changes,
        scoring: {
          previousScore: currentScore.overall,
          newScore: updatedScore.overall,
          delta: updatedScore.overall - currentScore.overall,
          previousLabel: currentScore.label,
          newLabel: updatedScore.label,
        },
        message: 'Listing updated successfully.',
      });
    }
  } catch (error) {
    outputJSON({ status: 'error', ...formatError(error) });
    process.exit(1);
  }
}

main();
