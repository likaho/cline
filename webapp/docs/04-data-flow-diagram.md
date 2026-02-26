# Data Flow/Sequence Diagram

## Key Business Flows

### 1. User Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant FE as Web Frontend
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant DB as PostgreSQL
    participant REDIS as Redis

    U->>FE: Enter credentials
    FE->>GW: POST /api/auth/login
    GW->>AUTH: Forward request
    AUTH->>DB: Validate user
    DB-->>AUTH: User data
    AUTH->>AUTH: Verify password
    AUTH->>REDIS: Create session
    AUTH->>AUTH: Generate JWT
    AUTH-->>GW: JWT token + session
    GW-->>FE: 200 OK + JWT
    FE->>FE: Store token in localStorage
    FE-->>U: Redirect to dashboard
```

### 2. Chat Message Flow
```mermaid
sequenceDiagram
    participant U as User
    participant FE as Web Frontend
    participant GW as API Gateway
    participant TASK as Task Service
    participant AI as AI Service
    participant LLM as LLM Provider

    U->>FE: Send message
    FE->>FE: Add to chat state
    FE->>GW: WebSocket /ws/chat
    GW->>GW: Authenticate WS
    GW->>TASK: Create task
    TASK->>TASK: Initialize checkpoint
    TASK-->>GW: Task ID
    GW-->>FE: Task started
    FE->>FE: Show "AI is thinking..."

    loop Streaming Response
        TASK->>AI: Send prompt
        AI->>LLM: API call
        LLM-->>AI: Stream response
        AI-->>TASK: Stream chunk
        TASK-->>FE: WebSocket message
        FE->>FE: Update UI
    end

    TASK->>TASK: Save final response
    TASK->>TASK: Create checkpoint
    TASK-->>FE: Task completed
    FE-->>U: Display response
```

### 3. Task Execution Flow
```mermaid
sequenceDiagram
    participant TASK as Task Service
    participant AI as AI Service
    participant BROWSER as Browser Service
    participant DB as PostgreSQL
    participant REDIS as Redis

    TASK->>TASK: Load prompt template
    TASK->>AI: Chat completion request
    AI-->>TASK: Response with tool calls
    
    alt Execute Browser Tool
        TASK->>BROWSER: POST /browser/execute
        BROWSER->>BROWSER: Get browser session
        BROWSER->>BROWSER: Execute command
        BROWSER-->>TASK: Result
    end
    
    TASK->>DB: Save checkpoint (state)
    TASK->>REDIS: Publish progress
    
    TASK->>AI: Continue with result
    AI-->>TASK: Next response
    
    TASK->>DB: Final checkpoint
    TASK-->>TASK: Task complete
```

### 4. Browser Automation Flow
```mermaid
sequenceDiagram
    participant TASK as Task Service
    participant GW as API Gateway
    participant BROWSER as Browser Service
    participant POOL as Browser Pool
    participant PUPP as Puppeteer

    TASK->>GW: POST /api/browser/execute
    GW->>BROWSER: Forward request
    BROWSER->>POOL: Get session
    alt New Session
        POOL->>PUPP: Launch browser
        PUPP-->>POOL: Browser instance
    end
    POOL->>POOL: Execute command
    POOL->>PUPP: Navigate to URL
    PUPP-->>POOL: Page content
    POOL->>PUPP: Execute script
    PUPP-->>POOL: Result
    POOL-->>BROWSER: Execution result
    BROWSER-->>TASK: Response
```

### 5. API Request Flow (REST)
```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant GW as API Gateway
    participant SVC as Backend Service
    participant DB as Database

    U->>FE: Make request
    FE->>FE: Add JWT to header
    FE->>GW: API request + Bearer token
    GW->>GW: Rate limit check
    
    alt Rate Limited
        GW-->>FE: 429 Too Many Requests
    else Valid
        GW->>GW: Validate JWT
        alt Invalid Token
            GW-->>FE: 401 Unauthorized
        else Valid
            GW->>SVC: Forward request
            SVC->>SVC: Business logic
            SVC->>DB: Query data
            DB-->>SVC: Results
            SVC-->>GW: Response
            GW-->>FE: 200 OK + data
        end
    end
    
    FE-->>U: Update UI
```

## Data Storage Flow
```mermaid
flowchart LR
    subgraph Write Path
        APP["Application"] -->|1. Write| C[(Redis Cache)]
        C -->|2. If miss| DB[(PostgreSQL)]
    end
    
    subgraph Read Path
        APP2["Application"] -->|3. Read| C2[(Redis)]
        C2 -->|4. Cache hit| APP2
        C2 -->|5. Cache miss| DB2[(PostgreSQL)]
        DB2 -->|6. Store in cache| C2
    end
```

## Message Queue Flow
```mermaid
sequenceDiagram
    participant PRODUCER as Task Service
    participant REDIS as Redis
    participant WORKER as Worker

    PRODUCER->>REDIS: Publish task
    REDIS-->>WORKER: Notify
    WORKER->>WORKER: Process task
    WORKER->>REDIS: Update status
    REDIS-->>PRODUCER: Status update (pub/sub)
```
