# STAIRS Platform - Knowledge Transfer Document Index# STAIRS Platform - Knowledge Transfer Document Index



## Quick Start Guide## Document Overview



Welcome to the STAIRS platform knowledge transfer documentation. This index helps you navigate all documentation resources.This folder contains comprehensive documentation for the STAIRS platform knowledge transfer.



------



## Document List## KT Document Checklist



### 1. **ARCHITECTURE_DOCUMENTATION.md**### ✅ Technical Documentation

**Purpose**: Complete system architecture overview  

**Contains**:1. **ARCHITECTURE_DOCUMENTATION.md**

- System overview & stakeholders   - System architecture and design

- Technology stack   - Module descriptions

- Module architecture (Auth, Student, Coach, Admin, Event)   - Technology stack

- Services & utilities   - Integration flows

- Authentication & authorization   - Security measures

- Dashboard features   - Future enhancements

- Integration flows

- Date/time handling (IST)2. **SYSTEM_DIAGRAMS.md**

- Security measures   - Visual architecture diagrams

   - User authentication flow

**When to use**: Understanding system design, onboarding new developers   - Event lifecycle flow

   - Certificate generation flow

---   - Payment flow

   - Database relationships

### 2. **SYSTEM_DIAGRAMS.md**   - Module interaction maps

**Purpose**: Visual architecture diagrams     - Request lifecycle

**Contains**:

- High-level system architecture3. **API_REFERENCE.md**

- Event creation & approval flow   - All API endpoints

- Payment & order flow   - Request/response formats

- Database entity relationships   - Authentication requirements

   - Error codes

**When to use**: Quick visual reference, presentations, design discussions   - Rate limiting

   - CORS configuration

---

4. **DATABASE_SCHEMA.md**

### 3. **FRONTEND_DOCUMENTATION.md**   - Table structures

**Purpose**: Complete frontend guide     - Column definitions

**Contains**:   - Relationships and foreign keys

- Project structure   - Indexes

- Pages & components detailed breakdown   - Sample queries

- Routing configuration   - Prisma schema location

- State management (Context API)

- API integration### ✅ Setup & Operations

- Key features (IST handling, payments, maps)

- Best practices5. **SETUP_DEPLOYMENT_GUIDE.md**

   - Local development setup

**When to use**: Frontend development, UI/UX work, component understanding   - Environment configuration

   - Database setup

---   - Production deployment (Ubuntu)

   - PM2 process management

### 4. **API_REFERENCE.md**   - Nginx configuration

**Purpose**: API endpoints documentation     - SSL setup

**Contains**:   - Troubleshooting

- All API routes (Auth, Student, Coach, Admin, Event, Certificate, Payment)

- Request/response formats6. **TESTING_GUIDE.md**

- Authentication requirements   - Unit tests

- Error codes   - Integration tests

- Rate limiting   - Manual test scenarios

   - Test coverage

**When to use**: API integration, backend development, testing   - Running tests

   - Test data management

---   - CI/CD integration



### 5. **DATABASE_SCHEMA.md**7. **MAINTENANCE_SUPPORT.md**

**Purpose**: Database structure reference     - Routine maintenance tasks

**Contains**:   - Backup and restore procedures

- All tables with fields   - Log management

- Relationships & constraints   - Common issues and solutions

- Indexes   - Performance monitoring

- Sample queries   - Security maintenance

- Migration info   - Escalation procedures

   - Disaster recovery

**When to use**: Database queries, schema understanding, data modeling

### ✅ User Documentation

---

8. **FEATURE_USER_GUIDE.md**

### 6. **SETUP_DEPLOYMENT_GUIDE.md**   - User roles and capabilities

**Purpose**: Installation & deployment instructions     - Dashboard features (Student, Coach, Admin, Institute, Club)

**Contains**:   - Common user flows

- Local development setup   - Tips and best practices

- Production deployment steps   - FAQ

- Server configuration (Nginx, PM2)

- Database setup9. **EXPERIENCE_SUMMARY.md**

- SSL configuration   - Project overview

- Backup strategies   - Technical contributions

- Troubleshooting   - Key responsibilities

   - Technology stack

**When to use**: Setting up dev environment, deploying to production   - Impact and achievements



---### ✅ KT Management



