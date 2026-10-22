# T-Kart: Complete Beginner Setup Guide

One file, start to finish. Follow the parts in order and tick off the checkboxes as you go.

**What you are setting up:** T-Kart, a MERN e-commerce app with three parts:

| Part | Tech | Runs at |
|---|---|---|
| Frontend (the website) | React 19 + Vite | http://localhost:5173 |
| Backend (the API) | Node.js + Express + Mongoose | http://localhost:5000 |
| Database | MongoDB Atlas (cloud) or local MongoDB | cloud / 127.0.0.1:27017 |

**Time needed:** about 30 to 45 minutes the first time.

---

## Part 0: Before you start

### 0.1 Install the required tools

- [ ] **Node.js** version 18, 20 or 24 (download from https://nodejs.org). npm comes with it.
- [ ] **Git** (optional but recommended)
- [ ] **A code editor** such as VS Code
- [ ] **MongoDB Compass** (optional): lets you see your database visually
- [ ] **Postman** (optional): for testing the API

### 0.2 Check your installs

Open a terminal (PowerShell on Windows, Terminal on Mac/Linux) and run:

```bash
node -v     # should print v18.x, v20.x or v24.x
npm -v      # should print 9.x or higher
```

If either command says "not found", install Node.js again and restart the terminal.

### 0.3 Know your project folders

```text
T-Kart/
├── frontend/     # React + Vite website
├── backend/      # Express API server
├── docs/         # Documentation guides
├── postman/      # Postman test collection
├── .gitignore
├── README.md
└── Task.md
```

You will use **two terminals at the same time**: one inside `backend/`, one inside `frontend/`.

---

## Part 1: Create your database (MongoDB Atlas)

> **Beginner tip:** MongoDB creates the database and collections only when the first record is saved. If Compass looks empty at first, that is normal. It fills up after you run the seed commands in Part 3.

### 1.1 Sign in
1. Go to https://cloud.mongodb.com
2. Create a free account or sign in.

### 1.2 Create a project
1. Click **Projects** → **New Project**.
2. Name it `T-Kart`.
3. Click **Next** → **Create Project**.

### 1.3 Create a free cluster
1. Click **Create** (or **Build a Database**).
2. Choose **M0 Free (Shared)**.
3. Pick a provider (AWS, GCP or Azure) and a region close to you.
4. Keep the name `Cluster0` and click **Create Deployment**.

### 1.4 Create a database user
1. Left sidebar → **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication.
4. Username: for example `tkart_admin`.
5. Password: use a strong one, but **avoid `@`, `:` and `/`** (they break the connection string unless encoded).
6. Privileges: **Read and write to any database**.
7. Click **Add User**.

> Write down this username and password. You need them in Part 2.

### 1.5 Allow your IP address
1. Left sidebar → **Security** → **Network Access**.
2. Click **Add IP Address** → **Add Current IP Address** → **Confirm**.

If you change WiFi networks later, your IP changes and you must add the new one. For short-term development only, you can use `0.0.0.0/0` (allows all IPs). Do not leave that on for a real deployment.

### 1.6 Get your connection string
1. Left sidebar → **Deployment** → **Database**.
2. Click **Connect** next to your cluster → **Drivers** → Node.js.
3. Copy the string. It looks like this:

```text
mongodb+srv://tkart_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

4. Make two edits:
   - Replace `<password>` with your real password.
   - Add `/tkart_db` right before the `?`.

Final result:

```text
mongodb+srv://tkart_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/tkart_db?retryWrites=true&w=majority
```

- [ ] Connection string ready

**Prefer local MongoDB instead?** Install and start MongoDB on your machine and use:
```text
mongodb://127.0.0.1:27017/tkart_db
```

---

## Part 2: Set up the backend

### 2.1 Install dependencies
```bash
cd backend
npm install
```

### 2.2 Create your `.env` file

| System | Command |
|---|---|
| Mac / Linux / Git Bash | `cp .env.example .env` |
| Windows PowerShell | `Copy-Item .env.example .env` |

### 2.3 Fill in `backend/.env`

Open `backend/.env` in your editor and set these values:

```ini
PORT=5000
CLIENT_URL=http://localhost:5173

# Your connection string from Part 1.6
MONGO_URI=mongodb+srv://tkart_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/tkart_db?retryWrites=true&w=majority

# A private random value, at least 32 characters. The backend will not start without it.
JWT_SECRET=replace_this_with_a_long_random_private_value_32plus_chars

# Your own admin account (do NOT keep the example values)
ADMIN_NAME=Your Name
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=AtLeast12Chars!
ADMIN_PHONE=your_phone_number
```

Rules to remember:
- `JWT_SECRET` must be **at least 32 characters**.
- `ADMIN_PASSWORD` must be **at least 12 characters**.
- The seed script rejects the placeholder values from the example file.
- **Never commit `.env` to Git.** The `.gitignore` already excludes it.

### 2.4 Optional `.env` settings

```ini
# Only if you get "querySrv ECONNREFUSED" or "ETIMEOUT" errors:
NODE_DNS_SERVERS=8.8.8.8,1.1.1.1

# Optional: enables title-matched product images from Pexels
PEXELS_API_KEY=your_pexels_key
```

- [ ] `backend/.env` saved with all values

---

## Part 3: Seed the database

Run these from the `backend` folder.

> **Atlas vs local:** commands ending in `:atlas` are for MongoDB Atlas on Node 24. They use your operating system's trusted certificates while keeping TLS verification on. For a local MongoDB, use the same command **without** `:atlas`.

### 3.1 Create the admin account
```bash
npm run seed:admin:atlas
```
(Local MongoDB: `npm run seed:admin`)

This reads the admin details from `.env`. It does not print or generate a default password.

> If you later change `ADMIN_PASSWORD` in `.env` and rerun the seed, the existing admin's password is **not** reset. Keep using the original password.

### 3.2 Add starter products
```bash
npm run seed:catalog:atlas
```

This adds 4 categories and 108 demo products. Reruns keep existing prices, stock and valid manual image URLs.

### 3.3 Optional: import the DummyJSON sample products

Preview first, then import:
```bash
npm run seed:dummyjson:atlas -- --dry-run
npm run seed:dummyjson:atlas
```

- Each product gets a stable SKU like `DJ-<id>`, so reruns skip products already imported.
- Prices are multiplied by 100 for the rupee display (for example `5.01` becomes `501`).
- The storefront never calls DummyJSON. This command is the only import path.

### 3.4 Optional: normalize old discount values

Only needed if you have older products in the database:
```bash
npm run migrate:product-discounts:atlas
```
(Local MongoDB: `npm run migrate:product-discounts`)

- [ ] Admin created
- [ ] Products seeded

---

## Part 4: Start the app

Open **two terminals**.

### Terminal 1: backend
```bash
cd backend
npm run dev:atlas
```
(Local MongoDB, or if the default Node certificate store works: `npm run dev`)

Success looks like this:

```text
=========================================
  MongoDB Database Connected!
  Host:     cluster0.xxxxx.mongodb.net
  Database: tkart_db
=========================================
```

### Terminal 2: frontend
```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Quick health check

```bash
curl http://localhost:5000/api/health
```
(PowerShell: `Invoke-RestMethod http://localhost:5000/api/health`)

You should see `"success": true` and `"status": "connected"` for the database.

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Health check returns `success: true`

---

## Part 5: Use the app

### Customer storefront (http://localhost:5173)
1. Browse products. Search, filter by category or price, and sort.
2. Open a product and add it to the cart. Register or sign in when asked.
3. Open the cart, change quantities, and go to checkout.
4. Enter delivery details and choose a simulated payment result. **No real card is charged.**
5. See your order and its status under **Orders**.
6. Use the theme toggle to switch light and dark appearance.

### Admin dashboard
1. Go to http://localhost:5173/login and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.
2. Open http://localhost:5173/admin.
3. Manage products, categories, inventory, customers and order statuses.
4. Product discounts are set in 10% steps (10%, 20%, ... up to 90%). Zero means no discount.

---

## Part 6: See your data in MongoDB Compass (optional)

1. Open Compass and click **New Connection**.
2. Paste the same URI you used for `MONGO_URI`.
3. Click **Connect** and open the `tkart_db` database.

You should see these collections once data exists:

| Collection | What it stores |
|---|---|
| `users` | Customer accounts, password hashes, admin roles |
| `products` | Catalog, prices, SKU, stock, images |
| `categories` | Product categories and slugs |
| `carts` | Customer shopping carts |
| `orders` | Placed orders, address and price snapshots, status |
| `payments` | Simulated payment records |

---

## Part 7: Run the tests (optional)

### Frontend checks (from `frontend/`)
```bash
npm run lint
npm run build
```

### Backend unit checks (from `backend/`)
```bash
npm run test:dummyjson
npm run test:product-images
```

Database integration tests are opt-in and need their own environment variables and a **test** database. Never point them at production data.

### API tests with Postman CLI

> The collection creates test customers, products and orders. **Use a development database only.**

From the repository root:

```powershell
$env:TKART_ADMIN_EMAIL = "your-admin@example.com"
$env:TKART_ADMIN_PASSWORD = "your-admin-password"
postman collection run postman/T-Kart.postman_collection.json --environment "postman/environments/T-Kart Local.environment.yaml" --env-var "adminEmail=$env:TKART_ADMIN_EMAIL" --env-var "adminPassword=$env:TKART_ADMIN_PASSWORD" --no-report-events
```

**Postman Desktop instead:** import `postman/T-Kart.postman_collection.json`, create a local environment with `baseUrl = http://localhost:5000/api`, and set `adminEmail` and `adminPassword` as a secret variable. Do not commit a populated environment file.

---

## Part 8: Troubleshooting

| Problem | What to do |
|---|---|
| Atlas "connection refused" or "IP not allowed" | Add your current IP under Atlas → Network Access, then retry |
| `querySrv ECONNREFUSED` or `ETIMEOUT` | Add `NODE_DNS_SERVERS=8.8.8.8,1.1.1.1` to `backend/.env`, restart the backend |
| `unable to verify the first certificate` | Use the `:atlas` scripts (`npm run dev:atlas`, `npm run seed:catalog:atlas`) on Node 24 |
| Backend refuses to start | Check `JWT_SECRET` is set and at least 32 characters |
| Admin seed fails | Use your own admin email and a password of 12+ characters, not the example placeholders |
| Cannot log in as admin | Use the original seeded password. Rerunning the seed does not reset it |
| Password with special characters fails | URL-encode characters like `@ : /` in the URI, or pick a simpler password |
| "No products found" | Run `npm run seed:catalog:atlas`, then refresh the page |
| Frontend cannot reach the API | Confirm the backend is running, `/api/health` works, `CLIENT_URL=http://localhost:5173`, and ports 5000 and 5173 are free |
| Compass shows nothing | Normal before seeding. Run the seed commands, then refresh |
| Discount values look old | Run `npm run migrate:product-discounts:atlas` |

---

## Part 9: Command cheat sheet

| Task | Atlas | Local MongoDB |
|---|---|---|
| Install backend | `cd backend && npm install` | same |
| Create admin | `npm run seed:admin:atlas` | `npm run seed:admin` |
| Seed products | `npm run seed:catalog:atlas` | `npm run seed:catalog` |
| Import DummyJSON | `npm run seed:dummyjson:atlas` | see note below |
| Fix product images | `npm run migrate:product-images:atlas` | `npm run migrate:product-images` |
| Fix discounts | `npm run migrate:product-discounts:atlas` | `npm run migrate:product-discounts` |
| Start backend | `npm run dev:atlas` | `npm run dev` |
| Start frontend | `cd frontend && npm install && npm run dev` | same |
| Delete ALL orders and payments | `npm run clear:orders:atlas` | check `package.json` |

Note: the guides only show `:atlas` versions for the DummyJSON import and orders cleanup. Check `backend/package.json` for local equivalents.

> **Careful:** `clear:orders:atlas` removes all orders and their linked mock payments from `tkart_db`. Only run it when you really want that.

---

## Final checklist

- [ ] Node and npm installed and verified
- [ ] Atlas project, cluster, user and IP access created
- [ ] Connection string includes `/tkart_db`
- [ ] `backend/.env` created and filled in (not committed to Git)
- [ ] Admin and starter products seeded
- [ ] Backend running, `/api/health` returns `success: true`
- [ ] Frontend open at http://localhost:5173
- [ ] Logged in as admin at `/admin`
- [ ] Placed a test order as a customer

If every box is ticked, your T-Kart setup is complete.
