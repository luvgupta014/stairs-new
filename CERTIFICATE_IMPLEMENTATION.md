# Certificate Generation & Issuance System

## Overview
Automated e-certificate generation and delivery system for STAIRS platform. Coaches can issue certificates to students after event completion and payment, and students can view/download certificates from their dashboard.

---

## Workflow

### 1. **Event Completion & Payment**
- Coach completes event
- Coach makes payment for certificates (e.g., pays for 10 certificates)
- Payment status must be `SUCCESS` for certificate issuance

### 2. **Certificate Issuance (Coach)**
- Coach selects students via checkboxes (max = number of certificates paid for)
- Coach clicks "Issue Certificates"
- Backend generates PDF certificates for selected students
- Each certificate is saved to `/uploads/certificates/` folder
- Certificate metadata is saved to database

### 3. **Certificate Delivery (Student)**
- Students receive notification
- Certificates appear on student dashboard
- Students can view and download certificates

---

## Technical Implementation

### Database Schema

#### Certificate Model (`prisma/schema.prisma`)
```prisma
model Certificate {
  id              String   @id @default(cuid())
  studentId       String
  eventId         String
  orderId         String
  certificateUrl  String
  participantName String
  sportName       String
  eventName       String
  issueDate       DateTime @default(now())
  uid             String   @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([studentId, eventId, orderId])
  @@map("certificates")
}
```

### Backend Components

#### 1. Certificate Service (`backend/src/services/certificateService.js`)
- `generateCertificate(data)` - Generate certificate for one student
- `generateBulkCertificates(certificatesData)` - Generate certificates for multiple students
- `getStudentCertificates(studentId)` - Get all certificates for a student
- `getCertificateByUID(uid)` - Verify certificate by unique ID

#### 2. Certificate Routes (`backend/src/routes/certificates.js`)

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/certificates/issue` | POST | Coach | Issue certificates to selected students |
| `/api/certificates/my-certificates` | GET | Student | Get all certificates for logged-in student |
| `/api/certificates/verify/:uid` | GET | Public | Verify certificate by UID |
| `/api/certificates/event/:eventId/issued` | GET | Coach | Get all issued certificates for an event |

#### 3. Certificate Template (`backend/templates/certificate-template.html`)
- Professional HTML/CSS design
- Placeholders: `[PARTICIPANT_NAME]`, `[SPORT_NAME]`, `[EVENT_NAME]`, `[DATE]`, `[UID]`, `[LOGO_PATH]`
- Generates A4-sized PDF (1123px × 794px)

---

## API Usage

### Issue Certificates (Coach)

**Request:**
```http
POST /api/certificates/issue
Authorization: Bearer <coach_token>
Content-Type: application/json

{
  "eventId": "event_123",
  "orderId": "order_456",
  "selectedStudents": ["student_1", "student_2", "student_3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully issued 3 certificate(s)",
  "data": {
    "issued": 3,
    "failed": 0,
    "certificates": [
      {
        "id": "cert_1",
        "studentId": "student_1",
        "certificateUrl": "/uploads/certificates/STAIRS-CERT-1234567890-0001.pdf",
        "uid": "STAIRS-CERT-1234567890-0001"
      }
    ],
    "errors": []
  }
}
```

### Get My Certificates (Student)

**Request:**
```http
GET /api/certificates/my-certificates
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Certificates retrieved successfully",
  "data": {
    "certificates": [
      {
        "id": "cert_1",
        "participantName": "Rahul Sharma",
        "sportName": "Basketball",
        "eventName": "Inter-School Championship 2024",
        "certificateUrl": "/uploads/certificates/STAIRS-CERT-1234567890-0001.pdf",
        "issueDate": "2025-11-04T10:30:00Z",
        "uid": "STAIRS-CERT-1234567890-0001"
      }
    ],
    "count": 1
  }
}
```

---

## Certificate Generation Process

1. **Load Template**: Read HTML template from file
2. **Replace Placeholders**: Fill in student/event data
3. **Launch Puppeteer**: Headless browser for rendering
4. **Generate PDF**: Render HTML and save as PDF
5. **Save to Database**: Store certificate metadata
6. **Send Notification**: Notify student

---

## Validation Rules

### Backend Validations:
- ✅ Event must belong to the coach
- ✅ Order must exist and payment must be `SUCCESS`
- ✅ Number of selected students ≤ number of paid certificates
- ✅ No duplicate certificates for same student/event/order
- ✅ All selected students must exist in database

### Error Scenarios:
| Error | HTTP Status | Message |
|-------|-------------|---------|
| Missing fields | 400 | "Missing required fields: eventId, orderId, or selectedStudents" |
| Event not found | 404 | "Event not found or you do not have permission" |
| Payment not complete | 404 | "Order not found or payment not completed" |
| Exceeds limit | 400 | "You can only issue X certificate(s). You selected Y students." |
| Already issued | 400 | "Certificates already issued for some students" |

---

## File Structure

```
backend/
├── src/
│   ├── routes/
│   │   └── certificates.js          # Certificate API routes
│   ├── services/
│   │   └── certificateService.js    # Certificate generation logic
│   └── index.js                      # Register certificate routes
├── templates/
│   └── certificate-template.html    # Certificate HTML template
├── prisma/
│   └── schema.prisma                 # Updated with Certificate model
└── uploads/
    └── certificates/                 # Generated PDF certificates

