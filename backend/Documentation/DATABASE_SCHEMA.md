# STAIRS Platform - Database Schema Reference# STAIRS Platform - Database Schema Reference



## Database: PostgreSQL## Database: PostgreSQL with Prisma ORM



------



## Core Tables## Core Tables



### Users### Users

Primary user authentication table for all roles.Primary user authentication table for all roles.



```sql**Columns:**

CREATE TABLE "User" (- `id` (UUID, PK): Unique identifier

  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),- `email` (String, Unique): User email address

  email           VARCHAR(255) UNIQUE NOT NULL,- `phone` (String, Unique): User phone number

  phone           VARCHAR(20) UNIQUE,- `password` (String): Bcrypt hashed password

  password        VARCHAR(255) NOT NULL,  -- bcrypt hashed- `role` (Enum): STUDENT | COACH | INSTITUTE | CLUB | ADMIN

  role            ENUM('STUDENT', 'COACH', 'INSTITUTE', 'CLUB', 'ADMIN') NOT NULL,- `uniqueId` (String): Role-specific unique identifier

  uniqueId        VARCHAR(50) UNIQUE NOT NULL,- `isVerified` (Boolean): Email/phone verification status

  isVerified      BOOLEAN DEFAULT false,- `createdAt` (DateTime): Account creation timestamp

  isActive        BOOLEAN DEFAULT true,- `updatedAt` (DateTime): Last update timestamp

  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updatedAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP**Relationships:**

);- One-to-one with Student, Coach, Institute, Club, or Admin based on role

```

---

**Indexes:**

- `idx_user_email` on `email`### Students

- `idx_user_phone` on `phone`Student profile information.

- `idx_user_unique_id` on `uniqueId`

- `idx_user_role` on `role`**Columns:**

- `id` (UUID, PK)

---- `userId` (UUID, FK → Users.id)

- `name` (String): Full name

### Student- `dob` (Date): Date of birth

Student profile information.- `gender` (String): Gender

- `aadhaar` (String): Aadhaar number

```sql- `school` (String): School/college name

CREATE TABLE "Student" (- `primarySport` (String): Primary sport

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),- `secondarySport` (String, Optional)

  userId              UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,- `tertiarySport` (String, Optional)

  name                VARCHAR(255) NOT NULL,- `profileCompletion` (Int): Completion percentage (0-100)

  dateOfBirth         DATE,- `createdAt` (DateTime)

  aadhaarNumber       VARCHAR(12),- `updatedAt` (DateTime)

  school              VARCHAR(255),

  primarySport        VARCHAR(100),**Relationships:**

  secondarySport      VARCHAR(100),- Belongs to one User

  tertiarySport       VARCHAR(100),- Many-to-many with Coaches (via StudentCoachConnection)

  state               VARCHAR(100),- Has many EventRegistrations

  city                VARCHAR(100),- Has many Certificates

  pincode             VARCHAR(10),

  profileCompletion   INTEGER DEFAULT 0,  -- 0-100---

  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP### Coaches

);Coach profile and subscription information.

```

**Columns:**

**Indexes:**- `id` (UUID, PK)

- `idx_student_user_id` on `userId`- `userId` (UUID, FK → Users.id)

- `idx_student_primary_sport` on `primarySport`- `name` (String): Full name

- `specialization` (String): Sport specialization

---- `experience` (Int): Years of experience

- `qualification` (String): Coaching qualifications

### Coach- `paymentStatus` (Enum): PENDING | SUCCESS | EXPIRED

Coach profile information.- `subscriptionType` (Enum): MONTHLY | ANNUAL

- `subscriptionExpiry` (DateTime): Subscription end date

```sql- `razorpayOrderId` (String, Optional)

CREATE TABLE "Coach" (- `razorpayPaymentId` (String, Optional)

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),- `createdAt` (DateTime)

  userId              UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,- `updatedAt` (DateTime)

  name                VARCHAR(255) NOT NULL,

  specialization      VARCHAR(255),**Relationships:**

  experience          INTEGER,  -- years- Belongs to one User

  state               VARCHAR(100),- Has many Events

  city                VARCHAR(100),- Many-to-many with Students (via StudentCoachConnection)

  paymentStatus       ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',- Has many EventOrders

  subscriptionType    ENUM('MONTHLY', 'ANNUAL'),

  subscriptionExpiry  DATE,---

  paymentId           VARCHAR(255),

  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,### Institutes

  updatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMPEducational institution profiles.

);

```**Columns:**

