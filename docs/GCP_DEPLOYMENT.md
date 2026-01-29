# GCP Deployment Guide - PocketBase Backend

Deploy PocketBase to Google Cloud for movie-fone.

## Prerequisites

- Google Cloud account (free tier eligible)
- `gcloud` CLI installed (`brew install google-cloud-sdk`)

## Option 1: Cloud Run (Recommended)

Cloud Run is serverless and scales to zero when not in use.

### Setup

```bash
# Login and create project
gcloud auth login
gcloud projects create movie-fone-backend --name="Movie Fone"
gcloud config set project movie-fone-backend

# Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates wget unzip

RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.4/pocketbase_0.23.4_linux_amd64.zip \
    && unzip pocketbase_0.23.4_linux_amd64.zip \
    && rm pocketbase_0.23.4_linux_amd64.zip

RUN mkdir -p /pb/pb_data

EXPOSE 8090

CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090"]
```

### Deploy

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/movie-fone-backend/pocketbase
gcloud run deploy pocketbase \
  --image gcr.io/movie-fone-backend/pocketbase \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi

# Note your URL (e.g., https://pocketbase-xxxxx-uc.a.run.app)
```

### Update Frontend

Edit `scripts/config.js`:

```javascript
const config = {
  pocketbaseUrl: window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8090'
    : 'https://pocketbase-xxxxx-uc.a.run.app'
};
```

## Option 2: Compute Engine VM (Always On)

Free tier includes 1 e2-micro VM.

### Create VM

```bash
gcloud compute instances create pocketbase-vm \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server

# Allow traffic on port 8090
gcloud compute firewall-rules create allow-pocketbase \
  --allow=tcp:8090 \
  --target-tags=http-server
```

### SSH and Install

```bash
gcloud compute ssh pocketbase-vm --zone=us-central1-a

# On the VM:
sudo mkdir -p /opt/pocketbase
cd /opt/pocketbase
sudo wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.4/pocketbase_0.23.4_linux_amd64.zip
sudo unzip pocketbase_0.23.4_linux_amd64.zip
sudo chmod +x pocketbase
```

### Create Service

```bash
sudo tee /etc/systemd/system/pocketbase.service > /dev/null <<EOF
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=0.0.0.0:8090
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable pocketbase
sudo systemctl start pocketbase
```

### Get External IP

```bash
gcloud compute instances describe pocketbase-vm \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

Your PocketBase is at `http://YOUR_IP:8090`

## Post-Deployment

1. Open PocketBase admin UI (`/\_/`)
2. Create admin account
3. Create collections (movies, user_movies)
4. Set API rules
5. Update `scripts/config.js` with production URL
6. Redeploy frontend to Netlify

## Free Tier Limits

- **Cloud Run:** 2 million requests/month
- **Compute Engine:** 1 e2-micro VM (us-central1, us-west1, or us-east1)
- **Storage:** 30GB disk
