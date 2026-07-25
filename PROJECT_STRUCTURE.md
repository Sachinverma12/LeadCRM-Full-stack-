cna # Project Structure — LeadCRM

A detailed breakdown of every folder and file in the LeadCRM lead management system.

---

## Root Overview

```
lead-platform/
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable UI components
├── lib/                    # Core library code (auth, db, utils)
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets (icons, images)
├── tests/                  # Automated test files
├── middleware.ts           # Next.js middleware for auth & role checks
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── vitest.config.ts        # Test runner configuration
├── eslint.config.mjs       # Linting rules
├── postcss.config.mjs      # CSS processing configuration
├── components.json         # shadcn/ui components configuration
├── CLAUDE.md               # AI assistant instructions
├── AGENTS.md               # Agent workflow documentation
├── TODO.md                 # Build progress tracker
├── README.md               # Main project documentation
├── .gitignore              # Git ignore rules
├── prisma.config.ts        # Prisma additional config
└── skills-lock.json        # Build tool lock file
```

---

## 1. `app/` — Application Pages & API Routes

### 1.1 `app/page.tsx` — Public Lead Capture Form
- **Purpose**: Landing page visible to everyone. Contains a lead submission form.
- **Access**: No authentication required.
- **Behavior**: Submits `POST /api/leads` with name, email, company (optional), message (optional).

### 1.2 `app/layout.tsx` — Root Layout
- **Purpose**: Global HTML structure, imports global CSS and fonts.
- **Children**: Wraps all pages.

### 1.3 `app/globals.css` — Global Styles
- **Purpose**: Tailwind CSS directives and any custom global styles.

### 1.4 `app/favicon.ico` — Browser Tab Icon

---

### 1.5 `app/login/` — Authentication Page

#### `app/login/page.tsx`
- **Purpose**: Login page with email/password form.
- **Behavior**: Calls `POST /api/auth/login`, stores session cookie, redirects to `/dashboard`.

---

### 1.6 `app/dashboard/` — Protected Dashboard

#### `app/dashboard/layout.tsx`
- **Purpose**: Dashboard layout with sidebar navigation (Leads list, Users management).
- **Features**: Shows current user info, role badge, logout button.
- **Role-based**: Admin sees "Users" link in sidebar, Member does not.

#### `app/dashboard/page.tsx`
- **Purpose**: Dashboard home page with statistics cards:
  - Total leads count
  - Leads by status (NEW, CONTACTED, etc.)
  - Recent activity summary

---

#### `app/dashboard/leads/` — Leads Management

##### `app/dashboard/leads/page.tsx`
- **Purpose**: Paginated leads list table with:
  - Filters: status dropdown, search box (name/email/company)
  - Pagination controls
  - Assignee column (shows assigned user name)
  - Status badges with color coding
  - Click to navigate to lead detail

##### `app/dashboard/leads/[id]/page.tsx`
- **Purpose**: Single lead detail view with:
  - Lead information card (name, email, company, message)
  - Inline editing for admin/assigned member
  - Status pipeline buttons (NEW → CONTACTED → QUALIFIED → PROPOSAL → WON → LOST)
  - Notes section with add/display
  - Assignment card (admin-only: dropdown to reassign)
  - Activity log timeline
  - Delete button (admin-only)

---

### 1.7 `app/api/` — REST API Endpoints

#### `app/api/auth/login/route.ts` — POST /api/auth/login
- **Purpose**: Authenticate user with email + password.
- **Access**: Public.
- **Returns**: User object + sets `session` HTTP-only cookie (JWT).
- **Status codes**: 200 (success), 401 (invalid credentials), 422 (validation error).

#### `app/api/auth/logout/route.ts` — POST /api/auth/logout
- **Purpose**: Clear session cookie.
- **Access**: Public.
- **Returns**: Success message.

#### `app/api/auth/me/route.ts` — GET /api/auth/me
- **Purpose**: Get currently authenticated user info.
- **Access**: Requires authentication (401 if not logged in).
- **Returns**: Current user object.

---

