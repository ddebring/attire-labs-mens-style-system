#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Attire Labs Men Catalogue Studio"
echo "Once the server starts, open: http://127.0.0.1:3037"
echo "Press Ctrl+C to stop the CMS. Keep npm run dev running in a separate terminal for the storefront."
npm run cms
