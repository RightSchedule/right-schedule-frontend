# RightSchedule — App Context for test agents

Scheduling SaaS for local businesses (barbers, salons, clinics). Owners manage services, staff, hours and bookings in a dashboard. Customers book through a mobile-first public link. This file is the single reference every test agent receives. Trust it over README/FRONTEND_SPEC, which lag the code. Full API contract: `C:\Users\Daniel\Desktop\Git\right-schedule-backend\docs\api.md`.

## Architecture

- **Frontend** (`right-schedule-frontend`, this repo): Next.js 16 App Router, React 19, Tailwind v4, shadcn on `@base-ui/react`, TanStack Query, React Hook Form + Zod. Runs on `http://localhost:3000`. All server state is client-side via TanStack Query (`features/*/hooks`); no BFF, the browser calls the backend directly with `credentials: "include"`.
- **Backend** (`right-schedule-backend`): Spring Boot 3 + Postgres 16 (Flyway). Runs on `http://localhost:8080`. API prefix `/api/v1`. Health: `GET /actuator/health`.
- **Auth**: `POST /auth/login` sets an HttpOnly `access_token` cookie (no token in body, nothing in localStorage). `Authorization: Bearer <jwt>` is also accepted and takes precedence. `401` in the browser triggers logout + redirect to `/login` except on public pages. Frontend `proxy.ts` redirects any non-public route to `/login?redirect=...` when both the `access_token` and `session_active` cookies are missing (presence check only). The access token lasts 15 min; `lib/api/client.ts` refreshes it via `POST /auth/refresh` on a 401.
- **Public (no auth) routes**: `/login`, `/b/*`, `/privacy`, `/terms`, `/dpa`, `/sub-processors`.
- **Timezone**: every business has an IANA timezone (all demo businesses: `Europe/Lisbon`). `startDateTime`/`endDateTime` are local to the business timezone, no offset. The frontend derives "today" and the now-line from the business timezone, not the browser.
- **i18n**: next-intl, locales `en` (default) and `pt`, stored in the `NEXT_LOCALE` cookie. Copy lives in `messages/{en,pt}/*.json`. Currency is always EUR.

## Test data (mock_data.sql, password for all: `Password123!`)

