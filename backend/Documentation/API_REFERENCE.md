# STAIRS Platform - API Reference# STAIRS Platform - API Reference



## Base URL## Base URL

```- **Development**: `http://localhost:5000/api`

Production: https://api.stairs.com- **Production**: `https://your-domain.com/api`

Development: http://localhost:5000

```## Authentication

All protected endpoints require JWT token in header:

## Authentication```

All API requests (except registration/login) require JWT token in header:Authorization: Bearer <your_jwt_token>

``````

Authorization: Bearer <token>

```---



---## Authentication Module



## Auth Routes (`/api/auth`)### POST /auth/register

Register a new user (Student/Coach/Institute/Club)

### Register

```http**Request Body:**

POST /api/auth/register```json

Content-Type: application/json{

  "email": "user@example.com",

{  "phone": "9876543210",

  "email": "user@example.com",  "password": "SecurePass123",

  "phone": "9876543210",  "role": "STUDENT"

  "password": "password123",}

  "role": "STUDENT|COACH|INSTITUTE|CLUB",```

  "name": "Full Name",

  // Role-specific fields...**Response:**

}```json

{

Response: {  "success": true,

  "success": true,  "data": {

  "data": { "user": {...}, "token": "jwt_token" },    "token": "jwt_token_here",

  "message": "Registration successful"    "user": {

}      "id": "uuid",

```      "email": "user@example.com",

      "role": "STUDENT"

### Login    }

```http  }

POST /api/auth/login}

Content-Type: application/json```



{### POST /auth/login

  "email": "user@example.com",Login with email/phone and password

  "password": "password123",

  "role": "STUDENT"**Request Body:**

}```json

{

Response: {  "emailOrPhone": "user@example.com",

  "success": true,  "password": "SecurePass123"

  "data": { "user": {...}, "token": "jwt_token" }}

}```

```

### POST /auth/send-otp

### Send OTPSend OTP for verification

```http

POST /api/auth/send-otp### POST /auth/verify-otp

Content-Type: application/jsonVerify OTP code



{### POST /auth/reset-password

  "email": "user@example.com",Reset password using OTP

  "purpose": "registration|login|password_reset"

}---

```

## Coach Module

### Verify OTP

```http### GET /coach/profile

POST /api/auth/verify-otpGet coach profile details

Content-Type: application/json

**Headers:** Authorization required

{

  "email": "user@example.com",**Response:**

  "otp": "123456"```json

}{

```  "success": true,

  "data": {

### Reset Password    "id": "uuid",

```http    "name": "Coach Name",

POST /api/auth/reset-password    "specialization": "Cricket",

Content-Type: application/json    "paymentStatus": "SUCCESS",

    "subscriptionExpiry": "2025-12-31"

{  }

  "email": "user@example.com",}

  "otp": "123456",```

  "newPassword": "newpassword123"

}### PUT /coach/profile

```Update coach profile



---### GET /coach/dashboard

Get coach dashboard statistics

## Student Routes (`/api/student`)

**Response:**

### Get Profile```json

```http{

GET /api/student/profile  "success": true,

Authorization: Bearer <token>  "data": {

    "totalStudents": 50,

Response: {    "totalEvents": 10,

  "success": true,    "upcomingEvents": 3,

  "data": {    "paymentStatus": "SUCCESS"

    "student": {  }

      "id": "uuid",}

      "name": "Student Name",```

      "email": "student@example.com",

      "uniqueId": "STU-001-MH-121125",### GET /coach/events

      "primarySport": "Cricket",List all coach's events

      "profileCompletion": 85

    }**Query Parameters:**

  }- `status`: PENDING | APPROVED | ACTIVE | COMPLETED

}- `page`: Page number (default: 1)

```- `limit`: Items per page (default: 10)



### Update Profile### POST /coach/events

```httpCreate a new event

PUT /api/student/profile

Authorization: Bearer <token>**Request Body:**

Content-Type: application/json```json

{

{  "name": "Summer Cricket Tournament",

  "name": "Updated Name",  "sport": "Cricket",

  "school": "New School",  "venue": "Stadium Name",

  "primarySport": "Football"  "address": "Full Address",

}  "startDate": "2025-11-20T10:00:00",

```  "endDate": "2025-11-22T18:00:00",

  "participantLimit": 100,

