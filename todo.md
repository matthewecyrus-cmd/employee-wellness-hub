# Employee Wellness Hub — TODO

## Phase 1: Schema & Backend
- [x] Add `tableside_sessions` table to drizzle schema (id, title, location, description, startTime, endTime, month, year, sortOrder)
- [x] Add `hub_sections` table (id, label, icon, color, route, isActive, sortOrder)
- [x] Add `hub_content` table (id, sectionKey, contentType, body, updatedAt)
- [x] Run migration SQL via webdev_execute_sql
- [x] Add db helpers in server/db.ts for sessions and sections
- [x] Add Express route GET /api/calendar/:sessionId that serves .ics with Content-Type: text/calendar
- [x] Add tRPC procedures: tableside.list, tableside.upsert, tableside.delete (admin)
- [x] Add tRPC procedures: sections.list, sections.upsert (admin)
- [x] Add tRPC procedures: content.get, content.upsert (admin)

## Phase 2: Hub Home Page
- [x] Design colorful mobile-first home page with vibrant section buttons
- [x] Each button routes to its dedicated page
- [x] Hero area with month/theme headline
- [x] Responsive grid of section cards

## Phase 3: Tableside Activity Page
- [x] List up to 4 session cards per month
- [x] Each card shows title, location, day/time
- [x] "Add to Calendar" button uses Android native calendar intent or inline .ics endpoint
- [x] Correct MIME type ensures native iOS/Android calendar prompt

## Phase 4: Admin Interface
- [x] Admin-only route /admin (protected, owner role)
- [x] Tableside sessions CRUD: add/edit/delete up to 4 sessions
- [x] Hub sections management: toggle active, reorder, edit labels/colors
- [x] Page content editor for each section

## Phase 5: Remaining Section Pages
- [x] Resources page (tip sheets, documents)
- [x] Events page (Lunch & Learn, etc.)
- [x] Health Coaching / Schedule Time page
- [x] National Safety / Awareness page
- [x] Men's Health / Awareness page
- [x] Quick Announcements section on home

## Phase 6: Polish & Tests
- [x] Mobile-first responsive design verified
- [x] Vitest tests for .ics endpoint and tRPC procedures
- [x] QR code display page for admin (hub URL shown in admin panel)
- [x] Checkpoint saved

## Tableside Session Update - June 2026

- [x] Insert/update 4 tableside sessions in DB (Tension Relief with a Thera-Cane)
- [x] Update Tableside.tsx to show 4 session cards with individual calendar buttons
- [x] Update hub-employee.html with 4 session cards and individual calendar buttons
- [x] Push updated HTML to GitHub Pages
- [x] Save checkpoint

## Calendar & Feature Improvements

- [x] Fix mobile calendar: iOS gets inline .ics, Android gets native calendar insert intent
- [x] Add Back to Hub button on Tableside page
- [x] Add Lunch & Learn RSVP URL field in admin Settings panel
- [x] Add Resources file/PDF upload support in admin panel (Upload PDF button in Content Manager)
