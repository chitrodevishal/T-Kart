# T-Kart REST API Documentation

Base URL: `http://localhost:5000/api` (configurable as `baseUrl` in the companion Postman environment)

## Quick start

1. Start MongoDB and the backend (`cd backend && npm run dev`).
2. Create or confirm an administrator using `npm run seed:admin:atlas` from `backend` when using Atlas. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_PHONE` in the ignored `backend/.env` file; never commit real credentials.
   `JWT_SECRET` must be a private value of at least 32 characters; the server refuses to start if it is missing or too short. `ADMIN_PASSWORD` must be unique and at least 12 characters; the seed script rejects the example placeholders.
3. Import `postman/T-Kart.postman_collection.json` into Postman Desktop. Create a local environment named **T-Kart Local** with `baseUrl` set to `http://localhost:5000/api`, and set `adminEmail` and `adminPassword` to the seeded administrator credentials. Keep the password in a local secret variable.
4. Run the whole collection. Its setup requests create unique customer and catalog fixtures; the administrator account must exist before the run.

For CLI runs from the repository root, set local `TKART_ADMIN_EMAIL` and `TKART_ADMIN_PASSWORD` process variables to the seeded admin credentials, then run `postman collection run postman/T-Kart.postman_collection.json --environment "postman/environments/T-Kart Local.environment.yaml" --env-var "adminEmail=$env:TKART_ADMIN_EMAIL" --env-var "adminPassword=$env:TKART_ADMIN_PASSWORD" --no-report-events` (PowerShell). The collection is an importable Postman Collection v2.1 export. Environment values override collection defaults, while generated IDs and customer/admin JWTs are kept as run-time collection variables. Do not commit a populated environment export.

## Resource index