- `id` (UUID, PK)

**Indexes:**- `userId` (UUID, FK → Users.id)

- `idx_coach_user_id` on `userId`- `name` (String): Institution name

- `idx_coach_payment_status` on `paymentStatus`- `address` (String): Full address

- `idx_coach_subscription_expiry` on `subscriptionExpiry`- `city` (String)

- `state` (String)

---- `pincode` (String)

- `principalName` (String): Principal/Head name

### Institute- `contactPerson` (String)

Institute/school profile.- `paymentStatus` (Enum): PENDING | SUCCESS | EXPIRED

- `createdAt` (DateTime)

```sql- `updatedAt` (DateTime)

CREATE TABLE "Institute" (

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),**Relationships:**

  userId              UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,- Belongs to one User

  name                VARCHAR(255) NOT NULL,- Has many Events

  type                VARCHAR(100),  -- School, College, Academy

  address             TEXT,---

  state               VARCHAR(100),

  city                VARCHAR(100),### Clubs

  pincode             VARCHAR(10),Sports club profiles.

  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP**Columns:**

);- `id` (UUID, PK)

```- `userId` (UUID, FK → Users.id)

- `name` (String): Club name

---- `address` (String)

- `city` (String)

### Club- `state` (String)

Sports club profile.- `sport` (String): Primary sport

- `paymentStatus` (Enum): PENDING | SUCCESS | EXPIRED

```sql- `createdAt` (DateTime)

CREATE TABLE "Club" (- `updatedAt` (DateTime)

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  userId              UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,**Relationships:**

  name                VARCHAR(255) NOT NULL,- Belongs to one User

  sport               VARCHAR(100),- Has many Events

  address             TEXT,

  state               VARCHAR(100),---

  city                VARCHAR(100),

  pincode             VARCHAR(10),### Events

  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,Sports events created by coaches/institutes/clubs.

  updatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);**Columns:**

```- `id` (UUID, PK)

- `uniqueId` (String, Unique): EVT-XXXX-SPORT-STATE-MMYYYY

---- `name` (String): Event name

- `sport` (String): Sport type

### Event- `venue` (String): Venue name

Sports event/tournament details.- `address` (String): Full address

- `city` (String)

```sql- `state` (String)

CREATE TABLE "Event" (- `startDate` (DateTime): Event start (stored in UTC)

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),- `endDate` (DateTime): Event end (stored in UTC)

  uniqueId            VARCHAR(100) UNIQUE NOT NULL,  -- EVT-001-CRICKET-MH-122025- `participantLimit` (Int): Maximum participants

  name                VARCHAR(255) NOT NULL,- `currentParticipants` (Int): Current registration count

  sport               VARCHAR(100) NOT NULL,- `description` (Text): Event description

  description         TEXT,- `status` (Enum): PENDING | APPROVED | ACTIVE | COMPLETED | CANCELLED | REJECTED

  startDate           TIMESTAMP NOT NULL,  -- Stored as UTC- `adminNotes` (Text, Optional): Admin moderation notes

  endDate             TIMESTAMP NOT NULL,   -- Stored as UTC- `creatorType` (Enum): COACH | INSTITUTE | CLUB

  venue               VARCHAR(255),- `coachId` (UUID, FK → Coaches.id, Optional)

  city                VARCHAR(100),- `instituteId` (UUID, FK → Institutes.id, Optional)

  state               VARCHAR(100),- `clubId` (UUID, FK → Clubs.id, Optional)

  latitude            DECIMAL(10, 8),- `createdAt` (DateTime)

  longitude           DECIMAL(11, 8),- `updatedAt` (DateTime)

  participantLimit    INTEGER,

  currentParticipants INTEGER DEFAULT 0,**Relationships:**

  status              ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED') DEFAULT 'PENDING',- Belongs to one Coach/Institute/Club

  coachId             UUID REFERENCES "Coach"(id) ON DELETE SET NULL,- Has many EventRegistrations

  instituteId         UUID REFERENCES "Institute"(id) ON DELETE SET NULL,- Has many EventOrders

  clubId              UUID REFERENCES "Club"(id) ON DELETE SET NULL,- Has many EventResultFiles

  adminNotes          TEXT,- Has many Certificates

  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP---

);

```### EventRegistrations

