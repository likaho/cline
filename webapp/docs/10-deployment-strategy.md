# Deployment/Release Strategy

## 1. Overview

This document describes the CI/CD pipeline, deployment automation, and release strategy for the Cline Web Application microservices.

---

## 2. CI/CD Pipeline

### 2.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
│                                                                  │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐ │
│  │  Build  │──▶│   Test   │──▶│ Security │──▶│   Deploy    │ │
│  └─────────┘   └──────────┘   └──────────┘   └─────────────┘ │
│       │              │              │                │            │
│       ▼              ▼              ▼                ▼            │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐ │
│  │Lint/    │   │Unit/     │   │SAST/     │   │Staging/    │ │
│  │TypeCheck│   │Integration│   │Dependency│   │Production  │ │
│  └─────────┘   └──────────┘   └──────────┘   └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Build
        run: npm run build
      
      - name: Build Docker images
        run: |
          docker build -t ${{ env.REGISTRY }}/api-gateway:${{ github.sha }} ./api-gateway
          docker build -t ${{ env.REGISTRY }}/auth-service:${{ github.sha }} ./auth-service
          docker build -t ${{ env.REGISTRY }}/task-service:${{ github.sha }} ./task-service
          docker build -t ${{ env.REGISTRY }}/ai-service:${{ github.sha }} ./ai-service
          docker build -t ${{ env.REGISTRY }}/browser-service:${{ github.sha }} ./browser-service

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run SAST
        uses: github/codeql-action/analyze@v2
      
      - name: Dependency scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy-staging:
    needs: [build, test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to EKS
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=${{ env.REGISTRY }}/api-gateway:${{ github.sha }} \
            -n cline-staging
          # ... repeat for other services

  deploy-production:
    needs: [build, test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to EKS (Canary)
        run: |
          # Deploy to 10% of traffic
          kubectl set image deployment/api-gateway \
            api-gateway=${{ env.REGISTRY }}/api-gateway:${{ github.sha }} \
            -n cline-production
```

---

## 3. Deployment Strategy

### 3.1 Environments

| Environment | Purpose | Cluster | Database |
|-------------|---------|---------|----------|
| Development | Local development | Minikube/Docker Desktop | Local PostgreSQL |
| Staging | Pre-production testing | EKS Staging | Staging RDS |
| Production | Live traffic | EKS Production | Production RDS |

### 3.2 Release Strategies

#### A. Blue-Green Deployment

```
┌────────────────────────────────────────────────────────────┐
│                     Load Balancer                           │
└──────────────────────────┬─────────────────────────────────┘
                           │
            ┌───────────────┴───────────────┐
            │                               │
    ┌───────▼───────┐              ┌──────▼──────┐
    │ Blue (Active) │              │ Green (Standby)│
    │ v1.0.0        │              │ v1.1.0       │
    │ 100% traffic  │              │ 0% traffic   │
    └───────────────┘              └──────────────┘
            │                               │
            └───────────────┬───────────────┘
                           │
                    Verify v1.1.0
                    Switch traffic
                    (instant)
```

**Use Case:** Major version releases, database migrations

#### B. Canary Deployment

```
┌────────────────────────────────────────────────────────────┐
│                     Load Balancer                           │
└──────────────────────────┬─────────────────────────────────┘
                           │
            ┌───────────────┴───────────────┐
            │ 10% v1.1.0 ───────────────────│──▶ 90% v1.0.0
            │                               │
    ┌───────▼───────┐              ┌───────▼───────┐
    │ Canary Pods   │              │ Main Pods     │
    │ v1.1.0        │              │ v1.0.0        │
    │ (1 replica)   │              │ (9 replicas)  │
    └───────────────┘              └───────────────┘
            │
            ▼
    Monitor metrics
    - Error rate < 1%
    - Latency p95 < 500ms
            │
            ▼
    Gradually increase
    or rollback
```

**Use Case:** Regular releases, feature rollouts

#### C. Rolling Deployment

```
Step 1: v1.0.0 [■■■■■■■■■■■■] 100%
Step 2: v1.1.0 [■] v1.0.0 [■■■■■] 80%
Step 3: v1.1.0 [■■] v1.0.0 [■■■] 60%
Step 4: v1.1.0 [■■■■] v1.0.0 [■■] 40%
Step 5: v1.1.0 [■■■■■■] v1.0.0 [■] 20%
Step 6: v1.1.0 [■■■■■■■■■■] 100%
```

**Use Case:** Minor updates, hotfixes

---

## 4. Kubernetes Deployment

### 4.1 Service Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: cline
  labels:
    app: api-gateway
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
        version: v1
    spec:
      containers:
      - name: gateway
        image: ghcr.io/cline/api-gateway:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: cline-secrets
              key: jwt-secret
```

### 4.2 HPA Configuration

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: cline
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

---

## 5. Database Migration

### 5.1 Migration Strategy

```sql
-- Create migration table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Example migration
-- Migration: add_user_avatar
-- Up
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
INSERT INTO schema_migrations (version) VALUES ('add_user_avatar');

-- Down
ALTER TABLE users DROP COLUMN avatar_url;
DELETE FROM schema_migrations WHERE version = 'add_user_avatar';
```

### 5.2 Zero-Downtime Migration

1. **Add new column** (nullable)
2. **Update application code** to write to both columns
3. **Backfill data** in background
4. **Verify data integrity**
5. **Make column non-nullable**
6. **Remove old column** (after verification)

---

## 6. Rollback Procedures

### 6.1 Application Rollback

```bash
# Quick rollback to previous version
kubectl rollout undo deployment/api-gateway -n cline

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway -n cline --to-revision=3

# Check rollout status
kubectl rollout status deployment/api-gateway -n cline
```

### 6.2 Database Rollback

```bash
# For numbered migrations
npm run migrate:down

# Or manually apply reverse migration
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/001_down.sql
```

### 6.3 Full System Rollback

```bash
# Script for full rollback
#!/bin/bash
VERSION=$1

# Rollback deployments
for service in api-gateway auth-service task-service ai-service browser-service; do
  kubectl set image deployment/$service \
    $service=$REGISTRY/$service:$VERSION -n cline
done

# Wait for rollout
kubectl rollout status deployment -n cline --timeout=5m
```

---

## 7. Monitoring & Validation

### 7.1 Post-Deployment Checks

```bash
# Health check
curl -f https://api.cline.dev/health

# Smoke tests
npm run test:e2e -- --tag=smoke

# Verify metrics
kubectl top pods -n cline

# Check error rates
kubectl logs -n cline -l app=api-gateway | grep ERROR | wc -l
```

### 7.2 Prometheus Alerts

```yaml
groups:
- name: deployment
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected

  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High latency detected
```

---

## 8. Release Checklist

### Pre-Release
- [ ] All tests passing
- [ ] Security scan complete
- [ ] Code review approved
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes drafted

### Deployment
- [ ] Backup created
- [ ] Canary deployed
- [ ] Metrics monitored
- [ ] Smoke tests passed
- [ ] Rollback plan ready

### Post-Release
- [ ] Production verified
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Metrics reviewed
- [ ] Post-mortem scheduled (if needed)
