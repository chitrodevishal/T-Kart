# MongoDB Atlas and Compass Setup Guide

This guide prepares the developer for **Phase 2: MongoDB Atlas and Compass Setup**.

---

## 1. Core Concepts Explained

- **MongoDB**: A document-oriented, NoSQL database that stores data in flexible, JSON-like documents with dynamic schemas.
- **MongoDB Atlas**: The official managed cloud database service for MongoDB. It handles hosting, security, backups, and cluster provisioning in the cloud.
- **MongoDB Compass**: The official GUI (Graphical User Interface) desktop application for MongoDB. It enables visual querying, schema inspection, document editing, and index monitoring.
- **Mongoose**: An Object Data Modeling (ODM) library for Node.js. It provides schema validation, type casting, middleware (hooks), and business logic enforcement in Express applications.

> **Key Rule**: Collections in MongoDB are generally created dynamically when Mongoose first writes documents into them, unless created explicitly.

---

## 2. Step-by-Step Atlas Setup (Phase 2 Preview)

1. **Sign Up / Sign In**:
   - Navigate to [MongoDB Cloud](https://www.mongodb.com/cloud/atlas).
2. **Create Project**:
   - Name the project: `T-Kart`.
3. **Deploy Cluster**:
   - Choose the **M0 Free Tier** (Shared).
   - Select cloud provider (AWS/GCP/Azure) and a region closest to your current location.
4. **Create Database User**:
   - Authentication method: Username and Password.
   - Choose a strong password. (Save credentials safely in `.env`, never commit to Git).
5. **Configure Network Access**:
   - Add your current IP address (recommended for security) or `0.0.0.0/0` (temporary development if working across dynamic IP connections).
6. **Obtain Connection String**:
   - Click **Connect** -> **Connect your application** (Node.js driver).
   - Format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/tkart_db?retryWrites=true&w=majority`
7. **Connect with MongoDB Compass**:
   - Paste connection URI into Compass and connect to verify connectivity.

---

## 3. Planned Collections in `tkart_db`

- `users`
- `products`
- `categories`
- `carts`
- `orders`
- `payments`
