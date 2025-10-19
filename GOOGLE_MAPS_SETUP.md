# Google Maps Integration for Venue Selection

## Overview

The EventCreate component supports Google Maps Places API for intelligent venue selection, with graceful fallback to manual entry when the API is unavailable.

## Current Status ⚠️

**API Activation Required**: Based on the error logs, the Google Maps APIs need to be properly activated in your Google Cloud Console.

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **Enable the following APIs** (THIS IS CRITICAL):
   - ✅ **Maps JavaScript API**
   - ✅ **Places API (New)**
   - ✅ **Geocoding API** (optional but recommended)

4. Create credentials (API Key)
5. Configure API key restrictions:
   - **Application restrictions**: HTTP referrers
   - **Add**: `http://localhost:*/*` for development
   - **Add**: Your production domain when deployed

### 2. API Key Configuration

1. Copy your Google Maps API key
2. Open `frontend/.env` file
3. Replace the placeholder with your actual API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_crL09bZixZMgRrZrQDNwPvInhD2a13Y
   ```

### 3. Enable Billing (Required for Production)

⚠️ **Important**: Google Maps APIs require billing to be enabled, even for the free tier.

1. Go to **Billing** in Google Cloud Console
2. Link a payment method
3. Monitor usage in the **API & Services** → **Quotas** section

### 4. API Quotas and Limits

- **Free tier**: $200 credit per month
- **Places Autocomplete**: $2.83 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Maps JavaScript API**: $7 per 1,000 loads

## Current Implementation Features

### 🔄 Graceful Fallbacks
- If Google Maps fails to load → Manual entry mode
- If Places API is unavailable → Standard input fields
- Clear user feedback about current mode

### 🎯 Smart Search (When Available)
- Real-time venue suggestions
- Automatic address completion
- Precise coordinates extraction
- Structured address components

### 📝 Manual Entry Mode
- Always available as fallback
- All required fields can be entered manually
- Form validation ensures complete venue information

## Troubleshooting

### Error: "ApiNotActivatedMapError"
**Solution**: 
1. Go to Google Cloud Console
2. Navigate to **APIs & Services** → **Library**
3. Search for and enable:
   - Maps JavaScript API
   - Places API (New)
4. Wait 5-10 minutes for activation
5. Restart your frontend server

### Error: "Google Maps Places API not available"
**Solutions**:
1. Check that Places API is enabled in Google Cloud Console
2. Verify billing is enabled
3. Check API key has proper permissions
4. Test with a simple Places API request

### Console Warnings About Deprecated API
Google is transitioning from `google.maps.places.Autocomplete` to `google.maps.places.PlaceAutocompleteElement`. Our implementation:
- ✅ Handles both old and new APIs
- ✅ Shows deprecation warnings but continues to work
- ✅ Will be updated to new API when fully available

## Current Behavior

### When Google Maps Works:
- ✅ Type venue names → See suggestions
- ✅ Select from dropdown → Auto-fill address
- ✅ Green indicators show smart search is active

### When Google Maps Fails:
- ⚠️ Yellow warning shows manual mode
- ✅ All fields still work for manual entry
- ✅ Form validation ensures complete information
- ✅ Events can still be created successfully

## Testing the Setup

1. **Check Console Logs**: Look for initialization messages
2. **Test Venue Field**: Type "stadium" or "sports complex"
3. **Verify Status**: Look for "Smart search enabled" or "Manual entry mode"
4. **Create Event**: Should work regardless of Google Maps status

## Production Recommendations

1. **Domain Restrictions**: Limit API key to your production domain
2. **Usage Monitoring**: Set up billing alerts in Google Cloud
3. **Error Handling**: Current implementation handles all failure modes
4. **Performance**: Consider caching frequently used venues

## Migration to New API (Future)

Google recommends migrating to `PlaceAutocompleteElement`. This will be implemented when:
- The new API becomes stable
- Documentation is complete
- Migration benefits outweigh current functionality