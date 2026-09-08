# Technical Plan - {{PROJECT_NAME}}

**Version:** 1.0
**Date:** {{DATE}}
**Status:** Living Document
**Author:** {{AUTHOR}}

> **Note:** This is a LIVING document. Update it as the project evolves. All technical decisions, architecture changes, and implementation details should be documented here.

---

## 📋 Template Modules

This template is split into focused modules for AI readability:

1. **Product Overview** - This file (below)
2. **[Tech Stack & Architecture](modules/tech-stack-architecture.md)** - Complete tech stack, architecture diagrams, request flow
3. **[Database Schema](modules/database-schema.md)** - ERD, Prisma schema, indexes
4. **[Security, Auth & Deployment](modules/security-auth-deployment.md)** - Authentication, security measures, deployment
5. **[Project Structure & API](modules/project-structure-api.md)** - Folder structure, business logic, API design
6. **[Design, Performance & Monitoring](modules/design-performance-monitoring.md)** - Design system, performance targets, monitoring

**For AI:** Read modules as needed based on task context. Each module is <200 lines for optimal processing.

---

## 1. Product Overview

### Product Vision
{{PRODUCT_VISION}}

### Product Rules (The North Star)
**Every feature must answer YES to:**
1. Does it solve the core problem?
2. Does it deliver measurable value?
3. Is it aligned with project goals?

**Example:** "Does it reduce user friction? Does it speed up the workflow?"

### Target Users
{{TARGET_USERS}}

### Core Value Proposition
{{VALUE_PROPOSITION}}

---

## 2-9. Technical Details

See module files for complete technical documentation:

- **Sections 2-3:** [Tech Stack & Architecture Module](modules/tech-stack-architecture.md)
- **Section 4:** [Database Schema Module](modules/database-schema.md)
- **Sections 5, 10, 11:** [Security, Auth & Deployment Module](modules/security-auth-deployment.md)
- **Sections 6-9:** [Project Structure & API Module](modules/project-structure-api.md)
- **Sections 12-14:** [Design, Performance & Monitoring Module](modules/design-performance-monitoring.md)

---

## 15. Changelog

> Keep this section updated with all major changes to the technical plan.

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-25 | 1.0 | {{AUTHOR}} | Initial technical plan created |
| {{DATE}} | 1.1 | {{AUTHOR}} | {{CHANGES}} |

**Format:**
```
### YYYY-MM-DD - v1.1
**Changed:**
- Updated database schema to include `avatar` field in User model
- Migrated from Context API to Zustand for state management

**Added:**
- Redis caching for product listings
- Webhook endpoint for Stripe payment events

**Fixed:**
- Race condition in order processing
- Memory leak in WebSocket connection

**Deprecated:**
- Old authentication flow (will be removed in v2.0)
```

---

## 16. Future Considerations

### Planned Improvements
{{FUTURE_IMPROVEMENTS}}

**Example:**
- Mobile native app (React Native)
- Real-time notifications (WebSockets)
- Advanced analytics dashboard
- Multi-tenant architecture
- Microservices migration (if scale requires)

### Technical Debt
{{TECHNICAL_DEBT}}

**Example:**
- TD-001: Refactor route handlers to use proper return types
- TD-002: Add request/response logging middleware
- TD-003: Implement proper error boundary in React app

---

## 17. References

### Documentation
- [Project README](../../README.md)
- [API Documentation](../../docs/api/README.md)
- [User Guide](../../docs/user-guide/README.md)
- [Deployment Guide](../../docs/deployment/README.md)

### External Resources
- {{FRAMEWORK}} Docs: {{LINK}}
- {{DATABASE}} Docs: {{LINK}}
- {{HOSTING}} Docs: {{LINK}}

### Template Modules (Internal)
- [Tech Stack & Architecture](modules/tech-stack-architecture.md)
- [Database Schema](modules/database-schema.md)
- [Security, Auth & Deployment](modules/security-auth-deployment.md)
- [Project Structure & API](modules/project-structure-api.md)
- [Design, Performance & Monitoring](modules/design-performance-monitoring.md)

---

**Document Owner:** {{OWNER}}
**Last Updated:** {{DATE}}
**Status:** Living Document (update as project evolves)

---

## How to Use This Document

1. **Fill in all `{{PLACEHOLDERS}}`** with your project details
2. **Update module files** with specific technical information
3. **Reference during development** for technical decisions
4. **Share with team** for alignment
5. **Keep changelog updated** with all major changes
6. **Review quarterly** to ensure it stays current

This is a **living document** - it should always reflect the current state of the technical implementation.

**AI Note:** This template is modularized for optimal AI processing. Read the main template for overview, then access specific modules as needed for detailed technical information.
