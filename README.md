# Xneeti Project

A backend service built with **Node.js**, **MongoDB**, and **Redis** to manage and update campaign budgets with controlled QPS (queries per second) using a worker system.

## 🚀 Features
- Campaign budget management stored in **MongoDB**
- **Idempotency** support to prevent duplicate requests
- Worker system to:
  - Pull pending documents from MongoDB
  - Apply **global QPS limit (10 req/s)**
  - Apply **profile-level QPS limit (2 req/s per profile)**
  - Update budgets via external API (e.g., Amazon Advertising API)
- Retry with exponential backoff for failed attempts
- Status tracking: `pending`, `inflight`, `applied`, `failed`

## 🛠️ Tech Stack
- [Node.js](https://nodejs.org/) – server runtime
- [Express](https://expressjs.com/) – REST APIs
- [MongoDB](https://www.mongodb.com/) – persistent storage
- [Mongoose](https://mongoosejs.com/) – ODM for MongoDB
- [Redis](https://redis.io/) – QPS throttling & rate limiting

## Prerequisite
- Nodejs (V>18)
- MongoDB(local or cloud)
- Redis(local or cloud)

## Create .env file in the root directory
- Add this PORT, MONGO_URL, REDIS_URL
## ⚡ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SauravRaj8/xneeti.git
   cd xneeti

2. **Install dependencies
   ```bash
   npm install

3. **Start server
   ```bash
   npm start