Student registrations for events.

**Indexes:**

- `idx_event_unique_id` on `uniqueId`**Columns:**

- `idx_event_status` on `status`- `id` (UUID, PK)

- `idx_event_sport` on `sport`- `eventId` (UUID, FK → Events.id)

- `idx_event_start_date` on `startDate`- `studentId` (UUID, FK → Students.id)

- `idx_event_state` on `state`- `status` (Enum): PENDING | CONFIRMED | CANCELLED

- `idx_event_coach_id` on `coachId`- `registeredAt` (DateTime)

- `updatedAt` (DateTime)

**Constraints:**

- Must have exactly one of: `coachId`, `instituteId`, or `clubId`**Relationships:**

- `endDate` must be after `startDate`- Belongs to one Event

- `participantLimit` must be > 0- Belongs to one Student



------



### EventRegistration### StudentCoachConnection

Student registration for events.Many-to-many relationship between students and coaches.



```sql**Columns:**

CREATE TABLE "EventRegistration" (- `id` (UUID, PK)

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),- `studentId` (UUID, FK → Students.id)

  eventId             UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,- `coachId` (UUID, FK → Coaches.id)

  studentId           UUID NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,- `status` (Enum): PENDING | ACCEPTED | REJECTED

  status              ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING',- `requestedBy` (Enum): STUDENT | COACH

  registeredAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,- `createdAt` (DateTime)

  cancelledAt         TIMESTAMP,- `updatedAt` (DateTime)

  UNIQUE(eventId, studentId)

);**Relationships:**

```- Belongs to one Student

- Belongs to one Coach

**Indexes:**

- `idx_event_registration_event_id` on `eventId`---

- `idx_event_registration_student_id` on `studentId`

- `idx_event_registration_status` on `status`### EventOrders

Orders for certificates, medals, and trophies.

---

**Columns:**

### StudentCoachConnection- `id` (UUID, PK)

Student-coach relationship.- `eventId` (UUID, FK → Events.id)

- `coachId` (UUID, FK → Coaches.id, Optional)

```sql- `instituteId` (UUID, FK → Institutes.id, Optional)

CREATE TABLE "StudentCoachConnection" (- `clubId` (UUID, FK → Clubs.id, Optional)

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),- `certificates` (Int): Number of certificates ordered

  studentId           UUID NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,- `medals` (Int): Number of medals ordered

  coachId             UUID NOT NULL REFERENCES "Coach"(id) ON DELETE CASCADE,- `trophies` (Int): Number of trophies ordered

  status              ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',- `certificatePrice` (Int, Optional): Price per certificate

  requestedAt         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,- `medalPrice` (Int, Optional): Price per medal

  respondedAt         TIMESTAMP,- `trophyPrice` (Int, Optional): Price per trophy

  UNIQUE(studentId, coachId)- `totalAmount` (Int, Optional): Total order amount

);- `status` (Enum): PENDING | CONFIRMED | COMPLETED | CANCELLED

```- `paymentStatus` (Enum): PENDING | PAID | FAILED

- `razorpayOrderId` (String, Optional)

**Indexes:**- `razorpayPaymentId` (String, Optional)

- `idx_student_coach_student_id` on `studentId`- `paymentDate` (DateTime, Optional)

- `idx_student_coach_coach_id` on `coachId`- `completedAt` (DateTime, Optional)

- `idx_student_coach_status` on `status`- `createdAt` (DateTime)

- `updatedAt` (DateTime)

---

**Relationships:**

### EventOrder- Belongs to one Event

Certificate/medal/trophy orders for events.- Belongs to one Coach/Institute/Club

- Has many Certificates