### 7. **TESTING_GUIDE.md**10. **KT_README.md**

**Purpose**: Testing strategies & execution      - KT package orientation

**Contains**:    - Quick start guide

- Test types (unit, integration, manual)    - Document navigation

- Running tests    - Support information

- Test coverage

- Key test scenarios11. **KT_DELIVERABLES_CHECKLIST.md**

- IST date/time testing    - Complete list of deliverables

- Debugging tests    - Verification checklist



**When to use**: Writing tests, QA, debugging issues12. **KT_HANDOVER_SUMMARY.md**

    - Handover scope

---    - Delivered documents

    - Next steps

### 8. **MAINTENANCE_SUPPORT.md**    - Post-handover support

**Purpose**: Ongoing maintenance & support  

**Contains**:---

- Routine maintenance tasks

- Backup & restore procedures## Document Purpose Map

- Error handling

- Log analysis### For New Developers / Onboarding

- Common issues & solutionsStart with:

- Escalation procedures1. KT_README.md - Orientation

2. ARCHITECTURE_DOCUMENTATION.md - System understanding

**When to use**: Production support, troubleshooting, maintenance3. SETUP_DEPLOYMENT_GUIDE.md - Environment setup

4. FEATURE_USER_GUIDE.md - Feature understanding

---

### For Development Work

### 9. **FEATURE_USER_GUIDE.md**Reference:

**Purpose**: Feature & dashboard guide  1. API_REFERENCE.md - API endpoints

**Contains**:2. DATABASE_SCHEMA.md - Database queries

- Student dashboard features3. TESTING_GUIDE.md - Testing procedures

- Coach dashboard features4. ARCHITECTURE_DOCUMENTATION.md - Module details

- Admin dashboard features

- Institute/Club dashboards### For Deployment & Operations

- Common user flowsUse:

- Screenshots & walkthroughs1. SETUP_DEPLOYMENT_GUIDE.md - Deployment procedures

2. MAINTENANCE_SUPPORT.md - Ongoing maintenance

**When to use**: Understanding user features, training, user documentation3. TESTING_GUIDE.md - Validation tests



---### For Troubleshooting

Check:

### 10. **EXPERIENCE_SUMMARY.md**1. MAINTENANCE_SUPPORT.md - Common issues

**Purpose**: Project summary for HR/management  2. SETUP_DEPLOYMENT_GUIDE.md - Configuration issues

**Contains**: Brief project description for experience letters3. API_REFERENCE.md - API errors

4. DATABASE_SCHEMA.md - Data issues

**When to use**: Experience letters, resumes, project summaries

### For Understanding Flows

---Review:

1. SYSTEM_DIAGRAMS.md - Visual flows

## Documentation Organization2. ARCHITECTURE_DOCUMENTATION.md - Detailed flows

3. FEATURE_USER_GUIDE.md - User journeys

```

backend/Documentation/---

├── KT_INDEX.md                      (You are here)

├── ARCHITECTURE_DOCUMENTATION.md    (System architecture)## Quick Reference Guide

├── SYSTEM_DIAGRAMS.md               (Visual diagrams)

├── FRONTEND_DOCUMENTATION.md        (Frontend complete guide)### Critical File Locations

├── API_REFERENCE.md                 (API endpoints)

├── DATABASE_SCHEMA.md               (Database structure)**Backend:**

├── SETUP_DEPLOYMENT_GUIDE.md        (Setup & deployment)- Code: `backend/src/`

├── TESTING_GUIDE.md                 (Testing guide)- Routes: `backend/src/routes/`

├── MAINTENANCE_SUPPORT.md           (Maintenance & support)- Services: `backend/src/services/`

├── FEATURE_USER_GUIDE.md            (User features)- Prisma Schema: `backend/prisma/schema.prisma`

└── EXPERIENCE_SUMMARY.md            (Project summary)- Environment: `backend/.env`

```

**Frontend:**

---- Code: `frontend/src/`

- Pages: `frontend/src/pages/`

## Quick Navigation- Components: `frontend/src/components/`

- Environment: `frontend/.env`

### For New Developers

1. Start with **ARCHITECTURE_DOCUMENTATION.md****Scripts:**

2. Review **SYSTEM_DIAGRAMS.md**- Maintenance: `backend/scripts/`

