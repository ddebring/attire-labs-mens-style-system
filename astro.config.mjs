import { defineConfig } from 'astro/config';

// Static output works well on Netlify. No server adapter is needed for this MVP.
export default defineConfig({ output: 'static' });
