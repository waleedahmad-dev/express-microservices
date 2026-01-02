# Express.js Microservices Boilerplate

A production-ready microservices architecture built with Express.js, featuring JWT authentication, real-time chat, distributed transactions (Saga pattern), and Docker containerization.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│              (Web, Mobile, Third-party APIs)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                 │
│         (Authentication, Rate Limiting, Routing)                │
│                       Port: 3000                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┬───────────────┐
          │               │               │               │
          ▼               ▼               ▼               ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    User     │   │   Product   │   │    Order    │   │   Payment   │
│   Service   │   │   Service   │   │   Service   │   │   Service   │
│  Port:3001  │   │  Port:3002  │   │  Port:3003  │   │  Port:3004  │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   User DB   │   │ Product DB  │   │  Order DB   │   │ Payment DB  │
│  MySQL:3306 │   │ MySQL:3307  │   │ MySQL:3308  │   │ MySQL:3309  │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘

                          ┌─────────────┐
                          │    Chat     │
                          │   Service   │
                          │  Port:3005  │
                          │ (Socket.IO) │
                          └──────┬──────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │   Chat DB   │
                          │ MySQL:3310  │
                          └─────────────┘
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4.x |
| Database | MySQL 8.0 |
| ORM | Sequelize 6.x |
| Authentication | JWT |
| Real-time | Socket.IO |
| Logging | Winston |
| Containerization | Docker & Docker Compose |
| Inter-service Communication | Axios (REST) |

## Folder Structure

```
express-microservices/
├── api-gateway/                    # API Gateway service
│   ├── src/
│   │   ├── routes/                 # Route definitions
│   │   ├── controllers/            # Request handlers
│   │   ├── middlewares/            # Auth, rate limiting, error handling
│   │   ├── services/               # Business logic
│   │   ├── utils/                  # Utility functions
│   │   ├── app.js                  # Express app setup
│   │   └── server.js               # Server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── services/
│   ├── user-service/               # User management & authentication
│   ├── product-service/            # Product catalog & inventory
│   ├── order-service/              # Order processing (Saga pattern)
│   ├── payment-service/            # Payment processing (mocked)
│   └── chat-service/               # Real-time messaging
│
│   # Each service follows this structure:
│   └── [service-name]/
│       ├── src/
│       │   ├── routes/             # API endpoints
│       │   ├── controllers/        # Thin controllers
│       │   ├── services/           # Business logic
│       │   ├── repositories/       # Database access layer
│       │   ├── models/             # Sequelize models
│       │   ├── dtos/               # Validation schemas
│       │   ├── middlewares/        # Service-specific middleware
│       │   ├── utils/              # Helpers
│       │   ├── seeds/              # Database seeders
│       │   ├── app.js
│       │   └── server.js
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
│
├── shared/                         # Shared utilities
│   ├── config/                     # Database, app configuration
│   ├── logger/                     # Winston logger setup
│   └── constants/                  # HTTP codes, events, enums
│
├── infrastructure/
│   └── docker/                     # Docker utilities
│
├── docker-compose.yml              # Container orchestration
├── .env.example                    # Environment template
├── .eslintrc.js                    # ESLint configuration
├── .gitignore
└── README.md
```

## Services Overview

### API Gateway (Port 3000)
- Single entry point for all client requests
- JWT authentication and authorization
- Rate limiting (100 requests/minute default)
- Request logging with correlation IDs
- Proxies requests to downstream services

### User Service (Port 3001)
- User registration and authentication
- JWT token generation and refresh
- User CRUD operations
- Role-based access control (ADMIN, USER, MODERATOR)
- Password hashing with bcrypt

### Product Service (Port 3002)
- Product catalog management
- Category hierarchy
- Inventory tracking
- Stock reservation for orders
- Low stock alerts

### Order Service (Port 3003)
- Order creation and management
- **Saga Pattern** for distributed transactions
- Coordinates with Product and Payment services
- Automatic rollback on failures
- Order status tracking

### Payment Service (Port 3004)
- Payment processing (mocked)
- Configurable success rate (default 90%)
- Full and partial refunds
- Transaction tracking

### Chat Service (Port 3005)
- Real-time messaging with Socket.IO
- Private and group chat rooms
- Message history persistence
- Typing indicators
- Online status tracking
- Unread message counts

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd express-microservices
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Check service health**
   ```bash
   curl http://localhost:3000/health
   ```

