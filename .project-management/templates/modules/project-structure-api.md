# Project Structure, Business Logic & API Module

**Part of:** technical-plan-template.md
**Sections:** 6-9 (i18n, Project Structure, Business Logic, API Design)

---

## 6. Internationalization (i18n)

> **Note:** Include this section only if your project requires multi-language support.

### Supported Languages
- {{LANG_1}} ({{CODE_1}}) - Primary
- {{LANG_2}} ({{CODE_2}}) - Secondary
- {{LANG_3}} ({{CODE_3}}) - Additional

**Example:**
- English (en) - Primary
- German (de) - Secondary
- Spanish (es) - Additional

### i18n Stack
{{I18N_STACK}}

**Example:**
- i18next 24.2.0
- react-i18next 15.4.0
- Translation files in `/locales/[lang]/[namespace].json`

### Translation Workflow
1. Add keys to `locales/en/*.json` (primary language)
2. Add translations to other language files
3. Use `useTranslation()` hook in components
4. Test language switching

---

## 7. Project Structure

```
project-root/
├── app/                          # Application code
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layout/              # Layout components
│   │   ├── features/            # Feature-specific components
│   │   └── common/              # Shared components
│   ├── lib/                     # Shared libraries
│   │   ├── services/            # Business logic (*.server.ts)
│   │   ├── utils/               # Helper functions
│   │   ├── validation/          # Zod schemas
│   │   ├── auth.server.ts       # Authentication helpers
│   │   └── db.server.ts         # Database client
│   ├── routes/                  # Route handlers
│   │   ├── _auth/               # Auth routes (login, register)
│   │   ├── _app/                # Protected app routes
│   │   └── api/                 # API endpoints
│   ├── types/                   # TypeScript types
│   ├── root.tsx                 # Root component
│   └── app.css                  # Global styles
├── prisma/                      # Database
│   ├── schema.prisma            # Prisma schema
│   ├── migrations/              # Migration files
│   └── seed.ts                  # Seed data
├── public/                      # Static assets
├── __tests__/                   # Tests
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # E2E tests
├── docs/                        # Documentation
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── vite.config.ts               # Vite config
```

### File Naming Conventions
- **Components:** `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Services:** `kebab-case.server.ts` (e.g., `user.server.ts`)
- **Utils:** `kebab-case.ts` (e.g., `format-date.ts`)
- **Routes:** `kebab-case.tsx` (e.g., `user-profile.tsx`)
- **Types:** `kebab-case.types.ts` (e.g., `user.types.ts`)
- **Tests:** `*.test.ts` or `*.test.tsx`

### Server-Only Code
**Pattern:** Use `.server.ts` suffix for server-only code that should never be bundled for client.

**Example:**
- `auth.server.ts` - Authentication logic
- `db.server.ts` - Database client
- `email.server.ts` - Email sending
- `user.server.ts` - User service

---

## 8. Business Logic & Domain Rules

### Core Business Rules

{{BUSINESS_RULES}}

**Example:**
1. **User Registration:**
   - Users must be 18+ years old
   - Email verification required within 24 hours
   - Password must meet complexity requirements

2. **Product Management:**
   - Product prices must be positive numbers
   - Maximum 5 images per product
   - Draft products not visible to customers

3. **Order Processing:**
   - Order total must match sum of line items + tax
   - Payment must complete before order confirmation
   - Orders cannot be modified after payment

### Validation Rules

**Client-side (Zod):**
```typescript
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18),
});
```

**Server-side (same schema):**
```typescript
export async function registerUser(data: unknown) {
  const validated = userSchema.parse(data); // Throws if invalid
  // ...
}
```

### Domain Constants

```typescript
export const CONSTANTS = {
  MIN_AGE: 18,
  MAX_PRODUCT_IMAGES: 5,
  MAX_CART_ITEMS: 50,
  SESSION_DURATION_DAYS: 7,
  PASSWORD_MIN_LENGTH: 8,
} as const;
```

---

## 9. API Design & Conventions

### RESTful Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **POST** | `/api/auth/register` | Register new user | No |
| **POST** | `/api/auth/login` | Login user | No |
| **POST** | `/api/auth/logout` | Logout user | Yes |
| **GET** | `/api/users/me` | Get current user | Yes |
| **PUT** | `/api/users/me` | Update current user | Yes |
| **GET** | `/api/products` | List products | No |
| **POST** | `/api/products` | Create product | Yes (VENDOR) |
| **GET** | `/api/products/:id` | Get product | No |
| **PUT** | `/api/products/:id` | Update product | Yes (OWNER) |
| **DELETE** | `/api/products/:id` | Delete product | Yes (OWNER) |

### Request/Response Format

**Standard Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "price": 99.99
  }
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |

---

[← Back to technical-plan-template.md](../technical-plan-template.md)
