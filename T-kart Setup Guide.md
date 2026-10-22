# T-Kart --- Beginner-Friendly All-in-One Setup Guide

This guide takes you from an extracted T-Kart project folder to a
running e-commerce application, then walks you through testing the
customer storefront, admin dashboard, database, and project checks.

**Assumption:** You are using Windows PowerShell and MongoDB Atlas.
Local MongoDB alternatives are included where the project guide provides
them.

------------------------------------------------------------------------

## 0. Understand what you are setting up

T-Kart has two main applications:

  Part              Technology                   Local address
  ----------------- ---------------------------- ---------------------------
  Frontend          React + Vite                 http://localhost:5173
  Backend           Node.js + Express            http://localhost:5000
  Backend API       Express API                  http://localhost:5000/api
  Database          MongoDB Atlas                Cloud database
  Database viewer   MongoDB Compass (optional)   Desktop application

Keep the project folder open in VS Code. The commands below assume that
your terminal starts in the **T-Kart project root** --- the folder
containing the `backend` and `frontend` folders.

## 1. Install and verify prerequisites

You need:

-   Node.js version 18 or newer, with npm.
-   A MongoDB Atlas account and cluster, or a local MongoDB server.
-   MongoDB Compass (optional).
-   Postman (optional; API testing can be done later).

Open PowerShell and check Node.js and npm:

``` powershell
node -v
npm -v
```

Confirm that Node.js is version 18 or newer. If either command is not
recognised, install Node.js and reopen PowerShell.

## 2. Open the project folder

1.  Extract the T-Kart project ZIP, if you received a ZIP file.
2.  Open the extracted project folder in VS Code.
3.  Open **Terminal → New Terminal**.
4.  Confirm that the terminal is at the project root.

The project root should contain folders similar to:

``` text
T-Kart/
├── backend/
├── frontend/
├── postman/
└── ...
```

If your terminal is not at the project root, move to it with `cd` and
the actual folder path. For example:

``` powershell
cd "D:\Projects\T-Kart"
```

Do not run the backend commands from inside `frontend`, or frontend
commands from inside `backend`.

## 3. Create a MongoDB Atlas database

If you are using MongoDB Atlas:

1.  Sign in to MongoDB Atlas.
2.  Create a project if you do not already have one.
3.  Create a cluster.
4.  Create a **database user** and note its username and password.
5.  Open **Security → Network Access**.
6.  Add your current public IP address.
7.  Open the cluster's **Connect** flow and copy the application
    connection string.

The database name used by this project is:

``` text
tkart_db
```

Use the Atlas connection-string format:

``` text
mongodb+srv://<database-user>:<password>@<cluster-host>/tkart_db?retryWrites=true&w=majority
```

Replace the placeholders with your actual database username, password,
and cluster host. Do not include the angle-bracket placeholders.

**Important:** - This is the MongoDB database user's password, not
necessarily your Atlas website login password. - If the password
contains URI-reserved characters, URL-encode those characters before
putting it in the connection string. - Keep the connection string
private. Do not paste it into public chats, screenshots, GitHub, or
source code.

### If you use local MongoDB instead

Start your local MongoDB server and use the local connection string
appropriate to your installation in `MONGO_URI`. For the local
workflow, use the non-Atlas commands shown later (`seed:admin`,
`seed:catalog` only if that script is available, and `dev`). The
supplied project guide explicitly documents the local admin seed and
development-server commands.

## 4. Create the backend environment file

Make sure your terminal is at the project root, then run:

``` powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` in VS Code.

Set the following values. Keep any additional settings already present
in `.env.example`; do not delete them.

``` env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_private_random_secret_at_least_32_characters

ADMIN_NAME=Your Name
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=choose_a_password_at_least_12_characters
ADMIN_PHONE=your_phone_number

CLIENT_URL=http://localhost:5173
```

Replace every example value with your own values. In particular:

-   `MONGO_URI`: the connection string from your Atlas cluster.
-   `JWT_SECRET`: a private random secret of at least 32 characters.
-   `ADMIN_NAME`: the administrator's name.
-   `ADMIN_EMAIL`: the email you will use to log in to the admin
    account.
-   `ADMIN_PASSWORD`: a password of at least 12 characters.
-   `ADMIN_PHONE`: the administrator's phone number.
-   `CLIENT_URL`: keep it as `http://localhost:5173` for local frontend
    development.

