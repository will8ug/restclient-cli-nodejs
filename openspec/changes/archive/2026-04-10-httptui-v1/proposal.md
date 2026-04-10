# httptui v1 — Terminal REST Client

## Summary

Build `httptui` — an interactive TUI (Terminal User Interface) tool that parses `.http` files and lets you browse, send, and inspect HTTP requests entirely from the terminal. Think Postman, but for people who live in the terminal.

No CI mode. No piping. Pure interactive TUI with keyboard shortcuts.

## Motivation

- VS Code REST Client popularized the `.http` file format, but it's locked inside VS Code
- httpyac exists as a CLI but it's heavy (1.2MB), CI-focused, and not interactive
- No Ink-based REST client TUI exists — this is a gap in the ecosystem
- Terminal power users want a fast, keyboard-driven HTTP tool without leaving their workflow

## Scope

### In Scope (V1)

- Parse `.http` and `.rest` files (custom parser, no external deps)
- Interactive TUI with split-panel layout (request list + response viewer)
- Keyboard navigation (arrow keys, Enter to send, Tab to switch panels, q to quit)
- File-level variables (`@hostname = api.example.com`)
- Basic system variables (`{{$timestamp}}`, `{{$guid}}`, `{{$randomInt}}`)
- `{{$dotenv VAR}}` and `{{$processEnv VAR}}` support
- HTTP methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Request headers
- Inline request bodies (JSON, text, XML)
- Colorized response display (status code, headers, JSON pretty-print)
- Request timing
- Status bar with keyboard shortcut hints

### Out of Scope (V1)

- Non-interactive / CI mode (no `run` subcommand)
- Request body from file (`< ./file.json`)
- Named requests / response chaining
- Prompt variables (interactive `{{$input}}`)
- GraphQL-specific support
- Multipart form-data
- Certificate auth / mTLS
- cURL import/export
- Cookie jar persistence
- Response assertions / testing
- AWS Signature / Azure AD auth
- Environment file switching (beyond dotenv)
- Mouse support

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js >= 18 | Widely available, stable |
| Language | TypeScript | Type safety, DX |
| TUI Framework | Ink 6.x (React) | Production-proven (Gemini CLI, Claude Code), 37K stars, great ecosystem |
| UI Components | @inkjs/ui | TextInput, Select, Spinner — official Ink components |
| HTTP Client | undici | Node.js native HTTP client, zero deps, full control |
| Build | tsup | Fast (esbuild), simple config |
| Test | vitest | Fast, TypeScript-native, good DX |
| Linting | eslint + prettier | Standard Node.js tooling |

## Distribution

V1: `npm install -g httptui` then run `httptui path/to/api.http`

## Non-Goals

- VS Code REST Client compatibility — we support common `.http` patterns, not every edge case
- Plugin system
- Config files or themes
- Request history persistence
