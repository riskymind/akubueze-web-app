# Akụbueze Age Grade Association

Meeting, dues, levy, and membership management for the Akụbueze Age Grade Association — a
Next.js (App Router) + TypeScript + Prisma rebuild of the original Claude Design prototype
(`Akubueze Age Grade.dc.html`).

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Prisma 7** ORM with the `@prisma/adapter-pg` driver adapter, targeting **PostgreSQL**
- **NextAuth.js v4** (Credentials provider, JWT sessions) for officer sign-in
- **Tailwind CSS v4** — theme tokens in `app/globals.css` mirror the original design's palette,
  fonts (Instrument Serif + Manrope), 861px breakpoint, and animations
- Meeting minutes are stored on local disk under `./uploads` (gitignored) and served through an
  authenticated route handler at `/api/minutes/[meetingId]`

## Getting started

1. **Install dependencies** (already done if you're reading this right after setup):
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` — your PostgreSQL connection string.
   - `NEXTAUTH_SECRET` — a random secret (`openssl rand -base64 32`).
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev.

3. **Run migrations and seed demo data**:
   ```bash
   npm run db:migrate   # prisma migrate dev
   npm run db:seed      # prisma db seed (also runs automatically after migrate dev)
   ```
   The seed script recreates the original design's mock data 1:1: 11 members (3 of whom are the
   officer accounts below), 4 meetings (3 recorded, 1 upcoming), and 2 levies with their payment
   states.

4. **Run the app**:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 — it redirects to `/login`.

### Demo logins

| Role | Username | Password |
| --- | --- | --- |
| Chairman | `chairman` | `chair2026` |
| Fin-Sec | `finsec` | `finsec2026` |
| Secretary | `secretary` | `sec2026` |
| Member (read-only) | `member` | `member2026` |

**Rotate these before using the app for anything real** — use the in-app "Change password" flow
from the sidebar once signed in. These are no longer shown on the login page itself (removed once
the app started holding real member data) — this table is the only place they're documented.

## Meeting dues

Every meeting has one member designated as its **host**, chosen when the meeting is created.
The host pays ₦5,000 in dues for that meeting; every other member pays the regular ₦1,000
(both get +₦100 if marked late). This is enforced everywhere dues amounts are shown or totaled
— dashboard stats, the members' dues ledger, and the payments checklist — via `dueAmountFor()`
in `lib/constants.ts`. A member currently hosting a meeting can't be deleted until a different
host is assigned to that meeting.

## Levies

A levy can optionally name a **host** (honoree) — the member a wedding, funeral, child
dedication, etc. levy is being raised for. That member is exempt from paying it: no payment
row is created for them, and they're excluded from the paid/total progress count and shown as
"Exempt (host)" wherever the levy's per-member breakdown appears. A levy with no host applies to
every member as before. Set the host (optional) when creating the levy — it can't be changed
afterward from the UI. A member currently hosting a levy can't be deleted until a different host
is assigned.

## Permissions

- **Record payments, manage levies, manage members, create meetings** — Chairman or Fin-Sec.
- **Upload meeting minutes** — Chairman or Secretary.
- **Member** — read-only: dashboard, members, levies, meetings (including viewing already-uploaded
  minutes). No record-payments, manage, create, or upload permissions, and no access to
  `/payments` at all.
- Every one of these is enforced both in the UI (controls are hidden) and again inside each
  Server Action / route handler (`lib/actions/*.ts`, `app/api/minutes/[meetingId]/route.ts`) —
  the server never trusts the client's role.

## Project structure

```
app/
  login/page.tsx              Role-tab + username/password sign-in
  (app)/layout.tsx            Auth-guarded shell (sidebar/topbar) wrapping the 5 screens
  (app)/dashboard/page.tsx    Stats, recent payments, levy progress
  (app)/members/page.tsx      Members table + detail modal + add member
  (app)/payments/page.tsx     Meeting picker + paid/late checklist (chairman/finsec only)
  (app)/levies/page.tsx       Levy cards (expand/edit/delete/toggle payment)
  (app)/meetings/page.tsx     Meeting list + minutes upload/view
  api/auth/[...nextauth]/     NextAuth route handler
  api/minutes/[meetingId]/    Authenticated minutes upload (POST) / stream (GET)
lib/
  auth.ts                     NextAuth config (Credentials provider)
  prisma.ts                   PrismaClient singleton (pg driver adapter)
  constants.ts, format.ts     Fixed dues/levy amounts, role permissions, formatting helpers
  actions/                    Server Actions for every mutation
  upload.ts                   Saves uploaded minutes files to ./uploads
components/                   Shell, per-screen client components, shared Modal
prisma/schema.prisma          Data model
prisma/seed.ts                Seeds the original design's demo data
proxy.ts                      Auth-gating middleware (Next.js 16 "proxy" convention)
```

## Notes on the Prisma 7 setup

Prisma 7 moved the datasource connection string out of `schema.prisma` and into
`prisma.config.ts` (used by the CLI for `migrate`/`db seed`/`studio`), and `PrismaClient` now
takes an explicit driver adapter instead of reading `DATABASE_URL` itself — see `lib/prisma.ts`
and `prisma.config.ts`.
