# T-Kart Project Setup Guide

This guide covers setting up the local development environment for the T-Kart E-Commerce platform.

---

## 1. System Requirements

- **Node.js**: Version 18.x, 20.x, or 24.x (`node -v`)
- **npm**: Version 9.x or higher (`npm -v`)
- **MongoDB Compass**: For inspecting database collections locally
- **Postman**: For API verification and running test collections

---

## 2. Repository Layout

```text
T-Kart/
├── frontend/             # React 19 + Vite client
├── backend/              # Express API server
├── docs/                 # Documentation guides
├── postman/              # Postman collection files
├── .gitignore            # Git exclusion rules
├── README.md             # Project overview
└── Task.md               # Implementation checklist
```

---

## 3. Backend Setup

1. Open terminal and navigate to backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file from template:
   ```bash
   cp .env.example .env
   ```
4. Verify variables in `.env`:
   - `PORT=5000`
   - `CLIENT_URL=http://localhost:5173`
   - `MONGODB_URI=...` (Configured in Phase 2)
   - `JWT_SECRET=...` (Use a private value of at least 32 characters; the backend refuses to start without it.)
   - `ADMIN_EMAIL=...` and `ADMIN_PASSWORD=...` (Use your own admin account; the seed script rejects example placeholders and passwords shorter than 12 characters.)
5. Start development server:
   ```bash
   npm run dev
   ```
   The backend server will listen at `http://localhost:5000`.

6. Populate a starter storefront catalog in the configured MongoDB database:
   ```bash
   npm run seed:catalog:atlas
   ```
   This adds four categories and 108 sample products. Images are selected by title and category through Pexels when `PEXELS_API_KEY` is configured; otherwise, product-title/category-tagged external fallbacks are used. Reruns preserve existing valid manual URLs and refresh known legacy LoremFlickr demo URLs.

7. Optional: set `PEXELS_API_KEY` in `backend/.env` to enable title-matched image search. To migrate existing catalog records, run `npm run migrate:product-images:atlas` from `backend` (or `npm run migrate:product-images` for local MongoDB). The script preserves valid manual and unique assigned images and replaces missing, invalid, legacy, generic, or duplicate auto-assigned images.

8. To import the DummyJSON sample catalog into MongoDB, preview the feed and then run the idempotent importer from `backend`:
   ```bash
   npm run seed:dummyjson:atlas -- --dry-run
   npm run seed:dummyjson:atlas
   ```
   The importer maps source product IDs to stable `DJ-<id>` SKUs, maps source categories into the T-Kart category taxonomy, multiplies DummyJSON prices by 100 for the T-Kart rupee display, stores HTTPS image URLs, and skips products already imported. It converts existing imported prices only when they still match the original source amount, so reruns do not multiply them again. Customers continue to use T-Kart's MongoDB-backed API; DummyJSON is fetched only when this seed command is run.

---

## 4. Frontend Setup

1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 5. Verifying Phase 1 Health

Once both servers are running:
1. Visit `http://localhost:5173` in your browser.
2. The landing page will query `http://localhost:5000/api/health` and display a green "Active :5000" badge.
3. You can also directly test the backend endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "message": "T-Kart REST API is running healthy",
     "timestamp": "...",
     "environment": "development",
     "uptimeSeconds": 10
   }
   ```
