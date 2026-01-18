# movie-fone

# 🎬 Simple Movie Tracker

A minimal movie tracking app that caches TMDB data locally. Search once, store forever. Mobile-first design.

## 🎯 Architecture Decision

**Why cache TMDB movies in our database?**
- ✅ Faster - no API calls after first search
- ✅ Offline-capable - works without TMDB
- ✅ Searchable - PocketBase full-text search on all fields
- ✅ Reliable - not dependent on TMDB API limits
- ✅ Consistent - same data structure for all movies

**How it works:**
1. Pre-seed with top 200 popular movies on first run
2. When user searches, check our DB first
3. If not found, query TMDB and cache the result
4. User categories/comments live in separate relation table
5. TMDB ID is the source of truth - never store same movie twice

## 🗄️ PocketBase Schema

### Collection: `movies`
Cached TMDB movie data - shared across all users

- `tmdb_id` (number, unique, required) - Source of truth
- `title` (text, required)
- `poster_path` (text)
- `backdrop_path` (text)
- `overview` (text)
- `release_date` (text)
- `year` (text) - Extracted from release_date
- `rating` (number) - TMDB vote_average
- `runtime` (number) - Minutes
- `genres` (text) - Comma-separated
- `cached_at` (date, auto)

**API Rules:**
- List/View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: Only admin (TMDB data shouldn't be edited by users)
- Delete: Only admin

### Collection: `user_movies`
User's personal movie data - one record per user per movie

- `user` (relation → users, required)
- `movie` (relation → movies, required)
- `category` (text) - User's custom category/tag
- `comment` (text) - User's personal notes
- `watched` (bool, default: false)
- `added_at` (date, auto)
- `updated_at` (date, auto)

**API Rules:**
- List/View: `@request.auth.id != "" && user = @request.auth.id`
- Create: `@request.auth.id != "" && @request.data.user = @request.auth.id`
- Update: `@request.auth.id != "" && user = @request.auth.id`
- Delete: `@request.auth.id != "" && user = @request.auth.id`

**Unique Index:** `user` + `movie` (prevents duplicates)

## 📋 TODO List

### Phase 1: PocketBase Setup
- [ ] Download and run PocketBase locally
- [ ] Create `movies` collection with schema above
- [ ] Create `user_movies` collection with schema above
- [ ] Set up API rules for both collections
- [ ] Create admin account
- [ ] Create your user account via admin UI

### Phase 2: Seed Popular Movies
- [ ] Get TMDB API key (free at themoviedb.org)
- [ ] Run seed script to fetch top 200 popular movies
- [ ] Verify movies appear in PocketBase admin UI
- [ ] Test search works in PocketBase

### Phase 3: Build Frontend
- [ ] Create HTML file with HTMX
- [ ] Implement login screen
- [ ] Build movie list view (shows all movies from DB)
- [ ] Add search bar (filters cached movies)
- [ ] Create movie detail page with edit form
- [ ] Implement inline category/comment editing

### Phase 4: TMDB Integration
- [ ] Search TMDB when query not found locally
- [ ] Cache new movies from TMDB to `movies` collection
- [ ] Test search → cache → show flow
- [ ] Handle API errors gracefully

### Phase 5: User Features
- [ ] Add movie to user's list
- [ ] Edit category/comment inline
- [ ] Mark as watched
- [ ] Filter by category
- [ ] Filter by watched status

### Phase 6: Deploy
- [ ] Choose hosting: Render or GCP
- [ ] Deploy PocketBase
- [ ] Upload HTML to `pb_public/`
- [ ] Test production environment
- [ ] Set up automatic backups

### Phase 7: Polish
- [ ] Mobile responsive testing
- [ ] Loading states
- [ ] Error messages
- [ ] Empty states
- [ ] Add to home screen instructions

## 🎬 TMDB API Setup

**Get Your Free API Key:**
1. Sign up at https://www.themoviedb.org/
2. Go to Settings → API
3. Request an API Key (choose "Developer")
4. Copy your API Read Access Token

**Free Tier Limits:**
- 1,000 requests per day
- Perfect for personal use
- With caching, you'll rarely hit this

**Key Endpoints We Use:**

```bash
# Popular movies (for seeding)
GET https://api.themoviedb.org/3/movie/popular?api_key=YOUR_KEY&page=1

# Search movies (when not in our DB)
GET https://api.themoviedb.org/3/search/movie?api_key=YOUR_KEY&query=SEARCH

# Movie details (for caching full data)
GET https://api.themoviedb.org/3/movie/{movie_id}?api_key=YOUR_KEY

# Image URLs
https://image.tmdb.org/t/p/w500/{poster_path}
https://image.tmdb.org/t/p/original/{backdrop_path}
```

## 🌱 Seed Script

Create `seed_movies.js` to populate initial movies:

```javascript
const PB_URL = 'http://127.0.0.1:8090';
const TMDB_KEY = 'YOUR_TMDB_API_KEY';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'your_admin_password';

async function seedMovies() {
    // Login as admin
    const authRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identity: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        })
    });
    
    const { token } = await authRes.json();
    
    // Fetch top 10 pages (200 movies)
    for (let page = 1; page <= 10; page++) {
        const res = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&page=${page}`
        );
        const data = await res.json();
        
        for (const movie of data.results) {
            // Get full movie details
            const detailRes = await fetch(
                `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_KEY}`
            );
            const details = await detailRes.json();
            
            // Cache in PocketBase
            try {
                await fetch(`${PB_URL}/api/collections/movies/records`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tmdb_id: details.id,
                        title: details.title,
                        poster_path: details.poster_path,
                        backdrop_path: details.backdrop_path,
                        overview: details.overview,
                        release_date: details.release_date,
                        year: details.release_date?.split('-')[0] || '',
                        rating: details.vote_average,
                        runtime: details.runtime,
                        genres: details.genres?.map(g => g.name).join(', ')
                    })
                });
                console.log(`Added: ${details.title}`);
            } catch (err) {
                console.log(`Skipped: ${details.title} (probably exists)`);
            }
            
            // Rate limiting
            await new Promise(r => setTimeout(r, 250));
        }
    }
    
    console.log('Seeding complete!');
}

