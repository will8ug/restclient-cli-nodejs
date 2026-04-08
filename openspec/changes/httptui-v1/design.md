# httptui v1 — Design

## Architecture Overview

```
httptui <file.http>
        │
        ▼
┌──────────────────────────────────────────────────┐
│                   Entry Point                     │
│              src/cli.tsx                          │
│  - Validate args (file path)                     │
│  - Read .http file                               │
│  - Parse into Request[]                          │
│  - render(<App requests={...} />,                │
│          { alternateScreen: true })              │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│              UI Layer (Ink/React)                  │
│                                                   │
│  <App>                                           │
│    <Layout>                                      │
│      <RequestListPanel />   ← left panel         │
│      <ResponsePanel />      ← right panel        │
│    </Layout>                                     │
│    <StatusBar />             ← bottom bar         │
│  </App>                                          │
│                                                   │
│  State: useReducer for app state                 │
│  Input: useInput for keyboard shortcuts          │
└──────────────────┬───────────────────────────────┘
                   │ triggers
                   ▼
┌──────────────────────────────────────────────────┐
│              Core Layer (pure TS, no React)        │
│                                                   │
│  src/parser/     → .http file → Request[]        │
│  src/variables/  → resolve @var, {{$sys}}        │
│  src/executor/   → Request → Response (undici)   │
│  src/formatter/  → Response → formatted strings  │
└──────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Separation: Core vs UI

The core layer (parser, variable resolver, HTTP executor, response formatter) has **zero React/Ink dependency**. It's pure TypeScript functions and types.

This means:
- Core is independently testable (vitest, no DOM/terminal mocking)
- If we ever add a CI mode later, the core is already decoupled
- Parser tests are simple: string in → Request[] out

### 2. Alternate Screen Buffer

The TUI renders in the terminal's alternate screen buffer (`render(<App />, { alternateScreen: true })`). When the user quits, their original terminal content is fully restored. This is how vim, htop, and similar tools behave.

### 3. State Management

Single `useReducer` at the `<App>` level. No external state library.

```typescript
type AppState = {
  requests: ParsedRequest[];
  selectedIndex: number;
  focusedPanel: 'requests' | 'response';
  response: ResponseData | null;
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'SELECT_REQUEST'; index: number }
  | { type: 'SEND_REQUEST' }
  | { type: 'RECEIVE_RESPONSE'; response: ResponseData }
  | { type: 'REQUEST_ERROR'; error: string }
  | { type: 'SWITCH_PANEL' }
  | { type: 'TOGGLE_VERBOSE' }
  | { type: 'SCROLL_RESPONSE'; direction: 'up' | 'down' };
```

### 4. Keyboard Shortcuts

All shortcuts handled in a single `useInput` hook at the `<App>` level with priority-based dispatch:

| Key | Action |
|-----|--------|
| `↑` / `k` | Move selection up (request list) or scroll up (response) |
| `↓` / `j` | Move selection down (request list) or scroll down (response) |
| `Enter` | Send selected request |
| `Tab` | Switch focus between panels |
| `q` | Quit |
| `v` | Toggle verbose mode (show/hide response headers) |
| `r` | Toggle raw mode (unformatted response body) |
| `?` | Toggle help overlay |

Vim-style `j`/`k` navigation included because terminal power users expect it.

### 5. Panel Layout

```
┌────────────────────┬───────────────────────────────────────┐
│   Request List     │   Response                            │
│   width: 30%       │   width: 70%                          │
│   min: 25 chars    │   flexGrow: 1                         │
│                    │                                        │
│   - method + path  │   - status line (colorized)           │
│   - selected: ▸    │   - headers (if verbose)              │
│   - scroll if many │   - body (pretty-printed JSON)        │
│                    │   - scroll with j/k when focused      │
└────────────────────┴───────────────────────────────────────┘
│  Status Bar: shortcuts | timing | file name                │
└─────────────────────────────────────────────────────────────┘
```

The left panel has a fixed-ish width (30%, min 25 chars). The right panel takes remaining space. Both panels scroll independently when focused.

### 6. Response Formatting

- **Status code**: Green (2xx), Yellow (3xx), Orange (4xx), Red (5xx)
- **Headers**: Dimmed, only shown in verbose mode
- **JSON body**: Pretty-printed with syntax coloring (keys in cyan, strings in green, numbers in yellow)
- **Non-JSON body**: Displayed as-is (plain text, XML, HTML)
- **Timing**: Shown in status bar (e.g., "247ms")

## File Structure

```
httptui/
├── src/
│   ├── cli.tsx              ← entry point, parse args, render Ink app
│   ├── app.tsx              ← root <App> component, state, keyboard
│   ├── components/
│   │   ├── Layout.tsx       ← split-panel flexbox layout
│   │   ├── RequestList.tsx  ← left panel: list of requests
│   │   ├── ResponseView.tsx ← right panel: response display
│   │   ├── StatusBar.tsx    ← bottom bar: shortcuts, timing
│   │   └── HelpOverlay.tsx  ← modal: keyboard shortcut reference
│   ├── core/
│   │   ├── parser.ts        ← .http file parser
│   │   ├── variables.ts     ← variable resolution
│   │   ├── executor.ts      ← HTTP request execution (undici)
│   │   ├── formatter.ts     ← response body formatting
│   │   └── types.ts         ← shared types (ParsedRequest, ResponseData, etc.)
│   └── utils/
│       └── colors.ts        ← status code color mapping, JSON syntax colors
├── test/
│   ├── parser.test.ts
│   ├── variables.test.ts
│   ├── executor.test.ts
│   └── formatter.test.ts
├── examples/
│   ├── basic.http           ← simple GET/POST examples
│   └── variables.http       ← variable usage examples
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## .http File Parser Design

### Grammar (informal)

```
file        = (variable | request | comment | blank)*
variable    = '@' name '=' value NEWLINE
comment     = ('#' | '//') text NEWLINE
separator   = '###' text? NEWLINE
request     = request_line headers? blank_line? body?
request_line = METHOD url HTTP_VERSION? NEWLINE
headers     = (header_line)+
header_line = name ':' value NEWLINE
body        = (non_separator_line)+
```

### Parser Strategy: Line-by-line State Machine

```
State: IDLE
  │
  ├─ "@var = val"    → store variable, stay IDLE
  ├─ "# comment"     → skip, stay IDLE
  ├─ "###"           → start new request boundary, stay IDLE
  ├─ "GET /path"     → create new request, move to HEADERS
  │
State: HEADERS
  │
  ├─ "Key: Value"    → add header, stay HEADERS
  ├─ blank line       → move to BODY
  ├─ "###"           → finalize request, move to IDLE
  ├─ EOF             → finalize request
  │
State: BODY
  │
  ├─ "###"           → finalize request with body, move to IDLE
  ├─ any line        → append to body, stay BODY
  ├─ EOF             → finalize request with body
```

No external parser dependency. ~150-200 lines of TypeScript.

## Variable Resolution

### Resolution Order

1. System variables (`{{$timestamp}}`, `{{$guid}}`, `{{$randomInt min max}}`)
2. Process env variables (`{{$processEnv VAR_NAME}}`)
3. Dotenv variables (`{{$dotenv VAR_NAME}}`) — reads `.env` from CWD
4. File variables (`@var = value`) — can reference other variables

### Implementation

Simple regex-based replacement: find `{{...}}` patterns, resolve, replace. One pass for file variables, one pass for system/env variables. File variables can reference system variables (two-pass resolution).
