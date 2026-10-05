# RightSchedule — Frontend

Scheduling SaaS for local businesses. Owners manage services, staff, hours and bookings in a dashboard. Customers book from a mobile-first public link (`/b/<slug>`).

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · shadcn (base-nova) on `@base-ui/react` · TanStack Query v5 · React Hook Form + Zod v4 · date-fns · lucide-react

> Next.js 16 has breaking changes: `proxy.ts` replaces `middleware.ts`, and `params` / `searchParams` are Promises (`await` in server pages, `use()` in client pages). See `AGENTS.md`.

## Getting started

```bash
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8080 > .env.local   # optional, this is the default
npm run dev                                                   # http://localhost:3000
```

| Variable              | Default                 | Purpose          |
| --------------------- | ----------------------- | ---------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend base URL |
| `NEXT_PUBLIC_STORAGE_ORIGIN` | unset | Origin of the logo object storage (CSP `connect-src`); required for logo upload |

Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`. `npx tsc --noEmit` for a typecheck.

The backend lives in `right-schedule-backend`; its API reference is `docs/api.md` and its phase plan is `IMPLEMENTATION_PHASES.md`.

## Screens

| Area          | Route                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Auth          | `/login` (sign in and register tabs)                                                        |
| Onboarding    | `/onboarding` (business, first service, team + hours, share link)                           |
| Dashboard     | `/dashboard`, `/calendar` (day + week), `/customers`, `/customers/[id]`                     |
| Setup         | `/services`, `/staff`, `/staff/[id]` (services, working hours, time off), `/settings`       |
| Public        | `/b/[slug]`, `/b/[slug]/booking` (wizard, `?service=` preselects), `/b/[slug]/confirmation` |

`proxy.ts` treats `/login` and `/b/*` as public; everything else redirects to `/login` without the `access_token` cookie.

## Backend phase dependencies

The backend is built through Phase 3. Screens that need later phases show an "isn't available yet" state (`ErrorState`, triggered by 404/405/501 or a network error via `isUnavailable`) instead of breaking.

| Needs                                                                             | Backend phase | Affected screens                                    |
| --------------------------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| Bookings list, cancel / complete / no-show; customers                             | 4             | Dashboard, calendar, customers                      |
| `GET /public/businesses/{slug}`, `POST /public/bookings`, `GET /public/bookings/{id}` | 5         | Business landing, booking wizard, confirmation      |

Working today: auth, business, services, staff, working hours, time off, public availability.

Assumptions to confirm when Phase 5 lands: the public business payload includes `services` and `staff`; `staff[].serviceIds` is optional (if absent, every staff member is offered); a booking conflict returns HTTP 409.

## Project layout

```
app/
  (public)/b/[businessSlug]/   landing, booking wizard, confirmation
  (dashboard)/                 sidebar shell + dashboard, calendar, customers, services, staff, settings
  login/  onboarding/
components/
  ui/                          shadcn primitives (+ toast, select)
  shared/                      PageHeader, EmptyState, ErrorState, LoadingButton, Field, ConfirmDialog, ...
  layout/Sidebar.tsx
features/<domain>/             hooks/ (TanStack Query), components/, store/
lib/api/                       fetch client + one module per resource
lib/utils/                     date, currency, cn, booking-link
types/                         domain.ts (API shapes), ui.ts
```

Conventions:

- All server state goes through TanStack Query hooks in `features/*/hooks`. Components never call `fetch`.
- Forms use React Hook Form + `zodResolver`. Numeric inputs use `valueAsNumber`.
- Derive state instead of syncing it in effects (the `react-hooks/set-state-in-effect` lint rule is on). Reset forms with a `key`.
- Use `errorMessage(e)` for user-facing API errors and `useToast()` for success/failure feedback.

## Design system

Tokens live in `app/globals.css` (oklch, light + dark via `.dark`).

- **Brand:** indigo. Primary `oklch(0.511 0.23 277)` light, `oklch(0.68 0.18 277)` dark. Radius base `0.75rem`.
- **Type:** Geist Sans / Mono via `next/font`.
- **Status colours:** confirmed = success (green), pending = pending, cancelled = destructive (red), no-show = warning (amber), completed = secondary. Mapped in `statusVariant` (`BookingDetailDialog.tsx`).
- **Accessibility:** labelled fields with `aria-invalid`, focus rings on every control, dialogs from Base UI (focus trap, Esc), `aria-current` on wizard steps, 44px-high primary actions on the public flow.

## Product docs

`FRONTEND_SPEC.md` holds the original product spec plus an implementation status section showing where the build differs from it.
