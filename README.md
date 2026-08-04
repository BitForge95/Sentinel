# Sentinel SOC (Security Operations Center) 🛡️

Sentinel is a production-ready, full-stack Security Operations Center (SOC) dashboard designed for real-time transaction monitoring and anomaly detection. Built with a highly scalable, containerized architecture, it ingests financial payloads, asynchronously processes them through an AI/heuristic validation pipeline, and streams live insights to analysts.

---

## 🚀 Key Features

- **Real-Time Telemetry:** Bi-directional WebSocket streaming (Socket.io) for live transaction volume charting and instant anomaly alerts.
- **Asynchronous Queueing:** BullMQ and Redis integration offloads heavy AI processing, preventing Node.js event loop bottlenecks during high-volume ingestions.
- **Server-Side Search Engine:** Optimized MongoDB indexing and `$regex` controllers enable instant, case-insensitive querying across millions of transaction logs.
- **Hardened Security:** Fortified with Helmet.js (HTTP header protection), Express Rate Limiting (DDoS mitigation), and bulletproof HttpOnly JWT authentication.
- **Role-Based Access Control (RBAC):** Tiered permissions ensuring only authorized Admin analysts can resolve critical security incidents.
- **Dockerized Infrastructure:** One-click deployment using Docker Compose, orchestrating isolated containers for the frontend, backend, MongoDB, and Redis.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Recharts
- Socket.io Client

### Backend
- Node.js
- Express.js
- Socket.io

### Database
- MongoDB (Mongoose)

### Queue / Message Broker
- Redis
- BullMQ

### Security
- JWT (HttpOnly Cookies)
- Helmet
- express-rate-limit

### DevOps
- Docker
- Docker Compose

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (or Docker Engine + Docker Compose)
- [Node.js](https://nodejs.org/) (v18 or higher) *(Only required for local/non-Docker development)*

---

# 🛠️ Quick Start (Docker Recommended)

The easiest way to run Sentinel is via Docker Compose, which automatically builds and links all services.

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sentinel.git
cd sentinel
```

> **Replace the repository URL with your own GitHub repository.**

---

## 2. Configure Environment Variables

Inside the `backend` folder create a `.env` file.

```env
PORT=5000
MONGO_URI=mongodb://mongo:27017/sentinel
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your_super_secret_key
```

---

## 3. Build & Start the Stack

```bash
docker-compose up --build
```

---

## 4. Access the Application

Frontend Dashboard

```
http://localhost:5173
```

Backend API

```
http://localhost:5000
```

---

# 💻 Manual Local Development

If you prefer running everything without Docker:

## 1. Start Local Infrastructure

Make sure:

- MongoDB is running
- Redis is running

---

## 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

---

## 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🛡️ Security Implementations

Sentinel follows enterprise security best practices.

## 🔐 Authentication

- HttpOnly Secure JWT Cookies
- Frontend never directly accesses authentication tokens
- Mitigates XSS token theft

---

## 🚫 API Rate Limiting

### Global API

- 100 Requests / 15 Minutes

### Transaction Ingestion

- 20 Payloads / Minute

Protects against:

- Brute-force attacks
- Queue flooding
- Abuse

---

## 🌐 CORS & HTTP Headers

- Strict frontend-only CORS
- Helmet.js security headers
- Removes identifying Express headers
- Strong resource policies

---

# 📡 API Overview

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/auth/login` | POST | Authenticate user & set HttpOnly JWT | ❌ |
| `/api/transactions/generate` | POST | Ingest transaction into Redis queue | ✅ |
| `/api/transactions?search=` | GET | Retrieve paginated & filtered transactions | ✅ |
| `/api/fraud` | GET | Retrieve unresolved anomalies | ✅ |
| `/api/fraud/:id/resolve` | DELETE | Resolve anomaly (Admin Only) | ✅ |
| `/api/analytics` | GET | Aggregate dashboard metrics | ✅ |

---

# 📂 Project Structure

```text
Sentinel/
│
├── frontend/
│   ├── src/
│   └── Dockerfile
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── workers/
│   ├── queue/
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

# 📄 License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.