| Account | Role | Notes |
|---|---|---|
| `demo.owner1@example.com` | BUSINESS_OWNER | "Barbearia Central", slug `demo-barbearia-central`, pt, 4 staff (Miguel, Rui, Tiago active; Bruno inactive), split shifts, review-flagged bookings, inactive service "Coloracao" |
| `demo.owner2@example.com` | BUSINESS_OWNER | "Studio Bella", slug `demo-studio-bella`, en, staff Sofia + Ines |
| `demo.owner3@example.com` | BUSINESS_OWNER | "Clinica Fisio Porto", slug `demo-clinica-fisio-porto`, pt, staff on vacation, quote requests |
| `demo.owner4@example.com` | BUSINESS_OWNER | no business yet (onboarding flow) |
| `demo.staff1@example.com` | STAFF | linked to Miguel (owner1's business) |
| `demo.staff2@example.com` | STAFF | not linked to any staff profile |
| `demo.staff3@example.com` | STAFF | inactive user, login must fail |

Bookings are anchored to the current week (last/this/next) and include every status. Past CONFIRMED bookings get `needsReviewAt` set by a job running every 15 min.

## Domain model

`User` 1—1 `Business` 1—* `Service`, `Staff`, `Customer`, `Booking`, `QuoteRequest`. `Staff` *—* `Service` (a service with no assignments is offered by every active staff member). `Staff` 1—* `WorkingHours` (`dayOfWeek` UPPERCASE e.g. `MONDAY`, `startTime`/`endTime`, split shifts allowed) and `AvailabilityException` (single `date`, optional time range, type `VACATION|PERSONAL|OTHER`).

Booking statuses: `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`. Only `CONFIRMED` blocks a slot. `needsReviewAt` is non-null only while an overdue CONFIRMED booking awaits resolution; `complete`, `no-show` and `cancel` clear it.

## API surface (`/api/v1`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` (email, password min 8, termsAccepted=true, termsVersion) · `POST /auth/login` · `POST /auth/logout` (always 204) · `GET /account/export` · `POST /account/delete` (400 `INVALID_PASSWORD` on wrong password) |
| Business | `POST /business` · `GET /business/me` · `PUT /business/me` |
| Staff | `POST /staff` · `GET /staff` · `GET/PUT/DELETE /staff/{id}` (DELETE deactivates) · `GET/PUT /staff/{id}/services` · `POST/DELETE /staff/{id}/services/{serviceId}` · `GET/PUT /staff/{id}/working-hours` · `DELETE /staff/{id}/working-hours/{whId}` · `GET/POST /staff/{id}/availability-exceptions` · `DELETE /staff/{id}/availability-exceptions/{exId}` |
| Services | `POST/GET /services` · `GET/PUT/DELETE /services/{id}` · `PATCH /services/{id}/toggle` |
| Customers | `POST/GET /customers` (`search`, `page`, `size`) · `GET/PUT/DELETE /customers/{id}` |
| Bookings (auth) | `GET /bookings` (`from`, `to`, `staffId`, `customerId`, `status`, `needsReview`, `page`, `size`) · `GET /bookings/{id}` · `PATCH /bookings/{id}/cancel` · `/complete` · `/no-show` |
| Public | `GET /public/businesses/{slug}` · `GET /public/businesses/{slug}/staff` · `GET /public/businesses/{slug}/availability?date&serviceId[&staffId]` · `POST /public/bookings` (optional `Idempotency-Key`) · `GET /public/bookings/{id}` · `POST /public/quote-requests` |
| Quotes (auth) | `GET /quote-requests` · `GET /quote-requests/{id}` · `PATCH /quote-requests/{id}/quote` · `PATCH /quote-requests/{id}/decline` |
| Analytics | `GET /analytics/dashboard?from&to` |
| Health | `GET /actuator/health` (public) |

Lists are paginated: `{content, page, size, totalElements, totalPages}`; the frontend fetches max `size=200` per page.

## Rules and behaviours worth attacking

- Slots are 15-minute aligned, sized to the service duration; past slots (judged in business timezone) are omitted; cancelled/completed/no-show do not block.
- `POST /public/bookings`: availability re-validated server-side; omitted `staffId` assigns the first free eligible staff in name order; booking in the past → 400 `BOOKING_IN_PAST`; staff does not offer service → 400 `STAFF_DOES_NOT_OFFER_SERVICE`; at least one of `customer.phone`/`customer.email`; concurrent same-slot requests must yield exactly one 201, rest 409. Customer matched by email then phone and never overwritten by public requests.
- Idempotency: same key + same payload → original booking with 201 and `Idempotent-Replayed: true`; same key + different payload → 422 `IDEMPOTENCY_KEY_REUSE`; malformed key → 400 `INVALID_IDEMPOTENCY_KEY`.
- Error codes: 400 `INVALID_EMAIL|INVALID_SLUG|INVALID_TIMEZONE|INVALID_TIME_RANGE|BOOKING_IN_PAST|STAFF_DOES_NOT_OFFER_SERVICE|INVALID_DATE_RANGE|INVALID_IDEMPOTENCY_KEY|VALIDATION_FAILED|MALFORMED_REQUEST`, 422 `IDEMPOTENCY_KEY_REUSE`, 429 `TOO_MANY_REQUESTS` (with `Retry-After`). Frontend maps codes through `messages/*/errors.json` `codes.*`.
- Rate limits per IP per minute (defaults): login 10, register 5, public booking 10, quote request 5. The skill starts the backend with raised limits; if you still see 429, honour `Retry-After`.
- Every response carries `X-Request-Id`; a client value (`[A-Za-z0-9._-]`, max 64) is echoed.
- Multi-tenancy: every resource belongs to one business. Another business's IDs must behave as not found (404) or forbidden, never leak data.
- CORS only allows origins in `CORS_ALLOWED_ORIGINS`; no credentials on CORS beyond the configured origin.

## Frontend routes

| Route | Purpose |
|---|---|
| `/login` | Sign in / create account tabs. Redirects to `/onboarding` if no business, else `/dashboard` |
| `/onboarding` | Wizard: business → first service → team + hours → share link |
| `/dashboard` | Today's overview, stats, upcoming bookings, review badge |
| `/calendar` | Day view (one column per staff, timeline) and week view, create booking by clicking a slot, booking detail dialog (cancel/complete/no-show) |
| `/review` | Overdue bookings awaiting resolution, bulk complete, paginated |
| `/customers`, `/customers/[id]` | Search + paging, detail with booking history |
| `/services` | Service cards: create, edit, toggle active, delete |
| `/staff`, `/staff/[id]` | Staff list; detail with services, working hours, exceptions |
| `/quotes` | Quote requests: quote / decline |
| `/analytics` | KPIs, revenue chart, funnel, top lists, date range presets |
| `/settings` | Business profile, booking link, privacy (account export/delete), language |
| `/b/[slug]` | Public landing |
| `/b/[slug]/booking` | Public booking wizard (service → staff → date → time → details), `?service=` preselects |
| `/b/[slug]/confirmation` | Post-booking summary |
| `/b/[slug]/quote`, `/b/[slug]/privacy` | Public quote form, privacy notice |
| `/privacy`, `/terms`, `/dpa`, `/sub-processors` | Legal pages (draft placeholders) |

Calendar booking colours: CONFIRMED indigo, COMPLETED green, CANCELLED red (struck through), NO_SHOW amber, needs-review amber with a warning icon.

## UI testing conventions

- The UI has no `data-testid` or stable ids. Select with Playwright `get_by_role`, `get_by_label`, `get_by_text`, `get_by_placeholder`. Look up exact copy in `messages/en/*.json`; force English with cookie `NEXT_LOCALE=en` (domain `localhost`) for deterministic text, and use `pt` only for i18n checks.
- Dialogs are Base UI dialogs: `role=dialog`, focus trap, Esc closes. Toasts come from `components/ui/toast`.
- Forms use React Hook Form + Zod; invalid fields set `aria-invalid="true"`.
- Authenticated browser contexts: log in via the API, then add the `access_token` cookie (see `utils.authed_cookies`). Do not log in through the UI for every test.
- Calendar geometry: 64px per hour (`HOUR_PX`), day view columns on `md+`, stacked per-staff timelines below `md`.

## Operational gotchas

- Backend must run with `AUTH_COOKIE_SECURE=false` over http, otherwise browsers drop the cookie.
- Backend must run with `CORS_ALLOWED_ORIGINS=http://localhost:3000`.
- Tests run on Windows. Write Python scripts to files and run `python script.py`; do not use multi-line `python -c` in PowerShell (f-strings/quotes break). Write files as UTF-8.
- Prefix every record you create with `E2E ` so it can be recognised and cleaned. Clean up what you create.
