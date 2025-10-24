# 🚀 STAIRS Project - Railway Deployment Checklist

## Prerequisites ✅
- [x] GitHub account
- [ ] Railway account (signup at railway.app)
- [x] Project ready with environment variables

## Deployment Steps

### 1. 🔧 Prepare Repository
```bash
# Commit deployment files (run in project root)
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. 🚂 Deploy Backend on Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up
2. **New Project**: Click "Start a New Project"
3. **Connect GitHub**: Choose "Deploy from GitHub repo"
4. **Select Repository**: Choose your `stairs-new` repository
5. **Configure Service**:
   - Service Name: `stairs-backend`
   - Root Directory: `/backend`
   - Build Command: `npm run build`
   - Start Command: `npm start`

### 3. 🗄️ Setup Database
1. **Add PostgreSQL**: In Railway dashboard, click "+" → "Database" → "PostgreSQL"
2. **Auto-connect**: Railway will automatically set `DATABASE_URL`

### 4. ⚙️ Backend Environment Variables
In Railway dashboard → Backend Service → Variables, add:

```bash
# Core Settings
NODE_ENV=production
PORT=5000

# JWT (generate a strong secret!)
JWT_SECRET=your_super_secure_jwt_secret_here_change_this
JWT_EXPIRES_IN=7d

# Payments
RAZORPAY_KEY_ID=rzp_test_R72yQ8cKrLWlkY
RAZORPAY_KEY_SECRET=SniDDw7MXDkvMKTcbPLEbFPH

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=luvgupta123465@gmail.com
EMAIL_PASS=khgfnbcbijqgbjdw

# File Upload
MAX_FILE_SIZE=5000000
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (update after frontend deployment)
FRONTEND_URL=https://your-frontend-url.railway.app
```

### 5. 🌐 Deploy Frontend
1. **Add New Service**: In same Railway project, click "+" → "GitHub Repo"
2. **Configure Service**:
   - Service Name: `stairs-frontend`
   - Root Directory: `/frontend`
   - Build Command: `npm run build`
   - Start Command: `npm run preview`

### 6. ⚙️ Frontend Environment Variables
In Railway dashboard → Frontend Service → Variables:

```bash
# Backend API (use your Railway backend URL)
VITE_BACKEND_URL=https://your-backend-url.railway.app

# Payments
VITE_RAZORPAY_KEY_ID=rzp_test_R72yQ8cKrLWlkY

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_crL09bZixZMgRrZrQDNwPvInhD2a13Y
```

### 7. 🔄 Update CORS Settings
1. **Get Frontend URL**: Copy your frontend Railway URL
2. **Update Backend**: In backend variables, set `FRONTEND_URL` to your frontend URL
3. **Redeploy**: Railway will auto-redeploy backend

### 8. 🗃️ Database Setup
1. **Access Railway Console**: Backend service → "Connect" → "Railway CLI"
2. **Run Migrations**:
   ```bash
   npx prisma db push
   ```

### 9. ✅ Test Deployment
Test these features in order:
- [ ] **Health Check**: Visit `https://your-backend-url.railway.app/health`
- [ ] **Frontend Loading**: Visit your frontend URL
- [ ] **User Registration**: Create a test account
- [ ] **Login**: Test authentication
- [ ] **File Upload**: Test event result upload (as coach)
- [ ] **Admin Panel**: Test admin file viewing
- [ ] **Payment Flow**: Test Razorpay integration

### 10. 🎯 Production Checklist
- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Verify all API endpoints work
- [ ] Test file upload/download functionality
- [ ] Confirm payment integration works
- [ ] Check admin panel accessibility
- [ ] Verify email notifications work
- [ ] Test on mobile devices

## 🔗 Useful Railway Commands
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# View logs
railway logs

# Connect to database
railway connect <database-service-name>
```

## 🆘 Troubleshooting
- **Build Failures**: Check Railway logs for detailed errors
- **Database Issues**: Ensure DATABASE_URL is set correctly
- **CORS Errors**: Verify FRONTEND_URL matches your frontend domain
- **File Upload Issues**: Check if uploads directory is created
- **Payment Errors**: Verify Razorpay credentials in both frontend and backend

## 📞 Support
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Your Repository: [github.com/luvgupta014/stairs-new](https://github.com/luvgupta014/stairs-new)

---
**Note**: After deployment, your event result upload system will work exactly as it does locally! 🎉