import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOOKS_FILE = path.join(ROOT, 'src', 'data', 'looks.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BACKUP_DIR = path.join(ROOT, '.attire-cms-backups');
const DEFAULT_GALLERY = [
  '/images/looks/mens-tailored-suit-02.jpg',
  '/images/looks/mens-tailored-suit-03.jpg',
  '/images/looks/mens-tailored-suit-04.jpg',
  '/images/looks/mens-tailored-suit-05.jpg',
];
const TARGET_SLUGS = new Set(['date-night-him', 'quiet-luxury-every-day']);

function normalizeGalleryItem(item) {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') return String(item.src || item.image || '').trim();
  return '';
}

function localImageExists(src) {
  if (/^https?:\/\//i.test(src)) return true;
  if (!src.startsWith('/images/')) return false;
  const fullPath = path.resolve(PUBLIC_DIR, `.${src}`);
  return fullPath.startsWith(path.resolve(PUBLIC_DIR) + path.sep) && existsSync(fullPath);
}

for (const src of DEFAULT_GALLERY) {
  const fullPath = path.join(PUBLIC_DIR, src.replace(/^\//, ''));
  if (!existsSync(fullPath)) {
    throw new Error(`Gallery image is missing: ${fullPath}. Extract the patch ZIP into the project root first.`);
  }
}

const looks = JSON.parse(await readFile(LOOKS_FILE, 'utf8'));
let changed = false;
const changedSlugs = [];
for (const look of looks) {
  if (!TARGET_SLUGS.has(look.slug)) continue;
  const existingItems = Array.isArray(look.galleryImages) ? look.galleryImages : [];
  const keep = [...new Set(existingItems.map(normalizeGalleryItem).filter(Boolean))]
    .filter((src) => src !== look.image && !DEFAULT_GALLERY.includes(src) && localImageExists(src));
  const next = [...DEFAULT_GALLERY, ...keep];
  if (JSON.stringify(look.galleryImages || []) !== JSON.stringify(next)) {
    look.galleryImages = next;
    changed = true;
    changedSlugs.push(look.slug);
  }
}

if (!changed) {
  console.log('Gallery already seeded; no catalogue changes were required.');
} else {
  await mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await copyFile(LOOKS_FILE, path.join(BACKUP_DIR, `${stamp}__src__data__looks.json.bak`));
  await writeFile(LOOKS_FILE, `${JSON.stringify(looks, null, 2)}\n`, 'utf8');
  console.log(`Added four supplementary 4:5 photos to: ${changedSlugs.join(', ')}.`);
  console.log(`Backup created in ${path.relative(ROOT, BACKUP_DIR)}.`);
}
