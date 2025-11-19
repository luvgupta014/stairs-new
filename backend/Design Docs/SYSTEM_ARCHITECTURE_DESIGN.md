# STAIRS Platform - System Architecture Design

## Document Information
- **Project Name:** STAIRS Platform
- **Version:** 1.0
- **Date:** November 2025
- **Audience:** Architects, Technical Leads, Management

---

## 1. Architecture Overview

STAIRS follows a **three-tier client-server architecture** with external service integrations. The system is designed for scalability, maintainability, and security.

### 1.1 Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React 18 Single Page Application (SPA)            │   │
│  │  - Role-based dashboards                            │   │
│  │  - Responsive UI (Mobile, Tablet, Desktop)          │   │
│  │  - Real-time updates                                │   │
│  │  - Client-side routing (React Router)               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API over HTTPS
                         │ JSON Data Format
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Node.js + Express.js Server                       │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Auth Module  │  │ Event Module │              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Payment Mod  │  │  Cert Module │              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Order Module │  │  User Module │              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma ORM
                         │ SQL Queries
                         │
┌────────────────────────┴────────────────────────────────────┐
│                        DATA LAYER                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 14 Relational Database                 │   │
│  │  - User data, Events, Orders, Certificates         │   │
│  │  - ACID compliance                                  │   │
│  │  - Indexed queries for performance                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Razorpay   │  │ Google Maps │  │   Email     │        │
│  │  (Payment)  │  │  (Location) │  │ (Nodemailer)│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Design

### 2.1 Frontend Architecture

```
Frontend (React SPA)
│
├── Public Assets
│   ├── Images, Logos
│   └── Favicon
│
├── Source Code (src/)
│   │
│   ├── Pages
│   │   ├── Auth Pages (Login, Register, OTP, Password Reset)
│   │   ├── Dashboard Pages (Student, Coach, Admin, Institute, Club)
│   │   ├── Event Pages (List, Details, Create, Edit, Participants)
│   │   ├── Profile Pages
│   │   └── Certificate Pages
│   │
│   ├── Components
│   │   ├── Shared Components (Header, Footer, Modal, Button)
│   │   ├── Event Components (EventCard, EventForm, EventsList)
│   │   ├── Payment Components (Payment, PaymentPopup)
│   │   ├── Auth Components (ProtectedRoute, LoginLayout)
│   │   └── Maps Components (GoogleMapsPlacesAutocomplete)
│   │
│   ├── Context (State Management)
│   │   ├── AuthContext (User authentication state)
│   │   └── SimpleAuthContext (Simplified auth)
│   │
│   ├── Services
│   │   └── api.js (Axios instance with interceptors)
│   │
│   ├── Utils
│   │   ├── errorUtils.js (Error handling)
│   │   └── stateCodes.js (Indian state codes)
│   │
│   └── App.jsx (Main application component with routing)
│
└── Build Output (dist/)
    └── Optimized production build
```

**Key Design Decisions:**
- **SPA Architecture:** Fast navigation without page reloads
- **Component-Based:** Reusable, maintainable components
- **Context API:** State management without external libraries
- **Axios Interceptors:** Automatic token injection and error handling
- **Protected Routes:** Role-based access control at routing level

### 2.2 Backend Architecture

