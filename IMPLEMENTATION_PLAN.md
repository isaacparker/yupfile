# Consay MVP Implementation Plan

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Vercel Postgres + Prisma ORM |
| Auth | NextAuth.js (magic link via email) |
| Styling | Tailwind CSS + shadcn/ui |
| PDF Export | React-PDF |
| Hosting | Vercel |

---

## Project Structure

```
consay/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Magic link login
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth-protected layout
│   │   ├── page.tsx                # Consent records list
│   │   ├── new/page.tsx            # Create consent request
│   │   ├── records/[id]/page.tsx   # View/manage single record
│   │   └── workspaces/page.tsx     # Workspace management
│   ├── c/[slug]/page.tsx           # Public consent record page
│   ├── approve/[token]/page.tsx    # Creator approval page
│   └── api/
│       ├── records/route.ts        # CRUD for consent records
│       ├── approve/route.ts        # Handle creator approval
│       └── pdf/[id]/route.ts       # Generate PDF export
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── consent-record-card.tsx
│   ├── consent-timeline.tsx
│   ├── scope-selector.tsx
│   └── copy-generator.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client
│   ├── auth.ts                     # NextAuth config
│   ├── consent-copy.ts             # Generate consent text
│   └── tokens.ts                   # Approval token generation
├── prisma/
│   └── schema.prisma
└── public/
```

---

## Data Model (Prisma Schema)

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  createdAt     DateTime    @default(now())
  workspaces    Workspace[]
}

model Workspace {
  id            String          @id @default(cuid())
  name          String
  userId        String
  user          User            @relation(fields: [userId], references: [id])
  records       ConsentRecord[]
  createdAt     DateTime        @default(now())
}

model ConsentRecord {
  id            String         @id @default(cuid())
  slug          String         @unique  // For public URL: /c/[slug]
  contentUrl    String
  creatorHandle String
  platform      String         // e.g., "instagram", "tiktok", "twitter"
  workspaceId   String
  workspace     Workspace      @relation(fields: [workspaceId], references: [id])
  events        ConsentEvent[]
  screenshots   Screenshot[]
  createdAt     DateTime       @default(now())
}

model ConsentEvent {
  id                 String        @id @default(cuid())
  recordId           String
  record             ConsentRecord @relation(fields: [recordId], references: [id])
  eventType          String        // "initial" | "expanded"
  scope              String        // "organic" | "paid_ads" | "organic_and_ads"
  consentText        String        // Verbatim text shown to creator
  status             String        // "pending" | "approved" | "declined"
  approvalToken      String        @unique  // For approval link
  approvalTokenExpiry DateTime?
  approvedAt         DateTime?
  createdAt          DateTime      @default(now())
}

model Screenshot {
  id          String        @id @default(cuid())
  recordId    String
  record      ConsentRecord @relation(fields: [recordId], references: [id])
  url         String        // Stored file URL
  caption     String?
  uploadedAt  DateTime      @default(now())
}
```

---

## Key URLs

| URL | Purpose | Access |
|-----|---------|--------|
| `/login` | Magic link auth | Public |
| `/` | Dashboard - list records | Auth required |
| `/new` | Create consent request | Auth required |
| `/records/[id]` | Manage single record | Auth required |
| `/c/[slug]` | Public consent record | Anyone with link |
| `/approve/[token]` | Creator approval page | Anyone with token |

---

## Scope Options (MVP)

```typescript
const SCOPES = {
  organic: "Organic social media posts only",
  paid_ads: "Paid advertising",
  organic_and_ads: "Both organic posts and paid advertising"
} as const;
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind + shadcn/ui
- [ ] Configure Prisma + Vercel Postgres
- [ ] Set up NextAuth.js with magic link (email provider)
- [ ] Create basic layout with auth protection

### Phase 2: Core Data & Workspaces
- [ ] Implement Prisma schema and run migrations
- [ ] Build workspace creation/selection UI
- [ ] Create workspace switcher in nav

### Phase 3: Consent Record Creation (Flow A)
- [ ] Build "New Consent Request" form
  - Content URL input
  - Creator handle + platform selector
  - Scope selector (required)
- [ ] Generate consent text copy (templated, human language)
- [ ] Create consent record + pending event in DB
- [ ] Generate unique approval token
- [ ] Display copyable approval link + message copy for DM

### Phase 4: Creator Approval Page
- [ ] Build `/approve/[token]` page
  - Show consent text verbatim
  - Show scope clearly
  - One-click "Approve" button
- [ ] Handle approval: update event status, log timestamp
- [ ] Handle decline: update event status
- [ ] Handle expired/invalid tokens gracefully

### Phase 5: Public Consent Record Page
- [ ] Build `/c/[slug]` page
  - Content URL
  - Creator handle + platform
  - Full event timeline (append-only history)
  - Each event shows: scope, consent text, timestamp, status
- [ ] No edit capabilities on public page

### Phase 6: Dashboard & List View
- [ ] Build records list with cards showing:
  - Creator handle
  - Platform
  - Current status (pending/approved)
  - Current scope
  - Link to manage
- [ ] Add filters: by status, by scope
- [ ] Add workspace filter (if multiple)

### Phase 7: Scope Expansion (Flow B)
- [ ] On record detail page, add "Request Expanded Scope" button
- [ ] Generate new consent event with new scope
- [ ] Generate follow-up message copy (for operator to send manually)
- [ ] New approval link for creator
- [ ] Append new event to timeline (never overwrite)

### Phase 8: Screenshots & PDF Export
- [ ] Add screenshot upload to consent records (fallback proof)
- [ ] Build PDF export using React-PDF
  - Include all event history
  - Include consent text verbatim
  - Timestamp each event

### Phase 9: Polish & Deploy
- [ ] Error handling and loading states
- [ ] Mobile responsiveness
- [ ] Deploy to Vercel
- [ ] Set up environment variables (DB, email provider for magic link)

---

## Verification / Testing Plan

1. **Auth flow**: Request magic link → receive email → click → logged in
2. **Create record**: Fill form → get approval link → copy message
3. **Creator approval**: Open approval link → see consent text → click approve → confirmed
4. **Public record**: Visit `/c/[slug]` → see full timeline with approved event
5. **Scope expansion**: Request expanded scope → new approval link → creator approves → timeline shows both events
6. **PDF export**: Download PDF → verify all data present
7. **Filters**: Filter by status/scope → list updates correctly

---

## Environment Variables Needed

```
DATABASE_URL=           # Vercel Postgres connection string
NEXTAUTH_SECRET=        # Random secret for NextAuth
NEXTAUTH_URL=           # App URL (e.g., https://consay.vercel.app)
EMAIL_SERVER=           # SMTP for magic link emails
EMAIL_FROM=             # Sender email address
```

---

## Notes

- **No legal language**: UI should say "consent" and "approval", never "agreement" or "contract"
- **Append-only**: Events are never deleted or modified after creation
- **Tokens**: Approval tokens should be cryptographically random, URL-safe, and optionally time-limited
- **Slug generation**: Use nanoid or similar for short, unique, URL-safe slugs
