# Development Guide

## Getting Started

### Option 1: Automated Setup (Recommended)

**Windows:**
```cmd
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env if needed
   npm run dev
   ```

## Environment Configuration

### Critical Settings

**Backend `.env`:**
- `JWT_SECRET`: Generate a strong secret (use: `openssl rand -base64 32`)
- `DATABASE_URL`: Leave as `file:./dev.db` for development
- `PORT`: Default 3000 (change if needed)
- `FRONTEND_URL`: Must match your frontend URL for CORS

**Frontend `.env`:**
- `VITE_BACKEND_URL`: Must match your backend URL

## Development Workflow

### Database Changes
```bash
cd backend
# Edit prisma/schema.prisma
npx prisma migrate dev --name "your_migration_name"
npx prisma generate
```

### API Development
1. Add routes in `backend/src/routes/`
2. Update middleware in `backend/src/utils/`
3. Test with Postman or frontend

### Frontend Development
1. Components in `frontend/src/components/`
2. Pages in `frontend/src/pages/`
3. API calls in `frontend/src/api.js`

## Common Issues & Solutions

### Database Issues
```bash
# Reset database
cd backend
rm prisma/dev.db
npx prisma migrate dev
```

### CORS Issues
- Check `FRONTEND_URL` in backend `.env`
- Ensure ports match between frontend and backend

### Authentication Issues
- Check `JWT_SECRET` is set
- Verify token format in requests
- Check middleware implementation

### File Upload Issues
- Check file size limits
- Ensure `uploads/` directory exists
- Verify middleware configuration

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Git Best Practices

### Before Committing
```bash
# Check what will be committed
git status

# Make sure sensitive files are ignored
git ls-files | grep -E '\.(env|db|log)$'
# Should return nothing

# Commit
git add .
git commit -m "feat: descriptive commit message"
```

### Commit Message Format
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting
- `refactor:` code restructuring
- `test:` testing
- `chore:` maintenance

## Deployment Preparation

### Environment Variables
1. **Never commit `.env` files**
2. **Set production values** for:
   - Strong `JWT_SECRET`
   - Production database URL
   - Proper CORS origins
   - Payment gateway keys

### Security Checklist
- [ ] Strong JWT secret
- [ ] Secure database credentials
- [ ] HTTPS in production
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] File upload restrictions

## API Documentation

### Authentication
- `POST /api/auth/coach/register` - Coach registration
- `POST /api/auth/coach/payment` - Payment processing
- `POST /api/auth/login` - General login

### Coach Routes
- `GET /api/coach/profile` - Get coach profile
- `POST /api/coach/students/add` - Add student manually
- `POST /api/coach/students/bulk-upload` - Bulk upload students
- `POST /api/coach/events` - Create event
- `POST /api/coach/events/:id/payment` - Pay event fee

## Database Schema

### Key Models
- `User` - Base user account
- `Coach` - Coach profile with payment status
- `Student` - Student profile
- `Event` - Events created by coaches
- `Payment` - Payment records
- `StudentCoachConnection` - Student-coach relationships

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
export PORT=3001
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Lock
```bash
# Close all database connections
# Restart the server
```

## Useful Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npx prisma studio    # Open database GUI

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview build
npm run test         # Run tests

# Database
npx prisma migrate dev    # Apply migrations
npx prisma generate       # Generate client
npx prisma studio         # Database GUI
npx prisma db seed        # Seed database
```