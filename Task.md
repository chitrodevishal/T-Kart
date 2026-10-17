# T-Kart --- E-Commerce Platform Development Task

## 1. Project Overview

**Project name:** T-Kart\
**Project type:** Full-stack e-commerce platform\
**Primary goal:** Build a functional customer shopping website and a
separate admin dashboard, supported by a REST API backend and MongoDB
database.

T-Kart allows customers to register, sign in, browse and search
products, view product details, manage a shopping cart, check out using
a simulated payment flow, and track orders.

Administrators can manage products, categories, inventory, customers,
and order statuses through a protected admin dashboard.

This is an educational portfolio project. Build it with sound
engineering practices while keeping the code understandable to an
entry-level MERN Stack developer.

## 2. Technology Stack

### Frontend

-   HTML5
-   CSS3
-   JavaScript (ES6+)
-   React
-   Tailwind CSS
-   Lucide React
-   React Router DOM
-   Axios
-   React Context API

### Backend

-   Node.js
-   Express.js
-   MongoDB Atlas
-   MongoDB Compass
-   Mongoose
-   JWT authentication
-   bcryptjs
-   dotenv
-   cors
-   helmet
-   express-rate-limit
-   express-validator (or an equivalent validation library)

### Development and testing tools

-   Google Antigravity IDE
-   MongoDB Atlas
-   MongoDB Compass
-   Postman
-   Git and GitHub

Use compatible, current stable package versions. Do not add dependencies
without explaining why they are needed.

## 3. Application Architecture

Create two independently runnable applications:

1.  `frontend/` --- React customer website and admin dashboard.
2.  `backend/` --- Express REST API and MongoDB integration.

The frontend communicates with the backend over HTTP using Axios. The
backend owns business rules, validation, authorization, price
calculations, inventory changes, and payment-state transitions.

Use an MVC-inspired backend structure: - Models - Routes - Controllers -
Middleware - Services - Utilities - Configuration

Suggested repository structure:

``` text
T-Kart/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   └── admin/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── shop/
│   │   │   ├── orders/
│   │   │   └── admin/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── postman/
│   └── T-Kart.postman_collection.json
├── docs/
│   ├── PROJECT_SETUP.md
│   ├── DATABASE_SETUP.md
│   └── API_DOCUMENTATION.md
├── .gitignore
├── README.md
└── Task.md
```

Adapt the structure only when there is a clear technical reason. Explain
structural changes before making them.

## 4. Customer-Facing Frontend Requirements

### 4.1 Home page

-   T-Kart logo and navigation.
-   Search input.
-   Product category navigation.
-   Hero/promotional section.
-   Featured products.
-   New or popular products.
-   Footer with useful links.

### 4.2 Product listing

-   Responsive product grid.
-   Product image, name, price, discount, and stock availability.
-   Search by product name.
-   Filter by category.
-   Sort by price and other sensible fields.
-   Pagination.
-   Clear loading, empty, and error states.

### 4.3 Product details

-   Product images.
-   Name and description.
-   Price and discount.
-   Available stock.
-   Quantity selector.
-   Add-to-cart action.
-   Related products where practical.

### 4.4 Cart

-   List cart items.
-   Change quantities.
-   Remove an item.
-   Clear cart.
-   Show subtotal and total.
-   Validate available stock.
-   Continue shopping and proceed to checkout.

### 4.5 Checkout

-   Customer contact details.
-   Shipping address: name, phone, address, city, state, and postal
    code.
-   Order summary.
-   Server-calculated totals.
-   Mock payment method.
-   Place-order action with clear success and failure feedback.

### 4.6 Mock payment

-   Simulate successful and failed payment outcomes.
-   Generate a transaction reference for the simulation.
-   Show payment status.
-   Do not collect or store real card numbers, CVVs, bank credentials,
    or other real payment credentials.
-   Clearly label the feature as a demo/mock payment flow.

### 4.7 Customer orders

-   Show the signed-in customer's orders.
-   Show order number, date, items, total, payment status, and order
    status.
-   Allow viewing order details.
-   Customers must only be able to access their own orders.

### 4.8 Authentication and profile

-   Registration.
-   Login.
-   Logout.
-   Current-user/profile view.
-   Protected customer routes.
-   Useful form validation and feedback.

## 5. Admin Dashboard Requirements

Create a separate admin layout with protected navigation and a sidebar.

### 5.1 Dashboard overview

-   Total orders.
-   Total revenue from eligible paid orders.
-   Total products.
-   Total customers.
-   Low-stock products.
-   Recent orders.

