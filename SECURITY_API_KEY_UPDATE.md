# After getting your NEW API key from Google Cloud Console:

# 1. Update frontend/.env
VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_RESTRICTED_API_KEY_HERE

# 2. Update backend/.env  
GOOGLE_MAPS_API_KEY=YOUR_NEW_RESTRICTED_API_KEY_HERE

# 3. Update production server files with the same NEW key

# 4. Test locally:
cd frontend && npm run dev
cd backend && npm run dev

# 5. Deploy to production server