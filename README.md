# Attire Labs Co. — Men’s Style File

A men-only Astro storefront and local Catalogue Studio CMS. Organize complete looks around the real plan: office, date night, campus, travel, weekends, gym, weddings, Indian festivals, setting/place, dress code, season, weather and regional context.

## Included

- Astro static storefront and look detail pages.
- Local-only CMS at `http://127.0.0.1:3037` for editing looks/products and uploading cover, gallery and product photos.
- JSON catalogue containing 13 men’s looks and 19 men’s products.
- Desktop look page: 50/50 image and shopping-panel columns, with each 4:5 photo stacked vertically down the page and top/bottom navigation controls.
- Mobile look page: one 4:5 frame per slide, horizontal touch swipe/snap, left/right controls, pagination dots, and a fixed “SHOP THE PIECES” button.
- Five-photo starter gallery references for `date-night-him` and `quiet-luxury-every-day`, including four local 4:5 images under `public/images/looks/`.
- Centered mobile wordmark and clean inline SVG search icon.
- Catalogue validation and an idempotent script to restore the suit gallery paths.

## Requirements

- Node.js 22.19.0 or newer (`.nvmrc` is included).
- npm 9.6.5+.
- Internet access for installing packages and remote fallback images.

## Install and run

In a Terminal opened inside this folder:

```bash
npm ci
npm run validate
npm run check
npm run build
npm run dev
```

Open the storefront at `http://localhost:4321`.

In a **second Terminal window**, from the same project folder, start the local CMS:

```bash
npm run cms
```

Open `http://127.0.0.1:3037`. The CMS binds to loopback (`127.0.0.1`) only; it is not intended to be deployed or exposed to the public internet. On macOS you can also run `Start-Catalogue-CMS.command`; on Windows use `Start-Catalogue-CMS.bat`.

## Gallery photos

The two matching tailored-suit looks (`date-night-him` and `quiet-luxury-every-day`) already reference four additional local 4:5 suit images in `src/data/looks.json`. You do not need to run a migration for the bundled catalogue. If you remove those paths and want to restore them, run:

```bash
npm run seed:gallery
```

For every other look, the gallery shows the cover plus only the additional photos stored on that look. Upload 4–5 photos of the **same outfit** using Catalogue Studio: open the look, go to **LOOK PHOTOGRAPHY**, upload the cover and multiple additional photos, then save the look. Do not use unrelated product thumbnails as gallery views.

On desktop, each gallery image occupies half the viewport and frames stack vertically as the page scrolls. The other half contains the look details and product list; the list remains in normal page flow (not clipped inside a nested scroll panel). On mobile, the gallery switches to horizontal swipe navigation. The bottom “SHOP THE PIECES” button scrolls to the list.

## What the CMS edits

- **Looks:** title, slug, description, category, audience (locked to `him`), occasions, places, dress code, style tags, seasons, weather, regions, styling notes, cover photo, additional photos, featured flag and linked product records.
- **Products:** name, category, subcategory, guide price/currency, retailer, affiliate URL, availability, tags and optional image.
- **Uploads:** JPG/JPEG, PNG, WebP and AVIF, maximum 18 MB per image. Files are stored under `public/images/` and JSON under `src/data/`.

Every save makes a timestamped backup in `.attire-cms-backups/`. This folder is excluded from the distributed ZIP and recreated by the CMS when needed.

## Before publishing

- The four bundled suit images are editorial mockups for layout/gallery testing, not verified retailer product photography.
- Other catalogue image paths are placeholders until you upload suitable photos in Catalogue Studio. `npm run validate` reports missing image files.
- Sample prices are guide values. Several retailer URLs are placeholders; replace them with checked product pages and your own tracked affiliate URLs.
- Check product availability, prices, sizing, regional fit, image rights and affiliate disclosure before deploying.

## Validation

```bash
npm run validate
npm run check
npm run build
```

`npm run validate` checks unique IDs/slugs, men-only audience values and look-to-product references. Missing images are reported as warnings until the catalogue is fully populated. `npm run build` produces the static site under `dist/`.

## Gallery interaction update (16 Oct 2026)

- Desktop look detail pages use natural vertical scrolling through the left-side 4:5 image stack while the right-hand look and shopping panel remains sticky for the duration of the gallery section. The panel has its own vertical overflow when its contents exceed the viewport.
- Desktop photo arrow controls are hidden; scroll the page to move between images. The gallery section ends with the final photo, allowing the related-looks section to follow naturally.
- Mobile retains horizontal swipe/scroll-snap and left/right controls. Controls use a translucent blurred surface and centered glyphs for better legibility over photos.
