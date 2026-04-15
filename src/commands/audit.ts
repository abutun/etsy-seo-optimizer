import { getConfig } from '../utils/config.js';
import { getAllShopListings } from '../api/listings.js';
import { getListing } from '../api/listings.js';
import { scoreShop, scoreListing } from '../seo/scorer.js';
import { saveSnapshot } from '../tracking/history.js';
import { outputJSON, formatError } from '../utils/formatter.js';

interface AuditArgs {
  listingId?: number;
}

function parseArgs(): AuditArgs {
  const args: AuditArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--listing' && argv[i + 1]) {
      args.listingId = parseInt(argv[i + 1], 10);
      i++;
    }
  }

  return args;
}

async function main() {
  try {
    const config = getConfig();
    const args = parseArgs();

    if (args.listingId) {
      // Single listing audit
      const listing = await getListing(args.listingId, ['Images']);
      const score = scoreListing(listing);
      await saveSnapshot(score);

      outputJSON({
        mode: 'single',
        listing: score,
      });
    } else {
      // Full shop audit
      const listings = await getAllShopListings(config.shopId, ['Images']);
      const report = scoreShop(config.shopId, listings);

      // Save snapshots for all listings
      for (const listing of report.listings) {
        await saveSnapshot(listing);
      }

      outputJSON({
        mode: 'shop',
        report,
      });
    }
  } catch (error) {
    outputJSON({ status: 'error', ...formatError(error) });
    process.exit(1);
  }
}

main();
