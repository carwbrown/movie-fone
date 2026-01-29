# Movie Fone

A minimal movie tracking app that caches TMDB data locally.

**Live:** [movie-fone.netlify.app](https://movie-fone.netlify.app)

## Tech Stack

- **Frontend:** Vanilla HTML + CSS + JavaScript (Web Components)
- **Backend:** PocketBase (SQLite with REST API)
- **External API:** TMDB for movie data
- **Hosting:** Netlify (frontend) + GCP (backend)

## Local Development

### Prerequisites
- [PocketBase](https://pocketbase.io/docs/) (`brew install pocketbase` on Mac)
- Free [TMDB API key](https://www.themoviedb.org/settings/api)

### Quick Start

```bash
# 1. Create config file with your TMDB API key
cp scripts/config.example.js scripts/config.js
# Edit scripts/config.js with your TMDB_API_KEY

# 2. Start PocketBase (Terminal 1)
pocketbase serve
# Admin UI: http://127.0.0.1:8090/_/

# 3. Serve frontend (Terminal 2)
python3 -m http.server 8000

# 4. Open http://localhost:8000
```

### First Time PocketBase Setup

1. Open Admin UI at `http://127.0.0.1:8090/_/`
2. Create admin account
3. Create `movies` collection (tmdb_id, title, poster_path, overview, release_date, rating)
4. Create `user_movies` collection (user relation, movie relation, category, watched)
5. Set API rules (see CLAUDE.md for details)

## File Structure

```
movie-fone/
├── index.html              # Login page
├── app.html                # Main app (behind auth)
├── scripts/
│   ├── config.js           # API keys (gitignored)
│   ├── pb.js               # PocketBase client
│   ├── auth.js             # Auth helpers
│   └── tmdb.js             # TMDB API client
├── components/
│   ├── login-form.js       # Login web component
│   └── movie-card.js       # Movie card web component
└── .gitignore
```

## Deployment

- **Frontend:** Netlify (auto-deploy from GitHub)
- **Backend:** See [docs/GCP_DEPLOYMENT.md](docs/GCP_DEPLOYMENT.md)
