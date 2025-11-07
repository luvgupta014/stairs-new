# STAIRS Talent Hub - Test Suite

This directory contains comprehensive tests for the STAIRS Talent Hub application.

## Test Files

### Registration Tests

- **`registration-basic.js`** - Basic registration flow test
  - Tests creating a single user with student profile
  - Validates UID generation
  - Verifies password hashing
  - Confirms OTP creation
  - *Run:* `node tests/registration-basic.js`

- **`registration-all-types.js`** - Comprehensive multi-user registration test
  - Tests all 4 user types: Student, Coach, Institute, Club
  - Verifies each type creates proper profiles
  - Ensures unique identifiers for all roles
  - Creates OTP records for each user
  - *Run:* `node tests/registration-all-types.js`

### Utilities

- **`cleanup.js`** - Database cleanup script
  - Removes all test data entries
  - Displays database statistics
  - Safe deletion with pattern matching
  - *Run:* `node tests/cleanup.js`

- **`run.js`** - Master test runner
  - Unified interface for all tests
  - Comprehensive test suite execution
  - Test result reporting
  - *Run:* `node tests/run.js [command]`

## Quick Start

### Run All Tests
```bash
cd backend
node tests/run.js --run-all
```

### Run Specific Tests
```bash
# Basic registration test
node tests/run.js --basic

# All user types test
node tests/run.js --all

# Cleanup test data
node tests/run.js --cleanup

# Help
node tests/run.js --help
```

## Test Coverage

### User Types Tested
- ✅ Student Registration
- ✅ Coach Registration
- ✅ Institute Registration
- ✅ Club Registration

### Features Tested
- ✅ User creation with email/phone uniqueness
- ✅ Profile creation (Student/Coach/Institute/Club)
- ✅ UID generation with state codes
- ✅ Password hashing
- ✅ OTP generation and storage
- ✅ Error handling for duplicates

## Database Schema

Tests interact with the following database models:
- `User` - Base user account
- `Student` - Student profile
- `Coach` - Coach profile
- `Institute` - Institution profile
- `Club` - Club profile
- `OTPRecord` - One-time password records

## Test Data

Test data uses patterns for easy identification and cleanup:
- Email patterns: `test`, `apistudent`, `apicoach`, `apiinstitute`, `apiclub`
- Phone: Generated with unique identifiers
- Aadhaar: Auto-generated unique 12-digit numbers

Run `node tests/cleanup.js` to remove all test data after running tests.

## Important Notes

1. **Database Connection**: Tests require a valid `DATABASE_URL` in `.env`
2. **Prisma Setup**: Ensure Prisma schema is in sync with database: `npx prisma db push`
3. **Email Service**: Email sending may fail gracefully if not configured
4. **Test Isolation**: Tests are independent and can run in any order
5. **Data Cleanup**: Always run cleanup after tests to maintain clean database

## Results

All tests generate detailed console output with:
- ✅ Success indicators
- ❌ Error messages
- 📊 Statistics and counters
- 🎯 Summary reports

## Troubleshooting

### Tests Fail with "Column Does Not Exist"
```bash
# Sync Prisma schema with database
npx prisma db push
```

### Unique Constraint Errors
```bash
# Clean up test data first
node tests/cleanup.js

# Then run tests again
node tests/run.js --run-all
```

### Connection Issues
- Verify `DATABASE_URL` is set in `.env`
- Check PostgreSQL connection is active
- Ensure database exists

## Adding New Tests

1. Create a new file: `tests/new-test.js`
2. Follow the pattern of existing tests
3. Export or use the standard async/await pattern
4. Add entry to `run.js` for easy execution
5. Document in this README
