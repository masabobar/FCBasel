# Architecture Document - {{PROJECT_NAME}}

**Version:** 1.0
**Date:** {{DATE}}
**Status:** {{STATUS}}
**Author:** {{AUTHOR}}

---

## Template Modules

This template references shared modules:
- **[Tech Stack & Architecture](modules/tech-stack-architecture.md)** - High-level architecture, component diagrams
- **[Database Schema](modules/database-schema.md)** - Data architecture, ERD
- **[Security & Deployment](modules/security-auth-deployment.md)** - Security architecture
- **[Design & Performance](modules/design-performance-monitoring.md)** - Performance, monitoring

**For AI:** Use modules for standard sections. Architecture-specific decisions below.

---

## 1. Executive Summary

**Project:** {{PROJECT_NAME}}
**Architecture Style:** {{ARCHITECTURE_STYLE}}
**Key Technologies:** {{KEY_TECH}}

**Summary:** {{SUMMARY}}

**Example:** {{PROJECT_NAME}} follows a modern 3-tier architecture with React frontend, Node.js/Express backend, and PostgreSQL database, deployed on Railway with automated CI/CD.

---

## 2. Architecture Overview

### 2.1 Architecture Style
{{ARCHITECTURE_STYLE}}

**Options:**
- Monolithic
- Microservices
- Serverless
- JAMstack
- 3-tier (most common)

**Example:** 3-tier architecture with clear separation of concerns (presentation, business logic, data).

### 2.2 Key Architectural Decisions

| Decision | Choice | Rationale | Trade-offs |
|----------|--------|-----------|------------|
| Architecture | {{CHOICE}} | {{RATIONALE}} | {{TRADEOFFS}} |
| Database | {{CHOICE}} | {{RATIONALE}} | {{TRADEOFFS}} |
| Deployment | {{CHOICE}} | {{RATIONALE}} | {{TRADEOFFS}} |

**Example:** See [modules/tech-stack-architecture.md](modules/tech-stack-architecture.md) for detailed architecture decisions table.

---

## 3. System Context

### 3.1 System Context Diagram

**See:** [modules/tech-stack-architecture.md](modules/tech-stack-architecture.md) for high-level architecture diagram.

### 3.2 External Systems & Integrations

| System | Purpose | Integration Method |
|--------|---------|-------------------|
| {{SYSTEM}} | {{PURPOSE}} | {{METHOD}} |

**Example:**
- Stripe: Payment processing (REST API)
- SendGrid: Email delivery (REST API)
- S3: File storage (AWS SDK)

---

## 4. Container Diagram

### 4.1 Application Containers

**Frontend Container:**
- Technology: {{FRONTEND_TECH}}
- Responsibilities: {{FRONTEND_RESP}}
- Communication: HTTPS to backend

**Backend Container:**
- Technology: {{BACKEND_TECH}}
- Responsibilities: {{BACKEND_RESP}}
- Communication: SQL to database, HTTPS to external APIs

**Database Container:**
- Technology: {{DATABASE_TECH}}
- Responsibilities: Data persistence
- Communication: SQL queries from backend

**See:** [modules/tech-stack-architecture.md](modules/tech-stack-architecture.md) for detailed architecture diagrams.

---

## 5. Component Architecture

### 5.1 Frontend Components

**See:** [modules/project-structure-api.md](modules/project-structure-api.md) for project structure.

**Key components:**
{{FRONTEND_COMPONENTS}}

### 5.2 Backend Components

**See:** [modules/project-structure-api.md](modules/project-structure-api.md) for backend structure.

**Key services:**
{{BACKEND_SERVICES}}

---

## 6. Data Architecture

### 6.1 Data Model

**See:** [modules/database-schema.md](modules/database-schema.md) for complete ERD and Prisma schema.

### 6.2 Data Flow Diagram

```
User → Frontend → API → Backend Service → Database
                                ↓
                        External Services
```

**Detailed flow:** See [modules/tech-stack-architecture.md](modules/tech-stack-architecture.md) for request flow diagram.

### 6.3 Data Storage Strategy

