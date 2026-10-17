# T-Kart Setup, Testing, and Usage Guide

This guide explains how to configure the database, start T-Kart, use the customer storefront and admin dashboard, and run the available checks.

## Prerequisites

- Node.js 18 or newer and npm
- MongoDB Atlas or a local MongoDB server
- MongoDB Compass (optional, for browsing database records)
- Postman (optional, for manually exploring the API)
- The Postman CLI (optional, for running the API collection from a terminal)

## 1. Configure MongoDB and the backend

1. Create a MongoDB database user and cluster in Atlas, then add your current IP under **Security → Network Access**. For local MongoDB, start the local server instead.
2. In a terminal at the repository root, create the backend environment file:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

3. Edit `backend/.env`. Set `MONGODB_URI` to your database connection string, replace the example `JWT_SECRET` with a private random value of at least 32 characters, and set your own `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 12 characters), and `ADMIN_PHONE`. Keep this file private and out of source control.

   Atlas URI format:

   ```text
   mongodb+srv://<database-user>:<password>@<cluster-host>/tkart_db?retryWrites=true&w=majority
   ```

   If your database password contains URI-reserved characters, URL-encode them. If Node cannot resolve the Atlas SRV record, configure `NODE_DNS_SERVERS` in `.env` with DNS servers reachable on your network. If you see a certificate verification error on Node 24, use the `:atlas` commands below.

4. Install backend dependencies and create the administrator account:

   ```powershell
   cd backend
   npm install
   npm run seed:admin:atlas
   ```

   For local MongoDB, use `npm run seed:admin` instead. The seed command reads the admin details from `.env`; it does not print or generate a default password.

5. Add starter products if the database is empty:

   ```powershell
   npm run seed:catalog:atlas
   ```

   This adds the sample categories and products. To import the optional DummyJSON catalogue into MongoDB, preview it and then import it:

   ```powershell
   npm run seed:dummyjson:atlas -- --dry-run
   npm run seed:dummyjson:atlas
   ```

   These are explicit seed commands; the storefront reads products from T-Kart's MongoDB-backed API.

## 2. Start the application

Open two terminals from the repository root.

**Terminal 1 — backend:**

```powershell
cd backend
npm run dev:atlas
```

For local MongoDB or a working default Node certificate store, use `npm run dev`.

**Terminal 2 — frontend:**

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The API is available at <http://localhost:5000/api>.

Check that the backend is responding:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

The response should have `success: true`. If the frontend reports an API connection error, confirm both servers are running and `CLIENT_URL` in `backend/.env` is `http://localhost:5173`.

## 3. Use the customer storefront

1. Open <http://localhost:5173> and browse the shop.
2. Search, choose a category, set price filters, sort the results, or clear filters.
3. Select a product to view its details and add it to the cart. Register or sign in when prompted.
4. Open the cart, change quantities, and continue to checkout.
5. At checkout, enter delivery details and choose either simulated payment outcome. This is a mock payment; it does not charge a card.
6. View the saved order and its status under **Orders**.
7. Use the theme toggle to switch appearance.

## 4. Use the admin dashboard

1. Make sure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `backend/.env` and the admin seed step has completed.
2. Open <http://localhost:5173/login> and sign in with those admin credentials.
3. Open <http://localhost:5173/admin> to manage products, categories, inventory, customers, and order statuses.
4. Product discounts are selected in 10% increments (10%, 20%, 30%, and so on up to 90%); zero means no discount.

If you changed an existing admin's credentials in `.env`, rerunning the seed script does not reset that account's password. Use the password already stored for that admin.

## 5. Apply the discount rule to existing products

Existing MongoDB products may have older discount values. After Atlas allows your current IP, normalize stored product discounts to the nearest 10% tier (0–90):

```powershell
cd backend
npm run migrate:product-discounts:atlas
```

For local MongoDB, use `npm run migrate:product-discounts`. Order item snapshots remain historical records and are not rewritten.

## 6. Inspect data in MongoDB Compass

Connect Compass with the same MongoDB URI used by `MONGODB_URI`, then open the `tkart_db` database. Mongoose creates collections after the first records are written. Common collections are `users`, `categories`, `products`, `carts`, `orders`, and `payments`.

## 7. Test the project

### Frontend checks

From `frontend`:

```powershell
npm run lint
npm run build
```

### Backend unit checks

From `backend`:

```powershell
npm run test:dummyjson
npm run test:product-images
```

The database integration tests are opt-in and require their corresponding integration environment variables and a test MongoDB database. Do not point destructive integration checks at production data.

### API checks with Postman CLI

Start the backend and seed an admin first. The collection creates test customer/catalog/order records in the configured database, so use a development database. From the repository root, set local shell variables to match the admin in `backend/.env`, then run:

```powershell
$env:TKART_ADMIN_EMAIL = "your-admin@example.com"
$env:TKART_ADMIN_PASSWORD = "your-admin-password"
postman collection run postman/T-Kart.postman_collection.json --environment "postman/environments/T-Kart Local.environment.yaml" --env-var "adminEmail=$env:TKART_ADMIN_EMAIL" --env-var "adminPassword=$env:TKART_ADMIN_PASSWORD" --no-report-events
```

The collection checks authentication and role access, categories, products, cart and stock behavior, orders, and mock payments. A successful run confirms the requests and assertions passed against the running API and its configured database.

For Postman Desktop, import `postman/T-Kart.postman_collection.json`, create/select a local environment with `baseUrl` set to `http://localhost:5000/api`, and set `adminEmail` and `adminPassword` to the seeded admin credentials. Keep the password in a local secret variable; do not commit a populated environment file.

The API reference is in [API_DOCUMENTATION.md](API_DOCUMENTATION.md), and the MongoDB walkthrough is in [DATABASE_SETUP.md](DATABASE_SETUP.md).

## Troubleshooting

- **Atlas connection refused / IP not allowed:** add the machine's current IP in Atlas Network Access and retry.
- **Node cannot resolve the cluster:** check the Atlas host in `MONGODB_URI`; configure `NODE_DNS_SERVERS` only if the default resolver fails.
- **Invalid admin credentials:** confirm you are using the seeded admin email and its existing password. The admin seed does not set a default password.
- **No products found:** seed the sample catalogue or run the optional DummyJSON import, then refresh the storefront.
- **Frontend cannot reach the API:** verify backend health at `/api/health`, check `CLIENT_URL`, and ensure ports 5000 and 5173 are available.
- **Discount values still look old:** run the database discount migration after fixing Atlas network access.

