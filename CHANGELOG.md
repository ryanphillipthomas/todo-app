# Changelog

All notable changes to this project will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.2.0] — 2026-04-19

### Added
- Apple Sign In on iOS (native AuthenticationServices)
- Apple Sign In on web (Apple JS SDK)
- JWT authentication (15-min access token + 30-day refresh token rotation)
- Per-user todo scoping — todos are private to each account
- Keychain storage for tokens on iOS
- Auth-gated WebSocket connections (per-user broadcast)
- Sign out button on both platforms

---

## [1.1.0] — 2026-04-19

### Added
- Express + SQLite backend API (`GET`, `POST`, `PATCH`, `DELETE /todos`)
- Real-time sync via WebSocket — changes on one device appear instantly on all others
- `/health` endpoint with uptime and timestamp
- Structured JSON request logging (Pino)
- Security headers (Helmet)
- Docker + docker-compose support with persistent volume
- Connection status indicator on web (connecting / reconnecting banner)
- Auto-reconnect WebSocket with 3s backoff
- React Error Boundary

---

## [1.0.0] — 2026-04-19

### Added
- Multiplatform todo app: React web (Vite) + native SwiftUI iOS
- Shared TypeScript `Todo` type and `useTodos()` hook across platforms
- Add, complete (toggle), and delete todos
- Incomplete todos sorted before completed; newest first within each group
- Swipe-to-delete on iOS, × button on web
- Animated checkmark on iOS
- GitHub Actions CI: lint, web build + test, API test, iOS XCTest
- ESLint across all TypeScript workspaces
- Vitest unit tests for shared hook, API endpoints, and web hook
- XCTest suite for Swift `TodoStore` with mock API client