3. Follow **SETUP_DEPLOYMENT_GUIDE.md**- Testing: `backend/testing/debug/`

4. Read **FRONTEND_DOCUMENTATION.md** or **API_REFERENCE.md** based on role

**Documentation:**

### For Frontend Development- All docs: `backend/Documentation/`

1. **FRONTEND_DOCUMENTATION.md** - Complete frontend guide- This index: `backend/Documentation/KT_INDEX.md`

2. **API_REFERENCE.md** - API integration

3. **TESTING_GUIDE.md** - Testing components---



### For Backend Development## Document Status

1. **ARCHITECTURE_DOCUMENTATION.md** - System design

2. **API_REFERENCE.md** - API endpoints| Document | Status | Last Updated | Version |

3. **DATABASE_SCHEMA.md** - Database structure|----------|--------|--------------|---------|

4. **TESTING_GUIDE.md** - Testing APIs| ARCHITECTURE_DOCUMENTATION.md | ✅ Complete | Nov 2025 | 1.0 |

| SYSTEM_DIAGRAMS.md | ✅ Complete | Nov 2025 | 1.0 |

### For Deployment| API_REFERENCE.md | ✅ Complete | Nov 2025 | 1.0 |

1. **SETUP_DEPLOYMENT_GUIDE.md** - Complete deployment guide| DATABASE_SCHEMA.md | ✅ Complete | Nov 2025 | 1.0 |

2. **MAINTENANCE_SUPPORT.md** - Post-deployment support| SETUP_DEPLOYMENT_GUIDE.md | ✅ Complete | Nov 2025 | 1.0 |

| TESTING_GUIDE.md | ✅ Complete | Nov 2025 | 1.0 |

### For Maintenance & Support| MAINTENANCE_SUPPORT.md | ✅ Complete | Nov 2025 | 1.0 |

1. **MAINTENANCE_SUPPORT.md** - Maintenance tasks| FEATURE_USER_GUIDE.md | ✅ Complete | Nov 2025 | 1.0 |

2. **TESTING_GUIDE.md** - Testing & debugging| EXPERIENCE_SUMMARY.md | ✅ Complete | Nov 2025 | 1.0 |

3. **API_REFERENCE.md** - API troubleshooting| KT_README.md | ✅ Complete | Nov 2025 | 1.0 |

| KT_DELIVERABLES_CHECKLIST.md | ✅ Complete | Nov 2025 | 1.0 |

---| KT_HANDOVER_SUMMARY.md | ✅ Complete | Nov 2025 | 1.0 |



## Key Concepts---



### IST Date/Time Handling## Contact & Support

- **Problem**: Database stores UTC, users work in IST

- **Solution**: Backend appends `+05:30` to inputs, converts UTC to IST for responsesFor questions about this documentation:

- **Documentation**: See ARCHITECTURE_DOCUMENTATION.md, FRONTEND_DOCUMENTATION.md- **Primary Contact**: [Your Name] - [Your Email]

- **Technical Lead**: [Lead Name] - [Lead Email]

### Payment Integration- **Emergency Support**: [Support Contact]

- **Provider**: Razorpay

- **Types**: Coach subscription, event orders---

- **Flow**: Create order → Payment modal → Verify signature → Update status

- **Documentation**: See API_REFERENCE.md, FRONTEND_DOCUMENTATION.md## Version History



### Certificate Generation- **v1.0** (November 2025) - Initial comprehensive documentation release

- **Tool**: Puppeteer (HTML to PDF)  - Complete technical documentation

- **UID**: STAIRS-CERT-{EventUID}-{StudentUID}  - Setup and deployment guides

- **Flow**: Results upload → Admin issues → PDF generated → Student downloads  - Maintenance and support procedures

- **Documentation**: See ARCHITECTURE_DOCUMENTATION.md  - User guides and feature documentation



------



## Document MaintenanceAll documents are located in the `backend/Documentation/` folder.

This index serves as a checklist and quick reference for knowledge transfer.

All documentation is located in: `backend/Documentation/`


**Last Updated**: November 2025  
**Version**: 1.0.0  
**Maintained By**: STAIRS Development Team

---

For questions or clarifications, refer to the appropriate documentation file above or contact the development team.
