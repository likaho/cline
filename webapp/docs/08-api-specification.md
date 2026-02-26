# API Specification

## Overview
This document describes the REST and WebSocket APIs for the Cline Web Application.

## Base URL
```
Production: https://api.cline.dev
Staging: https://api.staging.cline.dev
Development: http://localhost:8080
```

## Authentication
All API requests (except `/api/auth/*`) require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication API

### 1.1 Register User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "organizationName": "My Company"  // optional
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "org-uuid",
    "role": "owner"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

### 1.2 Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "org-uuid",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### 1.3 Refresh Token
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_from_cookies"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 86400
}
```

---

### 1.4 Logout
```
POST /api/auth/logout
```

**Response (204):** No content

---

## 2. User API

### 2.1 Get Current User
```
GET /api/users/me
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "organizationId": "org-uuid",
  "role": "user",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### 2.2 Update Profile
```
PATCH /api/users/me
```

**Request Body:**
```json
{
  "name": "John Updated",
  "avatarUrl": "https://..."
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Updated",
  "avatarUrl": "https://..."
}
```

---

## 3. Task API

### 3.1 Create Task
```
POST /api/tasks
```

**Request Body:**
```json
{
  "type": "chat",
  "prompt": "Write a function to sort an array",
  "model": "claude-3-sonnet-20240229",
  "checkpointEnabled": true
}
```

**Response (201):**
```json
{
  "id": "task-uuid",
  "type": "chat",
  "status": "pending",
  "prompt": "Write a function to sort an array",
  "model": "claude-3-sonnet-20240229",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### 3.2 List Tasks
```
GET /api/tasks?status=running&limit=20&offset=0
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending, running, completed, failed) |
| limit | int | Max results (default: 20) |
| offset | int | Pagination offset |

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "type": "chat",
      "status": "running",
      "prompt": "Write a function...",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:01:00Z"
    }
  ],
  "total": 150
}
```

---

### 3.3 Get Task
```
GET /api/tasks/:id
```

**Response (200):**
```json
{
  "id": "task-uuid",
  "type": "chat",
  "status": "completed",
  "prompt": "Write a function to sort an array",
  "result": "Here's the sorted array function...",
  "model": "claude-3-sonnet-20240229",
  "usage": {
    "inputTokens": 100,
    "outputTokens": 500,
    "totalTokens": 600,
    "cost": 0.005
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T10:02:00Z"
}
```

---

### 3.4 Cancel Task
```
DELETE /api/tasks/:id
```

**Response (204):** No content

---

### 3.5 Get Checkpoints
```
GET /api/tasks/:id/checkpoints
```

**Response (200):**
```json
{
  "checkpoints": [
    {
      "id": "cp-uuid",
      "stepNumber": 1,
      "createdAt": "2024-01-15T10:01:00Z"
    },
    {
      "id": "cp-uuid-2",
      "stepNumber": 2,
      "createdAt": "2024-01-15T10:01:30Z"
    }
  ]
}
```

---

### 3.6 Resume from Checkpoint
```
POST /api/tasks/:id/resume
```

**Request Body:**
```json
{
  "checkpointId": "cp-uuid"
}
```

**Response (200):**
```json
{
  "id": "task-uuid",
  "status": "running",
  "message": "Task resumed from checkpoint 1"
}
```

---

## 4. AI API

### 4.1 Chat Completion
```
POST /api/ai/chat
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful coding assistant."
    },
    {
      "role": "user",
      "content": "Write a Hello World in Python"
    }
  ],
  "model": "claude-3-sonnet-20240229",
  "temperature": 0.7,
  "maxTokens": 1024,
  "stream": false,
  "tools": [
    {
      "name": "bash",
      "description": "Run a bash command",
      "inputSchema": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "The command to run"
          }
        },
        "required": ["command"]
      }
    }
  ]
}
```

**Response (200):**
```json
{
  "id": "chat-uuid",
  "model": "claude-3-sonnet-20240229",
  "content": "Here's a Hello World program in Python:\n\n```python\nprint('Hello, World!')\n```",
  "stopReason": "end_turn",
  "usage": {
    "inputTokens": 50,
    "outputTokens": 100,
    "totalTokens": 150,
    "cost": 0.001
  }
}
```

---

### 4.2 Stream Chat Completion
```
POST /api/ai/chat
```

Same request with `"stream": true`

**Response:** Server-Sent Events (SSE)
```
event: message
data: {"delta": "Hello", "index": 0}

event: message
data: {"delta": ", World!", "index": 1}

event: done
data: {"usage": {"inputTokens": 50, "outputTokens": 10, "totalTokens": 60}}
```

---

### 4.3 List Models
```
GET /api/ai/models
```

**Response (200):**
```json
{
  "models": [
    {
      "id": "claude-3-opus-20240229",
      "name": "Claude 3 Opus",
      "provider": "anthropic",
      "contextWindow": 200000,
      "supportsVision": true,
      "supportsTools": true
    },
    {
      "id": "gpt-4-turbo",
      "name": "GPT-4 Turbo",
      "provider": "openai",
      "contextWindow": 128000,
      "supportsVision": false,
      "supportsTools": true
    }
  ]
}
```

---

### 4.4 Get Usage
```
GET /api/ai/usage?startDate=2024-01-01&endDate=2024-01-31
```

**Response (200):**
```json
{
  "usage": [
    {
      "date": "2024-01-15",
      "provider": "anthropic",
      "model": "claude-3-sonnet-20240229",
      "inputTokens": 1000000,
      "outputTokens": 500000,
      "cost": 10.50
    }
  ],
  "total": {
    "inputTokens": 1000000,
    "outputTokens": 500000,
    "cost": 10.50
  }
}
```

---

## 5. Browser API

### 5.1 Create Session
```
POST /api/browser/session
```

**Request Body:**
```json
{
  "headless": true,
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

**Response (201):**
```json
{
  "id": "session-uuid",
  "wsUrl": "wss://browser.cline.dev/session/session-uuid",
  "expiresAt": "2024-01-15T11:00:00Z"
}
```

---

### 5.2 Execute Command
```
POST /api/browser/execute
```

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "command": {
    "action": "navigate",
    "url": "https://example.com"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "title": "Example Domain"
  }
}
```

---

### 5.3 Close Session
```
DELETE /api/browser/session/:id
```

**Response (204):** No content

---

## 6. WebSocket API

### 6.1 Connect
```
WS /ws/chat?token=<jwt_token>
```

### 6.2 Send Message
```json
{
  "type": "message",
  "payload": {
    "content": "Write a function to sort an array",
    "model": "claude-3-sonnet-20240229"
  }
}
```

### 6.3 Receive Messages
```json
{
  "type": "message",
  "payload": {
    "content": "Here's a function...",
    "index": 0
  }
}
```

```json
{
  "type": "tool_use",
  "payload": {
    "name": "bash",
    "input": { "command": "ls" }
  }
}
```

```json
{
  "type": "done",
  "payload": {
    "usage": { "inputTokens": 100, "outputTokens": 50 }
  }
}
```

---

## 7. Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 8. Rate Limits

| Endpoint | Limit |
|----------|-------|
| /api/auth/* | 10 req/min |
| /api/ai/* | 60 req/min |
| /api/tasks/* | 30 req/min |
| /api/browser/* | 20 req/min |
| WebSocket | 100 msg/min |

---

## 9. OpenAPI Specification

Full OpenAPI 3.0 specification available at: `/api/docs/openapi.json`
