# MVP PRD — UGC Consent Record (Final)

## 1. Purpose

Teams reuse UGC constantly but rely on fragile screenshots, DMs, and spreadsheets to prove consent. The real pain is not getting a "yes" — it's proving what was approved later, especially when scope changes (organic → ads) or time passes.

This product creates a canonical consent record that replaces screenshots and reduces future panic.

## 2. Target User

### Primary

- Social media managers
- Growth / performance marketers
- Small agencies managing multiple brands

### Not the user

- Legal teams (blockers, not operators)
- Influencer managers running paid contracts

## 3. Core Job To Be Done

> "When someone asks 'are we covered?'  
> I need one link that shows what was approved, when, and by whom."

## 4. Product Shape (Non-Negotiable)

### This is not:

- a UGC discovery tool
- a content gallery
- a rights management platform
- a legal compliance system

### This is:

- a ledger of consent events
- append-only
- immutable
- defensible

**Think: receipts, not workflows.**

## 5. Consent Model

Consent is progressive, not binary.

### Levels

**Initial consent (default)**

- Low friction
- Explicit scope stated up front

**Expanded consent (conditional)**

- Triggered later (e.g. paid ads)
- Private follow-up (DM/email), not public comments

**Formalization (optional, rare)**

- Stronger language or PDF export
- Still no contracts required for MVP

Each approval is logged as a new event, never overwriting prior consent.

## 6. Core Artifact (The Product)

### Canonical Consent Record (Required)

A permanent, linkable page that displays:

- Content reference (URL)
- Creator identifier (handle + platform)
- Consent text shown to creator (verbatim)
- Approved scope (explicit)
- Timestamp(s)
- Event history (initial → expanded)

This link is the single source of truth.

### PDF Export (Recommended, secondary)

- Generated from the same record
- For Drive / email / legal reassurance
- The link remains canonical

## 7. MVP User Flows (High Level)

### Flow A — Initial Consent

1. User creates consent request
2. Paste content URL
3. Select initial scope (forced)
4. System generates consent ask (human language)
5. Creator explicitly confirms
6. Consent record is created (link)

### Flow B — Scope Expansion

1. User views existing consent record
2. Requests expanded usage (e.g. ads)
3. System generates private follow-up message
4. Creator approves or declines
5. New consent event appended to the same record

**No public comment resurrection.**

## 8. Required Constraints (Do Not Relax)

- Scope must be explicit (no implied permissions)
- Consent text must be stored verbatim
- Original consent is never overwritten
- Consent records must be viewable via shareable link
- No legal advice language in UI

These constraints define the value.

## 9. Assumed MVP UX (Minimal, Important)

The product should include:

- A list view of consent records
- At-a-glance status indicators (e.g. pending / approved)
- Basic filters:
  - by status
  - by scope (organic / ads)

**No bulk actions.**  
**No automation.**  
**No tagging system.**

This is for orientation, not management.

## 10. Data Model (Conceptual Only)

### ConsentRecord

- `content_url`
- `creator_handle`
- `platform`

### ConsentEvent

- `event_type` (initial / expanded)
- `scope`
- `consent_text`
- `timestamp`
- `confirmation_method`

**Append-only.**

## 11. MVP Decisions

### Auth Model

- Operators must be authenticated (email / magic link)
- Consent record pages are unlisted and viewable by anyone with the link (shareable with legal, clients, etc.)

### Creator Confirmation Method

- Creator confirms via a unique approval link to a simple web page
- Operator sends the link manually via DM or email
- One-click "Approve" logs timestamp + scope

### Multi-Tenancy

- Support workspaces
- One user can have multiple workspaces (brands)
- Team invites optional post-MVP

### Tech Preferences

- No hard requirements; choose simple, common web stack

### Follow-Up Messaging

- System generates copy only for follow-up requests
- It does not send messages in MVP

### Screenshots as Fallback

- Public comment → DM is still the normal flow
- If creator flakes after saying yes, screenshots may still be attached as fallback proof
- Link-based consent is the preferred, canonical record; screenshots are secondary and optional

**Summary:** Public comments to start, private DMs for consent, link for proof — screenshots only as a fallback.

## 12. Explicit Non-Goals (Repeat for Clarity)

- No UGC discovery
- No influencer payments
- No contract workflows
- No jurisdiction logic
- No campaign management

If it feels "powerful," it's drifting.

## 13. Success Criteria

- Screenshots are no longer needed
- "Are we covered?" can be answered with one link
- Scope confusion is eliminated
- The product feels boring but relieving

## 14. Guidance for AI Code-Building Tools

This spec is intentionally high-level.

It is designed to:

- communicate product intent
- enforce hard boundaries
- allow the builder to infer standard CRUD + list patterns

**Avoid adding:**

- layout instructions
- micro-interactions
- future features

Let the model handle how.  
This PRD defines what must exist and what must not.
