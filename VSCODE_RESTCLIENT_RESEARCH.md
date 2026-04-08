# vscode-restclient Format & Features Research

**Repository**: https://github.com/Huachao/vscode-restclient  
**Commit SHA**: 0773d56b65d9e7033259519e99eef8f752f6ba6e  
**Version**: 0.26.0  
**License**: MIT

---

## 1. .HTTP/.REST FILE FORMAT SPECIFICATION

### 1.1 File Extensions & Language Support
- **Extensions**: `.http` and `.rest`
- **Language ID**: `http`
- **Auto-detection**: Files starting with RFC 2616 request line format
- **Markdown Support**: Fenced code blocks with `http` or `rest` language identifier

### 1.2 Request Structure (RFC 2616 Compliant)

**Basic Format**:
```
[METHOD] URL [HTTP/VERSION]
[HEADERS]
[BLANK LINE]
[BODY]
```

**Request Line Variants**:
```http
GET https://example.com/comments/1 HTTP/1.1
GET https://example.com/comments/1
https://example.com/comments/1
```
- If method omitted → defaults to **GET**
- HTTP version is optional

**Evidence**: [httpRequestParser.ts#L149-L171](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/src/utils/httpRequestParser.ts#L149-L171)

### 1.3 Request Delimiter: `###`

**Syntax**: Three or more consecutive `#` symbols on a line  
**Regex Pattern**: `/^#{3,}/`  
**Purpose**: Separates multiple requests in a single file

**Example**:
```http
GET https://example.com/comments/1 HTTP/1.1

###

GET https://example.com/topics/1 HTTP/1.1

###

POST https://example.com/comments HTTP/1.1
content-type: application/json

{
    "name": "sample"
}
```

**Evidence**: [selector.ts#L289-L293](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/src/utils/selector.ts#L289-L293)

### 1.4 Request Headers

**Format**: `Header-Name: Header-Value`  
**Parsing**: Continues until first blank line  
**Default Headers**: 
- `User-Agent: vscode-restclient` (if not specified)
- `Accept-Encoding: gzip` (configurable)

**Multi-line Query Parameters**:
```http
GET https://example.com/comments
    ?page=2
    &pageSize=10
```

**Evidence**: [httpRequestParser.ts#L60-L68](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/src/utils/httpRequestParser.ts#L60-L68)

### 1.5 Request Body

**Inline Body**:
```http
POST https://example.com/comments HTTP/1.1
Content-Type: application/json

{
    "name": "sample",
    "time": "Wed, 21 Oct 2015 18:27:50 GMT"
}
```

**File Reference** (without variable processing):
```http
POST https://example.com/comments HTTP/1.1
Content-Type: application/xml

< ./demo.xml
```

**File Reference with Variable Processing**:
```http
POST https://example.com/comments HTTP/1.1
Content-Type: application/xml

<@ ./demo.xml
```

**File Reference with Custom Encoding**:
```http
POST https://example.com/comments HTTP/1.1
Content-Type: application/xml

<@latin1 ./demo.xml
```

**Multipart Form Data**:
```http
POST https://api.example.com/user/upload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="text"

title
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="image"; filename="1.png"
Content-Type: image/png

< ./1.png
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Form URL-Encoded** (multi-line):
```http
POST https://api.example.com/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

name=foo
&password=bar
```

**Evidence**: [httpRequestParser.ts#L173-L231](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/src/utils/httpRequestParser.ts#L173-L231)

### 1.6 Comments

**Syntax**: Lines starting with `#` or `//`  
**Scope**: Can appear anywhere in the file  
**Example**:
```http
# This is a comment
// This is also a comment
GET https://example.com/api
```

---

## 2. VARIABLE SUPPORT

### 2.1 Variable Reference Syntax

**System Variables**: `{{$variableName}}`  
**Custom Variables**: `{{variableName}}` (no `$` prefix)

**Regex Pattern**: `/\{{2}(.+?)\}{2}/g`

**Evidence**: [variableProcessor.ts#L20](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/src/utils/variableProcessor.ts#L20)

### 2.2 File Variables

**Definition Syntax**: `@variableName = variableValue`  
**Scope**: File-level (can be referenced in any request in the file)  
**Rules**:
- Must occupy a complete line
- Variable name cannot contain spaces
- Value can contain any characters (leading/trailing whitespace trimmed)
- Can reference other variables: `@token = {{loginAPI.response.body.token}}`
- Can use backslash escaping: `\n` for newline

**Percent-Encoding**: Use `%` to percent-encode value  
`{{%variableName}}` → URL-encodes the value

**Example**:
```http
@hostname = api.example.com
@port = 8080
@host = {{hostname}}:{{port}}
@contentType = application/json
@createdAt = {{$datetime iso8601}}
@modifiedBy = {{$processEnv USERNAME}}

###

@name = Strunk & White

GET https://{{host}}/authors/{{%name}} HTTP/1.1

###

PATCH https://{{host}}/authors/{{%name}} HTTP/1.1
Content-Type: {{contentType}}

{
    "content": "foo bar",
    "created_at": "{{createdAt}}",
    "modified_by": "{{modifiedBy}}"
}
```

**Evidence**: [README.md#L467-L497](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L467-L497)

### 2.3 Environment Variables

**Definition**: In VS Code settings file  
**Scope**: Can be referenced across different `.http` files  
**Shared Environment**: Special `$shared` environment available in all environments

**Example Configuration**:
```json
"rest-client.environmentVariables": {
    "$shared": {
        "version": "v1",
        "prodToken": "foo",
        "nonProdToken": "bar"
    },
    "local": {
        "version": "v2",
        "host": "localhost",
        "token": "{{$shared nonProdToken}}",
        "secretKey": "devSecret"
    },
    "production": {
        "host": "example.com",
        "token": "{{$shared prodToken}}",
        "secretKey": "prodSecret"
    }
}
```

**Usage in .http file**:
```http
GET https://{{host}}/api/{{version}}/comments/1 HTTP/1.1
Authorization: {{token}}
```

**Evidence**: [README.md#L439-L465](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L439-L465)

### 2.4 Request Variables (Named Requests)

**Definition Syntax**: `# @name requestName` or `// @name requestName`  
**Purpose**: Name a request to reference its response in other requests  
**Scope**: File-level only

**Reference Syntax**: `{{requestName.(response|request).(body|headers).(*|JSONPath|XPath|HeaderName)}}`

**Parts**:
- `response|request`: Which part to reference
- `body|headers`: Body or headers
- `*`: Full response body
- `JSONPath`: For JSON responses (e.g., `$.id`)
- `XPath`: For XML responses (e.g., `//reply[1]/@id`)
- `HeaderName`: For headers (case-insensitive)

**Example**:
```http
@baseUrl = https://example.com/api

# @name login
POST {{baseUrl}}/api/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

name=foo&password=bar

###

@authToken = {{login.response.headers.X-AuthToken}}

# @name createComment
POST {{baseUrl}}/comments HTTP/1.1
Authorization: {{authToken}}
Content-Type: application/json

{
    "content": "fake content"
}

###

@commentId = {{createComment.response.body.$.id}}

# @name getCreatedComment
GET {{baseUrl}}/comments/{{commentId}} HTTP/1.1
Authorization: {{authToken}}

###

# @name getReplies
GET {{baseUrl}}/comments/{{commentId}}/replies HTTP/1.1
Accept: application/xml

###

# @name getFirstReply
GET {{baseUrl}}/comments/{{commentId}}/replies/{{getReplies.response.body.//reply[1]/@id}}
```

**Evidence**: [README.md#L527-L577](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L527-L577)

### 2.5 Prompt Variables

**Definition Syntax**: `# @prompt {varName}` or `// @prompt {varName}`  
**With Description**: `# @prompt {varName} {description}`  
**Purpose**: Interactively prompt user for input when sending request

**Password Fields**: Input is hidden for variables named:
- `password`, `Password`, `PASSWORD`
- `passwd`, `Passwd`, `PASSWD`
- `pass`, `Pass`, `PASS`

**Example**:
```http
@hostname = api.example.com
@port = 8080
@host = {{hostname}}:{{port}}
@contentType = application/json

###
# @prompt username
# @prompt refCode Your reference code display on webpage
# @prompt otp Your one-time password in your mailbox
POST https://{{host}}/verify-otp/{{refCode}} HTTP/1.1
Content-Type: {{contentType}}

{
    "username": "{{username}}",
    "otp": "{{otp}}"
}
```

**Evidence**: [README.md#L499-L525](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L499-L525)

### 2.6 System Variables (Dynamic Variables)

**Syntax**: `{{$variableName [options]}}`  
**Case-Sensitive**: Yes

#### 2.6.1 UUID
```http
{{$guid}}
```
Generates RFC 4122 v4 UUID

#### 2.6.2 Random Integer
```http
{{$randomInt min max}}
```
Returns random integer between min (included) and max (excluded)

#### 2.6.3 Timestamp
```http
{{$timestamp [offset option]}}
```
UTC timestamp. Optional offset format: `{{$timestamp -3 h}}` (3 hours ago)

**Offset Options**: `y` (year), `M` (month), `w` (week), `d` (day), `h` (hour), `m` (minute), `s` (second), `ms` (millisecond)

#### 2.6.4 DateTime
```http
{{$datetime rfc1123|iso8601|"custom format" [offset option]}}
```
Formats: RFC1123, ISO8601, or custom (Day.js format)

Example: `{{$datetime "DD-MM-YYYY" 1 y}}` (one year later in custom format)

#### 2.6.5 Local DateTime
```http
{{$localDatetime rfc1123|iso8601|"custom format" [offset option]}}
```
Same as `$datetime` but in local timezone

#### 2.6.6 Process Environment Variable
```http
{{$processEnv [%]envVarName}}
```
Resolves local machine environment variable

**With Indirection** (using `%`):
```http
{{$processEnv %secretKey}}
```
Uses `secretKey` from environment settings to determine which env var to lookup

#### 2.6.7 .env File Variable
```http
{{$dotenv [%]variableName}}
```
Reads from `.env` file in same directory as `.http` file

#### 2.6.8 Azure Active Directory Token
```http
{{$aadToken [new] [public|cn|de|us|ppe] [<domain|tenantId>] [aud:<domain|tenantId>]}}
```

#### 2.6.9 Azure AD v2 Token
```http
{{$aadV2Token [new] [AzureCloud|AzureChinaCloud|AzureUSGovernment|ppe] [appOnly] [scopes:<scope[,]>] [tenantid:<domain|tenantId>] [clientid:<clientId>]}}
```

#### 2.6.10 OIDC Access Token
```http
{{$oidcAccessToken [new] [clientId:<clientId>] [callbackPort:<callbackPort>] [authorizeEndpoint:<authorizeEndpoint>] [tokenEndpoint:<tokenEndpoint>] [scopes:<scopes>] [audience:<audience>]}}
```

**Example**:
```http
POST https://api.example.com/comments HTTP/1.1
Content-Type: application/xml
Date: {{$datetime rfc1123}}

{
    "user_name": "{{$dotenv USERNAME}}",
    "request_id": "{{$guid}}",
    "updated_at": "{{$timestamp}}",
    "created_at": "{{$timestamp -1 d}}",
    "review_count": "{{$randomInt 5 200}}",
    "custom_date": "{{$datetime 'YYYY-MM-DD'}}",
    "local_custom_date": "{{$localDatetime 'YYYY-MM-DD'}}"
}
```

**Evidence**: [README.md#L579-L696](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L579-L696)

### 2.7 Variable Resolution Precedence

**Order** (highest to lowest):
1. Request variables
2. File variables
3. Environment variables
4. System variables

**Evidence**: [variableProcessor.ts#L12-L17](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/src/utils/variableProcessor.ts#L12-L17)

---

## 3. AUTHENTICATION SUPPORT

### 3.1 Basic Auth

**Three Formats** (all equivalent):

1. Raw format:
```http
GET https://httpbin.org/basic-auth/user/passwd HTTP/1.1
Authorization: Basic user:passwd
```

2. Base64 encoded:
```http
GET https://httpbin.org/basic-auth/user/passwd HTTP/1.1
Authorization: Basic dXNlcjpwYXNzd2Q=
```

3. Space-separated (auto-encoded):
```http
GET https://httpbin.org/basic-auth/user/passwd HTTP/1.1
Authorization: Basic user passwd
```

### 3.2 Digest Auth

```http
GET https://httpbin.org/digest-auth/auth/user/passwd
Authorization: Digest user passwd
```

### 3.3 SSL Client Certificates

**Supported Formats**: PFX, PKCS12, PEM

**Configuration** (in VS Code settings):
```json
"rest-client.certificates": {
    "localhost:8081": {
        "cert": "/Users/demo/Certificates/client.crt",
        "key": "/Users/demo/Keys/client.key"
    },
    "example.com": {
        "cert": "/Users/demo/Certificates/client.crt",
        "key": "/Users/demo/Keys/client.key"
    }
}
```

**PFX/PKCS12 Format**:
```json
"rest-client.certificates": {
    "localhost:8081": {
        "pfx": "/Users/demo/Certificates/clientcert.p12",
        "passphrase": "123456"
    }
}
```

### 3.4 AWS Signature v4

```http
GET https://httpbin.org/aws-auth HTTP/1.1
Authorization: AWS <accessId> <accessKey> [token:<sessionToken>] [region:<regionName>] [service:<serviceName>]
```

### 3.5 AWS Cognito

```http
GET https://httpbin.org/aws-auth HTTP/1.1
Authorization: COGNITO <Username> <Password> <Region> <UserPoolId> <ClientId>
```

### 3.6 Azure Active Directory

Uses system variables: `{{$aadToken ...}}` or `{{$aadV2Token ...}}`

**Evidence**: [README.md#L305-L396](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L305-L396)

---

## 4. RESPONSE HANDLING FEATURES

### 4.1 Response Preview Options

**Setting**: `rest-client.previewOption`

| Option | Description |
|--------|-------------|
| `full` | Response headers, body and status line (default) |
| `headers` | Response headers and status line only |
| `body` | Response body only |
| `exchange` | Whole HTTP exchange (request + response) |

### 4.2 Cookie Handling

**Setting**: `rest-client.rememberCookiesForSubsequentRequests` (default: true)  
Automatically saves `Set-Cookie` headers and uses them in subsequent requests

**Per-request Override**: `# @no-cookie-jar`

### 4.3 Redirect Following

**Setting**: `rest-client.followredirect` (default: true)  
Follows HTTP 3xx responses as redirects

**Per-request Override**: `# @no-redirect`

### 4.4 Per-Request Settings

**Syntax**: `# @settingName [settingValue]` or `// @settingName [settingValue]`

| Setting | Syntax | Description |
|---------|--------|-------------|
| note | `# @note` | Request confirmation (for critical requests) |
| no-redirect | `# @no-redirect` | Don't follow 3XX redirects |
| no-cookie-jar | `# @no-cookie-jar` | Don't save cookies |

**Example**:
```http
# @note This is a critical DELETE request
# @no-redirect
DELETE https://api.example.com/resource/123 HTTP/1.1
```

### 4.5 Response Saving

- **Save Full Response**: Headers + body to file
- **Save Response Body Only**: Body only, with MIME-type-based extension
- **Custom MIME Mapping**: `rest-client.mimeAndFileExtensionMapping`

**Evidence**: [README.md#L699-L753](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L699-L753)

---

## 5. SPECIAL REQUEST TYPES

### 5.1 GraphQL Requests

**Syntax**: Add header `X-Request-Type: GraphQL`

**Format**:
```http
POST https://api.github.com/graphql
Content-Type: application/json
Authorization: Bearer xxx
X-REQUEST-TYPE: GraphQL

query ($name: String!, $owner: String!) {
  repository(name: $name, owner: $owner) {
    name
    fullName: nameWithOwner
    description
  }
}

{
    "name": "vscode-restclient",
    "owner": "Huachao"
}
```

**Evidence**: [README.md#L226-L260](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L226-L260)

### 5.2 cURL Requests

**Supported Options**:
- `-X, --request`
- `-L, --location, --url`
- `-H, --header` (no `@` support)
- `-I, --head`
- `-b, --cookie` (no cookie jar file support)
- `-u, --user` (Basic auth only)
- `-d, --data, --data-ascii, --data-binary, --data-raw`

**Example**:
```http
curl -X POST https://example.com/api -H "Content-Type: application/json" -d '{"key":"value"}'
```

**Evidence**: [README.md#L262-L274](https://github.com/Huachao/vscode-restclient/blob/0773d56b65d9e7033259519e99eef8f752f6ba6e/README.md#L262-L274)

---

## 6. EXISTING CLI ALTERNATIVES

### 6.1 httpyac

**Repository**: https://github.com/anweber/httpyac  
**Stars**: 793  
**Status**: Active  
**Language**: TypeScript  
**License**: MIT

**Features**:
- CLI for `.http` and `.rest` files
- Supports HTTP, gRPC, WebSocket, MQTT, RabbitMQ
- VS Code extension available
- Request chaining
- Variable support
- Environment management

**CLI Usage**:
```bash
httpyac send request.http
```

### 6.2 rest-cli

**Repository**: https://github.com/gwillz/rest-cli  
**NPM**: https://www.npmjs.com/package/rest-cli  
**Stars**: 3  
**Status**: Maintained (last update: 2023-12-03)  
**Language**: TypeScript  
**License**: MIT

**Features**:
- Designed to be compatible with vscode-restclient format
- CLI runner for `.http` files
- Request sequencing support
- Minimal feature set (intentionally)

**CLI Usage**:
```bash
rest-cli request.http
```

### 6.3 restish

**Repository**: https://github.com/rest-sh/restish  
**Stars**: 1.2k  
**Status**: Active  
**Language**: Go  
**License**: MIT

**Features**:
- REST API CLI client
- Built-in features for API interaction
- Configuration management
- Not specifically designed for `.http` format

### 6.4 restman

**Repository**: https://github.com/cadamsdev/restman  
**Status**: **ARCHIVED** (March 20, 2026)  
**Language**: Rust  
**Type**: TUI (Terminal User Interface)

**Features**:
- Terminal-based REST client
- Postman alternative
- No longer maintained

---

## 7. IMPLEMENTATION RECOMMENDATIONS FOR CLI VERSION

### 7.1 Core Features to Support (MVP)

**Priority 1 - Essential**:
1. ✅ Parse `.http` and `.rest` files
2. ✅ Request delimiter (`###`) support
3. ✅ Basic request parsing (method, URL, headers, body)
4. ✅ File variables (`@var = value`)
5. ✅ System variables (`{{$guid}}`, `{{$timestamp}}`, etc.)
6. ✅ Basic authentication (Basic, Digest)
7. ✅ Send HTTP requests
8. ✅ Display responses

**Priority 2 - Important**:
1. Environment variables support
2. Request variables (named requests with response chaining)
3. Prompt variables
4. cURL request parsing
5. GraphQL support
6. Cookie handling
7. Redirect following

**Priority 3 - Nice-to-Have**:
1. AWS authentication
2. Azure AD authentication
3. SSL client certificates
4. Response saving
5. Request history
6. Code snippet generation

### 7.2 Parser Architecture

**Recommended Approach**:
1. **Tokenizer**: Split file by `###` delimiters
2. **Request Parser**: Parse each request block
   - Extract request line (method, URL, HTTP version)
   - Extract headers (until blank line)
   - Extract body (everything after blank line)
3. **Variable Processor**: Replace `{{...}}` patterns
   - Check system variables first
   - Then file variables
   - Then environment variables
4. **HTTP Client**: Send request using `got`, `axios`, or `node-fetch`

### 7.3 Key Implementation Details

**Variable Regex**: `/\{{2}(.+?)\}{2}/g`  
**Delimiter Regex**: `/^#{3,}/`  
**File Variable Regex**: `/^@(\w+)\s*=\s*(.*)$/`  
**Request Name Regex**: `/^[#\/]{1,2}\s*@name\s+(\w+)/`  
**Prompt Variable Regex**: `/^[#\/]{1,2}\s*@prompt\s+\{(\w+)\}(?:\s+(.+))?/`

### 7.4 Configuration

**Recommended Config File**: `.restclient.json` or `.restclient.env`

```json
{
  "environments": {
    "$shared": {
      "version": "v1"
    },
    "local": {
      "host": "localhost:3000",
      "token": "dev-token"
    },
    "production": {
      "host": "api.example.com",
      "token": "prod-token"
    }
  },
  "defaultHeaders": {
    "User-Agent": "restclient-cli"
  },
  "timeout": 30000,
  "followRedirects": true,
  "rememberCookies": true
}
```

---

## 8. SUMMARY TABLE

| Feature | Supported | Format | Notes |
|---------|-----------|--------|-------|
| Multiple Requests | ✅ | `###` delimiter | 3+ consecutive `#` |
| File Variables | ✅ | `@var = value` | File-scoped |
| Environment Variables | ✅ | Settings-based | Cross-file |
| Request Variables | ✅ | `# @name` + JSONPath/XPath | Response chaining |
| Prompt Variables | ✅ | `# @prompt {var}` | Interactive input |
| System Variables | ✅ | `{{$guid}}`, `{{$timestamp}}` | 10+ types |
| Basic Auth | ✅ | 3 formats | Auto base64 encoding |
| Digest Auth | ✅ | `Authorization: Digest` | - |
| SSL Certificates | ✅ | PEM, PFX, PKCS12 | Host-based config |
| AWS Signature v4 | ✅ | `Authorization: AWS` | - |
| AWS Cognito | ✅ | `Authorization: COGNITO` | - |
| Azure AD | ✅ | System variables | Token caching |
| GraphQL | ✅ | `X-REQUEST-TYPE: GraphQL` | Query + variables |
| cURL | ✅ | Native cURL syntax | Limited options |
| File Upload | ✅ | `< ./file` or `<@ ./file` | With/without variables |
| Multipart Form | ✅ | Standard format | Boundary-based |
| Form URL-Encoded | ✅ | Multi-line `&` | Auto-encoding |
| Cookies | ✅ | Auto-save | Per-request override |
| Redirects | ✅ | Auto-follow | Per-request override |
| Comments | ✅ | `#` or `//` | Anywhere in file |

---

## 9. REFERENCES

**Official Repository**: https://github.com/Huachao/vscode-restclient  
**VS Code Marketplace**: https://marketplace.visualstudio.com/items?itemName=humao.rest-client  
**RFC 2616**: http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html  
**JSONPath**: http://goessner.net/articles/JsonPath/  
**XPath**: https://developer.mozilla.org/en-US/docs/Web/XPath  
**Day.js Format**: https://day.js.org/docs/en/get-set/get#list-of-all-available-units

