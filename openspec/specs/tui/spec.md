# Spec: TUI Interface

## Overview

Interactive terminal UI built with Ink (React for CLI). Fullscreen alternate-buffer application with split-panel layout and keyboard navigation.

## Layout

```
┌────────────────────┬───────────────────────────────────────┐
│   Request List     │   Response                            │
│   (30% width,      │   (70% width,                         │
│    min 25 chars)   │    flexGrow: 1)                       │
│                    │                                        │
│   ▸ GET /users     │   HTTP/1.1 200 OK        247ms        │
│     POST /users    │                                        │
│     PUT /users/1   │   Content-Type: application/json      │
│     DEL /users/1   │   X-Req-Id: abc-123                   │
│                    │                                        │
│                    │   {                                    │
│                    │     "users": [                         │
│                    │       { "id": 1, "name": "Alice" }    │
│                    │     ]                                  │
│                    │   }                                    │
│                    │                                        │
├────────────────────┴───────────────────────────────────────┤
│ [Enter] Send  [j/k] Nav  [Tab] Panel  [v] Verbose  [q] Quit│
└─────────────────────────────────────────────────────────────┘
```

## Panels

### Request List Panel (left)
- Shows all parsed requests from the file
- Each entry: `METHOD /path` (truncated to fit width)
- Selected request highlighted with `▸` prefix and bold/color
- Scroll when requests exceed panel height
- Focused state: bordered with accent color

### Response Panel (right)
- Shows response for the last sent request
- Status line: `HTTP/1.1 {code} {text}` with timing
  - 2xx: green, 3xx: yellow, 4xx: orange, 5xx: red
- Headers section: shown only in verbose mode (dimmed text)
- Body section: pretty-printed JSON (with syntax colors) or raw text
- Scroll when content exceeds panel height
- Empty state: "Select a request and press Enter to send"

### Status Bar (bottom)
- Left side: keyboard shortcut hints
- Right side: file name, request count
- Single line, full width
- Dimmed text

## Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `↑` or `k` | Request list focused | Select previous request |
| `↓` or `j` | Request list focused | Select next request |
| `↑` or `k` | Response focused | Scroll response up |
| `↓` or `j` | Response focused | Scroll response down |
| `Enter` | Any | Send currently selected request |
| `Tab` | Any | Switch focus between panels |
| `v` | Any | Toggle verbose mode (show/hide headers) |
| `r` | Any | Toggle raw mode (no JSON formatting) |
| `R` | Any | Reload file from disk |
| `?` | Any | Toggle help overlay |
| `q` | Any (no overlay) | Quit application |
| `Escape` | Help overlay open | Close overlay |

## States

### Application States
- **Idle**: Request selected, no response yet (or previous response shown)
- **Loading**: Request in flight (show spinner in response panel)
- **Success**: Response received, displaying it
- **Error**: Network/connection error (show error message in response panel)

### Focus States
- **Request list focused**: bordered with accent color, keyboard controls list
- **Response focused**: bordered with accent color, keyboard controls scroll

## Startup

1. Parse file path from argv
2. If no file arg: show usage message and exit
3. If file doesn't exist: show error and exit
4. Parse .http file
5. If no requests found: show "No requests found in {file}" and exit
6. Render TUI with alternate screen buffer
7. First request pre-selected, response panel shows empty state

## Exit

- `q` key: clean exit, restore terminal
- `Ctrl+C`: clean exit, restore terminal
- Unhandled error: exit with error message (outside alternate buffer)

## File Reload

### Action: RELOAD_FILE

The TUI supports a `RELOAD_FILE` action that replaces the in-memory `requests` and `variables` with freshly parsed content from `filePath`. The action payload includes `requests` (ParsedRequest[]) and `variables` (FileVariable[]).

- Successful reload: re-read file from `filePath`, parse it, dispatch `RELOAD_FILE` with the new data, request list reflects new contents
- Selection preservation: if the currently selected request name still exists in the reloaded file, keep it selected; otherwise reset `selectedIndex` to 0
- Reload clears `response`, `error`, and `responseScrollOffset`

### Input: R key

The `R` key (Shift+R) triggers file reload. The reload handler reads the file at `state.filePath` using `readFileSync`, parses it with `parseHttpFile`, and dispatches a `RELOAD_FILE` action with the result. If the file read or parse fails, the handler dispatches a `REQUEST_ERROR` action with the error message.

- Lowercase `r` toggles raw mode (existing behavior), not reload

### Reload Confirmation

The status bar displays a temporary "Reloaded" confirmation (green, bold) when the file is reloaded. The message disappears after 2 seconds via a `CLEAR_RELOAD_MESSAGE` action dispatched by `setTimeout`.

### Help Overlay

The help overlay lists `R` as the "Reload file from disk" shortcut.