| Resource | Routes |
|---|---|
| System | `GET /`, `GET /api/health`, diagnostic `GET /api/error-test?type=...` |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/admin-check` |
| Catalog | `GET/POST /api/categories`, `GET/PUT/DELETE /api/categories/:id`, `GET /api/categories/slug/:slug`; `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id` |
| Cart | `GET/DELETE /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/:itemId` |
| Admin | `GET /api/admin/dashboard`, `GET/PATCH /api/admin/customers`, `GET /api/admin/inventory`, `PATCH /api/admin/products/:id/stock`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` |
| Orders | `POST /api/orders`, `GET /api/orders/my-orders`, `GET /api/orders/:id`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` |
| Payments | `POST /api/payments/mock`, `GET /api/payments/:orderId` |

All `/api/admin/*` routes require an administrator bearer token. Dashboard revenue counts orders whose payment status is `paid`; customer controls apply to customer accounts only.

---

## 1. System & Diagnostic Endpoints

### 1.1 Health Check (System & Database)
- **Endpoint**: `GET /api/health`
- **Description**: Returns detailed Node.js runtime metrics, memory allocation, and MongoDB connection status.
- **Authentication**: Public
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "T-Kart REST API is running healthy",
  "system": {
    "uptimeSeconds": 128,
    "timestamp": "2026-10-17T04:01:26.977Z",
    "environment": "development",
    "nodeVersion": "v24.15.0",
    "memoryUsageMB": {
      "rss": "72.92",
      "heapUsed": "19.36"
    }
  },
  "database": {
    "status": "connected",
    "connected": true,
    "host": "localhost",
    "name": "tkart_db"
  }
}
```

### 1.2 Root Welcome Endpoint
- **Endpoint**: `GET /`
- **Description**: Serves welcome banner and catalog of primary API resource endpoints.
- **Authentication**: Public

---

## 2. Authentication & Authorization Endpoints (Phase 5)

### 2.1 Customer Registration
- **Endpoint**: `POST /api/auth/register`
- **Description**: Registers a new customer, issues a signed JWT, and initializes an empty shopping cart. Privilege escalation is prevented by forcing `role: 'customer'`.
- **Authentication**: Public
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Jane Customer",
  "email": "jane.customer@example.com",
  "password": "SecurePass123!",
  "phone": "9876543210"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Account registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6ad2f647932fc762741e4605",
      "name": "Jane Customer",
      "email": "jane.customer@example.com",
      "role": "customer",
      "phone": "9876543210",
      "createdAt": "2026-10-17T04:15:35.000Z"
    }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (short password, invalid email, missing name).
  - `409 Conflict`: Email address is already registered.

---

### 2.2 User / Admin Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticates existing user via email and password, verifies account status, and issues a JWT token.
- **Authentication**: Public
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "jane.customer@example.com",
  "password": "SecurePass123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6ad2f647932fc762741e4605",
      "name": "Jane Customer",
      "email": "jane.customer@example.com",
      "role": "customer",
      "phone": "9876543210",
      "createdAt": "2026-10-17T04:15:35.000Z"
    }
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or incorrect password.
  - `403 Forbidden`: Account is deactivated.

---

### 2.3 Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Description**: Returns the authenticated customer or administrator profile.
- **Authentication**: Private (Requires valid JWT)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "6ad2f647932fc762741e4605",
      "name": "Jane Customer",
      "email": "jane.customer@example.com",
      "role": "customer",
      "phone": "9876543210",
      "createdAt": "2026-10-17T04:15:35.000Z"
    }
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing, expired, or tampered token.

---

### 2.4 Admin Privilege Verification
- **Endpoint**: `GET /api/auth/admin-check`
- **Description**: QA & test endpoint to verify administrator role authorization.
- **Authentication**: Private (Requires valid JWT with `role === 'admin'`)
- **Headers**: `Authorization: Bearer <adminToken>`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Admin authorization verified successfully",
  "data": {
    "admin": {
      "id": "6ad2f647932fc762741e4600",
      "name": "Admin User",
      "email": "admin@tkart.com",
      "role": "admin"
    }
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Customer token provided (insufficient permissions).

---

## 3. Initial Admin Setup Procedure

To seed the initial platform administrator:
```bash
cd backend
npm run seed:admin:atlas
```
Reads `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_PHONE` from `backend/.env`. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are required; the seed rejects placeholder values and passwords shorter than 12 characters. There is no built-in fallback credential. The Postman environment intentionally leaves `adminPassword` blank so a credential is not committed.

---

## 4. Product and Category Endpoints (Phase 6)

Catalog reads are public. A supplied bearer token is resolved so administrators can also read inactive products and categories; without a token, only active records are returned. Product and category create, update, and delete endpoints require an administrator token. Delete uses soft deletion (`isActive: false`). A category cannot be deactivated while any products reference it.

### Products

| Method and path | Access | Behavior |
|---|---|---|
| `GET /api/products` | Public; optional bearer token | Search, filter, sort, paginate; category can be an ID or slug |
| `GET /api/products/:id` | Public; optional bearer token | Product details with populated category |
| `POST /api/products` | Admin | Create; requires `name`, `description`, `sku`, `price`, and category ID |
| `PUT /api/products/:id` | Admin | Update supplied fields; auto refreshes provider-assigned images when title/category changes; validates SKU uniqueness and category existence |
| `DELETE /api/products/:id` | Admin | Deactivate product |

Products return `image` (the primary external URL), `images` (external HTTPS URLs only), and `imageSource` (`pexels`, `title-fallback`, `category-fallback`, or `manual`). If create omits both `image` and `images`, the backend searches Pexels using the product title and category, ranks results against product words, and avoids image URLs already assigned to other products. Provider failure, timeout, missing key, empty results, and rate limits use a stable product-title/category-tagged fallback; a category-only fallback is used if the title is missing. Valid manually supplied HTTPS image URLs are preserved; HTTP, data, and local paths are rejected. Pexels photographer and photo links are returned in `imageCredit`, `imageCreditUrl`, and `imageSourceUrl`. The backend caches candidate results in memory (`PEXELS_IMAGE_CACHE_TTL_MS`) and briefly caches failures (`PEXELS_IMAGE_FAILURE_CACHE_TTL_MS`). [Pexels API documentation](https://www.pexels.com/api/documentation/).

Set `PEXELS_API_KEY` in `backend/.env` to enable live image search. Existing catalogue migration (preserving valid manual and unique assigned URLs, and refreshing missing, legacy, generic, or duplicate auto-assigned URLs) can be run from `backend` with `npm run migrate:product-images` or `npm run migrate:product-images:atlas` for Atlas. The migration logs each preserved, updated, or failed record.

`GET /api/products` accepts `search`, `category`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `page`, and `limit`. Supported sort fields are `name`, `price`, `createdAt`, `stock`, and `ratingsAverage`; `sortOrder` is `asc` or `desc`. Page starts at 1 and limit is 1–100 (default 10). Invalid pagination, price ranges, or sort direction return `400`. The response includes `data` and `pagination` metadata (`currentPage`, `totalPages`, `totalItems`, `limit`, `hasNextPage`, and `hasPrevPage`).

### Categories

| Method and path | Access | Behavior |
|---|---|---|
| `GET /api/categories` | Public; optional bearer token | Lists active categories alphabetically |
| `GET /api/categories/:id` | Public; optional bearer token | Reads category by ID |
| `GET /api/categories/slug/:slug` | Public; optional bearer token | Reads category by generated slug |
| `POST /api/categories` | Admin | Create category; slug is generated from name |
| `PUT /api/categories/:id` | Admin | Update supplied category fields and regenerate slug when name changes |
| `DELETE /api/categories/:id` | Admin | Deactivate only when no products reference it |

All catalog endpoints return JSON with `success` and `data`; missing resources return `404`, malformed IDs and invalid input return `400`, duplicate SKU/category names return `409`, and missing/insufficient admin credentials return `401`/`403`.

---

## 5. Cart and Inventory Endpoints (Phase 7)

Every cart endpoint requires `Authorization: Bearer <token>` and scopes reads and mutations to the authenticated user. Cart prices and totals are recalculated from current product prices and discounts on the server; client-supplied prices are ignored. Adding an existing product increases its quantity. Cart quantities must be positive integers and cannot exceed current stock; unavailable/inactive products return `404`, and insufficient stock returns `409`.

| Method and path | Access | Request / behavior |
|---|---|---|
| `GET /api/cart` | Authenticated | Retrieves the caller's cart and recalculated totals; creates an empty cart if missing |
| `POST /api/cart/items` | Authenticated | Body: `{ "productId": "...", "quantity": 1 }`; quantity defaults to 1 |
| `PATCH /api/cart/items/:itemId` | Authenticated | Body: `{ "quantity": 2 }`; sets an item's quantity |
| `DELETE /api/cart/items/:itemId` | Authenticated | Removes one cart line |
| `DELETE /api/cart` | Authenticated | Clears the caller's cart |

Cart responses contain populated product details and server-calculated `subtotal`, `discountTotal`, and `total` fields.

| Method and path | Access | Behavior |
|---|---|---|
| `GET /api/admin/inventory` | Admin | Lists stock levels, low-stock products, category, and pagination metadata |
| `PATCH /api/admin/products/:id/stock` | Admin | Body: `{ "stock": 12 }`; sets stock to a non-negative integer |
| `GET /api/admin/dashboard` | Admin | Returns product, category, customer, and order counts; paid order count and revenue; six recent orders and six active low-stock products |
| `GET /api/admin/customers` | Admin | Lists customer accounts; supports `search` (name/email), `active` (`true`/`false`), `page` (default 1), and `limit` (default 20, maximum 100) |
| `PATCH /api/admin/customers/:id/status` | Admin | Body: `{ "isActive": false }`; activates or pauses a customer account, immediately enforced by authenticated API requests |

Inventory listing accepts `threshold` (default 5), `lowStockOnly=true`, `page` (default 1), and `limit` (default 50, maximum 100). Low-stock filtering includes zero stock. Stock updates use the existing product validation and return the updated product.

---

## 6. Orders and Simulated Payments (Phase 8)

Order and payment endpoints require a bearer token. Customers can only read their own orders and payment attempts; administrators can inspect any order through the admin order list. Checkout uses the authenticated customer's cart, snapshots current product details and discounted prices, and ignores any client-supplied prices or totals. `itemsTotal` and `totalAmount` are server-calculated; this version applies no shipping fee or tax. Stock is conditionally decremented when an order is created. A failed payment is recorded with HTTP `402`, leaves the order unpaid and the stock reserved, and can be retried; an administrator can cancel an unpaid order to restore its inventory. Paid orders cannot be cancelled because refunds are outside this mock-payment phase.

| Method and path | Access | Behavior |
|---|---|---|
| `POST /api/orders` | Authenticated | Creates an order from the caller's cart; requires `shippingAddress` with `fullName`, `phone`, `address`, `city`, `state`, and `postalCode` |
| `GET /api/orders/my-orders` | Authenticated | Lists only the caller's orders; supports `page` and `limit` |
| `GET /api/orders/:id` | Owner or admin | Reads an order, including immutable item and shipping snapshots |
| `GET /api/admin/orders` | Admin | Lists orders; optional `status`, `page`, and `limit` filters |
| `PATCH /api/admin/orders/:id/status` | Admin | Body `{ "orderStatus": "processing" }`; transitions follow the state policy below |
| `POST /api/payments/mock` | Authenticated order owner | Body `{ "orderId": "...", "outcome": "success" }`; `outcome` is `success` or `failed` |
| `GET /api/payments/:orderId` | Owner or admin | Reads the latest simulated payment attempt for an order |

Allowed order transitions are `placed → processing → shipped → delivered`; unpaid `placed` orders can transition to `cancelled`. Only paid orders can enter `processing`, and a payment attempt already in progress cannot be cancelled. Delivered and cancelled orders are terminal. Cancellation restores each order line's stock once and rejects a repeated status transition. Payment status (`pending`, `processing`, `paid`, or `failed`) remains separate from fulfillment status. Failed payment attempts may be retried until the order is cancelled or paid.

Checkout and cancellation use conditional atomic stock updates and compensation if a later write fails. This protects normal failures and concurrent stock depletion on standalone MongoDB; MongoDB transactions are not enabled by this local deployment. As with any multi-document compensation flow, an abrupt process or machine failure between writes may require operational reconciliation.

---

## 7. Standardized JSON Response Conventions

### Success Format (`sendSuccess`)
```json
{
  "success": true,
  "message": "Human readable summary of action",
  "data": { ... },
  "meta": { ... }
}
```

### Error Format (`sendError` / Global Error Handler)
```json
{
  "success": false,
  "status": "fail",
  "message": "Specific error message",
  "errors": [ ... ]
}
```

Successful resource responses use HTTP `200` for reads and updates and `201` for registration and resource creation. Errors use their corresponding HTTP status and a JSON body with `success: false` and a human-readable `message`; input validation may also include an `errors` array. Common statuses are `400` invalid input or malformed IDs, `401` missing/invalid authentication, `403` insufficient role, `404` missing or inaccessible resource, `409` duplicate/conflicting state or insufficient stock, `402` simulated payment failure, and `500` unexpected server errors. Ownership failures are returned as `404` to avoid disclosing another customer's resources.

The general `/api` limiter allows 200 requests per IP per 15 minutes. Registration and login have an additional authentication-attempt limiter (50 per IP in development, 15 otherwise, per 15 minutes); profile and authorization reads do not consume that authentication-attempt quota.

## 8. Collection coverage

The companion collection groups the system, authentication/RBAC, categories, products, cart/inventory, and order/payment workflows. It includes success and failure cases for duplicate registrations/categories/SKUs, malformed IDs, missing authentication, customer attempts at administrator actions, invalid cart quantities, stock conflicts, incomplete shipping addresses, payment failure and retry, order ownership, and invalid/terminal order transitions. Requests create unique test customers and catalog records; the final product is soft-deleted. A successful collection run verifies responses against a live local API and MongoDB, while importing the collection alone does not run any checks.
