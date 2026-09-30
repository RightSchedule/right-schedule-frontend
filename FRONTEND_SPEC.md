# RightSchedule — Frontend Specification

> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn (base-nova, `@base-ui/react`) · TanStack Query v5  
> **Target:** MVP — responsive web, desktop-first dashboard, mobile-first public booking page

---

## Implementation Status

_Updated 2026-09-29. This document started as the product spec; the sections below still describe intent. Where the build differs, this section wins._

All screens in the routing map exist. `tsc`, `next build` and `eslint` pass (0 errors). Screens that need backend Phase 4/5 endpoints render an "isn't available yet" state (`ErrorState`, see `isUnavailable` in `lib/api/client.ts`) until the backend ships them.

### Backend readiness

| Feature                                                              | Backend phase | Frontend                        |
| -------------------------------------------------------------------- | ------------- | ------------------------------- |
| Auth, business, services, staff, working hours, time off, availability | 1–3 (done)    | Live                            |
| Bookings list and cancel / complete / no-show; customers             | 4             | Built, gated until endpoints exist |
| `GET /public/businesses/{slug}`, `POST /public/bookings`, `GET /public/bookings/{id}` | 5 | Built, gated until endpoints exist |

Assumed Phase 5 contract: the public business payload includes `services` and `staff`; `staff[].serviceIds` is optional (missing means every staff member is offered); a booking conflict returns HTTP 409.

### Where the build differs from the spec