seedMovies();
```

Run with: `node seed_movies.js`

## 🚀 FREE Hosting Options

### Option 1: Render.com (ACTUALLY FREE)

**Why Render:**
- ✅ True free tier (750 hours/month)
- ✅ Auto-deploy from GitHub
- ✅ Free SSL
- ✅ No credit card required
- ⚠️ Spins down after 15 min inactivity (cold start ~30s)

**Deploy Steps:**

```bash
# 1. Create Dockerfile
cat > Dockerfile << 'EOF'
FROM alpine:latest

# Install dependencies
RUN apk add --no-cache \
    ca-certificates \
    wget \
    unzip

# Download PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip \
    && unzip pocketbase_0.22.0_linux_amd64.zip \
    && rm pocketbase_0.22.0_linux_amd64.zip

# Create data directory
RUN mkdir -p /pb/pb_data /pb/pb_public

# Copy your HTML files
COPY index.html /pb/pb_public/

EXPOSE 8090

CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090"]
EOF

# 2. Create render.yaml
cat > render.yaml << 'EOF'
services:
  - type: web
    name: movie-tracker
    env: docker
    plan: free
    disk:
      name: pb-data
      mountPath: /pb/pb_data
      sizeGB: 1
EOF

# 3. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main

# 4. Connect to Render
# Go to render.com → New → Web Service → Connect your repo
# Render will auto-detect the Dockerfile and deploy
```

**Your URL:** `https://movie-tracker.onrender.com`

