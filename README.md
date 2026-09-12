# Academix — Education Operations SaaS

Academix is a multi-module education operations platform for tuition centres, academies and private institutes. It combines student records, classes, attendance, assessments, fee collections, communications and reporting in one workspace.

## Product modules

- **Operations dashboard** — revenue, attendance, active students, classes, overdue fees and recent activity.
- **Student CRM** — profiles, enrollments, guardian details and barcode workflows.
- **Teachers & classes** — staff, classes, schedules and teaching assignments.
- **Attendance** — manual, bulk and barcode-based attendance with reports.
- **Assessments** — create assessments, enter grades and track academic progress.
- **Fees & receipts** — paid/pending/overdue tracking and printable LKR receipts.
- **Communications** — email/SMS/WhatsApp-ready messaging workflows.
- **Reports** — operational, financial and attendance reporting.
- **Institutes** — branch/institute records for multi-site operations.
- **SaaS account layer** — role-aware navigation, plan/usage surface and data-aware workspace onboarding.

## Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS + Radix/shadcn UI
- Framer Motion
- MongoDB + Mongoose
- JWT authentication with HttpOnly cookies
- Recharts
- Resend / Twilio integration points

## Getting started

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure the environment

Copy the example file:

```bash
cp .env.example .env.local
```

At minimum, configure:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-production-secret
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notification providers are optional during local development. See `.env.example` for Resend, Twilio and cron variables.

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run build
```

GitHub Actions runs both checks for pushes and pull requests targeting `main`.

## Project structure

```text
app/
  (auth)/            Authentication screens
  (dashboard)/       Protected workspace routes
  api/               Route handlers
components/
  dashboard/         Dashboard and analytics UI
  layout/            Navigation and workspace shell
  ui/                Shared UI primitives
lib/
  actions/           Server actions / domain operations
  auth/              JWT helpers
  mongodb/           Connection and Mongoose models
  services/          Notifications and integrations
types/                Domain types
```

## Security notes

- Dashboard routes are verified again in the server layout using the signed JWT; middleware is only a lightweight routing guard.
- Authentication cookies are HttpOnly and use `SameSite=Lax`.
- `JWT_SECRET` and `MONGODB_URI` must be supplied through deployment secrets, never committed.
- Production SaaS tenant isolation should be enforced in the data layer before onboarding unrelated customer organizations into the same deployment.

## SaaS roadmap

The current branch establishes a stronger product shell and plan/usage UI. The next production-hardening milestones are:

1. First-class tenant/workspace ownership and tenant-scoped queries across every domain model.
2. Subscription provider integration and server-side entitlement enforcement.
3. Team invitations and granular permissions beyond the current admin/teacher roles.
4. Real notification provider delivery, templates and delivery logs.
5. Audit logs, data export/retention controls and production observability.

## License

MIT
