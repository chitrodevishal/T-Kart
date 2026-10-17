# Backend Services

- `productImageService.js` searches Pexels for a product title and category, ranks candidates against product words, avoids previously assigned image URLs, validates external image URLs, and caches candidate results in process memory. Missing credentials or provider errors return stable title/category-tagged fallback URLs; a category image is used if the product title is unavailable.

Pexels credentials and timeout/cache settings are read only by the backend from `backend/.env`. The storefront receives image URLs and optional photographer attribution, never the API key.