**Primary storage:** {{PRIMARY_STORAGE}}
**Caching:** {{CACHING}}
**File storage:** {{FILE_STORAGE}}

**Example:**
- Primary: PostgreSQL (relational data)
- Cache: Redis (sessions, frequently accessed data)
- Files: S3 (user uploads, static assets)

### 6.4 Caching Strategy

**Levels:**
1. Browser cache (static assets)
2. CDN cache (images, CSS, JS)
3. Application cache (Redis - sessions, product listings)
4. Database query cache

---

## 7. Security Architecture

**See:** [modules/security-auth-deployment.md](modules/security-auth-deployment.md)

### Key Security Measures
- HTTPS only
- JWT authentication
- Role-based access control (RBAC)
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection (React auto-escape)
- CSRF tokens
- Rate limiting

---

## 8. Integration Architecture

### 8.1 Third-Party Integrations

**See:** [modules/project-structure-api.md](modules/project-structure-api.md) for API design.

**Integrations:**
{{INTEGRATIONS}}

### 8.2 API Strategy

**Internal API:**
- RESTful design
- JSON request/response
- JWT authentication
- Versioning: URL path (`/api/v1/`)

**External APIs:**
- Service-specific clients
- Error handling
- Retry logic
- Rate limit handling

---

## 9. Deployment Architecture

**See:** [modules/security-auth-deployment.md](modules/security-auth-deployment.md)

**Infrastructure:**
{{INFRASTRUCTURE}}

**CI/CD Pipeline:**
1. Push to main
2. GitHub Actions trigger
3. Run tests
4. Build application
5. Deploy to {{HOSTING}}
6. Run migrations
7. Health check

---

## 10. Performance & Scalability

**See:** [modules/design-performance-monitoring.md](modules/design-performance-monitoring.md)

### Performance Targets
- Page load < 2s
- API response < 500ms
- Database query < 100ms

### Scalability Strategy
{{SCALABILITY}}

**Example:**
- Horizontal scaling: Multiple backend instances
- Database: Read replicas for scaling reads
- Caching: Redis cluster
- CDN: CloudFlare for static assets

---

## 11. Monitoring & Observability

**See:** [modules/design-performance-monitoring.md](modules/design-performance-monitoring.md)

**Stack:**
- APM: Sentry
- Logging: Winston
- Metrics: Custom dashboards
- Uptime: UptimeRobot

---

## 12. Disaster Recovery

### 12.1 Backup Strategy
{{BACKUP_STRATEGY}}

**Example:**
- Database: Daily automated backups (7-day retention)
- File storage: S3 versioning enabled
- Code: Git repository (multiple remotes)

### 12.2 Recovery Procedures
{{RECOVERY_PROCEDURES}}

**Example:**
1. Database restore from backup (<30 min RTO)
2. Redeploy application from git
3. Verify data integrity
4. Resume operations

---

## 13. Technical Debt & Future Considerations

### 13.1 Known Technical Debt
{{TECHNICAL_DEBT}}

### 13.2 Future Improvements
{{FUTURE_IMPROVEMENTS}}

**Example:**
- Microservices migration (if scale requires)
- GraphQL API (if client needs change)
- Real-time features (WebSockets)
- Mobile native apps

---

## 14. Appendices

### A. Architecture Decision Records (ADRs)
{{ADRS}}

### B. Glossary
{{GLOSSARY}}

### C. References
- [Technical Specification](technical-spec.md)
- [Database Schema](../templates/modules/database-schema.md)
- [System Overview](../SYSTEM-OVERVIEW.md)

---

**Document Owner:** {{OWNER}}
**Last Updated:** {{DATE}}

---

## How to Use This Template

1. **Fill `{{PLACEHOLDERS}}`** with project-specific information
2. **Reference shared modules** for standard architecture patterns
3. **Customize** integration and deployment sections
4. **Update** as architecture evolves
5. **Document decisions** in ADRs section

**AI Note:** This template references shared modules for common architecture patterns. Focus on project-specific architectural decisions and integration strategies.
