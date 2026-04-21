# Changelog

All notable changes to this project will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.4.0] — 2026-04-21

### Added
- Bitrise CI/CD config (`bitrise.yml`) with two workflows:
  - `ci` — JS tests + iOS unit tests on every push/PR
  - `deploy` — archive + TestFlight upload triggered by `v*` tags

### Improved
- Test coverage expanded from 18 → 47 tests across all packages
- Auth route tests (dev-login, refresh, logout)
- WebSocket status state tests (connecting, connected)
- Changelog integrity and utils tests in shared package

### Fixed
- `addTodo` no longer fires a network request for blank or whitespace-only input

---

## [1.3.2] — 2026-04-20

### Added
- App icon at all required sizes (20–1024px), blue background with white checkmark
- `PrivacyInfo.xcprivacy` privacy manifest for App Store compliance (UserDefaults declared, no tracking)
- AccentColor asset catalog entry (`#007AFF`)

### Improved
- Release build config: `-O` Swift optimization, DWARF dSYM, product validation enabled
- `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` managed in `project.yml`
- README expanded with real screenshots, full feature list, tech stack table, and command reference

---

## [1.3.1] — 2026-04-19

### Added
- Settings page on web (slide-in panel) and iOS (Form sheet)
- Account section with initials avatar, name, and email
- What's New accessible from settings on both platforms

### Improved
- Light, Dark, and System appearance toggle (persisted to localStorage / AppStorage)

---

## [1.3.0] — 2026-04-19

### Fixed
- Dev login now works regardless of which port Vite picks (CORS allows all localhost origins in dev)
- Adding todos no longer fails after a fresh install (stale SQLite schema with missing `user_id` column)
- Login button shows errors instead of failing silently
- Loading state on sign-in button prevents double-tap

---

## [1.2.0] — 2026-04-19

### Added
- Apple Sign In on iOS (native AuthenticationServices)
- Apple Sign In on web (Apple JS SDK)
- JWT authentication (access token + 30-day refresh token rotation)
- Per-user todo scoping — todos are private to each account
- Keychain storage for tokens on iOS
- Auth-gated WebSocket connections (per-user broadcast)
- Sign out on both platforms

---

## [1.1.0] — 2026-04-19

### Added
- Express + SQLite backend API (`GET`, `POST`, `PATCH`, `DELETE /todos`)
- Real-time sync via WebSocket — changes appear instantly across all devices
- `/health` endpoint with uptime and timestamp
- Structured JSON logging (Pino), security headers (Helmet)
- Docker + docker-compose with persistent volume
- Connection status indicator on web
- Auto-reconnect WebSocket with 3s backoff
- React Error Boundary

---

## [1.0.0] — 2026-04-19

### Added
- Multiplatform todo app: React web (Vite) + native SwiftUI iOS
- Shared TypeScript `Todo` type across platforms
- Add, complete (toggle), and delete todos
- Incomplete todos sorted before completed; newest first within each group
- Swipe-to-delete on iOS, × button on web
- GitHub Actions CI: lint, web build, API tests, iOS XCTest
- Vitest tests for shared, API, and web
- XCTest suite with mock API client
