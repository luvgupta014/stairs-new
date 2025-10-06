# STAIRS Talent Hub Backend

Backend API for the STAIRS Talent Hub MVP built with Node.js and Express.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (for production database)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
copy .env.example .env
```

Edit the `.env` file with your specific configuration:
- Set your `JWT_SECRET` to a secure random string
- Configure your `DATABASE_URL` for PostgreSQL connection
- Adjust `PORT` if needed (default: 5000)

### 3. Run the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` with auto-reload enabled via nodemon.

### 4. Run in Production Mode

```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Root
- `GET /` - API information and status

## Project Structure

```
backend/
├── src/
│   ├── index.js          # Main server file
│   ├── routes/           # API routes
│   ├── controllers/      # Route handlers
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   │   └── authMiddleware.js  # JWT authentication
│   ├── prisma/           # Database schema and migrations
│   └── tests/            # Test files
├── package.json          # Dependencies and scripts
├── .env.example          # Environment variables template
└── README.md            # This file
```

## Authentication

The backend includes JWT authentication utilities in `src/utils/authMiddleware.js`:

- `authenticateToken` - Middleware to protect routes
- `generateToken` - Create JWT tokens
- `verifyToken` - Verify JWT tokens
- `optionalAuth` - Optional authentication for public routes

## Environment Variables

Key environment variables (see `.env.example`):

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ALLOWED_ORIGINS` - CORS allowed origins

## Next Steps

1. Set up database schema with Prisma
2. Implement authentication routes
3. Add API routes for talent hub features
4. Add input validation and error handling
5. Write unit and integration tests
6. Set up CI/CD pipeline

## Support

For questions or issues, please refer to the project documentation or contact the development team.