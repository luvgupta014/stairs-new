# Deployment Guide for STAIRS Talent Hub

## Railway Deployment Steps

### 1. Prerequisites
- GitHub account with this repository
- Railway account (free signup at railway.app)

### 2. Backend Deployment
1. Go to railway.app and click "Start a New Project"
2. Connect your GitHub repository
3. Select "Deploy from GitHub repo" → Choose your stairs-new repository
4. Choose to deploy the backend service first
5. Set the root directory to `/backend`

### 3. Environment Variables (Backend)
Add these in Railway dashboard → Your Service → Variables:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=<Railway will auto-generate PostgreSQL URL>
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_R72yQ8cKrLWlkY
RAZORPAY_KEY_SECRET=SniDDw7MXDkvMKTcbPLEbFPH
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=luvgupta123465@gmail.com
EMAIL_PASS=khgfnbcbijqgbjdw
MAX_FILE_SIZE=5000000
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=<Will be set after frontend deployment>
```

### 4. Frontend Deployment
1. Create another service in same project
2. Deploy frontend with root directory `/frontend`
3. Set build command: `npm run build`
4. Set start command: `npm run preview` or use static hosting

### 5. Environment Variables (Frontend)
```
VITE_BACKEND_URL=<Your Railway backend URL>
VITE_RAZORPAY_KEY_ID=rzp_test_R72yQ8cKrLWlkY
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_crL09bZixZMgRrZrQDNwPvInhD2a13Y
```

### 6. Database Setup
- Railway will automatically create PostgreSQL database
- Run migrations: `npx prisma db push` in Railway console
- Or use GitHub Actions for automated deployment

### 7. Post-Deployment
1. Update FRONTEND_URL in backend variables with your frontend URL
2. Update VITE_BACKEND_URL in frontend variables with your backend URL
3. Test all functionality:
   - User registration/login
   - File uploads
   - Payment integration
   - Admin panel

## Custom Domain (Optional)
- Go to Railway dashboard → Your service → Settings → Domains
- Add your custom domain
- Update CORS settings in backend if needed

## Monitoring
- Railway provides logs and metrics
- Monitor file uploads and database usage
- Set up alerts for errors

## Troubleshooting
- Check Railway logs for errors
- Ensure all environment variables are set
- Verify database connection
- Check CORS settings for frontend-backend communication