### Get Dashboard  "description": "Tournament details"

```http}

GET /api/student/dashboard```

Authorization: Bearer <token>

**Note:** Dates should be in IST format (YYYY-MM-DDTHH:mm:ss)

Response: {

  "data": {### PUT /coach/events/:eventId

    "upcomingEvents": 5,Update an existing event

    "connectedCoaches": 2,

    "certificates": 3,### DELETE /coach/events/:eventId

    "profileCompletion": 85,Delete/cancel an event

    "recentEvents": [...]

  }### GET /coach/students

}List connected students

```

### POST /coach/students/add

### Get EventsAdd a student manually

```http

GET /api/student/events### POST /coach/students/bulk-upload

Authorization: Bearer <token>Bulk upload students via CSV file



Response: {**Form Data:**

  "data": {- `file`: CSV file with student data

    "registered": [...],

    "available": [...]### GET /coach/connection-requests

  }List pending connection requests

}

```### PUT /coach/connection-requests/:connectionId

Accept or reject connection request

### Register for Event

```http**Request Body:**

POST /api/student/events/:eventId/register```json

Authorization: Bearer <token>{

  "action": "ACCEPT" | "REJECT"

Response: {}

  "success": true,```

  "message": "Successfully registered for event"

}### POST /coach/events/:eventId/orders

```Create an order for certificates/medals/trophies



### Unregister from Event**Request Body:**

```http```json

DELETE /api/student/events/:eventId/register{

Authorization: Bearer <token>  "certificates": 50,

```  "medals": 30,

  "trophies": 5

### Get Coaches}

```http```

GET /api/student/coaches

Authorization: Bearer <token>### GET /coach/events/:eventId/orders

View orders for an event

Response: {

  "data": {### POST /coach/create-payment-order

    "coaches": [...]Create Razorpay order for payment

  }

}### POST /coach/verify-payment

```Verify Razorpay payment



### Connect with Coach---

```http

POST /api/student/coaches/:coachId/connect## Student Module

Authorization: Bearer <token>

### GET /student/profile

Response: {Get student profile

  "success": true,

  "message": "Connection request sent"### PUT /student/profile

}Update student profile

```

### GET /student/dashboard

### Get CertificatesGet student dashboard stats

```http

GET /api/student/certificates### GET /student/events

Authorization: Bearer <token>List available events for registration



Response: {**Query Parameters:**

  "data": {- `sport`: Filter by sport

    "certificates": [- `location`: Filter by location

      {- `page`, `limit`: Pagination

        "id": "uuid",

        "uniqueId": "STAIRS-CERT-EVT-001-STU-001",### POST /student/events/:eventId/register

        "eventName": "Cricket Tournament",Register for an event

        "issuedAt": "2025-11-10",

        "certificateUrl": "/uploads/certificates/..."### DELETE /student/events/:eventId/register

      }Unregister from an event

    ]

  }### GET /student/coaches

}List available coaches

```

### POST /student/coaches/:coachId/connect

---Send connection request to coach



## Coach Routes (`/api/coach`)### GET /student/certificates

List student's certificates

### Get Profile

```http---

GET /api/coach/profile

Authorization: Bearer <token>## Admin Module

```

### GET /admin/dashboard

### Update ProfileGet admin dashboard statistics

```http

PUT /api/coach/profile**Response:**

Authorization: Bearer <token>```json

Content-Type: application/json{

  "success": true,

{  "data": {

  "name": "Coach Name",    "totalUsers": 500,

  "specialization": "Cricket Coaching",    "totalEvents": 100,

  "experience": 10    "pendingEvents": 15,

}    "totalRevenue": 50000

```  }

}

### Get Dashboard```

```http

GET /api/coach/dashboard### GET /admin/events

Authorization: Bearer <token>List all events (with filters)



Response: {**Query Parameters:**

  "data": {- `status`: Filter by status

    "totalStudents": 45,- `page`, `limit`: Pagination

    "totalEvents": 12,

    "upcomingEvents": 5,### PUT /admin/events/:eventId/moderate

    "paymentStatus": "SUCCESS",Approve or reject an event

    "subscriptionExpiry": "2026-01-30"

  }**Request Body:**

}```json