- **Auth (§4):** the backend returns a single JWT (`{ token, email, role }`), so there is no refresh token or silent refresh. The token is kept in `localStorage` and the `access_token` cookie. `proxy.ts` (Next 16's replacement for `middleware.ts`) does the server-side guard, and the API client handles 401 by clearing the session and redirecting to `/login`. There is no `AuthGuard` component. `/login` has Sign in and Create account tabs.
- **Onboarding (§5):** three steps plus a done screen: business (name, auto-slugged link, timezone), first service, team member with working hours. No business-type step. Progress is not stored in `localStorage`; the wizard resumes at "first service" if a business already exists. Steps can be skipped where the backend allows it.
- **Public booking (§6):** four steps: service, staff, when, details. The staff step is skipped when one or zero staff can perform the service. "When" combines a 14-day date strip with time slots grouped into Morning / Afternoon / Evening. `?service=<id>` preselects a service. A 409 on submit refreshes availability and returns to the time step. The confirmation page reads a summary from `sessionStorage` (saved on success) and falls back to a plain message if it is missing. No `.ics` download and no cancel link yet.
- **Dashboard (§7):** four stat cards (total, confirmed, completed, cancelled) and today's bookings. No charts.
- **Calendar (§8):** day and week views are both built (spec deferred week). Booking detail is a dialog, not a drawer, with cancel / no-show / complete actions. Not built: click-an-empty-slot-to-create (there is no authenticated booking-create endpoint) and drag-and-drop.
- **Services / Staff (§9–10):** service create, edit, hide/show. Staff create, edit, deactivate (backend DELETE deactivates), assign services, edit weekly hours (multiple ranges per day), add and remove time off (one `date` per exception, full day or time range).
- **Customers (§11):** list and detail with booking history. Search is client-side.
- **Settings:** shows the public booking link with copy and open actions. Full business profile editing is not built.
- **Notifications (§12):** backend only. The frontend does not send email.
- **Types and endpoints (§14–15):** see the corrected contract in §15.

### Design system

Tokens live in `app/globals.css` (oklch, light and dark via `.dark`).

- **Brand:** indigo. Primary `oklch(0.511 0.23 277)` light, `oklch(0.68 0.18 277)` dark. Base radius `0.75rem`. Geist Sans and Mono.
- **Booking status badges:** confirmed = success, pending = pending, cancelled = destructive, no-show = warning, completed = secondary (`statusVariant` in `BookingDetailDialog.tsx`). `NO_SHOW` is part of `BookingStatus`.
- **Shared UI:** `components/shared` (PageHeader, PageContainer, EmptyState, ErrorState, Spinner, LoadingButton, Field, FormError, ConfirmDialog), `components/ui/toast` (`useToast().success/error/info`, provided in `components/providers.tsx`), `components/ui/select`.
- **States:** every list has skeleton loading, an empty state with a next action, and an error state with retry.
- **Accessibility:** labelled fields with `aria-invalid`, visible focus rings, Base UI dialogs (focus trap, Esc), `aria-current` on wizard steps, 44px primary actions on the public flow.

### Code conventions

- Server state only through TanStack Query hooks in `features/*/hooks`. Components do not call `fetch`.
- Forms: React Hook Form + `zodResolver`; numeric inputs use `valueAsNumber`; Zod v4 (`z.email()`, `z.number({ error })`).
- Derive state instead of syncing it in effects (`react-hooks/set-state-in-effect` is enforced). Reset a form by changing its `key`.
- Next 16: `params` and `searchParams` are Promises. Server pages `await` them, client pages use `use()`.
- Wizard state is a reducer (`features/bookings/store/bookingWizard.ts`), no Zustand.

### Remaining work

- Wire up and test against the real endpoints once backend Phases 4 and 5 exist; confirm the assumed payload shapes.
- `.ics` download and customer cancellation link on the confirmation page.
- Business profile editing in Settings.
- Authenticated booking creation from the calendar (needs a backend endpoint).
- Manual browser pass on mobile widths and dark mode; no automated tests yet.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Tech Stack & Tooling](#2-tech-stack--tooling)
3. [Routing Map](#3-routing-map)
4. [Authentication](#4-authentication)
5. [Business Onboarding Flow](#5-business-onboarding-flow)
6. [Public Booking Flow](#6-public-booking-flow)
7. [Business Dashboard](#7-business-dashboard)
8. [Calendar](#8-calendar)
9. [Services Management](#9-services-management)
10. [Staff Management](#10-staff-management)
11. [Customer Management](#11-customer-management)
12. [Notifications](#12-notifications)
13. [Business Rules & Validation](#13-business-rules--validation)
14. [TypeScript Types](#14-typescript-types)
15. [API Contract](#15-api-contract)
16. [MVP Scope Checklist](#16-mvp-scope-checklist)

---

## 1. Project Structure

_Reflects the built layout._

```
right-schedule-frontend/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   └── b/[businessSlug]/
│   │       ├── page.tsx                 # Business landing
│   │       ├── booking/page.tsx         # Booking wizard (?service= preselects)
│   │       └── confirmation/page.tsx    # ?id=<bookingId>
│   ├── (dashboard)/                     # Sidebar shell, protected by proxy.ts
│   │   ├── layout.tsx
│   │   ├── dashboard/  calendar/  services/  settings/
│   │   ├── customers/  (page.tsx, [customerId]/page.tsx)
│   │   └── staff/      (page.tsx, [staffId]/page.tsx)
│   ├── onboarding/page.tsx
│   ├── login/page.tsx                   # Sign in + Create account tabs
│   ├── layout.tsx  page.tsx (redirects to /dashboard)  globals.css
│
├── components/
│   ├── ui/                              # shadcn primitives + toast, select
│   ├── shared/index.tsx                 # PageHeader, EmptyState, ErrorState, LoadingButton, Field, ...
│   ├── layout/Sidebar.tsx
│   └── providers.tsx                    # QueryClient + ToastProvider
│
├── features/
│   ├── auth/hooks/useAuth.ts
│   ├── bookings/
│   │   ├── components/                  # BookingWizard, BookingConfirmation, BusinessLanding,
│   │   │                                # PublicShell, CalendarViews, BookingDetailDialog
│   │   ├── hooks/                       # useAvailability, useBookings, useCreateBooking, usePublicBusiness
│   │   ├── store/bookingWizard.ts       # useReducer wizard state
│   │   └── summary.ts                   # sessionStorage booking summary
│   ├── business/                        # useBusiness, BookingLinkCard
│   ├── customers/hooks/useCustomers.ts
│   ├── onboarding/OnboardingWizard.tsx
│   ├── services/                        # useServices, ServiceFormDialog
│   └── staff/                           # useStaff, StaffFormDialog, StaffPanels, WorkingHoursEditor
│
├── lib/
│   ├── api/                             # client.ts (fetch, 401 handling, isUnavailable, errorMessage)
│   │                                    # + auth, bookings, businesses, customers, services, staff
│   ├── auth/session.ts                  # token in localStorage + access_token cookie
│   └── utils/                           # date, currency, cn, booking-link (slugify, timezones)
│
├── types/                               # api.ts, domain.ts, ui.ts
└── proxy.ts                             # Next 16 replacement for middleware.ts
```

---

## 2. Tech Stack & Tooling

| Concern           | Choice                                        | Notes                                        |
| ----------------- | --------------------------------------------- | -------------------------------------------- |
| Framework         | Next.js 16 (App Router, Turbopack)            | `proxy.ts`, async `params` / `searchParams`  |
| Language          | TypeScript 5                                  | Strict mode on                               |
| Styling           | Tailwind CSS v4                               |                                              |
| Component library | shadcn (base-nova) on `@base-ui/react`        | Install components as needed, don't bulk-add |
| Server state      | TanStack Query v5                             | All API calls go through Query/Mutation      |
| Client state      | `useReducer` (no Zustand)                     | Only for wizard steps and calendar UI state  |
| Forms             | React Hook Form + Zod v4                      | Zod schemas double as runtime validators   |
| Date handling     | date-fns                                      | No moment, no dayjs                          |
| HTTP              | Native `fetch` wrapped in `lib/api/client.ts` | Attach JWT, on 401 clear session + /login    |
| Icons             | Lucide React                                  |                                              |
| Calendar          | Custom (no heavy lib for MVP)                 | Build on top of CSS Grid                     |

---

## 3. Routing Map

### Public

| Path                             | Component        | Description                |
| -------------------------------- | ---------------- | -------------------------- |
| `/b/[businessSlug]`              | Business landing | Name, rating, address, CTA |
| `/b/[businessSlug]/booking`      | Booking wizard   | 4-step form (staff step skipped if not needed) |
| `/b/[businessSlug]/confirmation` | Confirmation     | Post-booking summary       |

### Auth

| Path     | Description                                           |
| -------- | ----------------------------------------------------- |
| `/login` | Sign in / Create account tabs. Redirects to `/onboarding` if no business yet, else `/dashboard` |

### Dashboard (protected)

| Path              | Description                                       |
| ----------------- | ------------------------------------------------- |
| `/dashboard`      | Today's overview + upcoming bookings              |
| `/calendar`       | Day and week views                                |
| `/customers`      | Searchable customer list                          |
| `/customers/[id]` | Customer detail + booking history                 |
| `/services`       | Service CRUD                                      |
| `/staff`          | Staff list                                        |
| `/staff/[id]`     | Staff config: services, working hours, exceptions |
| `/settings`       | Business profile settings                         |

### Onboarding

| Path          | Description                                 |
| ------------- | ------------------------------------------- |
| `/onboarding` | 3-step wizard (business, service, team) + done screen |

---

## 4. Authentication

_Built as described here; the original refresh-token design was dropped because the backend issues a single JWT._

### Login Page (`/login`)

- Sign in and Create account tabs, Zod validation via `zodResolver`
- Backend returns `{ token, email, role }`. Token is stored in `localStorage` and in the `access_token` cookie
- Redirects to `/onboarding` if the user has no business yet, else `/dashboard`

### Route guard

- `proxy.ts` (Next 16, replaces `middleware.ts`): `/login` and `/b/*` are public. Anything else without the `access_token` cookie redirects to `/login`
- `lib/api/client.ts`: a 401 clears the token and cookie and redirects to `/login`
- No refresh token, no `AuthGuard` component

---

## 5. Business Onboarding Flow

Shown once after first login. State persisted in `localStorage` so the user can resume if they close the browser.

### Step 1 — Business Name

```
What's your business called?

[ Barbearia X                    ]

[ Next ]
```

Fields: `name` (required, min 2 chars)

---

### Step 2 — Business Type

```
What type of business do you run?

○ Barbeiro
○ Cabeleireiro
○ Clínica de estética
○ Outro

[ Back ]  [ Next ]
```

Field: `businessType` enum

---

### Step 3 — Add Services

```
Add your services

+ Add service

┌─────────────────────────────────┐
│ Name        [ Corte            ]│
│ Duration    [ 30   ] min        │
│ Price       [ 15   ] €          │
│                         [ Remove]│
└─────────────────────────────────┘

[ Back ]  [ Next ]
```

- Minimum 1 service required to proceed
- Inline add/remove, no modal needed at this stage
- Fields per service: `name`, `duration` (minutes), `price` (€ decimal)

---

### Step 4 — Add Staff

```
Add your team

+ Add staff member

┌─────────────────────────────────┐
│ Name  [ Daniel                 ]│
│ Role  [ Barbeiro               ]│
│                         [ Remove]│
└─────────────────────────────────┘

[ Back ]  [ Next ]
```

- Minimum 1 staff member required
- Fields: `name`, `role` (free text for MVP)
- Services assigned in step 4b (or in staff config post-onboarding)

---

### Step 5 — Working Hours

```
When are you open?

Mon  ☑  [ 09:00 ] – [ 18:00 ]
Tue  ☑  [ 09:00 ] – [ 18:00 ]
Wed  ☑  [ 09:00 ] – [ 18:00 ]
Thu  ☑  [ 09:00 ] – [ 18:00 ]
Fri  ☑  [ 09:00 ] – [ 18:00 ]
Sat  ☐
Sun  ☐

[ Back ]  [ Next ]
```

- Toggle per day (checked = open)
- Time pickers: 15-minute increments
- Applied to all staff initially; fine-tuned per staff later

---

### Step 6 — Done

```
✓ O teu negócio está pronto!

A tua página de marcações:

rightschedule.com/b/my-business

[ Copiar link ]

[ Ir para o dashboard ]
```

- Display public booking URL
- Copy button
- CTA to dashboard

---

## 6. Public Booking Flow

Mobile-first. URL: `/b/[businessSlug]/booking`

Wizard state lives in a `useReducer` (`features/bookings/store/bookingWizard.ts`). Selections are held in memory only; only the final booking summary goes to `sessionStorage`, for the confirmation page.

### Step 1 — Business Landing (`/b/[businessSlug]`)

```
┌───────────────────────────────┐
│  [Logo]  BARBEARIA X          │
│                               │
│  ★ 4.9  · Rua Example, Barcelos│
│                               │
│  Sobre nós (optional bio)     │
│                               │
│  [ Marcar agora ]             │
└───────────────────────────────┘
```

Data fetched server-side (Next.js Server Component). CTA navigates to `/b/[businessSlug]/booking`.

---

### Step 2 — Choose Service

```
← Voltar

Escolhe o serviço

┌───────────────────────────────┐
│ Corte                         │
│ 30 min                    €15 │
└───────────────────────────────┘
┌───────────────────────────────┐
│ Corte + Barba       [selected]│
│ 45 min                    €20 │
└───────────────────────────────┘
```

- Only active services shown
- Single selection
- Selected card gets a highlight border + checkmark

---

### Step 3 — Choose Staff

```
← Voltar

Quem te vai atender?

○ Daniel
○ João
○ Maria

[ Qualquer profissional ]
```

- Only staff with the selected service assigned
- "Qualquer profissional" = system picks staff with earliest available slot
- Radio selection

---

### Step 4 — Choose Date

```
← Voltar

Escolhe o dia

< Setembro 2025 >

Seg  Ter  Qua  Qui  Sex  Sáb
 28   29   30    1    2    3
  4    5    6    7    8    9

```

- Past dates disabled
- Days with no availability grayed out
- Custom calendar built with CSS Grid (no external calendar lib)
- Fetches available dates for the selected staff+service combination

---

### Step 5 — Choose Time

```
← Voltar

Horários disponíveis

09:00   09:30
10:00   10:30
11:00   11:30
──────────────
14:00   14:30
15:00   15:30
```

- 15-minute increment slots
- Grouped by morning / afternoon if gap > 1 hour
- Unavailable slots not shown (not shown as disabled — just absent)
- Fetched from `/api/availability?date=...&staffId=...&serviceId=...`

---

### Step 6 — Customer Details

```
← Voltar

Os teus dados

Nome *
[ João Silva                    ]

Telemóvel *
[ 912 345 678                   ]

Email *
[ joao@email.com                ]

[ Confirmar marcação ]
```

- All fields required
- Phone: PT format validation (9XX XXX XXX), but accept international too
- Email: standard format validation
- On submit: POST to create booking → navigate to confirmation on success

---

### Step 7 — Confirmation (`/b/[businessSlug]/confirmation`)

```
✓ Marcação confirmada

Barbearia X

Corte + Barba
01 Outubro · 10:30
Daniel

[ Adicionar ao calendário ]  ← generates .ics

Receberás uma confirmação por email.
```

- Booking ID in URL query param: `/confirmation?bookingId=xxx`
- "Adicionar ao calendário" generates a `.ics` download (client-side)
- No auth required

---

## 7. Business Dashboard

### Layout

```
┌──────────────────────────────────────────────────────┐
│  [Logo] RightSchedule                    [User menu] │
├─────────────┬────────────────────────────────────────┤
│             │                                        │
│  Dashboard  │                                        │
│  Calendar   │              Main content              │
│  Customers  │                                        │
│  Services   │                                        │
│  Staff      │                                        │
│  Settings   │                                        │
│             │                                        │
└─────────────┴────────────────────────────────────────┘
```

- Sidebar collapses to icon-only on md breakpoint
- Mobile: bottom nav bar (Dashboard, Calendar, Customers, More)

---

### Dashboard Page

```
Bom dia, Daniel            (greeting changes by time of day)

Hoje ─────────────────

12 marcações
 8 concluídas
 2 canceladas

Próximas marcações ────────

09:00  João Silva     Corte          Daniel
09:30  Maria Costa    Corte + Barba  Maria
10:00  Pedro Alves    Barba          Daniel
```

- "Próximas" = upcoming from now, for today only
- Each row clickable → opens booking detail drawer/modal
- Stats are today-only counts, no charts for MVP

---

## 8. Calendar

### Day View (default)

```
          │ Daniel          │ Maria           │
──────────┼─────────────────┼─────────────────┤
  09:00   │ ████████████    │                 │
          │ João · Corte    │                 │
  09:30   │                 │ ████████████    │
          │                 │ Maria · C+B     │
  10:00   │ ████████████    │                 │
          │ Pedro · Barba   │                 │
  10:30   │                 │                 │
```

- One column per staff member
- Time grid: 15-minute rows, visible range 08:00–20:00
- Booking block height = `(duration / 15) * rowHeight`
- Current time indicator (red line)

### Week View

- 7-day header, one column per day (no per-staff split in week view for MVP)
- Booking blocks show staff name abbreviated

### Booking Block

Each block shows:

- Customer name
- Service name (abbreviated)
- Status color: `pending` = blue, `confirmed` = green, `cancelled` = red/strikethrough, `completed` = gray

### Interactions

| Action               | Behavior                                        |
| -------------------- | ----------------------------------------------- |
| Click empty slot     | Open "New booking" drawer, date+time pre-filled |
| Click booking block  | Open booking detail drawer                      |
| Drag booking (defer) | Reschedule — skip for MVP                       |

### Booking Detail Drawer

Opens from the right. Shows:

- Customer name + phone + email
- Service, staff, date/time
- Status badge
- Actions: **Mark completed** / **Cancel booking** / **Edit** (limited)

### Calendar Toolbar

```
[ Day | Week ]          < 28 Set >         [ + New booking ]
```

---

## 9. Services Management

### Service List (`/services`)

```
Services                              [ + Add service ]

────────────────────────────────────────────────────
Corte                    30 min · €15    Active   [Edit]
Corte + Barba            45 min · €20    Active   [Edit]
Barba                    20 min · €10    Inactive [Edit]
```

- Toggle active/inactive inline (optimistic update)
- Edit opens a sheet/drawer on the right

### Service Form (Create / Edit)

```
Name *
[ Corte                         ]

Duration (min) *
[ 30 ]

Price (€) *
[ 15.00 ]

Description
[ Optional description...       ]

Active
[☑]

[ Save ]  [ Cancel ]
```

Zod schema:

```ts
const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  duration: z.number().int().min(5).max(480),
  price: z.number().min(0),
  description: z.string().max(500).optional(),
  active: z.boolean(),
});
```

---

## 10. Staff Management

### Staff List (`/staff`)

```
Staff                              [ + Add staff ]

────────────────────────────────────────────────
Daniel     Barbeiro     Active    [Configure]
Maria      Cabeleireira Active    [Configure]
```

### Staff Configuration (`/staff/[id]`)

Three sections:

#### Services

```
Serviços

☑ Corte
☑ Barba
☐ Coloração
```

#### Working Hours

```
Horário de trabalho

Segunda   ☑  09:00 – 18:00
Terça     ☑  09:00 – 18:00
Quarta    ☑  09:00 – 18:00
Quinta    ☑  09:00 – 18:00
Sexta     ☑  09:00 – 18:00
Sábado    ☐
Domingo   ☐
```

- Toggle per day
- Time inputs with 15-min increments
- Save per section or all at once (TBD — keep it simple, one save button)

#### Exceptions / Absences

```
Exceções

+ Add absence

────────────────────────────────
15 Out – 20 Out   Férias    [Remove]
```

Modal to add an exception:

```
Start date  [ 15/10/2025 ]
End date    [ 20/10/2025 ]
Reason      [ Férias      ]  (optional)
```

---

## 11. Customer Management

### Customer List (`/customers`)

```
Customers

[ Search by name or phone... ]

────────────────────────────────────────
João Silva      12 marcações   Última: 10 Set   [View]
Maria Costa      7 marcações   Última: 08 Set   [View]
```

- Client-side search filter (no debounced API search for MVP — load all, filter in memory if < 500 customers; add server search later)
- Sorted by most recent booking by default

### Customer Detail (`/customers/[id]`)

```
← Clientes

João Silva
──────────────────
Telemóvel   912 345 678
Email       joao@email.com

Marcações
──────────────────
01 Out 10:30   Corte + Barba   Daniel    Confirmada
15 Set 14:00   Corte           João      Concluída
30 Ago 09:00   Barba           Maria     Concluída
```

- Booking rows link to the booking detail drawer/page
- No edit of customer details for MVP (customers self-enter on booking)

---

## 12. Notifications

### Email Triggers (MVP)

| Event             | Recipient | Template                                  |
| ----------------- | --------- | ----------------------------------------- |
| Booking created   | Customer  | Confirmation with date/time/staff/service |
| Booking created   | Business  | New booking alert                         |
| Booking cancelled | Customer  | Cancellation notice                       |
| Booking cancelled | Business  | Cancellation alert                        |
| Booking reminder  | Customer  | Sent 24h before appointment               |

### Frontend Responsibility

- No notification UI in MVP dashboard beyond a future "Notifications" settings tab placeholder
- Email sending is entirely backend — frontend just triggers it via booking creation/cancellation API calls
- "Receberás uma confirmação por email" text on confirmation page is sufficient user feedback

---

## 13. Business Rules & Validation

These rules must be enforced on the **frontend** as UX (don't show unavailable slots) and on the **backend** as hard validation.

### Booking Constraints

```
1. Service must be active
2. Staff member must be active
3. Staff must have the service assigned
4. Slot must fall within staff's working hours for that day
5. Slot must not overlap an existing booking (same staff)
6. Slot start + service duration must not exceed staff's end time
7. No booking in past (client-side check, backend enforces too)
8. No booking during a staff exception/absence period
```

### Time Slot Interval

- All slots generated in **15-minute increments**
- A 30-min service can start at 09:00, 09:15, 09:30, 09:45 — not just :00/:30
- Slot grid on step 5 only shows valid, available slots (no disabled states)

### Cancellation

- Customer can cancel via a link in the confirmation email (backend generates a signed cancel URL)
- Business can cancel from the booking detail in the calendar
- No cancellation deadline in MVP

---

## 14. TypeScript Types

```ts
// types/domain.ts

export type BusinessType = "barber" | "hairdresser" | "aesthetics" | "other";

export interface Business {
  id: string;
  slug: string;
  name: string;
  type: BusinessType;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  duration: number; // minutes
  price: number; // € decimal
  description?: string;
  active: boolean;
}

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface WorkingHours {
  staffId: string;
  day: WeekDay;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface AvailabilityException {
  id: string;
  staffId: string;
  startDate: string; // ISO date "2025-10-15"
  endDate: string;
  reason?: string;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  role: string;
  active: boolean;
  services: Service[];
  workingHours: WorkingHours[];
  exceptions: AvailabilityException[];
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  date: string; // ISO date
  startTime: string; // "10:30"
  endTime: string; // "11:00"
  status: BookingStatus;
  service: Service;
  staff: Pick<Staff, "id" | "name">;
  customer: Customer;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string;
  bookingCount: number;
  lastBookingDate?: string;
}

// types/ui.ts

export interface BookingWizardState {
  serviceId: string | null;
  staffId: string | null; // null = "any"
  date: string | null;
  startTime: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}
```

---

## 15. API Contract

_Matches `lib/api/*` and the backend `docs/api.md`. Prefix is `/api/v1`. Authenticated with `Authorization: Bearer <token>` except `/public/*` and auth._

**Backend Phases 1-3 (live)**

```
POST   /auth/login                           # -> { token, email, role }
POST   /auth/register
POST   /business                             # create
GET    /business/me
PUT    /business/me
GET    /services            POST /services
GET    /services/{id}       PUT  /services/{id}     DELETE /services/{id}
PATCH  /services/{id}/toggle
GET    /staff               POST /staff
GET    /staff/{id}          PUT  /staff/{id}        DELETE /staff/{id}   # deactivates
GET    /staff/{id}/services                          # -> string[] of service ids
PUT    /staff/{id}/services                          # body { serviceIds }
POST   /staff/{id}/services/{serviceId}   DELETE same path
GET    /staff/{id}/working-hours
PUT    /staff/{id}/working-hours                     # body { entries }, dayOfWeek UPPERCASE
DELETE /staff/{id}/working-hours/{hoursId}
GET    /staff/{id}/availability-exceptions
POST   /staff/{id}/availability-exceptions           # single `date`, optional start/end time
DELETE /staff/{id}/availability-exceptions/{exceptionId}
GET    /public/businesses/{slug}/availability        # -> { date, slots: [{ start, end }] }
```

**Backend Phases 4-5 (frontend built, endpoints not yet available)**

```
GET    /bookings?date=&staffId=&status=              # Phase 4
PATCH  /bookings/{id}/cancel | /complete | /no-show  # Phase 4
GET    /customers   GET /customers/{id}   GET /customers/{id}/bookings   # Phase 4
GET    /public/businesses/{slug}                     # Phase 5 -> PublicBusiness { services, staff[] }
POST   /public/bookings                              # Phase 5, 409 on slot conflict
GET    /public/bookings/{id}                         # Phase 5
```

Dropped from the original draft: `/auth/refresh`, `/dashboard/today` (stats are computed client-side from bookings), `/onboarding` (the wizard calls the normal create endpoints in sequence), signed-token cancel link.

---

## 16. MVP Scope Checklist

`[x]` = built in the frontend. Items marked _(gated)_ render an "isn't available yet" state until the backend phase ships.

### Must Have

- [x] Business registration + login
- [x] Route guard (`proxy.ts`)
- [x] Business onboarding wizard (3 steps + done)
- [x] Public booking page (`/b/[slug]`) _(gated: Phase 5)_
- [x] Booking wizard (4 steps) _(gated: Phase 5)_
- [ ] Booking confirmation `.ics` download (the page itself is built)
- [x] Dashboard (today stats + upcoming) _(gated: Phase 4)_
- [x] Calendar - day view _(gated: Phase 4)_
- [x] Calendar - booking detail dialog (cancel, no-show, mark complete) _(gated: Phase 4)_
- [x] Services CRUD
- [x] Staff list + per-staff config (services, working hours, exceptions)
- [x] Customer list + customer detail _(gated: Phase 4)_
- [ ] Email notifications (backend)
- [x] Responsive design (mobile booking flow + desktop dashboard); manual device pass still to do

### Built ahead of plan

- [x] Calendar week view
- [x] Booking link card in Settings (copy / open)

### Deferred (Post-MVP)

- [ ] Drag-and-drop rescheduling
- [ ] Create booking from the calendar (needs an authenticated booking endpoint)
- [ ] Dashboard analytics / charts
- [ ] Business settings page (full profile editing)
- [ ] Push / SMS / WhatsApp notifications
- [ ] Cancellation deadlines + fees
- [ ] No-show rules
- [ ] Multi-location businesses
- [ ] Rating / review system
- [ ] Server-side customer search (paginated)

---

_Last updated: 2026-09-29_
