# T-Kart REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. System Endpoints

### 1.1 Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns server uptime, environment, and health status.
- **Authentication**: Public
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "T-Kart REST API is running healthy",
  "timestamp": "2026-10-17T03:45:00.000Z",
  "environment": "development",
  "uptimeSeconds": 42
}
```

### 1.2 Root Welcome
- **Endpoint**: `GET /`
- **Description**: Welcome message and link to documentation.
- **Authentication**: Public
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Welcome to T-Kart E-Commerce Platform API",
  "documentation": "/api/health"
}
```

---

## 2. API Overview by Phase

| Phase | Resource | Methods & Path | Auth Required |
|---|---|---|---|
| **Phase 5** | Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Public / Customer |
| **Phase 6** | Products | `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` | Public / Admin |
| **Phase 6** | Categories | `GET /api/categories`, `GET /api/categories/:id`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id` | Public / Admin |
| **Phase 7** | Cart | `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:itemId`, `DELETE /api/cart/items/:itemId`, `DELETE /api/cart` | Customer |
| **Phase 7** | Inventory | `GET /api/admin/inventory`, `PATCH /api/admin/products/:id/stock` | Admin |
| **Phase 8** | Orders | `POST /api/orders`, `GET /api/orders/my-orders`, `GET /api/orders/:id`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` | Customer / Admin |
| **Phase 8** | Payments | `POST /api/payments/mock`, `GET /api/payments/:orderId` | Customer |
| **Phase 11** | Admin | `GET /api/admin/dashboard`, `GET /api/admin/customers` | Admin |