### Local Development

1. **Install dependencies for each service**
   ```bash
   cd api-gateway && npm install
   cd ../services/user-service && npm install
   # ... repeat for other services
   ```

2. **Start MySQL databases**
   ```bash
   docker-compose up -d user-db product-db order-db payment-db chat-db
   ```

3. **Start services individually**
   ```bash
   cd services/user-service && npm run dev
   # In separate terminals for each service
   ```

## Docker Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f user-service

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart a specific service
docker-compose restart user-service

# Scale a service (if needed)
docker-compose up -d --scale product-service=3
```

## API Endpoints

### Authentication
```
POST /api/users/register    - Register new user
POST /api/users/login       - Login and get tokens
POST /api/users/refresh-token - Refresh access token
POST /api/users/logout      - Logout
```

### Users
```
GET    /api/users           - List all users (admin)
GET    /api/users/profile   - Get current user profile
PUT    /api/users/profile   - Update current user profile
GET    /api/users/:id       - Get user by ID
PUT    /api/users/:id       - Update user (admin)
DELETE /api/users/:id       - Delete user (admin)
```

### Products
```
GET    /api/products            - List products
GET    /api/products/:id        - Get product
POST   /api/products            - Create product
PUT    /api/products/:id        - Update product
DELETE /api/products/:id        - Delete product
PATCH  /api/products/:id/inventory - Update inventory
```

### Orders
```
GET    /api/orders              - List all orders (admin)
GET    /api/orders/my-orders    - List current user's orders
GET    /api/orders/:id          - Get order
POST   /api/orders              - Create order
POST   /api/orders/:id/cancel   - Cancel order
PATCH  /api/orders/:id/status   - Update status (admin)
```

### Payments
```
GET    /api/payments            - List payments (admin)
GET    /api/payments/my-payments - List current user's payments
GET    /api/payments/:id        - Get payment
POST   /api/payments/:id/refund - Refund payment
```

### Chat (WebSocket)
```
Connect: ws://localhost:3005
Events:
  - rooms:join       - Join all user's rooms
  - room:join        - Join specific room
  - message:send     - Send message
  - message:edit     - Edit message
  - message:delete   - Delete message
  - typing:start     - Start typing indicator
  - typing:stop      - Stop typing indicator
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Service port | varies |
| DB_HOST | MySQL host | service-db |
| DB_PORT | MySQL port | 3306 |
| DB_NAME | Database name | service_name |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | password |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Token expiry | 24h |
| RATE_LIMIT_MAX | Requests per window | 100 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 60000 |
| LOG_LEVEL | Winston log level | info |

## Saga Pattern (Order Service)

The Order Service implements the Saga pattern for distributed transactions:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Check     │ -> │  Reserve    │ -> │   Create    │ -> │  Process    │
│ Availability│    │  Inventory  │    │   Order     │    │  Payment    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                   │                   │
                   ┌──────┴───────────────────┴───────────────────┘
                   │ Compensating Transactions (on failure)
                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Release    │ <- │   Delete    │ <- │   Refund    │
│  Inventory  │    │   Order     │    │   Payment   │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Health Checks

Each service exposes a health endpoint:
```bash
GET /health           # Basic health
GET /health/detailed  # Detailed health with dependencies (API Gateway only)
```

## Logging

Logs include:
- Timestamp
- Service name
- Request ID (for correlation)
- Log level (info, warn, error)
- HTTP request/response details

Example log output:
```
2024-01-15 10:30:45 [user-service] [abc-123-def] INFO: POST /users/login 200 45ms
```

## Security Considerations

- JWT tokens for authentication
- Password hashing with bcrypt (10 rounds)
- Rate limiting on API Gateway
- Helmet.js for HTTP security headers
- CORS configuration
- Input validation with express-validator
- No secrets in code (use environment variables)

## Future Improvements

- [ ] Add Redis for session management and caching
- [ ] Implement circuit breaker pattern
- [ ] Add message queue (RabbitMQ/Kafka)
- [ ] Kubernetes deployment manifests
- [ ] Add comprehensive test suites
- [ ] API documentation with Swagger/OpenAPI
- [ ] Implement distributed tracing (Jaeger/Zipkin)
- [ ] Add metrics collection (Prometheus)

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