**Free Tier Details:**
- 750 hours/month (enough for 24/7 if it's your only app)
- 512MB RAM
- 1GB disk
- Perfect for personal use

### Option 2: Google Cloud Platform (Always Free Tier)

**Why GCP:**
- ✅ Truly always free (not trial)
- ✅ No cold starts
- ✅ More reliable than Render
- ⚠️ Requires credit card (won't charge without permission)

**Free Tier Includes:**
- 1 f1-micro VM instance (24/7)
- 30GB standard persistent disk
- 1GB network egress/month

**Deploy Steps:**

```bash
# 1. Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 2. Login and create project
gcloud auth login
gcloud projects create movie-tracker-12345
gcloud config set project movie-tracker-12345

# 3. Create free tier VM
gcloud compute instances create pocketbase-vm \
  --zone=us-west1-b \
  --machine-type=f1-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server

# 4. Create firewall rule
gcloud compute firewall-rules create allow-http-8090 \
  --allow=tcp:8090 \
  --target-tags=http-server

# 5. SSH into VM
gcloud compute ssh pocketbase-vm --zone=us-west1-b

# 6. Install PocketBase on VM
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip
chmod +x pocketbase

# 7. Create systemd service
sudo tee /etc/systemd/system/pocketbase.service > /dev/null <<EOF
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME
ExecStart=$HOME/pocketbase serve --http=0.0.0.0:8090
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 8. Start service
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

# 9. Get your external IP
gcloud compute instances describe pocketbase-vm \
  --zone=us-west1-b \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

**Your URL:** `http://YOUR_VM_IP:8090`

**Add Custom Domain (Optional):**
- Point your domain A record to the VM IP
- Use Cloudflare for free SSL

### Option 3: Local + Cloudflare Tunnel (ZERO COST)

**Why Cloudflare Tunnel:**
- ✅ 100% free forever
- ✅ No credit card needed
- ✅ Your data stays on your machine
- ✅ Access from anywhere
- ⚠️ Requires your computer to be on

```bash
# 1. Install cloudflared
brew install cloudflare/cloudflare/cloudflared
# Or: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# 2. Run PocketBase locally
./pocketbase serve

# 3. Create tunnel (opens in another terminal)
cloudflared tunnel --url http://localhost:8090

# Output: https://random-words-1234.trycloudflare.com
# This URL works from anywhere!
```

**Pro tip:** Leave PocketBase running on an old laptop/Raspberry Pi at home.

## 🔒 Invite System (Via Admin UI)

**No code needed!** Just use PocketBase's built-in admin:

1. **Disable public registration:**
   - Open PocketBase Admin: `http://your-url:8090/_/`
   - Settings → Collection (users) → API Rules
   - Uncheck "Allow registration"

2. **When someone needs access:**
   - Login to Admin UI
   - Collections → users → New record
   - Set email, username, password
   - Send them credentials
   - They login and change password

**That's it.** Simple, secure, no extra code.

## 💾 Backup Strategy

```bash
# Backup PocketBase data (run weekly)
tar -czf backup-$(date +%Y%m%d).tar.gz pb_data/

# Restore from backup
tar -xzf backup-20260115.tar.gz
```

**Automated backups on GCP:**
```bash
# Add to crontab
0 2 * * 0 tar -czf ~/backups/pb-$(date +\%Y\%m\%d).tar.gz ~/pb_data/
```

## 📱 Mobile Setup

1. Open your app URL in mobile browser
2. **iOS:** Share → Add to Home Screen
3. **Android:** Menu → Add to Home screen
4. Icon appears on home screen
5. Opens like a native app!

## 💰 Cost Comparison

| Option | Monthly Cost | Setup Time | Reliability |
|--------|--------------|------------|-------------|
| **Render** | $0 | 5 min | Good (cold starts) |
| **GCP Free Tier** | $0 | 15 min | Excellent |
| **Cloudflare Tunnel** | $0 | 2 min | Good (needs your PC) |
| Fly.io | $5-10 | 5 min | Excellent |

**Recommendation for you:** Start with Render (easiest), move to GCP if you want better reliability.

## 🛠️ Local Development

```bash
# 1. Download PocketBase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip

# 2. Create your HTML file
mkdir pb_public
cp index.html pb_public/

# 3. Run PocketBase
./pocketbase serve

# 4. Open in browser
open http://127.0.0.1:8090/_/

# 5. Create collections via UI (use schema above)
# 6. Create admin account
# 7. Run seed script
# 8. Access app at http://127.0.0.1:8090/
```

## 🔍 Search Flow

1. User types query
2. Check `movies` collection with PocketBase filter: `title ~ 'query' || overview ~ 'query'`
3. If found → show results from DB
4. If not found → query TMDB API
5. Cache TMDB results to `movies` collection
6. Show results
7. Next time same search → instant from DB!

## 📚 Resources

- [PocketBase Docs](https://pocketbase.io/docs/)
- [TMDB API Docs](https://developers.themoviedb.org/3)
- [Render Docs](https://render.com/docs)
- [GCP Free Tier](https://cloud.google.com/free/docs/free-cloud-features)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

**TL;DR:** Cache movies locally, search is instant, deploy free on Render or GCP, works great on mobile.