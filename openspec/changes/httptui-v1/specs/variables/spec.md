# Spec: Variable Resolution

## Overview

Resolve `{{...}}` variable placeholders in URLs, headers, and request bodies. Two-pass resolution: file variables first, then system/env variables.

## Variable Types

### 1. File Variables

```http
@hostname = api.example.com
@port = 3000
@baseUrl = https://{{hostname}}:{{port}}
```

- Declared with `@name = value` at file level
- Referenced as `{{name}}` (without `@`)
- Can reference other file variables and system variables
- Resolution: simple string replacement

### 2. System Variables

| Variable | Description | Example Output |
|----------|-------------|----------------|
| `{{$timestamp}}` | Unix timestamp (seconds) | `1712649600` |
| `{{$guid}}` | UUID v4 | `a1b2c3d4-e5f6-...` |
| `{{$randomInt min max}}` | Random integer in range | `42` |

- `{{$randomInt}}` without args defaults to 0-1000
- `{{$randomInt 1 100}}` — space-separated min max

### 3. Environment Variables

| Variable | Description |
|----------|-------------|
| `{{$processEnv VAR_NAME}}` | Read from process.env |
| `{{$dotenv VAR_NAME}}` | Read from `.env` file in CWD |

- `{{$processEnv}}` reads from `process.env`
- `{{$dotenv}}` reads from `.env` file in the same directory as the `.http` file, falling back to CWD
- If variable not found, leave placeholder as-is and log a warning

## Resolution Order

1. Parse all `@name = value` declarations → build variable map
2. Resolve file variable values (they may reference `{{$...}}` system vars)
3. For each request:
   a. Replace `{{name}}` with file variable values
   b. Replace `{{$...}}` with system/env values

## Scope

- File variables are scoped to the file (not shared across files)
- System variables are evaluated fresh each time they're resolved
- `{{$guid}}` generates a new UUID each time it appears (not cached)
- `{{$timestamp}}` returns the current time at resolution (not parse time)