```sql

CREATE TABLE "EventOrder" (---

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  eventId             UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,### Certificates

  coachId             UUID REFERENCES "Coach"(id) ON DELETE SET NULL,Digital certificates issued to students.

  instituteId         UUID REFERENCES "Institute"(id) ON DELETE SET NULL,

  clubId              UUID REFERENCES "Club"(id) ON DELETE SET NULL,**Columns:**

  certificates        INTEGER DEFAULT 0,- `id` (UUID, PK)

  medals              INTEGER DEFAULT 0,- `uniqueId` (String, Unique): STAIRS-CERT-{EventUID}-{StudentUID}

  trophies            INTEGER DEFAULT 0,- `studentId` (UUID, FK → Students.id)

  certificatePrice    DECIMAL(10, 2),- `eventId` (UUID, FK → Events.id)

  medalPrice          DECIMAL(10, 2),- `orderId` (UUID, FK → EventOrders.id, Optional)

  trophyPrice         DECIMAL(10, 2),- `certificateUrl` (String): Path to PDF file

  totalAmount         DECIMAL(10, 2),- `issuedBy` (UUID, FK → Users.id): Admin who issued

  status              ENUM('PENDING', 'PRICED', 'PAYMENT_PENDING', 'PAID', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',- `issuedAt` (DateTime)

  paymentStatus       ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',- `createdAt` (DateTime)

  razorpayOrderId     VARCHAR(255),

  razorpayPaymentId   VARCHAR(255),**Relationships:**

  paymentDate         TIMESTAMP,- Belongs to one Student

  completedAt         TIMESTAMP,- Belongs to one Event

  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,- Belongs to one EventOrder (optional)

  updatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);---

```

### EventResultFiles

**Indexes:**Result files uploaded for events.

- `idx_event_order_event_id` on `eventId`

- `idx_event_order_status` on `status`**Columns:**

- `idx_event_order_payment_status` on `paymentStatus`- `id` (UUID, PK)

- `eventId` (UUID, FK → Events.id)

---- `filename` (String): Stored filename

- `originalName` (String): Original filename

### Certificate- `mimeType` (String): File MIME type

Digital certificates for event participants.- `size` (Int): File size in bytes

- `uploadedBy` (UUID, FK → Users.id)

```sql- `description` (Text, Optional)

CREATE TABLE "Certificate" (- `uploadedAt` (DateTime)

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  uniqueId            VARCHAR(255) UNIQUE NOT NULL,  -- STAIRS-CERT-EVT-001-STU-001**Relationships:**

  studentId           UUID NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,- Belongs to one Event

  eventId             UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,- Uploaded by one User

  orderId             UUID REFERENCES "EventOrder"(id) ON DELETE SET NULL,

  certificateUrl      VARCHAR(500),  -- /uploads/certificates/...---

  issuedBy            UUID REFERENCES "User"(id) ON DELETE SET NULL,

  issuedAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,### Notifications

  isValid             BOOLEAN DEFAULT trueIn-app notifications for users.

);

```**Columns:**

- `id` (UUID, PK)

**Indexes:**- `userId` (UUID, FK → Users.id)

- `idx_certificate_unique_id` on `uniqueId`- `type` (String): Notification type

- `idx_certificate_student_id` on `studentId`- `title` (String)

- `idx_certificate_event_id` on `eventId`- `message` (Text)

- `idx_certificate_order_id` on `orderId`- `isRead` (Boolean, Default: false)

- `relatedId` (UUID, Optional): Related entity ID

---- `createdAt` (DateTime)



### EventResultFile**Relationships:**

Uploaded result files for events.- Belongs to one User



```sql---

CREATE TABLE "EventResultFile" (

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),## Indexes

  eventId             UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,

  filename            VARCHAR(255) NOT NULL,Performance indexes on frequently queried columns:

  originalName        VARCHAR(255) NOT NULL,- `Users.email` (Unique)

  mimeType            VARCHAR(100),- `Users.phone` (Unique)

  size                INTEGER,  -- bytes- `Users.role`

  description         TEXT,- `Events.status`

  uploadedBy          UUID REFERENCES "User"(id) ON DELETE SET NULL,- `Events.sport`

  uploadedAt          TIMESTAMP DEFAULT CURRENT_TIMESTAMP- `Events.startDate`

);- `Certificates.uniqueId` (Unique)

```- `EventRegistrations.eventId`

- `EventRegistrations.studentId`

**Indexes:**

- `idx_event_result_file_event_id` on `eventId`---



---## Sample Queries



### Payment### Get all events for a coach

Payment transaction records.```sql

SELECT * FROM "Events" 

```sqlWHERE "coachId" = 'coach_uuid' 