```
Backend (Node.js + Express)
│
├── Entry Point
│   └── index.js (Server initialization, middleware setup)
│
├── Routes (API Endpoints)
│   ├── auth.js (Authentication routes)
│   ├── student.js (Student-specific routes)
│   ├── coach.js (Coach-specific routes)
│   ├── admin.js (Admin-specific routes)
│   ├── institute.js (Institute routes)
│   ├── club.js (Club routes)
│   ├── event.js (Event management routes)
│   ├── payment.js (Payment processing routes)
│   ├── certificates.js (Certificate routes)
│   └── maps.js (Google Maps integration routes)
│
├── Controllers (Request Handlers)
│   └── eventController.js (Event business logic)
│
├── Services (Business Logic Layer)
│   ├── eventService.js (Event operations)
│   └── certificateService.js (Certificate generation)
│
├── Utils (Helper Functions)
│   ├── authMiddleware.js (JWT verification, RBAC)
│   ├── asyncHandler.js (Error handling wrapper)
│   ├── emailService.js (Email sending)
│   ├── uidGenerator.js (Unique ID generation)
│   ├── eventUIDGenerator.js (Event-specific UIDs)
│   ├── prismaClient.js (Database client)
│   ├── database.js (Database utilities)
│   └── helpers.js (Common helper functions)
│
├── Config
│   └── paymentPlans.js (Subscription pricing)
│
├── Prisma
│   ├── schema.prisma (Database schema definition)
│   └── migrations/ (Database migration files)
│
├── Templates
│   └── certificate-template.html (PDF template)
│
├── Uploads (File Storage)
│   ├── certificates/ (Generated certificate PDFs)
│   ├── results/ (Event result files)
│   └── event-results/ (Additional result files)
│
└── Tests
    ├── Unit Tests
    ├── Integration Tests
    └── API Tests
```

**Key Design Decisions:**
- **Layered Architecture:** Routes → Controllers → Services → Database
- **Separation of Concerns:** Each layer has a specific responsibility
- **Middleware-Based:** Authentication, error handling via middleware
- **Service Layer:** Reusable business logic
- **Prisma ORM:** Type-safe database access with migrations

### 2.3 Database Schema Design

```
┌──────────┐
│   User   │ (Base table for all user types)
└────┬─────┘
     │
     ├─────┬──────────┬─────────┬─────────┐
     │     │          │         │         │
┌────▼───┐ │     ┌───▼────┐ ┌──▼────┐ ┌──▼───┐
│Student │ │     │ Coach  │ │Institute│ │ Club │
└────┬───┘ │     └───┬────┘ └───┬────┘ └──┬───┘
     │     │         │          │         │
     │     │         ├──────────┴─────────┘
     │     │         │ (createdBy)
     │     │    ┌────▼────┐
     │     │    │  Event  │
     │     │    └────┬────┘
     │     │         │
     │     │    ┌────┴─────────────┐
     │     │    │                  │
     ├─────┼────▼────┐      ┌──────▼────────┐
     │     │EventReg │      │ EventOrder    │
     │     │istration│      └───────────────┘
     │     └─────────┘             │
     │                         ┌───▼────┐
     │                         │Payment │
     │                         └────────┘
     │
     ├──────────────┐
     │              │
┌────▼────┐  ┌──────▼──────┐
│Certificate│ │StudentCoach │
└──────────┘  │Connection   │
              └─────────────┘
```

**Relationships:**
- **User → Role-Specific Profiles:** One-to-one (1:1)
- **Coach → Events:** One-to-many (1:N)
- **Student → Events:** Many-to-many (M:N) via EventRegistration
- **Student → Coaches:** Many-to-many (M:N) via StudentCoachConnection
- **Event → Orders:** One-to-many (1:N)
- **Event → Certificates:** One-to-many (1:N)
- **Order → Payment:** One-to-one (1:1)

---

## 3. Data Flow Patterns

### 3.1 Request-Response Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. HTTP Request (with JWT token)
     ▼
┌──────────────┐
│    Nginx     │ 2. Reverse Proxy
└────┬─────────┘
     │ 3. Forward to Backend
     ▼
┌──────────────┐
│   Express    │ 4. Route matching
│   Router     │
└────┬─────────┘
     │ 5. Auth Middleware
     ▼
┌──────────────┐
│ Auth         │ 6. Verify JWT, check role
│ Middleware   │
└────┬─────────┘
     │ 7. If valid, continue
     ▼
┌──────────────┐
│ Controller   │ 8. Handle request
└────┬─────────┘
     │ 9. Call service
     ▼
┌──────────────┐
│   Service    │ 10. Business logic
└────┬─────────┘
     │ 11. Database query
     ▼
┌──────────────┐
│   Prisma     │ 12. Execute query
│     ORM      │
└────┬─────────┘
     │ 13. Query PostgreSQL
     ▼
