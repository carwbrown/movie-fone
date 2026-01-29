# Movie Fone - TODO

## Completed

### Auth & Core
- [x] Create login page with web component (`index.html`)
- [x] Implement login/register functionality (`components/login-form.js`)
- [x] Create auth helpers (`scripts/auth.js`)
- [x] Create PocketBase client (`scripts/pb.js`)
- [x] Create config file for API keys (`scripts/config.js`)
- [x] Set up .gitignore for secrets

### TMDB Integration
- [x] Create TMDB API client (`scripts/tmdb.js`)
- [x] Search TMDB when query not found locally
- [x] Cache new movies from TMDB to `movies` collection
- [x] Handle API errors gracefully

### UI Components
- [x] Create movie card web component (`components/movie-card.js`)
- [x] Build main app page (`app.html`)
- [x] Add movie to user's list
- [x] Loading states
- [x] Error messages
- [x] Empty states

### Documentation
- [x] Update README with local dev instructions
- [x] Create GCP deployment guide
- [x] Create CLAUDE.md with project guidelines

## Remaining

### PocketBase Setup (Local)
- [ ] Download and run PocketBase locally
- [ ] Create `movies` collection with schema
- [ ] Create `user_movies` collection with schema
- [ ] Set up API rules for both collections
- [ ] Create test user account

### Frontend Features
- [ ] Create movie detail page with edit form
- [ ] Implement inline category/comment editing
- [ ] Mark as watched toggle
- [ ] Filter by category
- [ ] Filter by watched status
- [ ] Watchlist view (separate from "My Movies")
- [ ] Seed script for top 200 popular movies
- [x] Create `scripts/config.example.js` template file

### Deployment
- [ ] Deploy PocketBase to GCP
- [ ] Update `scripts/config.js` with production URL
- [ ] Test production environment
- [ ] Set up automatic backups

### Polish
- [ ] Mobile responsive testing
- [ ] Add to home screen instructions