If the example file contains `NODE_DNS_SERVERS`, leave it unset unless
your default DNS resolver cannot resolve the Atlas SRV record. If DNS
resolution fails, configure it with DNS server addresses reachable on
your network, following your network's policy.

**Security checklist:** - Never commit `backend/.env` to Git. - Never
share your MongoDB URI, JWT secret, or admin password. - Use a
different, strong password for the admin account. - Do not put backend
secrets in frontend environment variables.

## 5. Install backend packages

In the VS Code terminal:

``` powershell
cd backend
npm install
```

Wait for installation to finish. If it reports an error, resolve that
error before moving on.

You are now inside the `backend` folder.

## 6. Create the administrator account

For MongoDB Atlas, run:

``` powershell
npm run seed:admin:atlas
```

For local MongoDB, run instead:

``` powershell
npm run seed:admin
```

The seed command reads the administrator details from `backend/.env`. It
does not print or create a default password. Use the credentials you
configured.

Do not run both commands for the same setup. Choose the command matching
your database connection.

## 7. Add starter categories and products

For Atlas, while still inside `backend`, run:

``` powershell
npm run seed:catalog:atlas
```

This adds the sample categories and products if the catalog needs
starter data.

The project also provides an optional DummyJSON catalogue import. You
can preview it first:

``` powershell
npm run seed:dummyjson:atlas -- --dry-run
```

Only if you want to import that optional catalogue, run:

``` powershell
npm run seed:dummyjson:atlas
```

**Beginner recommendation:** First use the built-in starter catalog.
Skip the optional DummyJSON import until the application is running and
you understand the normal product flow.

The storefront gets its products from T-Kart's MongoDB-backed API; it
does not simply display remote DummyJSON data directly.

## 8. Start the backend server

For MongoDB Atlas, while inside `backend`, run:

``` powershell
npm run dev:atlas
```

For local MongoDB, or where the default Node certificate store works,
use:

``` powershell
npm run dev
```

Keep this terminal open. The backend should be available at:

``` text
http://localhost:5000
```

Do not close this terminal while testing the application.

## 9. Check that the backend is healthy

Open a **second terminal** in VS Code. Run:

``` powershell
Invoke-RestMethod http://localhost:5000/api/health
```

The response should contain:

``` text
success: true
```

If the health check fails, do not continue to frontend testing yet.
Check that:

1.  The backend terminal is still running.
2.  The database URI in `backend/.env` is correct.
3.  The Atlas database user and password are correct.
4.  Your current IP is allowed in Atlas Network Access.
5.  The database cluster is available.

If Atlas reports an SRV/DNS resolution error, verify the cluster host in
`MONGO_URI`. Only if the default resolver fails, configure
`NODE_DNS_SERVERS` in `.env` with DNS servers reachable on your network.
If you receive a certificate verification error on Node 24, use the
project's `:atlas` commands as directed by the setup guide.

## 10. Install and start the frontend

Use a **third terminal**, or reuse the second terminal after the health
check has succeeded.

From the project root, run:

``` powershell
cd frontend
npm install
npm run dev
```

Keep this terminal open too.

Open the frontend in your browser:

``` text
http://localhost:5173
```

At this point, you should have two running processes:

-   Backend terminal: API on port `5000`.
-   Frontend terminal: Vite development server on port `5173`.

If the frontend cannot reach the API, confirm both servers are running
and that `CLIENT_URL` in `backend/.env` is `http://localhost:5173`.

------------------------------------------------------------------------

## 11. Test the customer storefront

Open:

``` text
http://localhost:5173
```

Test the features in this order:

1.  Open the homepage and confirm that products are displayed.
2.  Search for a product.
3.  Select a category.
4.  Try the price filters and sorting.
5.  Clear the filters and confirm the listing returns.
6.  Open a product detail page.
7.  Add the product to the cart.
8.  Register or sign in when prompted.
9.  Open the cart and change product quantities.
10. Continue to checkout.
11. Enter delivery details.
12. Choose one of the simulated payment outcomes.
13. Open the Orders page and check the saved order and its status.
14. Try the theme toggle.

**Payment note:** T-Kart's checkout payment is a mock/simulated payment.
It does not charge a real card.

