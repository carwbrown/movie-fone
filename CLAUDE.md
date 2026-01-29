# Movie Fone

## Code Review Requirement
**All code changes must be shown to the user and approved before writing files.**

## Design Philosophy
- Follow plainvanillaweb.com principles
- Simplicity is paramount - no unnecessary complexity
- No build tools, no frameworks
- ES modules for JavaScript
- Web components for reusable UI
- Vanilla CSS with custom properties
- PocketBase SDK for backend (loaded from CDN)

## Architecture
- Frontend: Vanilla HTML + CSS + JavaScript
- Backend: PocketBase (SQLite with REST API)
- External API: TMDB for movie data (cached locally)
- Hosting: Frontend on Netlify (movie-fone.netlify.app), Backend on GCP

## Development Decisions
- App is behind auth - users must log in to access any features
- Use PocketBase SDK directly (no HTMX)
- TMDB API key stored in `.env` file
- Build frontend first, connect to PocketBase later

## File Structure
```
movie-fone/
├── index.html          # Login page (entry point)
├── app.html            # Main app (behind auth)
├── styles/
│   └── app.css         # Styling
├── scripts/
│   ├── pb.js           # PocketBase client setup
│   ├── auth.js         # Auth helpers
│   ├── tmdb.js         # TMDB API client
│   └── app.js          # Main app logic
├── components/
│   ├── movie-card.js   # Movie card web component
│   ├── movie-detail.js # Movie detail web component
│   └── login-form.js   # Login form web component
├── .env                # API keys (gitignored)
└── README.md
```

## Key Files
- `scripts/pb.js` - PocketBase client initialization
- `scripts/auth.js` - Authentication helpers
- `scripts/tmdb.js` - TMDB API client with caching
- `components/movie-card.js` - Movie display web component
- `.env` - Contains TMDB API key (never commit)

## PocketBase Collections

### movies (shared movie cache)
- `tmdb_id` (number, unique) - TMDB source of truth
- `title`, `poster_path`, `backdrop_path`, `overview`
- `release_date`, `year`, `rating`, `runtime`, `genres`
- `cached_at` (auto)

### user_movies (user's personal data)
- `user` (relation to users)
- `movie` (relation to movies)
- `category`, `comment`, `watched` (bool)

## TMDB Integration
- API key stored in `.env`
- Search: Check local DB first, then TMDB if not found
- Cache: Store TMDB results in `movies` collection
- Image URLs: `https://image.tmdb.org/t/p/w500/{poster_path}`

## Development
```bash
# Terminal 1: Start PocketBase
pocketbase serve
# Admin UI at http://127.0.0.1:8090/_/

# Terminal 2: Serve frontend
python3 -m http.server 8000
# App at http://localhost:8000
```

## GCP Deployment (PocketBase Backend)

### Option 1: Google Cloud Free Tier VM
1. Create e2-micro VM in us-central1/us-west1/us-east1
2. SSH and install PocketBase:
   ```bash
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.4/pocketbase_0.23.4_linux_amd64.zip
   unzip pocketbase_0.23.4_linux_amd64.zip
   chmod +x pocketbase
   ```
3. Create systemd service for auto-restart
4. Configure firewall to allow port 8090
5. Optional: nginx + SSL for production domain

### Option 2: Google Cloud Run
```bash
# Create Dockerfile for PocketBase
# Then deploy:
gcloud builds submit --tag gcr.io/PROJECT/pocketbase
gcloud run deploy pocketbase \
  --image gcr.io/PROJECT/pocketbase \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend Deployment: Netlify
- Connect GitHub repo
- Publish directory: `.` (root)
- No build command needed
- Configure CORS in PocketBase with Netlify domain