Define dashboard metrics clearly and calculate them from database
records, not hardcoded values.

### 5.2 Product management

-   List and view products.
-   Create products.
-   Edit products.
-   Delete or deactivate products safely.
-   Manage product name, description, SKU, images, price, discount,
    category, stock, and active status.
-   Validate input and prevent duplicate SKUs.

For the first version, image URLs are acceptable. Do not build
file-upload infrastructure unless explicitly approved.

### 5.3 Category management

-   List categories.
-   Create, edit, and delete categories.
-   Validate category names.
-   Prevent unsafe deletion when products still reference a category;
    explain and implement a safe policy.

### 5.4 Inventory management

-   View stock quantities.
-   Update stock through authorized admin operations.
-   Highlight low-stock products.
-   Prevent orders that exceed available stock.
-   Keep inventory changes consistent with order placement and
    cancellation.

### 5.5 Order management

-   View all orders.
-   Inspect order details.
-   Update order status using allowed transitions.
-   View payment status independently from order status.
-   Cancel eligible orders according to a documented policy.
-   Restore inventory exactly once when an eligible cancellation
    requires it.

### 5.6 Customer management

-   View registered customers.
-   View customer details.
-   View a customer's order history.
-   Do not expose password hashes or unnecessary sensitive data.

### 5.7 Admin access

-   Admin-only dashboard routes.
-   Admin-only backend endpoints.
-   Never allow public registration to choose or submit the `admin`
    role.
-   Create the initial admin using a documented, controlled seed script
    or another private setup procedure.

## 6. Backend API Requirements

Use consistent JSON response formats and appropriate HTTP status codes.
Validate route parameters, query parameters, and request bodies.

### 6.1 Authentication

-   `POST /api/auth/register`
-   `POST /api/auth/login`
-   `GET /api/auth/me`

Requirements: - Hash passwords with bcryptjs. - Issue and verify JWTs. -
Prevent duplicate email registration. - Validate email and password
inputs. - Never return password hashes. - Never accept a role from
public registration input. - Protect private endpoints with
authentication middleware.

### 6.2 Products

-   `GET /api/products`
-   `GET /api/products/:id`
-   `POST /api/products` --- admin
-   `PUT /api/products/:id` --- admin
-   `DELETE /api/products/:id` --- admin

Requirements: - CRUD operations. - Search, category filtering, sorting,
and pagination. - Validate MongoDB IDs. - Validate prices, discounts,
SKU, and stock. - Do not expose inactive products to ordinary customers
unless intended.

### 6.3 Categories

-   `GET /api/categories`
-   `GET /api/categories/:id`
-   `POST /api/categories` --- admin
-   `PUT /api/categories/:id` --- admin
-   `DELETE /api/categories/:id` --- admin

### 6.4 Cart

-   `GET /api/cart`
-   `POST /api/cart/items`
-   `PATCH /api/cart/items/:itemId`
-   `DELETE /api/cart/items/:itemId`
-   `DELETE /api/cart`

Requirements: - Associate each cart with its authenticated customer. -
Validate product existence and active status. - Validate requested
quantities against current stock. - Calculate displayed totals on the
server. - Never trust prices or totals sent by the browser.

### 6.5 Orders

-   `POST /api/orders`
-   `GET /api/orders/my-orders`
-   `GET /api/orders/:id`
-   `GET /api/admin/orders`
-   `PATCH /api/admin/orders/:id/status`

Requirements: - Generate unique order numbers. - Store product name,
SKU, unit price, and quantity as order-line snapshots. - Store shipping
address snapshot. - Recalculate all amounts on the server. - Validate
stock at order placement. - Prevent cross-customer order access. -
Define valid order-status transitions. - Prevent duplicate stock
restoration on cancellation.

### 6.6 Payments

-   `POST /api/payments/mock`
-   `GET /api/payments/:orderId`

Requirements: - Simulate success and failure on the server. - Generate a
transaction reference. - Link payment records to orders and customers. -
Prevent customers from accessing another customer's payment
information. - Keep payment status separate from fulfilment/order
status. - Do not claim that a frontend-only success screen represents a
verified payment.

### 6.7 Admin

-   `GET /api/admin/dashboard`
-   `GET /api/admin/customers`
-   `GET /api/admin/inventory`
-   `PATCH /api/admin/products/:id/stock`

Every admin endpoint must require a valid authenticated user with the
admin role.

## 7. MongoDB Atlas and Compass Setup

Provide a beginner-friendly, step-by-step guide covering:

