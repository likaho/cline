# Container/Component Diagram (C4 Model Level 2)

## Overview
This diagram shows the high-level technical building blocks of the Cline Web Application and their technology choices.

```mermaid
flowchart TB
    subgraph "Web Frontend"
        UI["React SPA"]
        Store["Zustand State"]
        API["Axios Client"]
        WS["WebSocket Client"]
    end
    
    subgraph "API Gateway"
        Router["Express Router"]
        Auth["JWT Middleware"]
        RateLimiter["Rate Limiter"]
        Metrics["Prometheus Metrics"]
        WSH["WebSocket Handler"]
    end
    
    subgraph "Auth Service"
        Controller["Auth Controller"]
        JWT["JWT Manager"]
        DB["User Repository"]
        Cache["Session Store"]
    end
    
    subgraph "Task Service"
        Executor["Task Executor"]
        Checkpoint["Checkpoint Manager"]
        Queue["Task Queue"]
        State["State Machine"]
    end
    
    subgraph "AI Service"
        Router["Provider Router"]
        Anthropic["Anthropic Provider"]
        OpenAI["OpenAI Provider"]
        Google["Google Provider"]
        Cache["Response Cache"]
    end
    
    subgraph "Browser Service"
        Pool["Browser Pool"]
        Puppeteer["Puppeteer Manager"]
        Session["Session Manager"]
    end
    
    UI --> API
    UI --> WS
    API --> Router
    WS --> WSH
    
    Router --> Auth
    Router --> RateLimiter
    Router --> Metrics
    
    Auth --> Controller
    Controller --> JWT
    Controller --> DB
    Controller --> Cache
    
    Router --> Executor
    Executor --> Checkpoint
    Executor --> Queue
    Executor --> State
    
    Router --> Router2["Provider Router"]
    Router2 --> Anthropic
    Router2 --> OpenAI
    Router2 --> Google
    
    Router --> Pool
    Pool --> Puppeteer
    Pool --> Session
```

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API

### Backend - API Gateway
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Authentication**: JWT (HS256/RS256)
- **Rate Limiting**: express-rate-limit
- **Metrics**: Prometheus + OpenTelemetry
- **WebSocket**: ws library

### Backend - Auth Service
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Knex
- **Cache**: Redis
- **Password Hashing**: bcrypt

### Backend - Task Service
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Queue**: Redis
- **Checkpoint**: PostgreSQL with JSONB

### Backend - AI Service
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Providers**: Anthropic, OpenAI, Google
- **Caching**: Redis

### Backend - Browser Service
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Browser**: Puppeteer
- **Session Management**: In-memory + Redis

### Infrastructure
- **Container Runtime**: Docker
- **Orchestration**: Kubernetes
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Queue**: Redis Pub/Sub
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack / Loki
