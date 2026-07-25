# LeadCRM API Documentation

Base URL: `http://localhost:3000` (development) or `https://your-deployed-url.vercel.app` (production)

Authentication is handled via an HTTP-only cookie named `session` containing a JWT token (7-day expiry).

---

## Authentication

### POST `/api/auth/login`

Login with email and password. Sets a `session` cookie.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Success (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN"
  }
}
```

**Errors:**
| Status | Body |
|--------|------|
| 400 | `{ "error": "Email and password are required" }` |
| 401 | `{ "error": "Invalid email or password" }` |
| 500 | `{ "error": "Internal server error" }` |

---

### POST `/api/auth/logout`

Clears the session cookie. No request body required.

**Success (200):**
```json
{ "message": "Logged out successfully" }
```

---

### GET `/api/auth/me`

Returns the currently authenticated user.

**Auth Required:** Yes (any authenticated user)

**Success (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

**Errors:**
| Status | Body |
|--------|------|
| 401 | `{ "error": "Not authenticated" }` |

---

## Leads

### POST `/api/leads`

Submit a new lead via the public form. No authentication required.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "company": "Acme Corp",
  "message": "Interested in your services"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Cannot be empty |
| `email` | string | Yes | Must contain `@` |
| `company` | string | No | Trimmed, defaults to null |
| `message` | string | No | Trimmed, defaults to null |

**Success (201):**
```json
{
  "lead": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "company": "Acme Corp",
    "message": "Interested in your services",
    "status": "NEW",
    "assignedToId": null,
    "createdAt": "2026-07-25T12:00:00.000Z",
    "updatedAt": "2026-07-25T12:00:00.000Z"
  }
}
```

**Errors:**
| Status | Body |
|--------|------|
| 422 | `{ "error": "Validation failed", "details": { "name": "...", "email": "..." } }` |
| 500 | `{ "error": "Internal server error" }` |

---

### GET `/api/leads`

List leads with pagination, filtering, and search.

**Auth Required:** Yes
- **ADMIN**: Sees all leads
- **MEMBER**: Only sees leads assigned to them

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | Min: 1 |
| `limit` | number | 10 | Min: 1, Max: 100 |
| `status` | string | — | Filter by status |
| `assignedTo` | string | — | Filter by user ID (ADMIN only) |
| `search` | string | — | Search name, email, or company |

**Success (200):**
```json
{
  "leads": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "company": "Acme Corp",
      "message": "...",
      "status": "NEW",
      "assignedToId": "uuid",
      "createdAt": "2026-07-25T12:00:00.000Z",
      "updatedAt": "2026-07-25T12:00:00.000Z",
      "assignedTo": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "_count": {
        "notes": 3,
        "activities": 7
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### GET `/api/leads/:id`

Get a single lead by ID.

**Auth Required:** Yes. ADMIN sees all. MEMBER sees only assigned leads.

**URL Params:** `id` — lead UUID

**Success (200):**
```json
{
  "lead": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "company": "Acme Corp",
    "status": "CONTACTED",
    "assignedTo": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "_count": { "notes": 3, "activities": 7 }
  }
}
```

**Errors:**
| Status | Body |
|--------|------|
| 401 | `{ "error": "Not authenticated" }` |
| 403 | `{ "error": "Forbidden" }` |
| 404 | `{ "error": "Lead not found" }` |

---

### PATCH `/api/leads/:id`

Update a lead's fields or status.

**Auth Required:** Yes. ADMIN sees all. MEMBER sees only assigned leads.

**URL Params:** `id` — lead UUID

**Request Body (all optional):**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "company": "New Company",
  "message": "Updated message",
  "status": "QUALIFIED"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Cannot be empty |
| `email` | string | Must contain `@` |
| `company` | string | Trimmed, null if empty |
| `message` | string | Trimmed, null if empty |
| `status` | string | One of: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `WON`, `LOST` |

**Success (200):**
```json
{
  "lead": {
    "id": "uuid",
    "name": "Updated Name",
    "status": "QUALIFIED",
    ...
  }
}
```

**Errors:**
| Status | Body |
|--------|------|
| 400 | `{ "error": "No valid fields to update" }` |
| 401 | `{ "error": "Not authenticated" }` |
| 403 | `{ "error": "Forbidden" }` |
| 404 | `{ "error": "Lead not found" }` |
| 422 | `{ "error": "Validation failed", "details": { "status": "..." } }` |

---

### DELETE `/api/leads/:id`

Delete a lead and all associated notes and activity logs.

**Auth Required:** Yes — `ADMIN` role only.

**URL Params:** `id` — lead UUID

**Success (200):**
```json
{ "message": "Lead deleted successfully" }
```

**Errors:**
| Status | Body |
|--------|------|
| 401 | `{ "error": "Not authenticated" }` |
| 403 | `{ "error": "Only admins can delete leads" }` |
| 404 | `{ "error": "Lead not found" }` |

---

## Notes

### GET `/api/leads/:id/notes`

List all notes for a lead.

**Auth Required:** Yes. ADMIN sees all. MEMBER sees only notes on assigned leads.

**URL Params:** `id` — lead UUID

**Success (200):**
```json
{
  "notes": [
    {
      "id": "uuid",
      "content": "Follow-up call scheduled",
      "leadId": "uuid",
      "authorId": "uuid",
      "createdAt": "2026-07-25T14:00:00.000Z",
      "updatedAt": "2026-07-25T14:00:00.000Z",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

---

### POST `/api/leads/:id/notes`

Add a note to a lead.

**Auth Required:** Yes. ADMIN sees all. MEMBER sees only notes on assigned leads.

**URL Params:** `id` — lead UUID

**Request Body:**
```json
{
  "content": "Follow-up call scheduled for next week"
}
```

| Field | Type | Required |
|-------|------|----------|
| `content` | string | Yes — cannot be empty |

**Success (201):**
```json
{
  "note": {
    "id": "uuid",
    "content": "Follow-up call scheduled for next week",
    "leadId": "uuid",
    "authorId": "uuid",
    "createdAt": "2026-07-25T14:00:00.000Z",
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Errors:**
| Status | Body |
|--------|------|
| 422 | `{ "error": "Validation failed", "details": { "content": "Note content is required" } }` |

---

## Lead Assignment

### PATCH `/api/leads/:id/assign`

Reassign a lead to a different user.

**Auth Required:** Yes — `ADMIN` role only.

**URL Params:** `id` — lead UUID

**Request Body:**
```json
{
  "assignedToId": "user-uuid"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `assignedToId` | string | Yes | Must be a valid user ID |

**Success (200):**
```json
{
  "lead": {
    "id": "uuid",
    "assignedToId": "user-uuid",
    "assignedTo": {
      "id": "user-uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

**Errors:**
| Status | Body |
|--------|------|
| 401 | `{ "error": "Not authenticated" }` |
| 403 | `{ "error": "Only admins can assign leads" }` |
| 404 | `{ "error": "Lead not found" }` or `{ "error": "User not found" }` |
| 422 | `{ "error": "Validation failed", "details": { "assignedToId": "A valid user ID is required" } }` |

---

## Activity Log

### GET `/api/leads/:id/activity`

Get paginated activity log for a lead.

**Auth Required:** Yes. ADMIN sees all. MEMBER sees only activity on assigned leads.

**URL Params:** `id` — lead UUID

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | Min: 1 |
| `limit` | number | 20 | Min: 1, Max: 100 |

**Success (200):**
```json
{
  "activities": [
    {
      "id": "uuid",
      "action": "Lead created by public form",
      "leadId": "uuid",
      "actorId": null,
      "createdAt": "2026-07-25T12:00:00.000Z",
      "actor": null
    },
    {
      "id": "uuid",
      "action": "Status changed from NEW to CONTACTED",
      "leadId": "uuid",
      "actorId": "uuid",
      "createdAt": "2026-07-25T13:00:00.000Z",
      "actor": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## Roles

| Role | Capabilities |
|------|-------------|
| **ADMIN** | Full access to all leads, assign/reassign leads, delete leads, view all activity |
| **MEMBER** | View and edit only leads assigned to them, add notes |
| **Unauthenticated** | Submit leads via public form, login/logout |

---

## Status Values

| Status | Description |
|--------|-------------|
| `NEW` | Newly created lead (default) |
| `CONTACTED` | Initial contact made |
| `QUALIFIED` | Lead meets criteria |
| `PROPOSAL` | Proposal sent |
| `WON` | Deal closed successfully |
| `LOST` | Deal lost |

---

## Authentication Details

- **Token type:** JWT (HS256)
- **Expiry:** 7 days
- **Storage:** HTTP-only cookie named `session`
- **Password hashing:** bcryptjs
- **No public signup** — users are created manually by an admin
