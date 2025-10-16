# STAIRS Talent Hub

A comprehensive sports talent management platform connecting students, coaches, institutes, and clubs.
Hosted link - http://160.187.22.41:3008/

## Project Structure

```
├── backend/          # Node.js + Express API server
├── frontend/         # React + Vite frontend application
├── .gitignore        # Root git ignore rules
└── README.md         # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Stairs-new
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   # Add your JWT_SECRET, DATABASE_URL, etc.
   
   # Setup database
   npx prisma migrate dev
   npx prisma generate
   
   # Start development server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create environment file
   echo "VITE_BACKEND_URL=http://localhost:3000" > .env
   
   # Start development server
   npm run dev
   ```

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (generate a strong secret)
JWT_SECRET="your-jwt-secret-here"

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10MB

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend (.env)
```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:3000

# Environment
VITE_NODE_ENV=development
```

## Important Security Notes

⚠️ **Never commit these files:**
- `.env` files (contain sensitive data)
- `node_modules/` (dependency folders)
- Database files (`*.db`, `*.sqlite`)
- Build outputs (`dist/`, `build/`)
- Log files (`*.log`)

✅ **Safe to commit:**
- `.env.example` (template without secrets)
- Source code files
- Configuration files (without secrets)
- Documentation

## Development Workflow

1. **Database changes**: Edit `backend/prisma/schema.prisma` then run `npx prisma migrate dev`
2. **API changes**: Update routes in `backend/src/routes/`
3. **Frontend changes**: Update components in `frontend/src/`

## Git Workflow

```bash
# Add your changes (gitignore will exclude sensitive files)
git add .

# Commit your changes
git commit -m "Your commit message"

# Push to repository
git push origin main
```

## Key Features

- 🏫 **Multi-role system**: Students, Coaches, Institutes, Clubs, Admins
- 💳 **Payment integration**: Razorpay for registrations and events
- 📊 **Analytics dashboard**: Role-specific insights
- 📁 **File uploads**: Bulk student data, documents
- 🔐 **Secure authentication**: JWT-based auth with role-based access
- 📱 **Responsive design**: Works on desktop and mobile

## Tech Stack

**Backend:**
- Node.js + Express
- Prisma ORM + SQLite
- JWT Authentication
- File Upload handling

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- React Router
- Axios for API calls

## Support

For development questions or issues, check:
1. Console logs for errors
2. Network tab for API issues  
3. `.env` configuration
4. Database connection

---

**Note**: This is a development setup. For production, ensure proper environment configuration and security measures.