```{

  "action": "APPROVE" | "REJECT",

### Get Events  "notes": "Optional admin notes"

```http}

GET /api/coach/events```

Authorization: Bearer <token>

### GET /admin/events/:eventId/participants

Response: {List participants for an event

  "data": {

    "events": [### GET /admin/orders

      {List all orders

        "id": "uuid",

        "name": "Cricket Tournament",### PUT /admin/orders/:orderId/price

        "sport": "Cricket",Set pricing for an order

        "startDate": "2025-12-15T10:00:00",

        "endDate": "2025-12-17T18:00:00",**Request Body:**

        "venue": "Mumbai Stadium",```json

        "status": "APPROVED",{

        "participants": 25,  "certificatePrice": 100,

        "participantLimit": 50  "medalPrice": 150,

      }  "trophyPrice": 500

    ]}

  }```

}

```### PUT /admin/orders/:orderId/complete

Mark order as completed

### Create Event

```http### POST /admin/certificates/issue

POST /api/coach/eventsIssue certificates to students

Authorization: Bearer <token>

Content-Type: application/json**Request Body:**

```json

{{

  "name": "Cricket Tournament",  "eventId": "event_uuid",

  "sport": "Cricket",  "studentIds": ["student1_uuid", "student2_uuid"],

  "startDate": "2025-12-15T10:00:00",  // IST  "orderId": "order_uuid"

  "endDate": "2025-12-17T18:00:00",    // IST}

  "venue": "Mumbai Stadium",```

  "city": "Mumbai",

  "state": "Maharashtra",### GET /admin/users

  "description": "Annual cricket tournament",List all users

  "participantLimit": 50

}**Query Parameters:**

- `role`: Filter by role

Response: {- `page`, `limit`: Pagination

  "success": true,

  "data": {---

    "event": {

      "id": "uuid",## Event Module

      "uniqueId": "EVT-001-CRICKET-MH-122025",

      "status": "PENDING"### GET /events

    }List all approved events (public)

  },

  "message": "Event created successfully. Awaiting admin approval."### GET /events/:eventId

}Get event details

```

### POST /events/:eventId/register

### Update EventRegister for event (students only)

```http

PUT /api/coach/events/:eventId### DELETE /events/:eventId/register

Authorization: Bearer <token>Unregister from event

Content-Type: application/json

### POST /events/:eventId/results

{Upload event results (coaches only)

  "name": "Updated Name",

  "startDate": "2025-12-16T10:00:00",  // IST**Form Data:**

  "participantLimit": 60- `file`: PDF/Excel file with results

}

```### GET /events/:eventId/results

List result files for an event

### Delete Event

```http### GET /events/:eventId/results/:fileId/download

DELETE /api/coach/events/:eventIdDownload a result file

Authorization: Bearer <token>

```---



### Get Students## Certificate Module

```http

GET /api/coach/students### POST /certificates/issue

Authorization: Bearer <token>Issue a certificate



Response: {### GET /certificates/my-certificates

  "data": {Get my certificates (current user)

    "students": [...]

  }### GET /certificates/:certificateId

}Get certificate details

```

### GET /certificates/:certificateId/download

### Add StudentDownload certificate PDF

```http

POST /api/coach/students/add### GET /certificates/verify/:uid

Authorization: Bearer <token>Verify certificate by unique ID

Content-Type: application/json

**Response:**

{```json

  "studentEmail": "student@example.com"{

}  "success": true,

```  "data": {

    "valid": true,

### Bulk Upload Students    "student": "Student Name",

```http    "event": "Event Name",

POST /api/coach/students/bulk-upload    "issuedAt": "2025-11-10"

Authorization: Bearer <token>  }

Content-Type: multipart/form-data}

```

file: students.csv

```---



### Get Connection Requests## Payment Module

