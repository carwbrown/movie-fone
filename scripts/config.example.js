// Copy this file to config.js and fill in your values
// config.js is gitignored - never commit your API keys

const config = {
  // PocketBase URL (local dev vs production)
  pocketbaseUrl: window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8090'
    : 'https://YOUR_CLOUD_RUN_URL.run.app',

  // TMDB API Key - get yours at https://www.themoviedb.org/settings/api
  TMDB_API_KEY: 'YOUR_TMDB_API_KEY_HERE'
};

export default config;
