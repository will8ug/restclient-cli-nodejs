# Example .http Files for Testing

This document contains practical examples of `.http` files that demonstrate the vscode-restclient format. Use these as test cases for your CLI implementation.

## 1. Basic Requests

### Simple GET Request
```http
GET https://jsonplaceholder.typicode.com/posts/1
```

### GET with Headers
```http
GET https://jsonplaceholder.typicode.com/posts/1
Accept: application/json
User-Agent: my-rest-client
```

### POST with JSON Body
```http
POST https://jsonplaceholder.typicode.com/posts
Content-Type: application/json

{
  "title": "foo",
  "body": "bar",
  "userId": 1
}
```

### POST with Form Data
```http
POST https://httpbin.org/post
Content-Type: application/x-www-form-urlencoded

name=John&age=30&city=New York
```

### Multi-line Form Data
```http
POST https://httpbin.org/post
Content-Type: application/x-www-form-urlencoded

name=John
&age=30
&city=New York
```

---

## 2. Multiple Requests in One File

```http
### Get all posts
GET https://jsonplaceholder.typicode.com/posts

###

### Get specific post
GET https://jsonplaceholder.typicode.com/posts/1

###

### Create new post
POST https://jsonplaceholder.typicode.com/posts
Content-Type: application/json

{
  "title": "New Post",
  "body": "This is a new post",
  "userId": 1
}

###

### Update post
PUT https://jsonplaceholder.typicode.com/posts/1
Content-Type: application/json

{
  "title": "Updated Post",
  "body": "This post has been updated",
  "userId": 1
}

###

### Delete post
DELETE https://jsonplaceholder.typicode.com/posts/1
```

---

## 3. File Variables

```http
@baseUrl = https://jsonplaceholder.typicode.com
@contentType = application/json
@postId = 1

###

### Get post using variables
GET {{baseUrl}}/posts/{{postId}}

###

### Create post with variables
POST {{baseUrl}}/posts
Content-Type: {{contentType}}

{
  "title": "New Post",
  "body": "Created with variables",
  "userId": 1
}

###

### Update post with variables
PUT {{baseUrl}}/posts/{{postId}}
Content-Type: {{contentType}}

{
  "title": "Updated via variables",
  "body": "This was updated",
  "userId": 1
}
```

---

## 4. System Variables

```http
@baseUrl = https://httpbin.org

###

### Request with UUID
POST {{baseUrl}}/post
Content-Type: application/json

{
  "request_id": "{{$guid}}",
  "timestamp": {{$timestamp}},
  "random_number": {{$randomInt 1 100}}
}

###

### Request with formatted dates
POST {{baseUrl}}/post
Content-Type: application/json

{
  "created_at": "{{$datetime iso8601}}",
  "created_at_rfc": "{{$datetime rfc1123}}",
  "created_at_custom": "{{$datetime 'YYYY-MM-DD HH:mm:ss'}}",
  "local_time": "{{$localDatetime 'YYYY-MM-DD HH:mm:ss'}}",
  "tomorrow": "{{$datetime iso8601 1 d}}",
  "next_year": "{{$datetime iso8601 1 y}}"
}

###

### Request with environment variables
GET {{baseUrl}}/get
Authorization: Bearer {{$processEnv API_TOKEN}}
```

---

## 5. Environment Variables

**Configuration** (in `.restclient.json`):
```json
{
  "environments": {
    "$shared": {
      "baseUrl": "https://api.example.com",
      "version": "v1"
    },
    "development": {
      "host": "localhost:3000",
      "token": "dev-token-123",
      "debug": "true"
    },
    "production": {
      "host": "api.example.com",
      "token": "prod-token-456",
      "debug": "false"
    }
  }
}
```

**Usage in .http file**:
```http
### Development request
GET https://{{host}}/api/{{version}}/users
Authorization: Bearer {{token}}
X-Debug: {{debug}}

###

### Production request (switch environment to use different values)
GET https://{{host}}/api/{{version}}/users
Authorization: Bearer {{token}}
X-Debug: {{debug}}
```

---

## 6. Request Variables (Named Requests)

```http
@baseUrl = https://jsonplaceholder.typicode.com

###

# @name getUser
GET {{baseUrl}}/users/1

###

# @name createPost
POST {{baseUrl}}/posts
Content-Type: application/json

{
  "title": "New Post",
  "body": "Created by user {{getUser.response.body.$.id}}",
  "userId": {{getUser.response.body.$.id}}
}

###

# @name getPosts
GET {{baseUrl}}/posts?userId={{getUser.response.body.$.id}}

###

# @name getFirstPost
GET {{baseUrl}}/posts/{{getPosts.response.body.$[0].id}}

###

# @name updateFirstPost
PUT {{baseUrl}}/posts/{{getPosts.response.body.$[0].id}}
Content-Type: application/json

{
  "title": "Updated by request chaining",
  "body": "This post was updated",
  "userId": {{getUser.response.body.$.id}}
}
```

---

## 7. Prompt Variables

```http
@baseUrl = https://jsonplaceholder.typicode.com

###

# @prompt userId User ID to fetch
# @prompt postTitle Title for new post
GET {{baseUrl}}/users/{{userId}}

###

# @prompt username Username for login
# @prompt password Your password (will be hidden)
POST {{baseUrl}}/login
Content-Type: application/json

{
  "username": "{{username}}",
  "password": "{{password}}"
}

###

# @prompt postId Post ID to update
# @prompt newTitle New title for the post
PUT {{baseUrl}}/posts/{{postId}}
Content-Type: application/json

{
  "title": "{{newTitle}}",
  "body": "Updated via prompt variables"
}
```

---

## 8. Authentication Examples