┌──────────────┐
│  PostgreSQL  │ 14. Return data
└────┬─────────┘
     │ 15. Results to Prisma
     ▼
┌──────────────┐
│   Service    │ 16. Process results
└────┬─────────┘
     │ 17. Return to controller
     ▼
┌──────────────┐
│ Controller   │ 18. Format response
└────┬─────────┘
     │ 19. JSON response
     ▼
┌──────────────┐
│    Client    │ 20. Display to user
└──────────────┘
```

### 3.2 Authentication Flow

```
┌────────┐
│ User   │
└───┬────┘
    │ 1. Login (email + password)
    ▼
┌────────────┐
│  Frontend  │ 2. POST /api/auth/login/:role
└─────┬──────┘
      │ 3. Send credentials
      ▼
┌──────────────┐
│   Backend    │ 4. Validate role
└──────┬───────┘
       │ 5. Query user by email & role
       ▼
┌──────────────┐
│  Database    │ 6. Return user (with hashed password)
└──────┬───────┘
       │ 7. User data
       ▼
┌──────────────┐
│   Backend    │ 8. Compare password (bcrypt)
└──────┬───────┘
       │ 9. If valid, generate JWT
       │ 10. JWT payload: {userId, email, role}
       ▼
┌──────────────┐
│   Frontend   │ 11. Store token (localStorage)
└──────┬───────┘
       │ 12. Include in all requests (Authorization header)
       ▼
┌──────────────┐
│Subsequent    │ 13. Bearer <token>
│  Requests    │
└──────────────┘
```

### 3.3 Payment Flow

```
┌────────┐
│ Coach  │
└───┬────┘
    │ 1. Initiate payment (subscription/order)
    ▼
┌────────────┐
│  Frontend  │ 2. POST /api/payment/create-order
└─────┬──────┘
      │
      ▼
┌──────────────┐
│   Backend    │ 3. Create Razorpay order
└──────┬───────┘
       │ 4. Razorpay API call
       ▼
┌──────────────┐
│  Razorpay    │ 5. Return order_id
└──────┬───────┘
       │ 6. Order details
       ▼
┌──────────────┐
│   Frontend   │ 7. Open Razorpay modal
└──────┬───────┘
       │ 8. User completes payment
       ▼
┌──────────────┐
│  Razorpay    │ 9. Process payment
└──────┬───────┘
       │ 10. Return payment_id + signature
       ▼
┌──────────────┐
│   Frontend   │ 11. POST /api/payment/verify
└──────┬───────┘
       │ 12. Send payment_id, order_id, signature
       ▼
┌──────────────┐
│   Backend    │ 13. Verify signature (HMAC SHA256)
└──────┬───────┘
       │ 14. If valid, create Payment record
       ▼
┌──────────────┐
│  Database    │ 15. Save payment & update order/subscription
└──────┬───────┘
       │ 16. Success
       ▼
