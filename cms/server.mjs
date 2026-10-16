import http from 'node:http';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = process.env.ATTIRE_PROJECT_ROOT || process.cwd();
const HOST = '127.0.0.1';
const PORT = Number(process.env.ATTIRE_CMS_PORT || 3037);
const CMS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROUTES = {
  looks: path.join(PROJECT, 'src/data/looks.json'),
  products: path.join(PROJECT, 'src/data/products.json')
};
const PUBLIC_DIR = path.join(PROJECT, 'public');
const MAX_REQUEST_BYTES = 25 * 1024 * 1024;
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.avif':'image/avif' };

function send(res, status, data, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
async function body(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new Error('Request too large (25 MB limit). Upload smaller images.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Request body must be valid JSON.'); }
}
async function readCatalog(kind) {
  return JSON.parse(await readFile(ROUTES[kind], 'utf8'));
}
function safeImagePath(rel) {
  if (typeof rel !== 'string' || !rel.startsWith('/images/')) throw new Error('Image path must begin with /images/.');
  if (rel.includes('..') || rel.includes('\\') || rel.includes('\0')) throw new Error('Invalid image path.');
  const full = path.resolve(PUBLIC_DIR, `.${rel}`);
  if (!full.startsWith(path.resolve(PUBLIC_DIR) + path.sep)) throw new Error('Invalid image path.');
  return full;
}
async function validate(kind, data) {
  if (!Array.isArray(data)) throw new Error(`${kind} must be a JSON array.`);
  const ids = new Set();
  const slugs = new Set();
  for (const [i, item] of data.entries()) {
    const label = `${kind} item ${i + 1}`;
    if (!item.id || !item.slug) throw new Error(`${label}: ID and slug are required.`);
    if (ids.has(item.id)) throw new Error(`${label}: duplicate ID "${item.id}".`);
    if (slugs.has(item.slug)) throw new Error(`${label}: duplicate slug "${item.slug}".`);
    ids.add(item.id); slugs.add(item.slug);
    if (kind === 'looks') {
      for (const field of ['title','subtitle','audience','category','image']) if (!item[field]) throw new Error(`${label}: ${field} is required.`);
      if (item.audience !== 'him') throw new Error(`${label}: this is a men-only catalogue. Audience must be "him".`);
      for (const field of ['productIds','occasions','styles','tags','places','seasons','weather','regions']) {
        if (item[field] !== undefined && !Array.isArray(item[field])) throw new Error(`${label}: ${field} must be an array.`);
      }
      if (!Array.isArray(item.productIds)) throw new Error(`${label}: productIds must be an array.`);
      if (!Array.isArray(item.occasions)) throw new Error(`${label}: choose at least one occasion.`);
    } else {
      for (const field of ['name','category','affiliateUrl']) if (!item[field]) throw new Error(`${label}: ${field} is required.`);
      if (item.audience && item.audience !== 'him') throw new Error(`${label}: this is a men-only catalogue. Audience must be "him".`);
      if (!(item.affiliateUrl.startsWith('http://') || item.affiliateUrl.startsWith('https://'))) throw new Error(`${label}: affiliateUrl must be a full http(s) URL.`);
    }
  }
  if (kind === 'looks') {
    const productIds = new Set((await readCatalog('products')).map(p => p.id));
    for (const look of data) for (const id of look.productIds || []) if (!productIds.has(id)) throw new Error(`Look "${look.title}" references missing product "${id}". Save/create the product first.`);
  } else {
    const productIds = new Set(data.map(p => p.id));
    const looks = await readCatalog('looks');
    for (const look of looks) for (const id of look.productIds || []) if (!productIds.has(id)) throw new Error(`Product "${id}" is used by look "${look.title}". Remove or replace it in that look before deleting the product.`);
  }
}
async function backup(file) {
  const folder = path.join(PROJECT, '.attire-cms-backups');
  await mkdir(folder, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const relative = path.relative(PROJECT, file).replace(/[\\/]/g, '__');
  await copyFile(file, path.join(folder, `${stamp}__${relative}.bak`));
}
async function handle(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/') {
    return send(res, 200, await readFile(path.join(CMS_DIR, 'public/index.html'), 'utf8'), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && url.pathname.startsWith('/images/')) {
    const file = safeImagePath(decodeURIComponent(url.pathname));
    if (!existsSync(file)) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    return send(res, 200, await readFile(file), MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  }
  if (req.method === 'GET' && url.pathname === '/api/catalog') {
    return send(res, 200, { looks: await readCatalog('looks'), products: await readCatalog('products') });
  }
  if (req.method === 'POST' && url.pathname === '/api/save') {
    const payload = await body(req);
    if (!['looks', 'products'].includes(payload.kind)) throw new Error('Unknown catalogue type.');
    await validate(payload.kind, payload.data);
    const target = ROUTES[payload.kind];
    await backup(target);
    await writeFile(target, JSON.stringify(payload.data, null, 2) + '\n', 'utf8');
    return send(res, 200, { ok: true, message: `Saved ${payload.data.length} ${payload.kind}. A backup was created in .attire-cms-backups/.` });
  }
  if (req.method === 'POST' && url.pathname === '/api/image') {
    const payload = await body(req);
    if (!['looks', 'products'].includes(payload.kind)) throw new Error('Choose a look or product image target.');
    const name = String(payload.filename || '');
    const ext = path.extname(name).toLowerCase();
    const allowed = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };
    if (!allowed[ext]) throw new Error('Use JPG, PNG, WebP, or AVIF images.');
    if (typeof payload.data !== 'string' || !payload.data.startsWith(`data:${allowed[ext]};base64,`)) throw new Error('Image data/type mismatch.');
    const folder = payload.kind === 'looks' ? 'looks' : 'products';
    const baseName = String(payload.slug || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    if (!baseName) throw new Error('Add a title/name first so a filename can be generated.');
    let suffix = '';
    if (payload.kind === 'looks' && payload.slot !== undefined && payload.slot !== null && payload.slot !== 'cover') {
      const slot = Number(payload.slot);
      if (!Number.isInteger(slot) || slot < 2 || slot > 20) throw new Error('Gallery slots must be numbered 02–20.');
      suffix = `-${String(slot).padStart(2, '0')}`;
    }
    const relPath = `/images/${folder}/${baseName}${suffix}${ext}`;
    const full = safeImagePath(relPath);
    await mkdir(path.dirname(full), { recursive: true });
    if (existsSync(full)) await backup(full);
    await writeFile(full, Buffer.from(payload.data.split(',')[1], 'base64'));
    return send(res, 200, { ok: true, path: relPath });
  }
  return send(res, 404, { error: 'Not found' });
}
http.createServer((req, res) => handle(req, res).catch(err => send(res, 400, { error: err.message || 'Request failed.' }))).listen(PORT, HOST, () => {
  console.log(`Attire Labs Men’s Catalogue CMS: http://${HOST}:${PORT}`);
  console.log(`Project root: ${PROJECT}`);
  console.log('Local only: this server binds to 127.0.0.1 and is not exposed to your network.');
});