#### `app/api/leads/route.ts`
- **`GET /api/leads`** — List leads with pagination + filtering
  - **Access**: Authenticated users.
  - **Query params**: `page`, `limit`, `status`, `assignedTo` (admin-only), `search`.
  - **Permissions**: Members see only assigned leads; Admins see all.
  - **Returns**: `{ leads, pagination: { page, limit, total, totalPages } }`
- **`POST /api/leads`** — Create a new lead (public)
  - **Access**: No authentication required.
  - **Body**: `{ name, email, company?, message? }`
  - **Returns**: Created lead object (status 201).

#### `app/api/leads/[id]/route.ts`
- **`GET /api/leads/[id]`** — Get single lead details
  - **Permissions**: Admin sees any; Member sees only assigned.
- **`PATCH /api/leads/[id]`** — Update lead fields
  - **Validates**: name, email, company, message, status.
  - **Auto-logs**: status changes, field updates.
- **`DELETE /api/leads/[id]`** — Delete lead (ADMIN only)
  - **Cascades**: Deletes associated notes + activity logs.

#### `app/api/leads/[id]/notes/route.ts`
- **`GET /api/leads/[id]/notes`** — List all notes for a lead.
- **`POST /api/leads/[id]/notes`** — Add a note to a lead.
  - **Permissions**: Admin adds to any; Member adds to assigned only.
  - **Auto-logs**: Activity entry for "Note added".

#### `app/api/leads/[id]/assign/route.ts`
- **`PATCH /api/leads/[id]/assign`** — Reassign lead to another user.
  - **Access**: ADMIN only.
  - **Auto-logs**: "Reassigned from X to Y" or "Assigned to Y".

#### `app/api/leads/[id]/activity/route.ts`
- **`GET /api/leads/[id]/activity`** — Get paginated activity log for a lead.
  - **Query params**: `page`, `limit`.
  - **Includes**: actor name, action description, timestamp.

---

## 2. `components/` — Reusable UI Components

### `components/ui/button.tsx`
- **Purpose**: shadcn/ui Button component with variants (default, outline, ghost, destructive).
- **Usage**: Used across dashboard pages for consistent styling.

---

## 3. `lib/` — Core Library Code

### `lib/prisma.ts`
- **Purpose**: Singleton Prisma client instance.
- **Adapter**: Uses `@prisma/adapter-pg` for PostgreSQL connection.
- **Config**: Reads `DATABASE_URL` from environment.

### `lib/auth.ts`
- **Purpose**: JWT token creation and verification.
- **Functions**:
  - `signToken(payload)` — Create JWT with userId + role, expires in 7 days.
  - `verifyToken(token)` — Verify and decode JWT, returns null if invalid/expired.
- **Algorithm**: HS256 via `jose` library.

### `lib/session.ts`
- **Purpose**: Extract current user from request cookies.
- **Function**:
  - `getCurrentUser()` — Reads `session` cookie, verifies JWT, fetches user from DB.

### `lib/activity.ts`
- **Purpose**: Activity logging helpers.
- **Functions**:
  - `logActivity(action, leadId, actorId?)` — Create a single activity entry.
  - `logActivities(entries[])` — Bulk create multiple activity entries.

### `lib/utils.ts`
- **Purpose**: Common utility functions.
- **Key exports**: `cn()` — merges Tailwind CSS class names using `clsx` + `tailwind-merge`.

### `lib/generated/` — Auto-generated Prisma Client
- **Purpose**: Generated TypeScript client for database operations.
- **Note**: Regenerated with `npx prisma generate` — do not edit manually.

---

## 4. `prisma/` — Database Layer

### `prisma/schema.prisma`
- **Purpose**: Database schema definition.
- **Models**:
  - `User` — id, email (unique), password (hashed), name, role (ADMIN/MEMBER), createdAt
  - `Lead` — id, name, email, company?, message?, status (enum), assignedTo?, createdAt, updatedAt
  - `Note` — id, content, leadId (FK), authorId (FK), createdAt
  - `ActivityLog` — id, action (string), leadId (FK), actorId (FK?), createdAt
- **Enums**:
  - `Role` — ADMIN, MEMBER
  - `LeadStatus` — NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST

### `prisma/migrations/` — Database Migrations
- **Purpose**: Version-controlled database schema changes.
- **Folder**: `20260724173952_init/` — Initial migration creating all tables.