assets/
└── logo.png                          # Logo used in certificates
```

---

## Frontend Integration (Next Steps)

### Coach Dashboard:
1. Add "Issue Certificates" button on event detail page
2. Show checkbox list of event participants
3. Display count: "You can issue X certificates (paid for X)"
4. Call `/api/certificates/issue` endpoint
5. Show success/error messages

### Student Dashboard:
1. Add "My Certificates" section
2. Call `/api/certificates/my-certificates` endpoint
3. Display certificate cards with:
   - Event name, sport, date
   - Download button (links to certificateUrl)
   - View button (open PDF in new tab)
   - Verify button (shows UID for verification)

### Sample Frontend Code (Coach):
```jsx
const issueCertificates = async () => {
  const response = await api.post('/api/certificates/issue', {
    eventId: selectedEvent.id,
    orderId: order.id,
    selectedStudents: selectedStudentIds
  });
  
  if (response.data.success) {
    alert(`Successfully issued ${response.data.data.issued} certificates!`);
  }
};
```

### Sample Frontend Code (Student):
```jsx
const fetchCertificates = async () => {
  const response = await api.get('/api/certificates/my-certificates');
  setCertificates(response.data.data.certificates);
};

// Display certificates
{certificates.map(cert => (
  <div key={cert.id}>
    <h3>{cert.eventName}</h3>
    <p>{cert.sportName} - {new Date(cert.issueDate).toLocaleDateString()}</p>
    <a href={cert.certificateUrl} download>Download Certificate</a>
    <p>UID: {cert.uid}</p>
  </div>
))}
```

---

## Security & Best Practices

- ✅ Authentication required for all endpoints (except verify)
- ✅ Role-based access control (Coach/Student)
- ✅ Unique certificate UIDs for verification
- ✅ Database constraints prevent duplicate issuance
- ✅ File size limits and upload validation
- ✅ Notifications for students on certificate issuance

---

## Testing

### Test Certificate Generation:
1. Create an event as coach
2. Make payment for certificates (e.g., 5 certificates)
3. Complete the event
4. Select 5 students from participants
5. Click "Issue Certificates"
6. Verify certificates appear in student dashboards
7. Download and verify PDF quality

### Test Validations:
- Try issuing more certificates than paid for → Should fail
- Try issuing duplicate certificates → Should fail
- Try issuing without payment → Should fail
- Verify certificate by UID → Should return certificate details

---

## Future Enhancements

- [ ] Multiple certificate templates (Winner, Participation, etc.)
- [ ] Bulk certificate download (ZIP file)
- [ ] Email certificates to students
- [ ] Certificate analytics (issued count, download stats)
- [ ] Certificate templates customization by coach
- [ ] Digital signatures on certificates
- [ ] Blockchain verification for authenticity

---

## Dependencies

- `puppeteer` - PDF generation from HTML
- `@prisma/client` - Database ORM
- `express` - Backend framework
- `express-fileupload` - File handling

---

## Deployment Checklist

- [ ] Run Prisma migration: `npx prisma migrate dev`
- [ ] Install Puppeteer: `npm install puppeteer`
- [ ] Create `/uploads/certificates/` directory
- [ ] Add logo to `/assets/logo.png`
- [ ] Update environment variables if needed
- [ ] Test certificate generation in production
- [ ] Monitor Puppeteer memory usage
- [ ] Set up file cleanup cron job (optional)

---

## Support

For issues or questions, contact the development team or refer to the main project documentation.

**Last Updated:** November 4, 2025
**Version:** 1.0.0