## 12. Test the admin dashboard

First make sure the admin seed command completed successfully.

Open the login page:

``` text
http://localhost:5173/login
```

Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in
`backend/.env`.

Then open:

``` text
http://localhost:5173/admin
```

Check the available admin functions:

-   Product management.
-   Category management.
-   Inventory management.
-   Customer management.
-   Order management and order-status updates.

The product discount selector uses 10% increments: 10%, 20%, 30%, and so
on up to 90%. Zero means no discount.

**Admin password note:** If you change an existing admin's credentials
in `.env`, rerunning the seed script does not reset that account's
stored password. Use the password already stored for that admin.

## 13. Inspect the database with MongoDB Compass (optional)

1.  Open MongoDB Compass.
2.  Connect using the same URI configured as `MONGO_URI`.
3.  Open the `tkart_db` database.
4.  Inspect the collections after records have been created.

Common collections include:

``` text
users
categories
products
carts
orders
payments
```

Mongoose creates collections when records are first written, so a
collection may not appear until the application has created data for it.

## 14. Run frontend quality checks

Open a terminal and move to the frontend folder:

``` powershell
cd frontend
```

Run the linter:

``` powershell
npm run lint
```

Then create a production build:

``` powershell
npm run build
```

Both commands should finish successfully. If a command reports errors,
read the first relevant error, fix it, and run the command again.

## 15. Run backend unit checks

Open another terminal and move to the backend folder:

``` powershell
cd backend
```

Run:

``` powershell
npm run test:dummyjson
npm run test:product-images
```

These are the backend checks listed in the project guide.

Database integration tests are opt-in and require their corresponding
integration environment variables and a dedicated test MongoDB database.
Never point destructive integration checks at production data.

## 16. Optional: run the Postman API collection

Do this after the backend is running and the admin account has been
seeded. Use a development database because the collection creates test
customer, catalog, and order records.

From the **project root**, set PowerShell variables using the same admin
credentials configured in `backend/.env`:

``` powershell
$env:TKART_ADMIN_EMAIL = "your-admin@example.com"
$env:TKART_ADMIN_PASSWORD = "your-admin-password"
```

Then run:

``` powershell
postman collection run postman/T-Kart.postman_collection.json --environment "postman/environments/T-Kart Local.environment.yaml" --env-var "adminEmail=$env:TKART_ADMIN_EMAIL" --env-var "adminPassword=$env:TKART_ADMIN_PASSWORD" --no-report-events
```

If the Postman CLI is not installed, you can use Postman Desktop
instead:

1.  Import `postman/T-Kart.postman_collection.json`.
2.  Create or select a local environment.
3.  Set `baseUrl` to `http://localhost:5000/api`.
4.  Set `adminEmail` and `adminPassword` to the seeded admin
    credentials.
5.  Store the password in a local secret variable; do not commit a
    populated environment file.
6.  Run the collection.

The collection checks authentication and role access, categories,
products, cart and stock behavior, orders, and mock payments.

## 17. Optional: migrate old product discount values

This step is only relevant if the database already contains products
with older discount values. It is not a required step for every fresh
setup.

For Atlas, after confirming that the current IP is allowed:

``` powershell
cd backend
npm run migrate:product-discounts:atlas
```

For local MongoDB:

``` powershell
npm run migrate:product-discounts
```

The migration normalizes stored product discounts to the nearest 10%
tier from 0 to 90. Historical order-item snapshots are not rewritten.

## 18. Troubleshooting

### A. Atlas says the IP address is not allowed

-   Open Atlas **Security → Network Access**.
-   Add your current public IP address.
-   Wait for the access change to take effect, then retry.

### B. Node cannot resolve the Atlas cluster

-   Check the hostname in `MONGO_URI`.
-   Confirm the URI is copied from the correct Atlas cluster.
-   If the default DNS resolver fails, configure `NODE_DNS_SERVERS` in
    `.env` with DNS servers reachable on your network.

### C. MongoDB authentication fails

-   Confirm the database username and password.
-   Remember that the database user is different from your Atlas website
    login.
-   URL-encode URI-reserved characters in the password.

### D. Admin login fails

-   Confirm you are using the seeded admin email.
-   Use the password already stored for that admin.
-   Remember that rerunning the seed script does not reset an existing
    admin's password.

### E. No products appear