### Basic Auth (3 formats)

```http
### Format 1: Raw username:password
GET https://httpbin.org/basic-auth/user/passwd
Authorization: Basic user:passwd

###

### Format 2: Base64 encoded
GET https://httpbin.org/basic-auth/user/passwd
Authorization: Basic dXNlcjpwYXNzd2Q=

###

### Format 3: Space-separated (auto-encoded)
GET https://httpbin.org/basic-auth/user/passwd
Authorization: Basic user passwd
```

### Bearer Token
```http
GET https://api.example.com/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key
```http
GET https://api.example.com/data
X-API-Key: your-api-key-here
```

---

## 9. File Upload

### Upload with file reference (no variables)
```http
POST https://httpbin.org/post
Content-Type: application/octet-stream

< ./path/to/file.txt
```

### Upload with variable processing
```http
POST https://httpbin.org/post
Content-Type: application/octet-stream

<@ ./path/to/file.txt
```

### Upload with custom encoding
```http
POST https://httpbin.org/post
Content-Type: application/octet-stream

<@utf-8 ./path/to/file.txt
```

### Multipart form with file
```http
POST https://httpbin.org/post
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="username"

john_doe
------WebKitFormBoundary
Content-Disposition: form-data; name="email"

john@example.com
------WebKitFormBoundary
Content-Disposition: form-data; name="avatar"; filename="avatar.png"
Content-Type: image/png

< ./avatar.png
------WebKitFormBoundary--
```

---

## 10. GraphQL Request

```http
POST https://api.github.com/graphql
Content-Type: application/json
Authorization: Bearer YOUR_GITHUB_TOKEN
X-REQUEST-TYPE: GraphQL

query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    description
    stargazers {
      totalCount
    }
    forks {
      totalCount
    }
  }
}

{
  "owner": "microsoft",
  "name": "vscode"
}
```

---

## 11. Per-Request Settings

```http
@baseUrl = https://api.example.com

###

# @note This is a critical DELETE operation - requires confirmation
# @no-redirect
DELETE {{baseUrl}}/resource/123

###

# @no-cookie-jar
GET {{baseUrl}}/public-data

###

# @note Sensitive operation
# @no-redirect
# @no-cookie-jar
POST {{baseUrl}}/sensitive-action
Content-Type: application/json

{
  "action": "delete_account"
}
```

---

## 12. Complex Real-World Example

```http
# API Testing Suite for User Management

@baseUrl = https://api.example.com
@apiVersion = v1
@contentType = application/json

###

# @name registerUser
# @prompt email User email address
# @prompt password User password (will be hidden)
POST {{baseUrl}}/{{apiVersion}}/auth/register
Content-Type: {{contentType}}

{
  "email": "{{email}}",
  "password": "{{password}}",
  "created_at": "{{$datetime iso8601}}"
}

###

# @name loginUser
POST {{baseUrl}}/{{apiVersion}}/auth/login
Content-Type: {{contentType}}

{
  "email": "{{email}}",
  "password": "{{password}}"
}

###

@authToken = {{loginUser.response.body.$.token}}
@userId = {{loginUser.response.body.$.user.id}}

# @name getUserProfile
GET {{baseUrl}}/{{apiVersion}}/users/{{userId}}
Authorization: Bearer {{authToken}}

###

# @name updateUserProfile
# @prompt firstName User's first name
# @prompt lastName User's last name
PUT {{baseUrl}}/{{apiVersion}}/users/{{userId}}
Authorization: Bearer {{authToken}}
Content-Type: {{contentType}}

{
  "firstName": "{{firstName}}",
  "lastName": "{{lastName}}",
  "updated_at": "{{$datetime iso8601}}"
}

###

# @name getUserPosts
GET {{baseUrl}}/{{apiVersion}}/users/{{userId}}/posts
Authorization: Bearer {{authToken}}

###

# @name createPost
# @prompt title Post title
# @prompt content Post content
POST {{baseUrl}}/{{apiVersion}}/posts
Authorization: Bearer {{authToken}}
Content-Type: {{contentType}}

{
  "title": "{{title}}",
  "content": "{{content}}",
  "userId": {{userId}},
  "created_at": "{{$datetime iso8601}}",
  "request_id": "{{$guid}}"
}

###

@postId = {{createPost.response.body.$.id}}

# @name getPost
GET {{baseUrl}}/{{apiVersion}}/posts/{{postId}}
Authorization: Bearer {{authToken}}

###

# @name deletePost
# @note This will permanently delete the post
DELETE {{baseUrl}}/{{apiVersion}}/posts/{{postId}}
Authorization: Bearer {{authToken}}

###

# @name logout
POST {{baseUrl}}/{{apiVersion}}/auth/logout
Authorization: Bearer {{authToken}}
```

---

## Testing Checklist

Use these examples to test your CLI implementation:

- [ ] Parse simple GET requests
- [ ] Parse requests with headers
- [ ] Parse requests with JSON body
- [ ] Parse requests with form data
- [ ] Handle multiple requests with `###` delimiter
- [ ] Replace file variables (`@var = value`)
- [ ] Replace system variables (`{{$guid}}`, `{{$timestamp}}`)
- [ ] Handle environment variables
- [ ] Support request variables (named requests)
- [ ] Support prompt variables (interactive input)
- [ ] Handle authentication headers
- [ ] Support file uploads
- [ ] Parse GraphQL requests
- [ ] Handle per-request settings (`@note`, `@no-redirect`)
- [ ] Display responses correctly
- [ ] Handle errors gracefully

---

**Note**: These examples use public APIs (jsonplaceholder.typicode.com, httpbin.org) for demonstration. Replace with your actual API endpoints when testing.
