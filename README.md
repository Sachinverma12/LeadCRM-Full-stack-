# LeadCRM — Lead Management System

A full-featured CRM built with **Next.js 16**, **Prisma**, **PostgreSQL**, and **Tailwind CSS**. Includes public lead capture, authenticated dashboard, role-based access (Admin/Member), activity logging, and notes.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT (jose) + bcryptjs password hashing
- **UI**: Tailwind CSS + shadcn/ui components + Lucide icons
- **Styling**: tw-animate-css for animations

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/leadcrm"
JWT_SECRET="your-secure-secret-key-change-in-production"
```

### Installation

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed an Admin User

Since there's no public signup (admin creates accounts manually), use Prisma Studio:

```bash
npx prisma studio
```

Generate a bcrypt hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

Add a row to the `User` table with:
- `email`: your email
- `password`: the bcrypt hash
- `name`: your name
- `role`: ADMIN

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with email + password → returns user + sets session cookie |
| POST | `/api/auth/logout` | No | Clears session cookie |
| GET | `/api/auth/me` | Yes | Returns the currently authenticated user |

### Leads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/leads` | No | Public lead submission (name, email, company?, message?) |
| GET | `/api/leads` | Yes | List leads (paginated, filterable). Members see only assigned leads |
| GET | `/api/leads/[id]` | Yes | Get single lead details |
| PATCH | `/api/leads/[id]` | Yes | Update lead fields (name, email, company, message, status) |
| DELETE | `/api/leads/[id]` | Yes (Admin) | Delete a lead and all associated notes/activities |

**Query Parameters for GET /api/leads:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `status` — filter by LeadStatus (NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST)
- `assignedTo` — filter by user ID (Admin only)
- `search` — search name, email, company (case-insensitive)

### Notes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/[id]/notes` | Yes | List all notes for a lead |
| POST | `/api/leads/[id]/notes` | Yes | Add a note to a lead |

### Assignments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/leads/[id]/assign` | Yes (Admin) | Reassign lead to another user |

### Activity Log

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads/[id]/activity` | Yes | Get paginated activity log for a lead |

---

## Sample API Requests

### Login as Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

### Create a Lead (Public)
```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","company":"Acme Inc","message":"Interested in your services"}'
```

### List Leads (Authenticated)
```bash
curl http://localhost:3000/api/leads?page=1&limit=10&status=NEW
```

### Update Lead Status
```bash
curl -X PATCH http://localhost:3000/api/leads/[ID] \
  -H "Content-Type: application/json" \
  -d '{"status":"CONTACTED"}'
```

### Add a Note
```bash
curl -X POST http://localhost:3000/api/leads/[ID]/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"Called the client, interested in demo"}'
```

### Assign Lead (Admin only)
```bash
curl -X PATCH http://localhost:3000/api/leads/[ID]/assign \
  -H "Content-Type: application/json" \
  -d '{"assignedToId":"user-id-here"}'
```

---

## Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| View all leads | ✅ | ❌ (only assigned) |
| Create leads | ✅ | ✅ |
| Edit any lead | ✅ | ❌ (only assigned) |
| Delete leads | ✅ | ❌ |
| Assign/reassign leads | ✅ | ❌ |
| Add notes to any lead | ✅ | ❌ (only assigned) |
| View activity logs | ✅ | ❌ (only assigned) |
| Users management page | ✅ | ❌ (redirected) |

---

## Project Structure

```
lead-platform/
├── app/
│   ├── api/auth/       # Auth endpoints (login, logout, me)
│   ├── api/leads/      # Leads CRUD + notes + assign + activity
│   ├── dashboard/      # Protected dashboard pages
│   ├── login/          # Login page
│   └── page.tsx        # Public lead capture form
├── components/ui/       # shadcn UI components
├── lib/
│   ├── auth.ts         # JWT sign/verify helpers
│   ├── session.ts      # getCurrentUser() helper
│   ├── prisma.ts       # Prisma client singleton
│   └── activity.ts     # Activity logging helpers
├── prisma/
│   └── schema.prisma   # Database schema
└── middleware.ts        # Auth + role-based middleware
```

## Deploy on Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables (`DATABASE_URL`, `JWT_SECRET`)
4. Deploy — Vercel auto-detects Next.js

For database, use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) for hosted PostgreSQL.