1.  Create or sign in to a MongoDB Atlas account.
2.  Create a project named `T-Kart`.
3.  Create an eligible free/shared cluster where available.
4.  Create a database user and strong password.
5.  Configure network access securely; prefer the developer's current IP
     rather than unrestricted access.
6.  Obtain the application's connection string.
7.  Install and open MongoDB Compass.
8.  Connect Compass to the Atlas cluster.
9.  Configure the backend `.env` connection string.
10. Connect the Express application using Mongoose.
11. Verify the connection.
12. Inspect databases, collections, and documents in Compass.

Use the database name `tkart_db`.

Expected collections: - users - products - categories - carts - orders -
payments

Explain the difference between MongoDB, MongoDB Atlas, MongoDB Compass,
and Mongoose. Explain that collections are generally created when
Mongoose first writes documents, unless explicitly created.

Never commit connection strings, passwords, or secrets.

## 8. Postman Testing Requirements

Create an importable Postman collection at:

`postman/T-Kart.postman_collection.json`

Include requests for: - Registration and login. - Current user. -
Product listing, details, and admin CRUD. - Category listing and admin
CRUD. - Cart operations. - Order creation and order history. - Mock
payment. - Admin dashboard. - Admin customer and inventory endpoints. -
Order status updates.

Use Postman environment variables: - `baseUrl` - `customerToken` -
`adminToken` - `productId` - `categoryId` - `orderId`

For each endpoint, document: - HTTP method and URL. - Required
headers. - Example request body. - Expected success response. - Expected
error responses. - Authorization requirements.

Test success and failure cases, including: - Invalid input. - Missing or
invalid token. - Customer attempting admin access. - Customer attempting
to access another customer's order. - Invalid MongoDB IDs. - Duplicate
email and SKU. - Insufficient inventory. - Invalid quantity. - Failed
mock payment. - Invalid order-status transition.

Do not mark an API complete until it has been tested.

## 9. Security and Data Integrity

Implement and verify: - bcrypt password hashing. - JWT authentication. -
Server-side role authorization. - Helmet security headers. - Rate
limiting for sensitive endpoints. - CORS restricted to configured
frontend origins. - Request validation and sanitization. - Protection
against NoSQL injection. - Resource ownership checks. - Mass-assignment
protection. - Centralized error handling. - Safe environment-variable
handling. - No sensitive fields in API responses. - No secrets in
frontend code or Git history.

For order placement, payment-state changes, inventory deduction, and
cancellation, design operations to avoid inconsistent or duplicate
updates. Use MongoDB transactions when supported by the selected Atlas
deployment and appropriate for the operation. If transactions are
unavailable, explain the limitation and implement a safe alternative
with conditional atomic updates and rollback/compensation handling.

## 10. UI/UX Requirements

Brand the application consistently as **T-Kart**.

Design direction: - Modern, clean, professional e-commerce experience. -
Clear visual hierarchy and consistent spacing. - Responsive desktop,
tablet, and mobile layouts. - Reusable components and design tokens. -
Lucide React icons rather than emoji icons. - Accessible labels, focus
states, and keyboard-friendly controls. - Loading, empty, error, and
success states. - Confirmation before destructive actions. - Clear form
validation messages.

Avoid unnecessary animation, clutter, and inconsistent styling.

## 11. Development Phases and Completion Checklist

Work through the phases in order. Update the checkboxes in this file as
work is verified.

### Phase 1 --- Project initialization

-   [x] Inspect workspace.
-   [x] Create frontend and backend directories.
-   [x] Initialize React frontend.
-   [x] Initialize Express backend.
-   [x] Install only required dependencies.
-   [x] Create `.gitignore` and `.env.example`.
-   [x] Verify both applications start.

### Phase 2 --- MongoDB setup

-   [ ] Create Atlas project and cluster.
-   [ ] Configure database user and network access.
-   [ ] Connect MongoDB Compass.
-   [ ] Configure backend environment variables.
-   [ ] Connect backend with Mongoose.
-   [ ] Verify connection and inspect database.

### Phase 3 --- Backend foundation

-   [ ] Configure Express application and server.
-   [ ] Configure middleware and CORS.
-   [ ] Configure centralized error handling.
-   [ ] Add health-check endpoint.
-   [ ] Verify server and database startup.

### Phase 4 --- Database models

-   [ ] User model.
-   [ ] Product model.
-   [ ] Category model.
-   [ ] Cart model.
-   [ ] Order model.
-   [ ] Payment model.
-   [ ] Add required validation and indexes.

