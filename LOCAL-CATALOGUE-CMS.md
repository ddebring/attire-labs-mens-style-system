# Local Catalogue Studio — Men’s Edition

The Catalogue Studio is a small Node.js admin tool for editing this Astro project’s JSON data and image files locally. It is a development utility, not a deployed CMS service.

## Run it

From the project root:

```bash
npm run cms
```

Then open `http://127.0.0.1:3037`. In a separate terminal, run `npm run dev` for the storefront at `http://localhost:4321`.

The server binds only to `127.0.0.1`. It writes edits to `src/data/looks.json` and `src/data/products.json`; uploads are written under `public/images/looks/` or `public/images/products/`.

## Men-only catalogue fields

Looks support occasion keys, places/settings, dress code, styles, seasons, weather, regions, tags, styling notes, linked products, a cover photo and multiple additional gallery photos. All looks and products must use `audience: "him"`.

## Images

Upload JPG, PNG, WebP or AVIF files up to 18 MB each in the UI. Cover images use the look slug or product identifier as a filename. Additional look photos receive sequential suffixes, starting at `-02`. Add multiple actual photographs of the same outfit, not related product photos or stock photos, for the gallery.

## Persistence

Every data save creates a timestamped backup under `.attire-cms-backups/`. Replacing an existing image does the same. The server validates uniqueness and product references before it writes a catalogue JSON file. Do not expose the local CMS to the internet.
