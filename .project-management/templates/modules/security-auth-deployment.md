# Security, Authentication & Deployment Module

**Part of:** technical-plan-template.md
**Sections:** 5, 10, 11 (Authentication, Security, Deployment)

---

## 5. Authentication & Sessions

### Authentication Strategy
{{AUTH_STRATEGY}}

**Example:**
- **Strategy:** JWT tokens stored in HTTP-only cookies
- **Session Duration:** 7 days (refresh token), 15 minutes (access token)
- **Password Hashing:** bcrypt with salt rounds 10
- **Token Storage:** HTTP-only, Secure, SameSite=Strict cookies

### Auth Flow

```
1. User submits credentials (email + password)
2. Server validates credentials against database
3. Server generates JWT access token (15min) + refresh token (7 days)
4. Server sets HTTP-only cookies with tokens
5. Client includes cookie automatically in requests
6. Server middleware validates token on each request
7. Grant/deny access based on role and permissions
```

### Protected Routes

| Route | Required Role | Description |
|-------|---------------|-------------|
| `/app/*` | USER | Authenticated users only |
| `/admin/*` | ADMIN | Admin users only |
| `/vendor/*` | VENDOR | Vendor users only |
| `/api/*` | Varies | API endpoints (check per route) |

---

## 10. Security

### Security Measures

**Authentication:**
- ✅ bcrypt password hashing (salt rounds: 10)
- ✅ HTTP-only, Secure cookies
- ✅ SameSite=Strict for CSRF protection
- ✅ Token expiration (access: 15min, refresh: 7 days)

**Input Validation:**
- ✅ Zod schema validation on client and server
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS prevention (React auto-escapes, DOMPurify for rich text)

**Authorization:**
- ✅ Role-based access control (RBAC)
- ✅ Resource ownership checks
- ✅ Protected routes with middleware

**Data Protection:**
- ✅ HTTPS only (enforced)
- ✅ Environment variables for secrets
- ✅ No secrets in client bundle
- ✅ Rate limiting on API endpoints

**OWASP Top 10 Compliance:**
- ✅ A01: Broken Access Control - RBAC implemented
- ✅ A02: Cryptographic Failures - bcrypt, HTTPS
- ✅ A03: Injection - Parameterized queries
- ✅ A04: Insecure Design - Security by design
- ✅ A05: Security Misconfiguration - Secure defaults
- ✅ A06: Vulnerable Components - npm audit
- ✅ A07: Authentication Failures - Strong auth
- ✅ A08: Data Integrity - Validation
- ✅ A09: Logging Failures - Error logging
- ✅ A10: SSRF - Input validation

---

## 11. Deployment

### Hosting Platform
{{HOSTING_PLATFORM}}

**Example:** Railway (auto-deploy from `main` branch)

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | Yes | `random-32-char-string` |
| `NODE_ENV` | Environment (development/production) | Yes | `production` |
| `PORT` | Server port | No | `3000` |
| `STRIPE_SECRET_KEY` | Stripe API key | Yes | `sk_live_...` |
| `SENDGRID_API_KEY` | SendGrid API key | Yes | `SG.xxx` |

### Deployment Process

```
1. Push to main branch
2. CI/CD triggers (GitHub Actions / Railway)
3. Run tests
4. Run linter
5. Build application
6. Run database migrations (prisma migrate deploy)
7. Deploy to production
8. Health check
```

### Health Check Endpoint

```typescript
// GET /api/health
{
  "status": "ok",
  "timestamp": "2026-03-25T10:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

[← Back to technical-plan-template.md](../technical-plan-template.md)
