# Deployment Guide

## Web App Features - January 2026

### React Modal Dialogs
Replaced browser `confirm()` and `alert()` with React components.

**Files created:**
- `web/src/contexts/ModalContext.tsx` - Context provider with `useConfirm` and `useAlert` hooks

**Files modified:**
- `web/src/App.tsx` - Wrapped routes with `ModalProvider`
- `web/src/screens/PlayersScreen.tsx` - Uses `useConfirm` for delete, `useAlert` for errors
- `web/src/screens/BracketScreen.tsx` - Uses `useConfirm` for archive/delete

**Usage:**
```tsx
const confirm = useConfirm()
const alert = useAlert()

// Simple
const ok = await confirm('Are you sure?')
await alert('Something happened')

// With options
const ok = await confirm({
  message: 'Delete this item?',
  confirmText: 'Delete',
  danger: true  // red button
})
```

---

### Bracket Light Theme Toggle
Added light/dark theme toggle on bracket screen for TV display.

**Files modified:**
- `web/src/screens/BracketScreen.tsx` - Theme state, toggle button, light CSS
- `web/src/components/MatchCard.tsx` - Added `theme` prop, light CSS

**Features:**
- Toggle button in bracket header ("Light" / "Dark")
- Theme persists in localStorage (`bracketTheme`)
- Light theme: white background, dark text, gray borders

---

### Format Locked Indicator
Tournament games (1-64) show "locked" on format button, matching phone behavior.

**Files modified:**
- `web/src/screens/KeepScoreScreen.tsx` - Lock format to Bo1, show "locked" label
- `web/src/screens/MirrorScreen.tsx` - Show "locked" label (read-only)

**Features:**
- Games 1-64 automatically lock format to Bo1
- Format button shows "locked" label below "Bo1"
- Button visually dimmed and non-clickable when locked
- Button height matches game number input when unlocked

---

### Tournament Game Names
Keep Score screen reads player names from Firebase for tournament games (1-64).

**Files modified:**
- `web/src/screens/KeepScoreScreen.tsx` - Subscribe to Firebase, lock player selection

**Features:**
- Player names auto-populated from bracket data
- Player name selection disabled for tournament games (1-64)

---

### 404 Page
Added catch-all route for unknown URLs.

**Files created:**
- `web/src/screens/NotFoundScreen.tsx` - 404 page component

**Files modified:**
- `web/src/App.tsx` - Added `<Route path="*">` catch-all

---

## Docker Image Build & Push to Registry

### Step 1: Build Docker Image
```bash
cd web
docker build \
  --build-arg VITE_FIREBASE_API_KEY=xxx \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=xxx \
  --build-arg VITE_FIREBASE_DATABASE_URL=xxx \
  --build-arg VITE_FIREBASE_PROJECT_ID=xxx \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=xxx \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=xxx \
  --build-arg VITE_FIREBASE_APP_ID=xxx \
  -t washers-web .
```

### Step 2: Push to Container Registry (pick one)

**Option A: Amazon ECR (AWS)**
```bash
# One-time setup: Create repository
aws ecr create-repository --repository-name washers-web --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag washers-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest
```

**Option B: Docker Hub**
```bash
# Login to Docker Hub
docker login

# Tag image (replace 'yourusername' with your Docker Hub username)
docker tag washers-web:latest yourusername/washers-web:latest

# Push to Docker Hub
docker push yourusername/washers-web:latest
```

**Option C: GitHub Container Registry (ghcr.io)**
```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image
docker tag washers-web:latest ghcr.io/USERNAME/washers-web:latest

# Push to GHCR
docker push ghcr.io/USERNAME/washers-web:latest
```

### Step 3: Deploy to EC2

**On your EC2 instance:**

```bash
# Install Docker
sudo yum install -y docker.x86_64
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install & configure AWS CLI
sudo yum install -y aws-cli
aws configure
# Enter: Access Key ID, Secret Access Key, us-east-1, json

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Pull and run
sudo docker pull <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest
sudo docker run -d -p 8080:80 --name washers-web \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest
```

### Step 4: Nginx + SSL

**Create nginx config** (`/etc/nginx/conf.d/washers.conf` - must end in `.conf`!):
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Get SSL cert with certbot:**
```bash
sudo certbot --nginx -d yourdomain.com
```

Certbot auto-configures nginx SSL and sets up auto-renewal.

---

## Updating the Deployment

```bash
# On Mac: rebuild for x86 (important: --platform linux/amd64)
cd web
docker build --platform linux/amd64 \
  --build-arg VITE_FIREBASE_API_KEY=xxx \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=xxx \
  --build-arg VITE_FIREBASE_DATABASE_URL=xxx \
  --build-arg VITE_FIREBASE_PROJECT_ID=xxx \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=xxx \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=xxx \
  --build-arg VITE_FIREBASE_APP_ID=xxx \
  -t washers-web .

docker tag washers-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest

# On EC2: pull and restart
sudo docker pull <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest
sudo docker stop washers-web
sudo docker rm washers-web
sudo docker run -d -p 8080:80 --name washers-web \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/washers-web:latest
```

---

## Live Site
https://washers.manion.org

---

## Roadmap
- [ ] Live game tiles view (all 8 games at once)
