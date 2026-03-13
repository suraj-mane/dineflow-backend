# DineFlow Backend 🍽️

A production-grade Restaurant Management System REST API built with Node.js, TypeScript, MySQL, Redis, Socket.io, and BullMQ.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js v5 |
| Database | MySQL 8.0 with mysql2 |
| Cache | Redis 7 with ioredis |
| Queue | BullMQ (Redis-backed) |
| Real-time | Socket.io v4 |
| Auth | JWT (access 15min + refresh 7d) |
| Validation | Zod |
| Logging | Winston |
| Docs | Swagger UI |
| Testing | Jest + ts-jest |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |

## Getting Started

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Git

### Installation
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/dineflow-backend.git
cd dineflow-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start Docker services
docker-compose up -d mysql redis

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Start background worker (separate terminal)
npm run worker:dev
```

## API Documentation

Once the server is running, visit:
```
http://localhost:5000/api/docs
```

Full interactive Swagger UI with all endpoints, request/response schemas, and JWT auth support.

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, get tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Auth | Revoke refresh token |
| GET | `/api/auth/me` | Auth | Get current user |

### Restaurants
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/restaurants` | Owner | Create restaurant |
| GET | `/api/restaurants` | Owner | List my restaurants |
| GET | `/api/restaurants/:id` | Owner | Get restaurant |
| PATCH | `/api/restaurants/:id` | Owner | Update restaurant |
| GET | `/api/restaurants/:id/dashboard` | Owner | Analytics dashboard |
| GET | `/api/restaurants/:id/menu` | All | Full menu (cached) |
| GET | `/api/restaurants/:id/orders` | Owner/Kitchen | Restaurant orders |

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/restaurants/:id/categories` | Owner | Create category |
| GET | `/api/restaurants/:id/categories` | Owner/Kitchen | List categories |
| PATCH | `/api/categories/:id` | Owner | Update category |
| DELETE | `/api/categories/:id` | Owner | Delete category |

### Menu Items
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/categories/:id/menu-items` | Owner | Create menu item |
| GET | `/api/categories/:id/menu-items` | Owner/Kitchen | List items |
| PATCH | `/api/menu-items/:id` | Owner | Update item |
| DELETE | `/api/menu-items/:id` | Owner | Delete item |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Customer | Place order |
| GET | `/api/orders/my` | Customer | My orders |
| GET | `/api/orders/:id` | All | Get order |
| PATCH | `/api/orders/:id/status` | Owner/Kitchen | Update status |
| PATCH | `/api/orders/:id/cancel` | Customer | Cancel order |

## Order Status Flow
```
pending → confirmed → preparing → ready → completed
   ↓           ↓
cancelled   cancelled
```

Auto-cancel: Orders not confirmed within **5 minutes** are automatically cancelled via BullMQ.

## Real-time Events (Socket.io)

### Authentication
```js
const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});
```

### Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `join-restaurant` | Client → Server | Join restaurant room |
| `join-customer` | Client → Server | Join customer room |
| `new-order` | Server → Client | New order placed |
| `order-status-updated` | Server → Client | Order status changed |
| `your-order-updated` | Server → Customer | Customer order update |

## Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Project Structure
```
src/
├── config/
│   ├── database.ts       # MySQL connection pool
│   ├── redis.ts          # Redis client
│   ├── socket.ts         # Socket.io + JWT auth
│   └── swagger.ts        # Swagger/OpenAPI setup
├── jobs/
│   ├── orderQueue.ts     # BullMQ queue definition
│   └── worker.ts         # Background job processor
├── middleware/
│   ├── auth.middleware.ts    # JWT verification
│   ├── error.middleware.ts   # Global error handler
│   └── rateLimit.middleware.ts
├── migrations/
│   ├── 001_initial_schema.sql
│   └── migrate.ts
├── modules/
│   ├── auth/
│   ├── restaurant/
│   ├── category/
│   ├── menu-item/
│   └── order/
├── types/
│   └── express.d.ts
├── utils/
│   ├── asyncHandler.ts
│   ├── jwt.ts
│   ├── logger.ts
│   └── response.ts
├── app.ts
└── server.ts
```

## CI/CD

GitHub Actions runs on every push to `main`:

1. **Type check** — `tsc --noEmit`
2. **Unit tests** — Jest with coverage
3. **Build** — Compile TypeScript to JS
4. **Docker** — Build production image

## Environment Variables

See `.env.example` for all required variables.

## License

MIT