### Phase 5 --- Authentication and authorization

-   [ ] Registration and login.
-   [ ] Password hashing.
-   [ ] JWT authentication.
-   [ ] Current-user endpoint.
-   [ ] Admin seed/setup procedure.
-   [ ] Admin role middleware.
-   [ ] Test access-control cases in Postman.

### Phase 6 --- Product and category APIs

-   [ ] Product CRUD.
-   [ ] Search, filtering, sorting, and pagination.
-   [ ] Category CRUD.
-   [ ] Validate APIs in Postman.

### Phase 7 --- Cart and inventory

-   [ ] Cart retrieval and mutations.
-   [ ] Server-side price calculation.
-   [ ] Stock validation.
-   [ ] Admin inventory updates.
-   [ ] Validate APIs in Postman.

### Phase 8 --- Orders and mock payments

-   [ ] Order creation and snapshots.
-   [ ] Order history and details.
-   [ ] Mock payment success/failure.
-   [ ] Order-status transitions.
-   [ ] Inventory deduction and restoration rules.
-   [ ] Validate APIs and edge cases in Postman.

### Phase 9 --- Postman collection and API documentation

-   [ ] Create importable collection.
-   [ ] Configure environment variables.
-   [ ] Add positive and negative tests.
-   [ ] Export and verify collection.
-   [ ] Complete API documentation.

### Phase 10 --- Customer frontend

-   [ ] Shared layout and navigation.
-   [ ] Home page.
-   [ ] Product listing and filters.
-   [ ] Product details.
-   [ ] Authentication pages.
-   [ ] Cart.
-   [ ] Checkout and mock payment UI.
-   [ ] Customer order history.

### Phase 11 --- Admin dashboard

-   [ ] Admin layout and protected navigation.
-   [ ] Dashboard metrics.
-   [ ] Product management.
-   [ ] Category management.
-   [ ] Inventory management.
-   [ ] Order management.
-   [ ] Customer management.

### Phase 12 --- Frontend/backend integration

-   [ ] Axios API client and configuration.
-   [ ] Authentication state and protected routes.
-   [ ] Integrate product and category APIs.
-   [ ] Integrate cart and checkout.
-   [ ] Integrate orders and mock payments.
-   [ ] Integrate admin APIs.
-   [ ] Verify loading and error handling.

### Phase 13 --- End-to-end testing and security review

-   [ ] Test complete customer journey.
-   [ ] Test complete admin journey.
-   [ ] Verify MongoDB records in Compass.
-   [ ] Test responsive layouts.
-   [ ] Test authorization and ownership.
-   [ ] Test inventory and cancellation edge cases.
-   [ ] Fix critical and high-severity defects.

### Phase 14 --- Documentation and deployment preparation

-   [ ] Complete README.
-   [ ] Complete project setup guide.
-   [ ] Complete database setup guide.
-   [ ] Complete API documentation.
-   [ ] Document environment variables.
-   [ ] Document admin seed process.
-   [ ] Prepare deployment instructions.

## 12. Definition of Done

T-Kart is complete only when: - A customer can register and log in. - An
admin can log in through a controlled admin setup. - Customers can
browse, search, and view products. - Customers can manage their cart. -
Checkout and mock payment work end to end. - Orders are stored and
visible to their owners. - Inventory changes are consistent with orders
and cancellations. - Admins can manage products, categories, stock, and
orders. - Customer accounts cannot access admin APIs or other customers'
data. - APIs have been tested using the Postman collection. - MongoDB
Compass shows the expected database records. - Frontend and backend are
integrated. - Critical security and data-integrity issues are
resolved. - Documentation is sufficient for another developer to run the
project.

## 13. Mandatory Working Rules for the AI Agent

1.  Read this entire `Task.md` before making changes.
2.  Inspect the existing workspace before creating or modifying files.
3.  Implement one phase at a time.
4.  Start with Phase 1 only.
5.  Explain what, why, and how before important implementation steps.
6.  Explain terminal commands before asking the developer to run them.
7.  Prefer simple, readable, maintainable code.
8.  Do not fabricate API responses or claim untested functionality
    works.
9.  Do not skip MongoDB Compass verification or Postman testing.
10. Do not overwrite working files without inspecting them first.
11. Do not silently change requirements or architecture.
12. Ask before major architectural changes or destructive actions.
13. Update this checklist only when work has actually been verified.
14. Report completed work, tests run, issues found, and next steps at
    the end of each phase.
15. Stop after Phase 1 and wait for explicit approval before Phase 2.
