# Backend Testing Directory

This directory contains all testing scripts and utilities for the Stairs application backend. Tests are organized into subdirectories by purpose.

## Directory Structure

```
testing/
├── scripts/          # Automated test scripts (run with: node filename.js)
├── manual/           # Manual testing and verification scripts
├── debug/            # Debugging and diagnostic scripts
└── README.md         # This file
```

## Subdirectories

### `/scripts` - Automated Test Scripts

Tests that can be run automatically to verify functionality. These scripts typically:
- Create test data
- Send API requests
- Verify database state
- Clean up after themselves

**Files:**
- `test-file-upload.js` - Tests event result file upload with login flow
- `test-upload-simple.js` - Simplified file upload test for quick verification
- `check-uploaded-files.js` - Queries database to verify uploaded files exist
- `check-upload-config.js` - Validates upload directory configuration

**Usage:**
```bash
cd backend
node testing/scripts/test-file-upload.js
node testing/scripts/check-uploaded-files.js
```

### `/manual` - Manual Testing Scripts

Tests for complex scenarios or endpoints that require manual verification. These scripts:
- Test multiple endpoints
- Require manual token setup or configuration
- Test business logic scenarios

**Files:**
- `test-certificate-endpoints.js` - Tests certificate API endpoints (requires valid token)
- `test-cert-fix.js` - Verifies certificate query logic and event registration data

**Usage:**
```bash
cd backend
node testing/manual/test-certificate-endpoints.js
node testing/manual/test-cert-fix.js
```

### `/debug` - Debugging and Diagnostic Scripts

Scripts for troubleshooting and understanding system state. These are useful for:
- Inspecting database records
- Checking configuration
- Understanding data relationships

**Files:**
- `debug-event-lookup.js` - Lists all events and verifies uniqueId resolution

**Usage:**
```bash
cd backend
node testing/debug/debug-event-lookup.js
```

## Running Tests

### Prerequisites
1. Ensure backend is running: `npm run dev` (should be running on port 5000)
2. Database must be set up with migrations applied
3. Test data should exist (Asian Games 2025 event with ID: `cmho5esr70005u80opklr4qne`)

### Quick Test Suite
Run these in order to verify basic functionality:

```bash
# 1. Check configuration
node testing/scripts/check-upload-config.js

# 2. Debug event lookup
node testing/debug/debug-event-lookup.js

# 3. Test file upload
node testing/scripts/test-upload-simple.js

# 4. Verify uploaded files
node testing/scripts/check-uploaded-files.js

# 5. Test certificates
node testing/manual/test-cert-fix.js
```

## Key Test Scenarios

### File Upload Testing
Tests the complete flow of uploading event result files:
1. Coach login
2. Create test CSV file
3. Upload via multipart FormData
4. Verify file stored in filesystem
5. Verify entry in database

### Event Lookup Testing
Verifies that events can be looked up by:
- Database ID (CUID format)
- Unique ID (EVT-XXXX-XX-XX-XXXXXX format)
- All event IDs properly resolved

### Certificate Testing
Tests certificate-related database queries:
- Eligible students retrieval
- Issued certificates lookup
- Event registration verification

## Troubleshooting

### File Upload Fails with "Unexpected end of form"
- Check that express-fileupload is only on /api/coach routes, not global
- Verify multer middleware is properly configured
- Ensure Content-Type header is not set to 'application/json' for FormData

### Event Not Found
- Run `debug-event-lookup.js` to see all available events
- Verify correct event ID format (either database ID or uniqueId)
- Check that event exists in database

### Database Connection Failed
- Verify DATABASE_URL is set in .env file
- Ensure PostgreSQL is running
- Check database migrations have been applied: `npx prisma migrate dev`

## Adding New Tests

When adding new test files:

1. **For automated tests:** Place in `/scripts` with comments explaining what it tests
2. **For manual tests:** Place in `/manual` with requirements documented
3. **For debugging:** Place in `/debug` with clear output showing what's being checked
4. **Update this README** with description and usage instructions

## Test File Format

All test files should include:
```javascript
/**
 * Description of what this test does
 */

const axios = require('axios');
// or
const { PrismaClient } = require('@prisma/client');

// Clear documentation of purpose
console.log('🧪 Testing: [Feature Name]...\n');

// Test logic with clear logging
// Use emojis for visual clarity:
// ✅ Success
// ❌ Failure
// 🧪 Testing
// 📤 Upload
// 📋 Query
// 🔍 Debug
// 🧹 Cleanup
```

## Related Documentation

- Main README: `../../README.md`
- Testing Guide: `../../E2E_TESTING_GUIDE.md`
- Backend README: `../README.md`
- Prisma Schema: `../prisma/schema.prisma`
- API Routes: `../src/routes/`

---

**Last Updated:** Current session
**Maintained by:** Development Team
