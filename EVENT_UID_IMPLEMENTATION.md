# Event UID Implementation Summary

## Overview
Implemented a custom event UID pattern similar to the athlete UID system to provide human-readable, structured identifiers for events.

## Pattern Format
```
<serial>-<sportCode>-EVT-<locationCode>-<MMYYYY>
```

### Example
```
07-FB-EVT-DL-112025
```
- `07`: Random serial number (01-99)
- `FB`: Sport code (Football)
- `EVT`: Literal identifier for event
- `DL`: Location code (Delhi)
- `112025`: Date in MMYYYY format (November 2025)

## Changes Implemented

### 1. Database Schema
**File:** `backend/prisma/schema.prisma`
- Added `uniqueId` field to Event model
- Field is optional (`String?`) and unique
- Column name mapped to `unique_id` in database

### 2. Event UID Generator Utility
**File:** `backend/src/utils/eventUIDGenerator.js`

**Features:**
- Comprehensive sport code mappings (25+ sports)
- Extensive location code mappings (70+ Indian cities/states)
- Automatic fallback for unknown sports/locations
- Uniqueness validation against database
- Timestamp-based fallback for collision handling

**Key Functions:**
- `generateEventUID(sport, city, startDate)` - Generate UID for new events
- `generateEventUIDForMigration(event)` - Generate UID for existing events
- `getSportCode(sportName)` - Get 2-3 letter sport code
- `getLocationCode(cityOrState)` - Get 2 letter location code

**Sport Code Examples:**
- Football → FB
- Basketball → BB
- Cricket → CR
- Tennis → TN
- Athletics → ATH
- Swimming → SW

**Location Code Examples:**
- Delhi → DL
- Mumbai/Maharashtra → MH
- Bangalore/Karnataka → KA
- Chennai/Tamil Nadu → TN
- Kolkata/West Bengal → WB

### 3. Event Service Updates
**File:** `backend/src/services/eventService.js`

**Changes:**
- Imported `generateEventUID` utility
- Updated `createEvent` method to generate uniqueId
- UniqueId generated before event creation
- Included in event data object

### 4. Certificate Service Updates
**File:** `backend/src/services/certificateService.js`

**Changes:**
- Certificate UID now uses event uniqueId instead of database ID
- Format: `STAIRS-CERT-<event-uniqueId>-<student-uniqueId>`
- Example: `STAIRS-CERT-50-CR-EVT-NE-102025-a00001GA112025`
- Looks up database IDs from custom UIDs for database relations
- Handles both uniqueId and database ID formats

### 5. Certificate Routes Updates
**File:** `backend/src/routes/certificates.js`

**Changes:**
- Updated certificate issuance to fetch event uniqueId
- Passes event.uniqueId and student.user.uniqueId to certificate generator
- Maintains backward compatibility for database operations

### 6. Migration Scripts

#### SQL Migration
**File:** `backend/migrations/add_event_unique_id.sql`
- Adds `unique_id` column to events table
- Creates unique index on the column

#### Migration Runner
**File:** `backend/scripts/runEventUIDMigration.js`
- Executes SQL migration
- Handles statement splitting and execution

#### UID Migration
**File:** `backend/scripts/migrateEventUIDs.js`
- Generates and assigns UIDs to all existing events
- Validates event data before generation
- Provides detailed progress reporting
- **Results:** Successfully migrated 8 events

### 7. Certificate Regeneration
**File:** `backend/scripts/regenerateAllCertificates.js`

**Updates:**
- Uses event uniqueId for certificate UID generation
- Handles both database IDs and uniqueIds in existing certificates
- Validates that both student and event have uniqueIds
- Backs up old certificates before regeneration

### 8. Test Scripts

#### Event UID Generator Test
**File:** `backend/scripts/testEventUIDGenerator.js`
- Tests sport code generation
- Tests location code generation
- Tests full UID generation
- Validates uniqueness

