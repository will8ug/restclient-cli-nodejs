# Spec: HTTP Executor

## Overview

Takes a fully-resolved `ParsedRequest` (variables already substituted) and executes it using `undici`. Returns a structured `ResponseData` object.

## Input

```typescript
interface ResolvedRequest {
  method: HttpMethod;
  url: string;           // fully resolved, absolute URL
  headers: Record<string, string>;
  body: string | undefined;
}
```

## Output

```typescript
interface ResponseData {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timing: {
    durationMs: number;  // total request duration in milliseconds
  };
  size: {
    bodyBytes: number;   // response body size
  };
}
```

## Behavior

### Request Execution
- Use `undici.request()` for HTTP calls
- Set `Content-Type: application/json` only if body looks like JSON and no Content-Type header is explicitly set
- Follow redirects: **no** (by default, undici doesn't follow redirects — keep this behavior)
- Timeout: 30 seconds (hardcoded for V1)
- No retries

### Response Handling
- Read full response body as string (UTF-8)
- Capture all response headers
- Measure timing from request start to response body fully read

### Error Handling
- Network errors (DNS failure, connection refused, timeout) → return error object, don't crash
- Non-2xx status codes are NOT errors — they're valid responses to display
- Invalid URL → return error before sending

### TLS
- Accept self-signed certificates: **configurable** — disabled by default, enabled when `--insecure` flag is passed or `ExecutorConfig.insecure` is `true`.
- No client certificate support in V1

### Insecure Mode via ExecutorConfig

The executor accepts an optional `ExecutorConfig` parameter with an `insecure` boolean field. When `insecure` is `true`, the executor creates an undici `Agent` with `connect.rejectUnauthorized` set to `false` and passes it as the `dispatcher` option to `request()`. When `insecure` is `false` or the config is omitted, the executor uses default TLS verification (no custom dispatcher).

### Actionable TLS Error Messages

When a request fails due to a TLS certificate error, the executor detects the error code and appends remediation hints to the error message. The following error codes are detected: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, `DEPTH_ZERO_SELF_SIGNED_CERT`, `SELF_SIGNED_CERT_IN_CHAIN`, `CERT_HAS_EXPIRED`, `ERR_TLS_CERT_ALTNAME_INVALID`. The hint suggests the `--insecure` flag and `NODE_EXTRA_CA_CERTS` environment variable.

### CLI --insecure Flag

The CLI entry point recognizes `--insecure` and `-k` flags in `process.argv`. When present, the flag is parsed and removed from the argument list before extracting the file path. The parsed flag is passed as `ExecutorConfig` to the App component and propagated to the executor.

### Insecure Mode Warning

When insecure mode is active, the status bar in the TUI displays a visible "INSECURE" warning indicator.
