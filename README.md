# T-Kart — E-Commerce Platform

A modern, full-stack MERN e-commerce application featuring a customer shopping storefront and a dedicated, role-protected administrative dashboard.

---

## 🚀 Architecture Overview

T-Kart is split into two cleanly decoupled applications:

- **`frontend/`**: React 19 single-page application built with Vite, Tailwind CSS, Lucide React, and React Router.
- **`backend/`**: Node.js & Express RESTful API with MongoDB Atlas, Mongoose, JWT authentication, and enterprise security middleware.

```text
T-Kart/
├── frontend/             # React SPA (Customer Storefront + Admin Dashboard)
├── backend/              # Express REST API (Controllers, Services, Models, Routes)
├── postman/              # Postman collection & environment for verified testing
├── docs/                 # Guides for setup, database configuration, and API specs
├── .gitignore            # Git exclusion rules
├── README.md             # Project overview and quickstart
└── Task.md               # Master phase tracking checklist
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, React Router DOM, Axios, Context API |
| **Backend** | Node.js (v24), Express.js, Mongoose, JWT, bcryptjs, Helmet, CORS, Express Rate Limit |
| **Database** | MongoDB Atlas (`tkart_db`), MongoDB Compass |
| **Testing** | Postman, Browser Verification |

---

## ⚡ Quick Start (Phase 1)

### 1. Prerequisites
- Node.js (v18+ or v24+ recommended)
- npm (v9+)

### 2. Backend Setup
```bash
cd backend
npm install
# Ensure .env is populated (see .env.example)
npm run dev
```
The backend starts on `http://localhost:5000`. Test the health check endpoint:
```text
GET http://localhost:5000/api/health
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend launches at `http://localhost:5173`.

---

## 📋 Development Phases
- [x] **Phase 1: Project Initialization & Architecture Foundation**
- [ ] Phase 2: MongoDB Atlas & Compass Setup
- [ ] Phase 3: Backend Foundation & Middleware
- [ ] Phase 4: Database Models & Schemas
- [ ] Phase 5: Authentication & Authorization (Customer & Admin)
- [ ] Phase 6: Product & Category REST APIs
- [ ] Phase 7: Shopping Cart & Inventory Management
- [ ] Phase 8: Order Placement & Simulated Payments
- [ ] Phase 9: Postman Verification & API Documentation
- [ ] Phase 10: Customer Frontend Storefront
- [ ] Phase 11: Admin Dashboard UI
- [ ] Phase 12: End-to-End Frontend/Backend Integration
- [ ] Phase 13: QA, Security Audit & Edge Case Testing
- [ ] Phase 14: Final Documentation & Deployment Readiness
