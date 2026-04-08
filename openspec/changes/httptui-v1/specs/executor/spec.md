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
- Accept self-signed certificates: **no** (default undici behavior)
- No client certificate support in V1