-   Run the sample catalog seed command for your database setup.
-   If you choose to use the optional DummyJSON import, preview it with
    `--dry-run` first.
-   Refresh the storefront after the seed completes.

### F. Frontend cannot connect to the API

-   Confirm the backend is running on port `5000`.
-   Confirm the frontend is running on port `5173`.
-   Run the `/api/health` check.
-   Confirm `CLIENT_URL=http://localhost:5173` in `backend/.env`.
-   Make sure those ports are not already occupied by another process.

### G. Discount values look unchanged

If you have existing products with older discount values, run the
relevant discount migration after resolving Atlas network access.

------------------------------------------------------------------------

## 19. Final beginner checklist

Use this checklist from top to bottom. Do not mark a step complete until
you have verified it.

### Initial setup

-   [ ] Node.js 18+ and npm installed.
-   [ ] T-Kart project extracted and opened in VS Code.
-   [ ] MongoDB Atlas cluster created (or local MongoDB server started).
-   [ ] Database user created.
-   [ ] Current IP allowed in Atlas Network Access.
-   [ ] MongoDB connection string copied.
-   [ ] `backend/.env` created from `.env.example`.
-   [ ] `MONGO_URI`, `JWT_SECRET`, admin details, and `CLIENT_URL`
    configured.
-   [ ] `.env` kept private and out of Git.

### Backend and database

-   [ ] Backend dependencies installed.
-   [ ] Admin account seeded.
-   [ ] Starter catalog seeded.
-   [ ] Backend server started.
-   [ ] `/api/health` returns `success: true`.

### Frontend and features

-   [ ] Frontend dependencies installed.
-   [ ] Frontend server started.
-   [ ] Homepage loads.
-   [ ] Product listing, search, filters, and sorting work.
-   [ ] Product details and add-to-cart work.
-   [ ] Registration/login works.
-   [ ] Cart quantity updates work.
-   [ ] Checkout and mock payment work.
-   [ ] Order appears in Orders page.
-   [ ] Admin login works.
-   [ ] Admin dashboard opens and management features work.

### Quality checks

-   [ ] MongoDB Compass checked (optional).
-   [ ] Frontend lint passes.
-   [ ] Frontend production build passes.
-   [ ] Backend unit checks pass.
-   [ ] Postman API collection passes (optional).
-   [ ] Discount migration run only if existing data requires it.

------------------------------------------------------------------------

## 20. Quick command reference

**Run these commands from the stated folder.**

  ------------------------------------------------------------------------------------------------------
  Purpose                 Folder                  Command
  ----------------------- ----------------------- ------------------------------------------------------
  Create backend env file Project root            `Copy-Item backend/.env.example backend/.env`

  Install backend         `backend`               `npm install`

  Seed admin (Atlas)      `backend`               `npm run seed:admin:atlas`

  Seed admin (local)      `backend`               `npm run seed:admin`

  Seed starter catalog    `backend`               `npm run seed:catalog:atlas`
  (Atlas)                                         

  Preview DummyJSON       `backend`               `npm run seed:dummyjson:atlas -- --dry-run`
  import                                          

  Import DummyJSON        `backend`               `npm run seed:dummyjson:atlas`
  catalog                                         

  Start backend (Atlas)   `backend`               `npm run dev:atlas`

  Start backend (local)   `backend`               `npm run dev`

  Check backend health    Any terminal            `Invoke-RestMethod http://localhost:5000/api/health`

  Install frontend        `frontend`              `npm install`

  Start frontend          `frontend`              `npm run dev`

  Frontend lint           `frontend`              `npm run lint`

  Frontend build          `frontend`              `npm run build`

  Backend unit check      `backend`               `npm run test:dummyjson`

  Backend image check     `backend`               `npm run test:product-images`
  ------------------------------------------------------------------------------------------------------

## Useful project documentation

The project also includes:

-   `DATABASE_SETUP.md` --- MongoDB walkthrough.
-   `API_DOCUMENTATION.md` --- API reference.
-   `postman/T-Kart.postman_collection.json` --- API test collection.

**Recommended first-time path:** Complete Sections 1--10 in order.
Confirm the backend health check before starting frontend testing. Then
complete Sections 11--15. Treat Postman testing, DummyJSON import, and
discount migration as optional or conditional tasks.
