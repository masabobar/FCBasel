# Database Schema Module

**Part of:** technical-plan-template.md
**Section:** 4 (Database Schema)

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Product   │       │    Order    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │───┐   │ id          │───┐   │ id          │
│ email       │   │   │ name        │   │   │ userId      │──┐
│ passwordHash│   │   │ price       │   │   │ totalAmount │  │
│ role        │   │   │ userId      │──┘│   │ status      │  │
│ createdAt   │   │   │ createdAt   │   │   │ createdAt   │  │
└─────────────┘   │   └─────────────┘   │   └─────────────┘  │
                  │                     │            │        │
                  │                     └────────────┼────────┘
                  │                                  │
                  └──────────────────────────────────┘

```

### 4.2 Prisma Schema (Example)

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         UserRole  @default(USER)
  profile      Profile?
  products     Product[]
  orders       Order[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([email])
  @@map("users")
}

enum UserRole {
  USER
  VENDOR
  ADMIN
}

model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  firstName String?
  lastName  String?
  avatar    String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("profiles")
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@map("products")
}

model Order {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  totalAmount Decimal     @db.Decimal(10, 2)
  status      OrderStatus @default(PENDING)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([userId])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### 4.3 Database Indexes

| Table | Index | Fields | Purpose |
|-------|-------|--------|---------|
| users | email_idx | email | Fast user lookup by email |
| products | user_id_idx | userId | Query all products by user |
| orders | user_id_idx | userId | Query all orders by user |
| orders | status_idx | status | Filter orders by status |

---

[← Back to technical-plan-template.md](../technical-plan-template.md)