┌──────────────┐
│   Frontend   │ 17. Show success message
└──────────────┘
```

---

## 4. Security Architecture

### 4.1 Security Layers

```
┌─────────────────────────────────────────────────────┐
│                 APPLICATION SECURITY                 │
│  ┌───────────────────────────────────────────────┐ │
│  │ Authentication (JWT)                          │ │
│  │ - Token-based stateless auth                  │ │
│  │ - 24-hour expiry                              │ │
│  │ - Role-based access control (RBAC)            │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ Authorization                                 │ │
│  │ - Middleware-based permission checks          │ │
│  │ - Route-level protection                      │ │
│  │ - Resource ownership validation               │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ Input Validation                              │ │
│  │ - Express-validator for request validation    │ │
│  │ - Type checking with TypeScript (future)      │ │
│  │ - Prisma schema validation                    │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  TRANSPORT SECURITY                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ HTTPS/TLS                                     │ │
│  │ - SSL certificates (Let's Encrypt)            │ │
│  │ - TLS 1.2+ only                               │ │
│  │ - HSTS headers                                │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    DATA SECURITY                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Encryption at Rest                            │ │
│  │ - Password hashing (bcrypt, 10 rounds)        │ │
│  │ - Database encryption (PostgreSQL)            │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ Encryption in Transit                         │ │
│  │ - HTTPS for all API calls                     │ │
│  │ - Secure payment gateway (Razorpay PCI DSS)   │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                INFRASTRUCTURE SECURITY               │
│  ┌───────────────────────────────────────────────┐ │
│  │ Firewall (UFW)                                │ │
│  │ - Only ports 22, 80, 443 open                 │ │
│  │ - SSH key authentication only                 │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ Server Hardening                              │ │
│  │ - Regular security updates                    │ │
│  │ - Minimal software installation               │ │
│  │ - Non-root user for application               │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 4.2 Attack Prevention

| Attack Type | Prevention Method |
|-------------|-------------------|
| **SQL Injection** | Parameterized queries via Prisma ORM |
| **XSS** | Input sanitization, React automatic escaping |
| **CSRF** | JWT tokens (stateless), SameSite cookies |
| **Brute Force** | Rate limiting (future), account lockout |
| **Man-in-the-Middle** | HTTPS/TLS enforcement |
| **Session Hijacking** | Short-lived JWT tokens, secure storage |
| **DDoS** | Nginx rate limiting, firewall rules |

---

## 5. Scalability Design

### 5.1 Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └───────┬──────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
      ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
      │Backend  │      │Backend  │     │Backend  │
      │Instance │      │Instance │     │Instance │
      │   #1    │      │   #2    │     │   #3    │
      └────┬────┘      └────┬────┘     └────┬────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
                       ┌────▼────┐
                       │Database │
                       │(Primary)│
                       └────┬────┘
                            │
                    ┌───────┴────────┐
                    │                │
               ┌────▼────┐      ┌────▼────┐
               │Database │      │Database │
               │(Replica)│      │(Replica)│
               └─────────┘      └─────────┘
```

**Current Setup:**
- PM2 cluster mode with 4 instances (using 4 CPU cores)
- Single database server

**Future Scaling:**
- Multiple backend servers behind Nginx load balancer
- Database read replicas for read-heavy operations
- Redis caching layer for frequently accessed data

### 5.2 Performance Optimizations

**Frontend:**
- Code splitting and lazy loading
- Asset minification and compression
- CDN for static assets (future)
- Browser caching strategies

**Backend:**
- Connection pooling (Prisma)
- Database query optimization (indexes)
- Async/await patterns (non-blocking I/O)
- PM2 cluster mode (multi-core utilization)

**Database:**
- Proper indexing on frequently queried columns
- Query optimization (avoid N+1 queries)
- Regular VACUUM and ANALYZE operations

---

## 6. Integration Architecture

### 6.1 External Service Integration Pattern

```
┌──────────────┐
│   Backend    │
│  Application │
└───────┬──────┘
        │
        │ API Calls (REST/HTTPS)
        │
        ├─────────────┬──────────────┬────────────────┐
        │             │              │                │
   ┌────▼────┐  ┌────▼─────┐  ┌─────▼────┐   ┌──────▼──────┐
   │Razorpay │  │Google    │  │Email     │   │  Future     │
   │(Payment)│  │Maps API  │  │Service   │   │ Integrations│
   └─────────┘  └──────────┘  └──────────┘   └─────────────┘
```

**Integration Strategy:**
- **Abstraction Layer:** Service classes for each external API
- **Error Handling:** Graceful degradation if service unavailable
- **Retry Logic:** Exponential backoff for transient failures
- **Monitoring:** Log all external API calls and responses

---

## 7. Deployment Architecture

### 7.1 Production Deployment

```
┌─────────────────────────────────────────────────────┐
│                  Production Server                   │
│  (Ubuntu 22.04 LTS)                                 │
│                                                      │
│  ┌────────────────────────────────────────────────┐│
│  │            Nginx (Port 80, 443)                ││
│  │  - Reverse Proxy                               ││
│  │  - SSL Termination                             ││
│  │  - Static File Serving (Frontend)              ││
│  │  - Load Balancing                              ││
│  └─────────────────────┬──────────────────────────┘│
│                        │                           │
│  ┌─────────────────────▼──────────────────────────┐│
│  │       PM2 Process Manager                      ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      ││
│  │  │Backend #1│  │Backend #2│  │Backend #3│      ││
│  │  │(Port 5000│  │(Port 5001│  │(Port 5002│      ││
│  │  └──────────┘  └──────────┘  └──────────┘      ││
│  └─────────────────────┬──────────────────────────┘│
│                        │                            │
│  ┌─────────────────────▼──────────────────────────┐│
│  │       PostgreSQL Database (Port 5432)          ││
│  │  - ACID transactions                            ││
│  │  - Connection pooling                           ││
│  │  - Daily backups                                ││
│  └────────────────────────────────────────────────┘│
│                                                      │
│  ┌────────────────────────────────────────────────┐│
│  │       File System                               ││
│  │  /var/www/stairs-new/                          ││
│  │  ├── frontend/dist/ (Static files)              ││
│  │  └── backend/uploads/ (Certificates, Results)   ││
│  └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 7.2 CI/CD Pipeline (Future)

```
┌──────────────┐
│ Code Commit  │
│  (Git Push)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Automated     │
│  Tests       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Build         │
│(npm run build│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Deploy to     │
│ Staging      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Manual        │
│Approval      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Deploy to     │
│Production    │
└──────────────┘
```

---

## 8. Monitoring & Observability

### 8.1 Monitoring Stack

```
┌─────────────────────────────────────────┐
│          Application Layer              │
│  - PM2 monitoring                       │
│  - Application logs                     │
│  - Error tracking                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Infrastructure Layer            │
│  - Server CPU, RAM, Disk                │
│  - Network metrics                      │
│  - Nginx logs                           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Database Layer                │
│  - Query performance                    │
│  - Connection count                     │
│  - Slow query logs                      │
└─────────────────────────────────────────┘
```

---

## 9. Disaster Recovery

### 9.1 Backup Strategy

```
┌──────────────┐
│  Production  │
│   Database   │
└──────┬───────┘
       │ Daily Backup (2 AM)
       │
       ▼
┌──────────────┐
│  Local       │
│  Backup      │
│ /backups/    │
└──────┬───────┘
       │ Copy (Weekly)
       │
       ▼
┌──────────────┐
│  Remote      │
│  Storage     │
│ (Future)     │
└──────────────┘
```

**Retention Policy:**
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

---

## 10. Technology Decisions

### 10.1 Technology Stack Rationale

| Technology | Reason for Selection |
|-----------|----------------------|
| **React** | Component-based, large ecosystem, excellent performance |
| **Node.js** | JavaScript full-stack, non-blocking I/O, large community |
| **Express** | Lightweight, flexible, widely adopted |
| **PostgreSQL** | ACID compliance, relational data, robust |
| **Prisma** | Type-safe ORM, excellent migrations, developer experience |
| **PM2** | Production-ready process manager, clustering, monitoring |
| **Nginx** | High performance, reverse proxy, SSL termination |
| **Razorpay** | India-focused, easy integration, PCI DSS compliant |

---

## 11. Future Architecture Enhancements

### 11.1 Planned Improvements

1. **Microservices Architecture (Long-term)**
   - Separate services for auth, events, payments, certificates
   - Independent scaling and deployment

2. **Caching Layer**
   - Redis for session management
   - Cache frequently accessed data (events, user profiles)

3. **Message Queue**
   - RabbitMQ/Kafka for asynchronous operations
   - Certificate generation, email sending

4. **CDN Integration**
   - CloudFront/Cloudflare for static assets
   - Faster global content delivery

5. **Real-time Features**
   - WebSocket integration for live updates
   - Real-time notifications

---

## 12. Appendices

### Appendix A: Related Documents
- High-Level Design (HLD)
- Low-Level Design (LLD)
- API Reference Documentation
- Database Schema Documentation
- Deployment Guide

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Next Review:** February 2026
