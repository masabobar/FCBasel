# Technical Specification - {{PROJECT_NAME}}

**Version:** 1.0
**Date:** {{DATE}}
**Status:** {{STATUS}}
**Author:** {{AUTHOR}}

---

## Template Modules

This template references shared modules for common sections:
- **[Tech Stack & Architecture](modules/tech-stack-architecture.md)** - Technology stack details, architecture diagrams
- **[Database Schema](modules/database-schema.md)** - Database design, ERD, Prisma schema
- **[Security & Auth](modules/security-auth-deployment.md)** - Authentication, security measures
- **[Project Structure & API](modules/project-structure-api.md)** - Folder structure, API design

**For AI:** Use modules for standard sections. Template-specific content below.

---

## 1. Overview

### 1.1 Purpose
{{PURPOSE}}

**Example:** This technical specification defines the implementation details for {{PROJECT_NAME}}, including architecture, technology stack, API design, and development standards.

### 1.2 Scope
{{SCOPE}}

**Example:** This document covers frontend architecture, backend services, database design, API specifications, authentication, and deployment procedures.

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| {{TERM}} | {{DEFINITION}} |

---

## 2-3. Technology Stack & Architecture

**See shared modules:**
- [modules/tech-stack-architecture.md](modules/tech-stack-architecture.md) - Complete tech stack tables and architecture diagrams
- Sections covered: 2.1-2.4 (Frontend, Backend, Database, Infrastructure), 3.1-3.3 (Architecture, Components, Data Flow)

---

## 4. Frontend Architecture

### 4.1 Directory Structure
```
{{FRONTEND_STRUCTURE}}
```

**Example:** See [modules/project-structure-api.md](modules/project-structure-api.md) for complete project structure.

### 4.2 Routing Strategy
{{ROUTING_STRATEGY}}

**Example:**
- React Router 7 (SSR mode)
- File-based routing in `app/routes/`
- Protected routes via middleware
- Nested layouts for shared UI

### 4.3 State Management Strategy
{{STATE_MANAGEMENT}}

**Example:**
- Global state: Zustand
- Server state: React Query / Remix loaders
- Form state: react-hook-form
- URL state: React Router

### 4.4 API Integration
{{API_INTEGRATION}}

**Example:**
- Remix actions/loaders for data fetching
- Type-safe API client (generated from Prisma)
- Error handling with ErrorBoundary
- Loading states with Suspense

---

## 5. Backend Architecture

### 5.1 Directory Structure
**See:** [modules/project-structure-api.md](modules/project-structure-api.md)

### 5.2 API Design
**See:** [modules/project-structure-api.md](modules/project-structure-api.md) - RESTful endpoints, request/response format, error codes

### 5.3 Middleware Stack
{{MIDDLEWARE}}

**Example:**
1. CORS
2. Body parser
3. Authentication (JWT verification)
4. Rate limiting
5. Error handler

### 5.4 Business Logic Layer
{{BUSINESS_LOGIC}}

**Example:**
- Services in `lib/services/*.server.ts`
- Domain models
- Validation with Zod
- Error handling with custom exceptions

---

## 6. Database Design

**See:** [modules/database-schema.md](modules/database-schema.md)
- ERD, Prisma schema, indexes

---

## 7. Authentication & Authorization

**See:** [modules/security-auth-deployment.md](modules/security-auth-deployment.md)
- Auth strategy, auth flow, protected routes, security measures

---

## 8. API Specification

**See:** [modules/project-structure-api.md](modules/project-structure-api.md)
- All endpoints, request/response formats, error codes

---

## 9. Testing Strategy

**Testing approach:**
{{TESTING_STRATEGY}}

**Example:**
- **Unit tests:** Vitest
  - All services (`*.server.ts`)
  - All utilities
  - Target: 80%+ coverage

- **Integration tests:** Vitest + MSW
  - API routes
  - Database operations
  - Authentication flows

- **E2E tests:** Playwright
  - Critical user flows
  - Cross-browser testing

**Test structure:**
```
__tests__/
├── unit/           # Service and util tests
├── integration/    # API and DB tests
└── e2e/            # Playwright tests
```

**See:** `.project-management/rules/TESTING-RULES.md` for complete testing standards.

---

## 10. Deployment

**See:** [modules/security-auth-deployment.md](modules/security-auth-deployment.md)
- Hosting platform, environment variables, deployment process, health checks

---

## 11. Performance Requirements

**Targets:**
{{PERFORMANCE_TARGETS}}

**Example:**
| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5s |
| Time to Interactive (TTI) | < 3.5s |
| API Response (p95) | < 500ms |
| Database Query (p95) | < 100ms |

**Optimization strategies:**
- Code splitting
- Lazy loading
- Image optimization
- Database indexes
- Caching (Redis)

---

## 12. Monitoring & Logging

{{MONITORING}}

**Example:**
- **APM:** Sentry
- **Logging:** Winston (structured logs)
- **Metrics:** Custom dashboards
- **Alerts:** Error rate > 1%, Response time > 1s

---

## 13. Development Workflow

**Standards:**
- Code quality: See `.claude/rules/code-quality.md`
- Git conventions: See `.claude/rules/git.md`
- Testing: See `.project-management/rules/TESTING-RULES.md`

**Workflow:**
```
1. Create branch (feat/*, fix/*, refactor/*)
2. Implement feature
3. Write tests (80%+ coverage)
4. Run linter
5. Create PR
6. Code review
7. Merge to main
8. Auto-deploy
```

---

## 14. Appendices

### A. Environment Variables
{{ENV_VARS}}

**Example:** See [modules/security-auth-deployment.md](modules/security-auth-deployment.md)

### B. Third-Party Services
{{THIRD_PARTY}}

### C. References
- [Architecture Document](architecture.md)
- [API Documentation](api-spec.md)
- [Testing Rules](../rules/TESTING-RULES.md)

---

**Document Owner:** {{OWNER}}
**Last Updated:** {{DATE}}

---

## How to Use This Template

1. **Fill all `{{PLACEHOLDERS}}`** with project specifics
2. **Review shared modules** for standard sections
3. **Customize** project-specific sections (routing, state management, etc.)
4. **Keep updated** as architecture evolves

**AI Note:** This template references shared modules for common sections. Fill template-specific sections and reference modules for standard content.
