
# Deployment Guide

## Prerequisites

- Docker & Docker Compose (v20.10+)
- Java 21 JDK
- Node.js 18+
- MariaDB 11.3+
- DeepSeek API Key

## Local Development

### 1. Clone and Setup

```bash
git clone https://github.com/tathagatabandyo/smart_quiz_application.git
cd smart_quiz_application
git checkout production-ready-setup

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your local credentials:

```bash
DB_USERNAME=root
DB_PASSWORD=your-secure-password
JWT_SECRET=your-secret-key-min-32-chars
DEEPSEEK_API_KEY=sk-your-api-key
```

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:8085
- MariaDB: localhost:3307

## Production Deployment

### 1. Environment Setup

Create `.env.production`:

```bash
SERVER_PORT=8085
DB_URL=jdbc:mariadb://db-host:3306/smart_quiz
DB_USERNAME=smartquiz_user
DB_PASSWORD=<strong-password>
JWT_SECRET=<random-32-char-secret>
DEEPSEEK_API_KEY=<your-api-key>
CORS_ALLOWED_ORIGINS=https://yourdomain.com
SECURE_COOKIES=true
SSL_KEYSTORE_PATH=/etc/ssl/keystore.p12
SSL_KEYSTORE_PASSWORD=<keystore-password>
```

### 2. Build Production Images

```bash
# Backend
docker build -t smart-quiz-backend:1.0.0 ./backend/smart_quiz

# Frontend
docker build -t smart-quiz-frontend:1.0.0 ./frontend
```

### 3. Push to Registry (Docker Hub/ECR)

```bash
# Example with Docker Hub
docker tag smart-quiz-backend:1.0.0 yourusername/smart-quiz-backend:1.0.0
docker push yourusername/smart-quiz-backend:1.0.0

docker tag smart-quiz-frontend:1.0.0 yourusername/smart-quiz-frontend:1.0.0
docker push yourusername/smart-quiz-frontend:1.0.0
```

### 4. Deploy on Kubernetes (Optional)

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smart-quiz-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smart-quiz-backend
  template:
    metadata:
      labels:
        app: smart-quiz-backend
    spec:
      containers:
      - name: backend
        image: yourusername/smart-quiz-backend:1.0.0
        env:
        - name: DB_URL
          valueFrom:
            secretKeyRef:
              name: smart-quiz-secrets
              key: db-url
        ports:
        - containerPort: 8085
        livenessProbe:
          httpGet:
            path: /api/auth/me
            port: 8085
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/auth/me
            port: 8085
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smart-quiz-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: smart-quiz-frontend
  template:
    metadata:
      labels:
        app: smart-quiz-frontend
    spec:
      containers:
      - name: frontend
        image: yourusername/smart-quiz-frontend:1.0.0
        ports:
        - containerPort: 5173
```

Deploy:

```bash
kubectl apply -f k8s-deployment.yaml
```

### 5. Deploy on Cloud (AWS ECS Example)

Create task definition and push to ECS. See AWS documentation for full details.

### 6. SSL/TLS Setup

Using Let's Encrypt with Nginx reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend:8085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Database Migrations

Flyway automatically runs migrations on startup. Migrations are in:

```
backend/smart_quiz/src/main/resources/db/migration/
```

Naming convention: `V{version}__{description}.sql`

Example:
- `V1__initial_schema.sql`
- `V2__add_user_preferences.sql`

## Monitoring & Logging

### View Logs

```bash
# Docker
docker logs -f smart_quiz_backend

# Kubernetes
kubectl logs -f deployment/smart-quiz-backend
```

### Health Checks

```bash
curl http://localhost:8085/api/auth/me -H "Authorization: Bearer <token>"
```

## Backup & Recovery

### Database Backup

```bash
docker exec smart_quiz_db mariadb-dump -uroot -p<password> smart_quiz > backup.sql
```

### Restore

```bash
docker exec -i smart_quiz_db mariadb -uroot -p<password> smart_quiz < backup.sql
```

## Security Checklist

- [ ] JWT_SECRET changed and ≥32 characters
- [ ] Database password is strong
- [ ] SSL/TLS certificates configured
- [ ] CORS_ALLOWED_ORIGINS restricted
- [ ] Environment variables not committed
- [ ] Database user has least privileges
- [ ] Rate limiting enabled
- [ ] Regular security updates applied
- [ ] Backups automated and tested
- [ ] Logs monitored for suspicious activity

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker logs smart_quiz_backend

# Verify environment variables
docker exec smart_quiz_backend env | grep DB_
```

### Database connection fails

```bash
# Test connection
docker exec smart_quiz_db mariadb -h mariadb -uroot -p<password> -e "SELECT 1"
```

### Frontend can't reach API

```bash
# Check CORS configuration
curl -H "Origin: http://localhost:5173" http://localhost:8085/api/quizzes -v
```

## Support

For issues, create a GitHub issue or check the README.md.
