# vscode-restclient Research Summary

## Quick Overview

This research documents the complete `.http`/`.rest` file format specification used by the VS Code REST Client extension, which will inform the design of a pure CLI version.

## Key Findings

### 1. File Format is RFC 2616 Compliant
- Simple, text-based format with clear structure
- Request delimiter: `###` (3+ consecutive `#` symbols)
- Supports multiple requests in a single file
- Comments with `#` or `//`

### 2. Variable System is Sophisticated
- **4 types of variables**: File, Environment, Request, Prompt
- **10+ system variables**: `$guid`, `$timestamp`, `$datetime`, `$randomInt`, `$processEnv`, `$dotenv`, `$aadToken`, `$aadV2Token`, `$oidcAccessToken`, `$localDatetime`
- **Variable resolution precedence**: Request > File > Environment > System
- **Advanced features**: JSONPath/XPath for response extraction, percent-encoding, variable chaining

### 3. Authentication is Comprehensive
- Basic Auth (3 formats, auto base64 encoding)
- Digest Auth
- SSL Client Certificates (PEM, PFX, PKCS12)
- AWS Signature v4
- AWS Cognito
- Azure AD (v1 and v2)
- OIDC

### 4. Request Body Handling is Flexible
- Inline JSON/XML/text
- File references: `< ./file` (no variables) or `<@ ./file` (with variables)
- Custom encoding: `<@latin1 ./file`
- Multipart form data with file uploads
- Form URL-encoded with multi-line support

### 5. Special Request Types
- **GraphQL**: Add `X-REQUEST-TYPE: GraphQL` header
- **cURL**: Native cURL syntax support (limited options)

### 6. Response Handling
- Cookie persistence (auto-save, per-request override)
- Redirect following (auto-follow, per-request override)
- Per-request settings: `@note`, `@no-redirect`, `@no-cookie-jar`

## Existing CLI Alternatives

| Tool | Status | Language | Stars | Notes |
|------|--------|----------|-------|-------|
| **httpyac** | ✅ Active | TypeScript | 793 | Most feature-complete, supports gRPC/WebSocket/MQTT |
| **rest-cli** | ✅ Maintained | TypeScript | 3 | Minimal, intentionally compatible with vscode-restclient |
| **restish** | ✅ Active | Go | 1.2k | General REST CLI, not `.http` format specific |
| **restman** | ❌ Archived | Rust | 34 | TUI-based, no longer maintained |

## Recommended MVP Features (Priority Order)

### Priority 1 - Essential (v1.0)
- [x] Parse `.http` and `.rest` files
- [x] Request delimiter (`###`) support
- [x] Basic request parsing (method, URL, headers, body)
- [x] File variables (`@var = value`)
- [x] System variables (`{{$guid}}`, `{{$timestamp}}`, etc.)
- [x] Basic authentication
- [x] Send HTTP requests
- [x] Display responses

### Priority 2 - Important (v1.1-1.2)
- [ ] Environment variables support
- [ ] Request variables (named requests with response chaining)
- [ ] Prompt variables
- [ ] cURL request parsing
- [ ] GraphQL support
- [ ] Cookie handling
- [ ] Redirect following

### Priority 3 - Nice-to-Have (v2.0+)
- [ ] AWS authentication
- [ ] Azure AD authentication
- [ ] SSL client certificates
- [ ] Response saving
- [ ] Request history
- [ ] Code snippet generation

## Implementation Architecture

### Parser Pipeline
```
.http file
    ↓
[Tokenizer] → Split by ### delimiters
    ↓
[Request Parser] → Extract method, URL, headers, body
    ↓
[Variable Processor] → Replace {{...}} patterns
    ↓
[HTTP Client] → Send request (got/axios/node-fetch)
    ↓
[Response Handler] → Display/save response
```

### Key Regex Patterns
- **Variable reference**: `/\{{2}(.+?)\}{2}/g`
- **Delimiter**: `/^#{3,}/`
- **File variable**: `/^@(\w+)\s*=\s*(.*)$/`
- **Request name**: `/^[#\/]{1,2}\s*@name\s+(\w+)/`
- **Prompt variable**: `/^[#\/]{1,2}\s*@prompt\s+\{(\w+)\}(?:\s+(.+))?/`

## Configuration Strategy

Recommend `.restclient.json` or `.restclient.env` for:
- Environment definitions
- Default headers
- Timeout settings
- Cookie/redirect behavior
- Certificate paths

## Next Steps

1. **Design Phase**: Create detailed architecture document
2. **Parser Implementation**: Build robust `.http` file parser
3. **Variable System**: Implement variable processor with all 4 types
4. **HTTP Client**: Integrate HTTP library with auth support
5. **CLI Interface**: Design command-line arguments and options
6. **Testing**: Create comprehensive test suite with example `.http` files

## References

- **Full Research**: See `VSCODE_RESTCLIENT_RESEARCH.md`
- **Official Repo**: https://github.com/Huachao/vscode-restclient
- **RFC 2616**: http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
- **JSONPath**: http://goessner.net/articles/JsonPath/
- **XPath**: https://developer.mozilla.org/en-US/docs/Web/XPath

---

**Research Date**: April 8, 2026  
**vscode-restclient Version**: 0.26.0  
**Commit**: 0773d56b65d9e7033259519e99eef8f752f6ba6e