```http

GET /api/coach/connection-requests### POST /payment/create-order

Authorization: Bearer <token>Create Razorpay order



Response: {**Request Body:**

  "data": {```json

    "requests": [{

      {  "amount": 2000,

        "id": "uuid",  "type": "SUBSCRIPTION" | "ORDER",

        "student": {...},  "referenceId": "optional_reference"

        "status": "PENDING",}

        "createdAt": "2025-11-10"```

      }

    ]### POST /payment/verify-payment

  }Verify Razorpay payment signature

}

```**Request Body:**

```json

### Accept/Reject Connection{

```http  "razorpay_order_id": "order_id",

PUT /api/coach/connection-requests/:connectionId  "razorpay_payment_id": "payment_id",

Authorization: Bearer <token>  "razorpay_signature": "signature"

Content-Type: application/json}

```

{

  "action": "ACCEPT|REJECT"### GET /payment/history

}Get payment history

```

---

### Create Order

```http## Response Format

POST /api/coach/events/:eventId/orders

Authorization: Bearer <token>### Success Response

Content-Type: application/json```json

{

{  "success": true,

  "certificates": 50,  "data": { },

  "medals": 30,  "message": "Operation successful",

  "trophies": 5  "statusCode": 200

}}

```

Response: {

  "success": true,### Error Response

  "data": {```json

    "order": {{

      "id": "uuid",  "success": false,

      "status": "PENDING"  "message": "Error message",

    }  "errors": ["Validation error 1", "Validation error 2"],

  },  "statusCode": 400

  "message": "Order created. Admin will set pricing."}

}```

```

### Paginated Response

### Get Orders```json

```http{

GET /api/coach/events/:eventId/orders  "success": true,

Authorization: Bearer <token>  "data": {

```    "items": [],

    "pagination": {

### Create Payment Order      "page": 1,

```http      "limit": 10,

POST /api/coach/create-payment-order      "total": 100,

Authorization: Bearer <token>      "totalPages": 10,

Content-Type: application/json      "hasMore": true

    }

{  }

  "orderId": "order_uuid",}

  "amount": 5000```

}

---

Response: {

  "data": {## Error Codes

    "razorpayOrderId": "order_xxx",

    "amount": 5000,- `400` - Bad Request (validation errors)

    "currency": "INR"- `401` - Unauthorized (invalid/missing token)

  }- `403` - Forbidden (insufficient permissions)

}- `404` - Not Found

```- `409` - Conflict (duplicate entry)

- `500` - Internal Server Error

### Verify Payment

```http---

POST /api/coach/verify-payment

Authorization: Bearer <token>## Rate Limiting

Content-Type: application/json- API requests are limited to prevent abuse

- Limits may vary by endpoint and user role

{

  "orderId": "order_uuid",## CORS

  "razorpay_order_id": "order_xxx",- Configured to allow requests from authorized origins

  "razorpay_payment_id": "pay_xxx",- Credentials are supported for authenticated requests

  "razorpay_signature": "signature_xxx"
}
```

---

## Admin Routes (`/api/admin`)

### Get Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <token>

Response: {
  "data": {
    "totalStudents": 1234,
    "totalCoaches": 156,
    "totalEvents": 345,
    "pendingEvents": 12,
    "pendingOrders": 5,
    "totalRevenue": 450000
  }
}
```

### Get Events
```http
GET /api/admin/events
Authorization: Bearer <token>

Query params:
- status: PENDING|APPROVED|REJECTED|SUSPENDED
- page: 1
- limit: 10
```

### Moderate Event
```http
PUT /api/admin/events/:eventId/moderate
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "APPROVE|REJECT|SUSPEND|RESTART",
  "notes": "Reason for action (optional)"
}

Response: {
  "success": true,
  "message": "Event approved successfully"
}
```

### Get Event Participants
```http
GET /api/admin/events/:eventId/participants
Authorization: Bearer <token>

Response: {
  "data": {
    "participants": [
      {
        "student": {...},
        "registeredAt": "2025-11-10"
      }
    ]
  }
}
```

