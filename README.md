# LeadCRM — Lead Management System

A full-featured CRM for managing business leads, tracking activities, and closing deals. Built with **Next.js 16**, **Prisma**, **PostgreSQL**, and **Tailwind CSS**.

---

## Quick Links

| Resource | Link |
|----------|------|
| **GitHub Repo** | [https://github.com/Sachinverma12/LeadCRM-Full-stack-](https://github.com/Sachinverma12/LeadCRM-Full-stack-) |
| **Live App** | [https://leadcrm-full-stack-81hp.vercel.app/](https://leadcrm-full-stack-81hp.vercel.app/) |
| **API Docs** | See [API Documentation](#api-documentation) below |

---

## Test Credentials

### Admin Account
| Field | Value |
|-------|-------|
| Email | `admin01@gmail.com` |
| Password | `Admin@12345` |
| Access | All leads, user management, delete, assign/reassign |

### Member Account
| Field | Value |
|-------|-------|
| Email | `member@leadcrm.com` |
| Password | `Member@12345` |
| Access | Only leads assigned to them |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Auth | JWT (jose) + bcryptjs |
| UI | shadcn/ui + Tailwind CSS 4 |
| Icons | Lucide React |
| Testing | Vitest |

---

## Features

- **Public Lead Capture** — Landing page form for submitting leads without authentication
- **Role-Based Access** — Admin sees all leads; Member sees only assigned leads
- **Activity Logging** — Automatic tracking of status changes, notes, and assignments
- **Notes System** — Add notes to any lead
- **Lead Assignment** — Admin can assign/reassign leads to team members
- **Dashboard** — Stats cards showing lead counts by status
- **Search & Filter** — Paginated leads list with status and text search
- **Responsive Design** — Mobile-friendly with sidebar navigation
- **Security** — Rate limiting, input validation, security headers, JWT auth

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Setup
```bash
# Clone the repo
git clone https://github.com/Sachinverma12/LeadCRM-Full-stack-.git
cd LeadCRM-Full-stack-

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrations
npx prisma migrate dev

# Seed test users
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with email + password |
| POST | `/api/auth/logout` | No | Clear session cookie |
| GET | `/api/auth/me` | Yes | Get current user |

**POST /api/auth/login**
```json
// Request
{ "email": "admin01@gmail.com", "password": "Admin@12345" }

// Response (200)
{
  "user": {
    "id": "cms07t4wn0000q4uaomkw52pq",
    "email": "admin01@gmail.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

### Leads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/leads` | No | Submit a new lead (public) |
| GET | `/api/leads` | Yes | List leads (paginated, filterable) |
| GET | `/api/leads/:id` | Yes | Get single lead |
| PATCH | `/api/leads/:id` | Yes | Update lead |
| DELETE | `/api/leads/:id` | Admin | Delete lead |

**POST /api/leads** (Public)
```json
// Request
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "company": "Acme Corp",
  "message": "Interested in services"
}

// Response (201)
{
  "lead": {
    "id": "...",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "company": "Acme Corp",
    "status": "NEW"
  }
}
```

**GET /api/leads** (Authenticated)
```
Query Parameters:
  page      - Page number (default: 1)
  limit     - Items per page (default: 10, max: 100)
  status    - Filter by status (NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST)
  assignedTo - Filter by user ID (Admin only)
  search    - Search name, email, company
```

### Notes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/:id/notes` | Yes | List notes for a lead |
| POST | `/api/leads/:id/notes` | Yes | Add a note |

**POST /api/leads/:id/notes**
```json
// Request
{ "content": "Follow-up call scheduled for next week" }

// Response (201)
{
  "note": {
    "id": "...",
    "content": "Follow-up call scheduled for next week",
    "author": { "id": "...", "name": "Admin User" }
  }
}
```

### Assignments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/leads/:id/assign` | Admin | Reassign lead to another user |

### Activity Log

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/:id/activity` | Yes | Paginated activity log |

### Status Values

| Status | Description |
|--------|-------------|
| `NEW` | Newly created (default) |
| `CONTACTED` | Initial contact made |
| `QUALIFIED` | Lead meets criteria |
| `PROPOSAL` | Proposal sent |
| `WON` | Deal closed successfully |
| `LOST` | Deal lost |

---

## Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| View all leads | ✅ | ❌ (only assigned) |
| Edit leads | ✅ | ❌ (only assigned) |
| Delete leads | ✅ | ❌ |
| Assign/reassign | ✅ | ❌ |
| Add notes | ✅ | ✅ (assigned only) |
| View activity | ✅ | ✅ (assigned only) |
| User management | ✅ | ❌ |

---

## Security Features

- **Server-side middleware** — JWT verification on all protected routes
- **Rate limiting** — Login: 5 attempts/min, Public form: 10/hour per IP
- **Input validation** — Email regex, length limits on all fields
- **Security headers** — X-Frame-Options, HSTS, CSP, X-Content-Type-Options
- **JWT expiry** — 1-day token lifetime
- **Password hashing** — bcrypt with 12 salt rounds
- **No password exposure** — Passwords never returned in API responses

---

## Project Structure

```
lead-platform/
├── app/
│   ├── api/auth/         # Auth endpoints (login, logout, me)
│   ├── api/leads/        # Leads CRUD + notes + assign + activity
│   ├── dashboard/        # Protected dashboard pages
│   ├── login/            # Login page
│   └── page.tsx          # Public lead capture form
├── components/
│   ├── Footer.tsx        # Site-wide footer
│   └── ui/               # shadcn UI components
├── lib/
│   ├── auth.ts           # JWT sign/verify
│   ├── session.ts        # getCurrentUser()
│   ├── prisma.ts         # Prisma client singleton
│   ├── rate-limit.ts     # Rate limiting utility
│   └── activity.ts       # Activity logging
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Test user creation
├── tests/
│   ├── auth.test.ts      # Auth unit tests
│   └── e2e-flow.test.ts  # Integration tests
├── middleware.ts          # Auth + role-based middleware
├── API.md                # Full API documentation
└── package.json
```

---

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**
- `tests/auth.test.ts` — 4 unit tests (JWT sign/verify, invalid tokens, expiry)
- `tests/e2e-flow.test.ts` — 8 integration tests (lead CRUD, auth flows, notes)

---

## AI Usage

This project was developed with the assistance of an AI coding assistant (OpenCode). The AI was used for:

- **Code Generation** — Generating boilerplate for API routes, Prisma schema, and UI components
- **Security Audit** — Performing a comprehensive security review and implementing fixes (middleware, rate limiting, input validation, security headers)
- **Documentation** — Writing API documentation, README, and code comments
- **Debugging** — Diagnosing build failures on Vercel and fixing deployment issues

**What I changed manually:**
- Customized the UI design and styling to match the dark theme
- Adjusted the business logic for role-based access control
- Modified the seed script to use specific test credentials
- Configured environment variables and deployment settings
- Reviewed and approved all AI-generated code before committing

---

## Assumptions

1. **No public signup** — Users are created manually by an admin. The public form is for lead capture only.
2. **Single-tenant** — The system is designed for a single organization, not multi-tenant.
3. **PostgreSQL required** — Uses Prisma with PostgreSQL-specific features (driver adapter).
4. **Email-based auth** — No social login, OAuth, or magic links. Simple email + password.
5. **Throwaway credentials** — Test credentials use non-production emails and simple passwords.
6. **JWT in cookies** — Authentication uses HTTP-only cookies, not Authorization headers.
7. **Admin creates members** — There is no self-registration. Admin invites/creates team members.
8. **Activity is append-only** — Activity logs cannot be deleted or modified.
9. **Notes are permanent** — Once added, notes cannot be deleted (by design for audit trail).
10. **Status transitions** — Any status can transition to any other status (no workflow enforcement).

---

## Deployment

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `DATABASE_URL` — PostgreSQL connection string
   - `JWT_SECRET` — Random secret (use `openssl rand -base64 64`)
4. Deploy — Vercel auto-detects Next.js
5. Run seed: `npm run db:seed`

---

## License

This project was built for Digital Heroes Training Task.