CREATE TABLE "Payment" (ORDER BY "startDate" DESC;

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),```

  userId              UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  amount              DECIMAL(10, 2) NOT NULL,### Get students registered for an event

  currency            VARCHAR(10) DEFAULT 'INR',```sql

  type                ENUM('SUBSCRIPTION', 'ORDER') NOT NULL,SELECT s.* 

  orderId             UUID REFERENCES "EventOrder"(id) ON DELETE SET NULL,FROM "Students" s

  razorpayOrderId     VARCHAR(255),JOIN "EventRegistrations" er ON s.id = er."studentId"

  razorpayPaymentId   VARCHAR(255),WHERE er."eventId" = 'event_uuid' 

  razorpaySignature   VARCHAR(500),AND er.status = 'CONFIRMED';

  status              ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',```

  createdAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP### Get certificates for a student

);```sql

```SELECT c.*, e.name as event_name 

FROM "Certificates" c

**Indexes:**JOIN "Events" e ON c."eventId" = e.id

- `idx_payment_user_id` on `userId`WHERE c."studentId" = 'student_uuid'

- `idx_payment_status` on `status`ORDER BY c."issuedAt" DESC;

- `idx_payment_razorpay_order_id` on `razorpayOrderId````



---### Get pending events for admin approval

```sql

## RelationshipsSELECT e.*, u.email as creator_email 

FROM "Events" e

```LEFT JOIN "Coaches" co ON e."coachId" = co.id

User (1) ────── (1) Student/Coach/Institute/ClubLEFT JOIN "Users" u ON co."userId" = u.id

Coach (1) ────── (M) EventWHERE e.status = 'PENDING'

Student (M) ────── (M) Event (via EventRegistration)ORDER BY e."createdAt" ASC;

Student (M) ────── (M) Coach (via StudentCoachConnection)```

Event (1) ────── (M) EventRegistration

Event (1) ────── (M) EventOrder### Get orders with payment status

Event (1) ────── (M) Certificate```sql

Event (1) ────── (M) EventResultFileSELECT eo.*, e.name as event_name 

EventOrder (1) ────── (M) CertificateFROM "EventOrders" eo

Student (1) ────── (M) CertificateJOIN "Events" e ON eo."eventId" = e.id

```WHERE eo."paymentStatus" = 'PAID'

ORDER BY eo."paymentDate" DESC;

---```



## Sample Queries---



### Get all events for a coach## Prisma Schema Location

```sqlFull schema definition: `backend/prisma/schema.prisma`

SELECT * FROM "Event"

WHERE "coachId" = 'coach-uuid'## Migrations

  AND "status" = 'APPROVED'Migration files: `backend/prisma/migrations/`

ORDER BY "startDate" ASC;

```Run migrations:

```bash

### Get students registered for an eventnpx prisma migrate dev

```sqlnpx prisma migrate deploy  # For production

SELECT s.*, er."registeredAt"```

FROM "Student" s
JOIN "EventRegistration" er ON s.id = er."studentId"
WHERE er."eventId" = 'event-uuid'
  AND er."status" = 'CONFIRMED';
```

### Get certificates for a student
```sql
SELECT c.*, e."name" as "eventName"
FROM "Certificate" c
JOIN "Event" e ON c."eventId" = e.id
WHERE c."studentId" = 'student-uuid'
ORDER BY c."issuedAt" DESC;
```

### Get pending events for admin
```sql
SELECT e.*, u."email" as "organizerEmail"
FROM "Event" e
LEFT JOIN "Coach" c ON e."coachId" = c.id
LEFT JOIN "User" u ON c."userId" = u.id
WHERE e."status" = 'PENDING'
ORDER BY e."createdAt" ASC;
```

### Calculate revenue
```sql
SELECT 
  SUM("totalAmount") as "totalRevenue",
  COUNT(*) as "totalOrders",
  SUM(CASE WHEN "paymentStatus" = 'PAID' THEN "totalAmount" ELSE 0 END) as "paidRevenue"
FROM "EventOrder"
WHERE "createdAt" >= '2025-01-01'
  AND "createdAt" < '2026-01-01';
```

---

## Migrations

Located in: `backend/prisma/migrations/`

### Key Migrations:
1. **Initial Schema**: Base tables creation
2. **Add Unique IDs**: Add uniqueId fields for events/certificates
3. **Fix OrderId Nullable**: Make orderId nullable in certificates
4. **Add Event Unique ID**: Add unique constraint on event uniqueId

To run migrations:
```bash
cd backend
npx prisma migrate deploy    # Production
npx prisma migrate dev        # Development
```

---

## Prisma Schema

See `backend/prisma/schema.prisma` for the complete Prisma schema definition.

---

**Last Updated**: November 2025
