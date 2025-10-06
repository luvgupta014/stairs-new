# STAIRS MVP Overview

Goal: Build a portal with 5 modules (Student, Coach, Institute, Club, Admin).

## Tech Stack
- Backend: Node.js (Express + Prisma + Supabase Postgres)
- Frontend: React (Vite + Tailwind)
- Auth: OTP-based login for students; password + Razorpay for coaches
- Payment: Razorpay integration for coach registration + event creation
- Admin approval flow for events
- Role-based dashboards

## Core Modules

### 1. Student
- Register/login via OTP
- Connect with coach (request/accept)
- Register for approved events

### 2. Coach
- Register + pay via Razorpay
- Add students manually or bulk upload
- Create events → pay → send to admin for approval

### 3. Institute
- Upload students (single + bulk)

### 4. Club/Member
- Add students (works like student-initiated connection)

### 5. Admin
- Approve/reject events
- Dashboard: coaches, students, payments, analytics
