/**
 * Downloads every demo photo (products + categories) without touching the database.
 *
 *   npm run images
 *
 * Already downloaded images are skipped, so you can run it again after an
 * offline seed to fill in whatever is missing.
 */
const fs = require('fs');
const path = require('path');
const { categories, products } = require('../seed/data');
const { ensureImage, slugify, resetImageFailures, IMAGE_DIR } = require('../seed/images');

/** Removes placeholder SVGs that were replaced by a real photo. */
function cleanupStalePlaceholders() {
  if (!fs.existsSync(IMAGE_DIR)) return 0;
  let removed = 0;
  for (const file of fs.readdirSync(IMAGE_DIR)) {
    if (!file.endsWith('.svg')) continue;
    const jpg = path.join(IMAGE_DIR, file.replace(/\.svg$/, '.jpg'));
    if (fs.existsSync(jpg)) {
      fs.unlinkSync(path.join(IMAGE_DIR, file));
      removed++;
    }
  }
  return removed;
}

async function main() {
  resetImageFailures();
  const removed = cleanupStalePlaceholders();
  if (removed) console.log(`Removed ${removed} outdated placeholder(s).`);
  console.log('Downloading demo images into client/public/images/products ...');
  let ok = 0;
  let fallback = 0;

  const jobs = [];
  categories.forEach((c) =>
    jobs.push({ base: 'category-' + slugify(c.name), photo: c.photo, label: c.name })
  );
  products.forEach((item) =>
    item.photos.forEach((photo, k) =>
      jobs.push({ base: `${slugify(item.name)}-${k + 1}`, photo, label: item.name })
    )
  );

  for (const job of jobs) {
    const result = await ensureImage(job.base, job.photo, job.label);
    if (result.endsWith('.jpg')) ok++;
    else fallback++;
  }

  console.log(`\nDone. ${ok} real photo(s), ${fallback} placeholder(s).`);
  if (fallback > 0) console.log('Run "npm run images" again later to fetch the missing ones.');
}

main().catch((err) => {
  console.error('Image download failed:', err.message);
  process.exit(1);
});
