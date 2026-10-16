import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const products = readJson('src/data/products.json');
const looks = readJson('src/data/looks.json');
const errors = [];
const warnings = [];
const productIds = new Set();
const productSlugs = new Set();
const lookIds = new Set();
const lookSlugs = new Set();

for (const [index, product] of products.entries()) {
  const where = `products.json item ${index + 1} (${product.name || 'unnamed'})`;
  if (!product.id) errors.push(`${where}: missing id`);
  else if (productIds.has(product.id)) errors.push(`${where}: duplicate id "${product.id}"`);
  else productIds.add(product.id);
  if (!product.slug) errors.push(`${where}: missing slug`);
  else if (productSlugs.has(product.slug)) errors.push(`${where}: duplicate slug "${product.slug}"`);
  else productSlugs.add(product.slug);
  for (const field of ['name', 'category', 'affiliateUrl']) if (!product[field]) errors.push(`${where}: missing ${field}`);
  if (product.audience !== 'him') errors.push(`${where}: this is a men-only catalogue; audience must be "him"`);
  if (product.image && product.image.startsWith('/')) {
    const filePath = resolve(root, 'public', `.${product.image}`);
    if (!existsSync(filePath)) warnings.push(`${where}: image file not found yet: ${product.image}`);
  }
  if (product.affiliateUrl && !/^https?:\/\//i.test(product.affiliateUrl)) errors.push(`${where}: affiliateUrl should be a full http(s) URL`);
}

for (const [index, look] of looks.entries()) {
  const where = `looks.json item ${index + 1} (${look.title || 'untitled'})`;
  if (!look.id) errors.push(`${where}: missing id`);
  else if (lookIds.has(look.id)) errors.push(`${where}: duplicate id "${look.id}"`);
  else lookIds.add(look.id);
  if (!look.slug) errors.push(`${where}: missing slug`);
  else if (lookSlugs.has(look.slug)) errors.push(`${where}: duplicate slug "${look.slug}"`);
  else lookSlugs.add(look.slug);
  if (!look.image) errors.push(`${where}: missing image path`);
  if (look.audience !== 'him') errors.push(`${where}: this is a men-only catalogue; audience must be "him"`);
  if (!Array.isArray(look.occasions) || look.occasions.length === 0) errors.push(`${where}: add at least one occasion`);
  for (const field of ['productIds','styles','tags','places','seasons','weather','regions']) {
    if (look[field] !== undefined && !Array.isArray(look[field])) errors.push(`${where}: ${field} must be an array`);
  }
  for (const productId of look.productIds || []) if (!productIds.has(productId)) errors.push(`${where}: product id "${productId}" does not exist in products.json`);
  if (look.image && look.image.startsWith('/')) {
    const filePath = resolve(root, 'public', `.${look.image}`);
    if (!existsSync(filePath) && !look.demoImage) warnings.push(`${where}: cover file not found and no demo fallback set: ${look.image}`);
  }
  for (const image of look.galleryImages || []) {
    const src = typeof image === 'string' ? image : (image?.src || image?.image);
    if (src && src.startsWith('/') && !existsSync(resolve(root, 'public', `.${src}`))) warnings.push(`${where}: additional gallery image not found yet: ${src}`);
  }
}

if (errors.length) {
  console.error(`Catalogue validation failed with ${errors.length} error(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Catalogue validation passed: ${products.length} men’s products, ${looks.length} men’s looks, all IDs and look-to-product references are valid.`);
if (warnings.length) console.warn(`Image reminders (${warnings.length}):\n- ${warnings.join('\n- ')}`);
console.log('Starter note: image paths must be populated through the local CMS. Replace sample prices and placeholder retailer search URLs with verified product pages and tracked affiliate links before launch.');
