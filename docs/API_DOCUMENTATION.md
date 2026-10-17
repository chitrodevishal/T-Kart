# T-Kart REST API Documentation

Base URL: `http://localhost:5000/api`

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
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Welcome to T-Kart E-Commerce Platform REST API",
  "endpoints": {
    "health": "/api/health",
    "auth": "/api/auth",
    "products": "/api/products",
    "categories": "/api/categories",
    "cart": "/api/cart",
    "orders": "/api/orders",
    "payments": "/api/payments",
    "admin": "/api/admin"
  }
}
```

### 1.3 Error Simulation Diagnostic
- **Endpoint**: `GET /api/error-test?type={operational|notfound|unauthorized|forbidden|crash}`
- **Description**: Diagnostic endpoint to test centralized error handling behavior and status codes.
- **Query Parameters**:
  - `type`: `operational` (400), `notfound` (404), `unauthorized` (401), `forbidden` (403), or omit for 500 crash.
- **Example Response (400 Bad Request)**:
```json
{
  "success": false,
  "status": "fail",
  "message": "Simulated 400 Bad Request operational error"
}
```

---

## 2. Standardized JSON Response Conventions

### Success Format (`sendSuccess`)
```json
{
  "success": true,
  "message": "Human readable summary of action",
  "data": { ... },
  "meta": { ... } // Optional: pagination { page, limit, total }
}
```

### Error Format (`sendError` / Global Error Handler)
```json
{
  "success": false,
  "status": "fail", // "fail" for 4xx, "error" for 5xx
  "message": "Specific error message",
  "errors": [ ... ] // Optional: validation error details
}
```

---

## 3. Security & Middleware Configuration

1. **Helmet**: Protects against common web vulnerabilities via HTTP header hardening (XSS protection, MIME sniffing protection, clickjacking protection).
2. **CORS**:
   - Allowed origins: `http://localhost:5173`, `http://127.0.0.1:5173`, and `process.env.CLIENT_URL`.
   - Disallowed origins rejected with `403/500 Origin not permitted by CORS policy`.
   - Credentials supported (`Access-Control-Allow-Credentials: true`).
3. **Rate Limiting**:
   - **General API Limiter**: 200 requests per 15 minutes.
   - **Auth Limiter**: 15 requests per 15 minutes on `/api/auth/*` to prevent brute force attacks.
4. **Body Limits**: JSON and URL-encoded bodies capped at `10kb` to protect against DoS attacks.