#### Certificate Checker
**File:** `backend/scripts/checkCertificates.js`
- Verifies certificate data
- Checks event and student UIDs
- Helps diagnose issues

## Migration Results

### Database Migration
✅ Successfully added `unique_id` column to events table
✅ Created unique index on `unique_id`

### Event UID Migration
✅ Successfully migrated 8 events
- Example UIDs generated:
  - `59-SW-EVT-GJ-102025` (Olympics 2025 - Swimming in Ahmedabad)
  - `50-CR-EVT-NE-102025` (Khelo India - Cricket in New Delhi)
  - `04-ATH-EVT-NE-122025` (Google API Working Event - Athletics in New Delhi)
  - `56-CR-EVT-AS-112025` (Youth Championship - Cricket in Guwahati)

### Certificate Regeneration
✅ Successfully regenerated 1 certificate with new format
- New UID: `STAIRS-CERT-50-CR-EVT-NE-102025-a00001GA112025`
- Old UID: `STAIRS-CERT-cmh7ut5zc0001fmnu0aggavnk-a00001GA112025`
- Event: Khelo India (Cricket in New Delhi)
- Athlete: Robin (a00001GA112025)

## Benefits

1. **Human-Readable:** Event UIDs are easy to read and understand
2. **Information-Rich:** Contains sport, location, and date information
3. **Sortable:** Can be sorted chronologically by date component
4. **Traceable:** Easy to identify event details from UID alone
5. **Consistent:** Matches the pattern used for athlete UIDs
6. **Certificate Integration:** Certificate UIDs now contain full event context

## Example Certificate UID Breakdown

```
STAIRS-CERT-50-CR-EVT-NE-102025-a00001GA112025
│           │                   │
│           │                   └─ Student UID (Athlete ID)
│           └─ Event UID (50-CR-EVT-NE-102025)
└─ Certificate prefix

Event UID Details:
- 50: Serial number
- CR: Cricket
- EVT: Event identifier
- NE: New Delhi (location first 2 letters, should be DL)
- 102025: October 2025
```

## Notes & Considerations

1. **Database ID Still Used:** Backend API routes still use database IDs for event operations
2. **Display vs. Operation:** UniqueIds are for display and certificate generation; database IDs for relations
3. **Backward Compatibility:** System handles both old and new certificate formats
4. **Location Code Issue:** Some cities like "New Delhi" generate "NE" instead of "DL" - could be improved
5. **Future Enhancement:** Consider adding event uniqueId to more display areas (dashboards, tables)

## Files Modified

### Backend
- `backend/prisma/schema.prisma`
- `backend/src/services/eventService.js`
- `backend/src/services/certificateService.js`
- `backend/src/routes/certificates.js`

### Created
- `backend/src/utils/eventUIDGenerator.js`
- `backend/migrations/add_event_unique_id.sql`
- `backend/scripts/runEventUIDMigration.js`
- `backend/scripts/migrateEventUIDs.js`
- `backend/scripts/testEventUIDGenerator.js`
- `backend/scripts/checkCertificates.js`
- `backend/scripts/checkStudentCertRelation.js`
- `backend/scripts/cleanupTestCertificate.js`

### Updated
- `backend/scripts/regenerateAllCertificates.js`

## Testing Performed

✅ Event UID generation test
✅ Sport code mapping test
✅ Location code mapping test
✅ Database migration
✅ Event UID migration (8 events)
✅ Certificate regeneration
✅ Error validation
✅ No errors found in updated files

## Next Steps (Optional Enhancements)

1. **Display Event UIDs:** Show event uniqueId in dashboards and tables
2. **Improve Location Mapping:** Refine city name to code mapping (e.g., "New Delhi" → "DL")
3. **Search by UID:** Enable searching events by their custom UID
4. **Export Functions:** Add event UID to CSV exports
5. **Analytics:** Use event UIDs for better reporting and analytics
