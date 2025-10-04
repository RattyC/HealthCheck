# Production Readiness Checklist

Use this list to track the remaining polish before handing HealthCheck CM Price to users or stakeholders. Tick items as they are implemented.

## 1. UX & Presentation
- [x] Add hover/focus micro-interactions to buttons, cards, and tabs
- [x] Provide loading skeletons with shimmer states for package lists and detail panels
- [x] Craft friendly empty states with illustrations or icons per page (search, bookmarks, admin)
- [x] Ship dark mode with toggle persisted per user preference
- [x] Enable global command palette (`Cmd/Ctrl + K`) to jump to hospitals/packages/settings
- [x] Ensure consistent spacing, typography scale, and color usage across layouts

## 2. User-Facing Features
- [x] Personalise หน้าแรกและโปรโมชันตามบทบาท (ผู้เยี่ยมชม/ผู้ใช้/แอดมิน) พร้อมลิงก์ไปยังกระบวนการที่เกี่ยวข้อง
- [x] Make compare selections shareable via URL or social share dialog
- [x] Plot price history using charts (e.g., Recharts) in package detail and dashboard
- [x] Highlight "Hot Deals" / trending packages on the home page
- [x] Extend bookmark manager with grouping, removal, and direct compare actions
- [x] Provide inline hospital contact information (call, map link) on detail pages

## 3. Admin & Operations
- [x] Show diff view when approving package updates (price/items changes)
- [x] Support bulk approve/archive actions in admin tables
- [x] Log admin activities (who approved/edited and when)
- [x] Add analytics dashboard for search volume, popular filters, compares/day
- [x] Surface user cart interest in weekly digest or export CSV

## 4. Performance, Stability, Security
- [x] Add PostgreSQL indexes on `HealthPackage(status, hospitalId, updatedAt)` and other hot queries
- [x] Use ISR cache tags or SWR revalidation for package lists to reduce DB load
- [x] ตั้งค่า server timeouts (`withTimeout`) สำหรับสรุปหน้าแรกตามบทบาท ลดโอกาสที่ DB ช้าแล้วทำให้ UX กระตุก
- [x] Validate all API payloads with Zod and return friendly errors
- [x] Enforce server-side role checks (RBAC) for every admin route & API
- [x] Apply rate limiting to public APIs (search, compare, cart)
- [x] Configure error boundaries per route with helpful guidance
- [x] Monitor slow queries with Prisma logs or APM (e.g., Sentry / New Relic)

## 5. Content & Compliance
- [ ] Prepare Terms of Service and Privacy Policy pages with legal review
- [ ] Populate marketing copy (hero, CTA, benefit bullets) with final wording
- [ ] Provide localization review for all Thai copy and transliterations
- [ ] Add OG images, structured data, and favicons for sharing

## 6. Documentation & Delivery
- [ ] Update README with stack diagram, ERD, and deployment notes
- [ ] Capture annotated screenshots of major flows (home, compare, admin)
- [ ] Record 2–3 minute demo walkthrough (search → compare → admin approve)
- [ ] Produce feature roadmap and future enhancements slide
- [ ] Describe backup & recovery approach for database and assets
- [ ] Configure GitHub Action secrets (`SSH_PRIVATE_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, optional `DEPLOY_PORT`) for automated build + deploy
- [ ] Verify CI workflow (`.github/workflows/ci.yml`) passes on pull requests and deploy workflow succeeds on `main`

## 7. Testing & QA
- [ ] Smoke-test flows on mobile, tablet, and desktop breakpoints
- [ ] Achieve Lighthouse performance score ≥ 85 on key pages
- [ ] Implement automated tests for critical flows (sign-in, cart, admin approve)
- [ ] Verify error handling & fallback copy for offline/DB down scenarios
- [ ] Run accessibility audit (ARIA labels, keyboard navigation, color contrast)

Tick off each item as you ship it to keep the project presentation-ready.