### Get Orders
```http
GET /api/admin/orders
Authorization: Bearer <token>

Response: {
  "data": {
    "orders": [
      {
        "id": "uuid",
        "event": {...},
        "coach": {...},
        "certificates": 50,
        "medals": 30,
        "trophies": 5,
        "status": "PENDING",
        "paymentStatus": "PENDING"
      }
    ]
  }
}
```

### Set Order Pricing
```http
PUT /api/admin/orders/:orderId/price
Authorization: Bearer <token>
Content-Type: application/json

{
  "certificatePrice": 100,
  "medalPrice": 150,
  "trophyPrice": 500
}

Response: {
  "success": true,
  "data": {
    "totalAmount": 13500
  },
  "message": "Pricing set successfully"
}
```

### Mark Order Complete
```http
PUT /api/admin/orders/:orderId/complete
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Order marked as completed"
}
```

### Issue Certificates
```http
POST /api/admin/certificates/issue
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "event_uuid",
  "studentIds": ["student_uuid1", "student_uuid2"],
  "orderId": "order_uuid" (optional)
}

Response: {
  "success": true,
  "data": {
    "issued": 2,
    "certificates": [...]
  },
  "message": "Certificates issued successfully"
}
```

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <token>

Query params:
- role: STUDENT|COACH|INSTITUTE|CLUB
- page: 1
- limit: 10
```

---

## Event Routes (`/api/events`)

### Get All Events
```http
GET /api/events
Authorization: Bearer <token>

Query params:
- sport: Cricket|Football|etc.
- state: Maharashtra|Delhi|etc.
- startDate: 2025-12-01
- endDate: 2025-12-31
- page: 1
- limit: 10

Response: {
  "data": {
    "events": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Get Event Details
```http
GET /api/events/:eventId
Authorization: Bearer <token>

Response: {
  "data": {
    "event": {
      "id": "uuid",
      "name": "Cricket Tournament",
      "sport": "Cricket",
      "startDate": "2025-12-15T10:00:00",
      "venue": "Mumbai Stadium",
      "organizer": {...},
      "participants": 25,
      "participantLimit": 50,
      "isRegistered": true
    }
  }
}
```

### Upload Results
```http
POST /api/events/:eventId/results
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: results.pdf
description: "Tournament results"
```

### Get Results
```http
GET /api/events/:eventId/results
Authorization: Bearer <token>

Response: {
  "data": {
    "results": [
      {
        "id": "uuid",
        "filename": "results.pdf",
        "originalName": "Tournament Results.pdf",
        "uploadedAt": "2025-11-10",
        "uploadedBy": {...}
      }
    ]
  }
}
```

### Download Result File
```http
GET /api/events/:eventId/results/:fileId/download
Authorization: Bearer <token>

Response: File download
```

---

## Certificate Routes (`/api/certificates`)

### Get My Certificates
```http
GET /api/certificates/my-certificates
Authorization: Bearer <token>

Response: {
  "data": {
    "certificates": [...]
  }
}
```

### Get Certificate Details
```http
GET /api/certificates/:certificateId
Authorization: Bearer <token>
```

### Download Certificate
```http
GET /api/certificates/:certificateId/download
Authorization: Bearer <token>

Response: PDF file download
```

### Verify Certificate
```http
GET /api/certificates/verify/:uid

Response: {
  "data": {
    "certificate": {
      "uniqueId": "STAIRS-CERT-EVT-001-STU-001",
      "student": {...},
      "event": {...},
      "issuedAt": "2025-11-10",
      "isValid": true
    }
  }
}
```

---

## Payment Routes (`/api/payment`)

### Create Order
```http
POST /api/payment/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 2000,
  "type": "SUBSCRIPTION|ORDER"
}

Response: {
  "data": {
    "razorpayOrderId": "order_xxx",
    "amount": 2000,
    "currency": "INR"
  }
}
```

### Verify Payment
```http
POST /api/payment/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}

Response: {
  "success": true,
  "message": "Payment verified successfully"
}
```

### Get Payment History
```http
GET /api/payment/history
Authorization: Bearer <token>
```

---

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Rate Limiting

- 100 requests per 15 minutes per IP
- Exceeding limit returns `429 Too Many Requests`

---

**Last Updated**: November 2025