### `prisma/migrations/migration_lock.toml`
- **Purpose**: Lock file to ensure consistent migration state.

---

## 5. `public/` — Static Assets

| File | Purpose |
|------|---------|
| `file.svg` | Generic file icon |
| `globe.svg` | Globe/network icon |
| `next.svg` | Next.js logo |
| `vercel.svg` | Vercel logo |
| `window.svg` | Window/browser icon |

---

## 6. `tests/` — Automated Tests

### `tests/auth.test.ts`
- **Purpose**: Unit tests for JWT authentication token operations.
- **Tests (4)**:
  1. Sign and verify a valid token
  2. Return null for an invalid token
  3. Return null for an expired token
  4. Include role in token payload

### `tests/e2e-flow.test.ts`
- **Purpose**: Integration tests against a running dev server.
- **Flow 1 — Public Lead Capture** (2 tests):
  1. Submit a lead without authentication → 201 + lead data
  2. Reject lead with missing required fields → 422 + validation error
- **Flow 2 — Auth & Role-Based Access** (6 tests):
  1. Login as admin → get session cookie
  2. Reject invalid credentials → 401
  3. List all leads as admin → paginated results
  4. Update lead status as admin → status changes
  5. Add a note to a lead as admin → note created
  6. View activity log as admin → activity entries returned

---

## 7. Configuration Files

### `next.config.ts`
- **Purpose**: Next.js framework configuration (routing, build, etc.).

### `tsconfig.json`
- **Purpose**: TypeScript compiler options and path aliases (e.g., `@/` maps to `./`).

### `vitest.config.ts`
- **Purpose**: Vitest test runner configuration.

### `tailwind.config.ts`
- **Purpose**: Tailwind CSS customization (colors, spacing, etc.).

### `postcss.config.mjs`
- **Purpose**: PostCSS plugins configuration (Tailwind, autoprefixer).

### `eslint.config.mjs`
- **Purpose**: ESLint rules and Next.js plugin configuration.

### `components.json`
- **Purpose**: shadcn/ui component registry configuration.

### `package.json`
- **Purpose**: Project dependencies, scripts, and metadata.
- **Key scripts**:
  - `npm run dev` — Start development server (localhost:3000)
  - `npm run build` — Production build
  - `npm run test` — Run all tests
  - `npm run lint` — Run ESLint

---

## 8. `middleware.ts` — Edge Middleware

- **Purpose**: Runs on every `/dashboard/*` request for authentication + authorization.
- **Logic**:
  1. Read `session` cookie → verify JWT
  2. No valid token → redirect to `/login?redirect=...`
  3. MEMBER trying to access `/dashboard/users` → redirect to `/dashboard`
  4. Otherwise → allow request to proceed

---

## 9. Other Root Files

| File | Purpose |
|------|---------|
| `.gitignore` | Excludes `node_modules`, `.env`, `next-env.d.ts`, etc. |
| `README.md` | Project overview, setup instructions, API documentation |
| `TODO.md` | Build progress checklist |
| `CLAUDE.md` | AI assistant behavior guidelines |
| `AGENTS.md` | Multi-agent workflow documentation |
| `prisma.config.ts` | Additional Prisma configuration |
| `skills-lock.json` | Build tool dependency lock |
| `temp_build.mjs` | Temporary build helper script |
| `.temp_build.js` | Legacy temporary build file |

---

## Summary Table

| Layer | Folder | Purpose |
|-------|--------|---------|
| **Pages** | `app/` | Lead capture form, login, dashboard, lead list, lead detail |
| **API** | `app/api/` | Auth (login/logout/me), Leads CRUD, Notes, Assign, Activity |
| **DB** | `prisma/` | Schema (User, Lead, Note, ActivityLog), migrations |
| **Core** | `lib/` | Prisma client, JWT auth, session handling, activity logging |
| **UI** | `components/` | Reusable button component (shadcn/ui) |
| **Tests** | `tests/` | Auth unit tests (4), E2E integration tests (8) |
| **Config** | Root files | TypeScript, Tailwind, Vitest, ESLint, Next.js, PostCSS |
| **Edge** | `middleware.ts` | Auth guard + role-based route protection |
| **Static** | `public/` | Icons and images |
