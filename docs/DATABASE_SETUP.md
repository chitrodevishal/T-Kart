# MongoDB Atlas and Compass Setup Guide

This comprehensive guide covers everything required to set up, connect, and verify MongoDB for the **T-Kart** project.

---

## 1. Core Architecture Concepts

| Technology | Role | What It Does |
|---|---|---|
| **MongoDB** | Database Engine | The underlying NoSQL document-based database engine that stores JSON-like records (BSON documents) organized into collections. |
| **MongoDB Atlas** | Cloud Host | Managed Database-as-a-Service (DBaaS) running on cloud infrastructure (AWS/GCP/Azure) with automatic scaling, replication, and security. |
| **MongoDB Compass** | GUI Tool | Visual desktop client allowing developers to explore databases, query collections, edit documents, analyze schema performance, and manage indexes. |
| **Mongoose** | Node.js ODM | Object Data Modeling library providing strict schema validation, type safety, pre/post middleware hooks, and business logic methods in Express. |

> **Critical Concept for Beginners**: In MongoDB, databases and collections are created **lazily**. When you specify `tkart_db` in the connection string, MongoDB will not show the database or its collections in Compass until Mongoose writes the first document.

---

## 2. Step-by-Step MongoDB Atlas Setup

### Step 1: Create or Sign in to MongoDB Atlas
1. Visit [https://cloud.mongodb.com](https://cloud.mongodb.com).
2. Sign in or create a free account.

### Step 2: Create a Project
1. In the top navigation, click **Projects** -> **New Project**.
2. Set the Project Name: **`T-Kart`**.
3. Click **Next** and then **Create Project**.

### Step 3: Deploy an M0 Free Cluster
1. Click **Create** or **Build a Database**.
2. Select the **M0 Free (Shared)** tier.
3. Select your preferred Cloud Provider (**AWS**, **GCP**, or **Azure**) and a region closest to your geographic location.
4. Name your cluster (default: `Cluster0`) and click **Create Deployment**.

### Step 4: Create Database User Credentials
1. In the **Security** section on the left sidebar, click **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication.
4. Set Username: e.g. `tkart_admin`.
5. Generate or enter a strong Password. (Avoid special characters like `@`, `:`, or `/` in the password as they require percent-encoding in URI strings).
6. Set Database User Privileges: **Read and write to any database**.
7. Click **Add User**.

### Step 5: Configure Network Access (IP Whitelist)
1. On the left sidebar under **Security**, click **Network Access**.
2. Click **Add IP Address**.
3. Choose **Add Current IP Address** for optimal security during development.
   *(Note: If your ISP provides dynamic IPs or you switch WiFi networks, you may need to update this IP or temporarily use `0.0.0.0/0` during development).*
4. Click **Confirm**.

### Step 6: Retrieve Application Connection String
1. On the left sidebar under **Deployment**, click **Database**.
2. Click the **Connect** button next to your cluster.
3. Choose **Drivers** (Node.js).
4. Copy the connection string. It will look like:
   ```text
   mongodb+srv://tkart_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Append `/tkart_db` right before the `?` query string so your data is stored in the correct database:
   ```text
   mongodb+srv://tkart_admin:<your_password>@cluster0.xxxxx.mongodb.net/tkart_db?retryWrites=true&w=majority
   ```

---

## 3. Connecting MongoDB Compass

1. Download and install **MongoDB Compass** from [https://www.mongodb.com/products/tools/compass](https://www.mongodb.com/products/tools/compass).
2. Open MongoDB Compass.
3. In the **New Connection** tab, paste your Atlas connection URI (with username and password filled in):
   ```text
   mongodb+srv://tkart_admin:<your_password>@cluster0.xxxxx.mongodb.net/tkart_db
   ```
   *(Or if connecting to local MongoDB: `mongodb://127.0.0.1:27017`)*
4. Click **Connect**.
5. Once connected, Compass will display your cluster and databases.

---

## 4. Configuring Backend Environment Variables

Open `backend/.env` and update `MONGODB_URI`:

```ini
# For Cloud Atlas:
MONGODB_URI=mongodb+srv://tkart_admin:your_secure_password@cluster0.xxxxx.mongodb.net/tkart_db?retryWrites=true&w=majority

# Optional only when Node's default resolver cannot resolve Atlas SRV records:
# NODE_DNS_SERVERS=8.8.8.8,1.1.1.1

# For Local MongoDB:
# MONGODB_URI=mongodb://127.0.0.1:27017/tkart_db
```

> **Security Reminder**: Never commit `backend/.env` to Git. The `.gitignore` file already excludes `.env` to prevent credential exposure.

If Atlas hostnames resolve in the operating system but Node reports `querySrv ECONNREFUSED` or `ETIMEOUT`, configure `NODE_DNS_SERVERS` in `backend/.env` with DNS servers reachable from your network, then restart the backend. Leave it unset when Node's default DNS works.

If Node then reports `unable to verify the first certificate`, use the Atlas-specific scripts on a Node release that supports `--use-system-ca` (the current project environment uses Node 24):

```bash
npm run dev:atlas
npm run seed:catalog:atlas
```

These use the operating system's trusted certificates while keeping TLS verification enabled. The regular `dev`, `start`, and `seed:catalog` scripts remain available for environments where the default Node certificate store works.

The Atlas catalog seeder adds four categories and 108 demo products. It keeps existing prices, stock, and valid manually assigned external image URLs; generated images use Pexels when `PEXELS_API_KEY` is configured and product-title/category-tagged external fallbacks otherwise:

```bash
npm run seed:catalog:atlas
```

To add the DummyJSON sample products without replacing the current catalog, first preview the live source and then import them into the configured MongoDB database:

```bash
npm run seed:dummyjson:atlas -- --dry-run
npm run seed:dummyjson:atlas
```

Each source ID maps to a stable `DJ-<id>` product SKU, so rerunning the command skips already imported records. DummyJSON prices are multiplied by 100 for the T-Kart rupee display (for example, `5.01` becomes `501`), and the conversion is safe to rerun. Product images remain external HTTPS URLs. The customer application does not query DummyJSON; this command is the only import path.

To migrate images on existing products without replacing valid manual image URLs, run:

```bash
npm run migrate:product-images:atlas
```

To remove all orders and their linked mock payments from the configured `tkart_db` database, run the guarded cleanup command:

```bash
npm run clear:orders:atlas
```

---

## 5. Verifying Connection in Express

Start the backend:
```bash
cd backend
npm run dev
```

Look for the success message in the console:
```text
=========================================
  MongoDB Database Connected!            
  Host:     localhost (or cluster0.xxxxx.mongodb.net)
  Database: tkart_db      
=========================================
```

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected JSON response:
```json
{
  "success": true,
  "message": "T-Kart REST API is running healthy",
  "database": {
    "status": "connected",
    "connected": true,
    "host": "...",
    "name": "tkart_db"
  },
  "timestamp": "2026-10-17T03:55:31.534Z",
  "environment": "development",
  "uptimeSeconds": 20
}
```

---

## 6. Expected Collections in `tkart_db`

As we implement Mongoose models in Phase 4, the following collections will be populated:

1. `users` — Customer accounts, password hashes, and admin roles.
2. `products` — Product catalog, prices, SKU, stock inventory, and images.
3. `categories` — Product categories with hierarchy and slugs.
4. `carts` — Customer shopping carts linked to user IDs.
5. `orders` — Placed orders, customer address snapshot, pricing snapshot, and status.
6. `payments` — Simulated payment audit records, status, and transaction references.
