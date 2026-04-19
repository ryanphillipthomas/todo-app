# Todo App

Multiplatform todo app — React web + native SwiftUI iOS — sharing a common TypeScript data model and hook.

## Structure

```
todo-app/
├── packages/shared/   # TypeScript types + useTodos hook
├── apps/web/          # Vite + React
└── apps/mobile/       # SwiftUI (XcodeGen)
```

## Getting started

```bash
npm install
```

### Web
```bash
npm run web
# → http://localhost:5173
```

### iOS
```bash
cd apps/mobile
xcodegen generate
open TodoApp.xcodeproj
```

## Testing

```bash
# Shared hook (Vitest)
npm test --workspace=packages/shared

# iOS (XCTest)
cd apps/mobile && xcodebuild test \
  -project TodoApp.xcodeproj \
  -scheme TodoApp \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

## CI

GitHub Actions runs on every push and PR:
- **web** job: installs, runs shared tests, builds web app
- **ios** job: generates Xcode project, builds and tests on simulator
