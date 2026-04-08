# httptui v1 — Tasks

## Phase 1: Project Scaffold

- [ ] **Task 1.1: Initialize Node.js project**
  - `npm init`, configure `package.json` with name `httptui`, bin entry
  - Install dependencies: `ink`, `react`, `@inkjs/ui`, `undici`
  - Install dev dependencies: `typescript`, `tsup`, `vitest`, `@types/react`, `eslint`, `prettier`
  - Configure `tsconfig.json` (strict, JSX react-jsx, ESM)
  - Configure `tsup.config.ts` (entry: src/cli.tsx, format: esm, target: node18)
  - Configure `vitest.config.ts`
  - Add npm scripts: `dev`, `build`, `test`, `lint`
  - Create directory structure: `src/`, `src/core/`, `src/components/`, `test/`, `examples/`

## Phase 2: Core Layer (no UI dependency)

- [ ] **Task 2.1: Define shared types**
  - `src/core/types.ts` — `ParsedRequest`, `ResolvedRequest`, `ResponseData`, `HttpMethod`, `FileVariable`, `AppState`, `Action`
  - These types are the contract between all modules

- [ ] **Task 2.2: Build .http file parser**
  - `src/core/parser.ts` — line-by-line state machine
  - Parse: request lines, headers, body, `###` separators, comments, file variables
  - Return: `{ requests: ParsedRequest[], variables: FileVariable[] }`
  - Spec: `openspec/changes/httptui-v1/specs/parser/spec.md`

- [ ] **Task 2.3: Write parser tests**
  - `test/parser.test.ts`
  - Cases: empty file, single GET, multiple requests, headers, body, comments, variables, edge cases
  - Use example `.http` files from `examples/` directory

- [ ] **Task 2.4: Build variable resolver**
  - `src/core/variables.ts` — resolve `{{...}}` placeholders
  - Support: file variables, `$timestamp`, `$guid`, `$randomInt`, `$processEnv`, `$dotenv`
  - Two-pass resolution (file vars first, then system vars)
  - Spec: `openspec/changes/httptui-v1/specs/variables/spec.md`

- [ ] **Task 2.5: Write variable resolver tests**
  - `test/variables.test.ts`
  - Cases: file vars, system vars, nested vars, missing vars, dotenv, processEnv

- [ ] **Task 2.6: Build HTTP executor**
  - `src/core/executor.ts` — send resolved requests via undici
  - Capture: status, headers, body, timing
  - Handle: network errors, timeouts (30s)
  - Spec: `openspec/changes/httptui-v1/specs/executor/spec.md`

- [ ] **Task 2.7: Write executor tests**
  - `test/executor.test.ts`
  - Mock undici for unit tests
  - Cases: successful request, network error, timeout, various HTTP methods

- [ ] **Task 2.8: Build response formatter**
  - `src/core/formatter.ts` — format response for display
  - JSON pretty-print with syntax colors
  - Status code colorization (2xx green, 4xx orange, 5xx red)
  - Header formatting (dimmed)
  - Non-JSON passthrough

- [ ] **Task 2.9: Create example .http files**
  - `examples/basic.http` — simple GET/POST/PUT/DELETE
  - `examples/variables.http` — file variables, system variables, dotenv

## Phase 3: TUI Layer

- [ ] **Task 3.1: Build entry point**
  - `src/cli.tsx` — parse argv, read file, parse .http, render Ink app
  - Validate: file exists, has requests
  - Render with `alternateScreen: true`

- [ ] **Task 3.2: Build App component with state management**
  - `src/app.tsx` — root component with `useReducer`
  - AppState: requests, selectedIndex, focusedPanel, response, isLoading, error
  - useInput hook for all keyboard shortcuts
  - Spec: `openspec/changes/httptui-v1/specs/tui/spec.md`

- [ ] **Task 3.3: Build Layout component**
  - `src/components/Layout.tsx` — split-panel flexbox layout
  - Left panel (30% width, min 25 chars) + right panel (flexGrow: 1)
  - Focus-aware borders (accent color when focused)

- [ ] **Task 3.4: Build RequestList component**
  - `src/components/RequestList.tsx` — left panel
  - Show method + path for each request
  - Highlight selected request with `▸` and color
  - Scroll when requests exceed height

- [ ] **Task 3.5: Build ResponseView component**
  - `src/components/ResponseView.tsx` — right panel
  - Status line with colorized code + timing
  - Headers section (verbose mode only)
  - Body section (pretty-printed JSON or raw)
  - Empty state, loading state (Spinner), error state
  - Scrollable content

- [ ] **Task 3.6: Build StatusBar component**
  - `src/components/StatusBar.tsx` — bottom bar
  - Keyboard shortcut hints (left), file name + request count (right)
  - Single line, dimmed

- [ ] **Task 3.7: Build HelpOverlay component**
  - `src/components/HelpOverlay.tsx` — modal overlay
  - Full keyboard shortcut reference
  - Triggered by `?`, dismissed by `Escape`

- [ ] **Task 3.8: Build color utilities**
  - `src/utils/colors.ts` — status code colors, JSON syntax colors
  - Status: 2xx=green, 3xx=yellow, 4xx=orange/yellow, 5xx=red
  - JSON: keys=cyan, strings=green, numbers=yellow, booleans=magenta, null=dim

## Phase 4: Integration & Polish

- [ ] **Task 4.1: Integration testing**
  - End-to-end: parse file → resolve variables → send request → display
  - Test with real HTTP endpoints (httpbin.org or local mock server)

- [ ] **Task 4.2: Error handling polish**
  - Graceful handling of: malformed .http files, DNS failures, connection refused
  - User-friendly error messages in response panel

- [ ] **Task 4.3: Build & distribution setup**
  - `tsup` build producing single ESM bundle
  - `package.json` bin entry: `"httptui": "./dist/cli.js"`
  - Shebang: `#!/usr/bin/env node`
  - Test: `npm link` → `httptui examples/basic.http`

- [ ] **Task 4.4: README**
  - Installation, usage, .http file format reference, keyboard shortcuts, examples
