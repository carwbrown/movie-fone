/**
 * TMDB API Client
 * Handles movie search and caching to PocketBase
 */

import { pb } from './pb.js';
import { TMDB_API_KEY } from './config.js';

// TMDB Configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Image URL helpers
export const posterUrl = (path, size = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

export const backdropUrl = (path, size = 'original') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

/**
 * Validate TMDB API key is configured
 * @returns {boolean} - True if API key is valid
 */
function validateAPIKey() {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
    console.error('TMDB API key not configured. Add it to scripts/config.js');
    return false;
  }
  return true;
}

/**
 * Search for movies - checks local cache first, then TMDB
 */
export async function searchMovies(query) {
  if (!query?.trim()) return [];

  // First, search our local PocketBase cache
  try {
    const cached = await pb.collection('movies').getList(1, 20, {
      filter: `title ~ "${query}"`,
      sort: '-rating'
    });

    if (cached.items.length > 0) {
      console.log(`Found ${cached.items.length} movies in cache`);
      return cached.items;
    }
  } catch (error) {
    console.log('Cache search failed, trying TMDB:', error.message);
  }

  // If not in cache, search TMDB
  return searchTMDB(query);
}

/**
 * Search TMDB directly
 */
export async function searchTMDB(query) {
  if (!validateAPIKey()) return [];

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const movies = data.results || [];

    // Cache results to PocketBase (don't await, do in background)
    cacheMovies(movies);

    // Transform to our format
    return movies.map(transformTMDBMovie);
  } catch (error) {
    console.error('TMDB search error:', error);
    return [];
  }
}

/**
 * Get movie details from TMDB
 */
export async function getMovieDetails(tmdbId) {
  if (!validateAPIKey()) return null;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const movie = await response.json();
    return transformTMDBMovie(movie, true);
  } catch (error) {
    console.error('TMDB details error:', error);
    return null;
  }
}

/**
 * Get popular movies (for seeding/discovery)
 */
export async function getPopularMovies(page = 1) {
  if (!validateAPIKey()) return [];

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map(transformTMDBMovie);
  } catch (error) {
    console.error('TMDB popular error:', error);
    return [];
  }
}

/**
 * Transform TMDB movie to our format
 */
function transformTMDBMovie(movie, includeDetails = false) {
  const transformed = {
    tmdb_id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    overview: movie.overview,
    release_date: movie.release_date,
    year: movie.release_date?.split('-')[0] || '',
    rating: movie.vote_average,
  };

  if (includeDetails) {
    transformed.runtime = movie.runtime;
    transformed.genres = movie.genres?.map(g => g.name).join(', ') || '';
  }

  return transformed;
}

/**
 * Cache movies to PocketBase (background operation)
 * PERFORMANCE FIX: Batch query instead of N+1 queries
 */
async function cacheMovies(tmdbMovies) {
  if (tmdbMovies.length === 0) return;

  try {
    // BEFORE: For 20 movies, made 40 queries (20 checks + up to 20 inserts)
    // AFTER: 1 batch query + N inserts for new movies only

    // Build filter to check all movies at once
    const tmdbIds = tmdbMovies.map(m => m.id);
    const filterStr = tmdbIds.map(id => `tmdb_id = ${id}`).join(' || ');

    // Single query to check which movies already exist
    const existing = await pb.collection('movies').getList(1, 200, {
      filter: filterStr
    });

    // Build set of existing IDs for fast lookup
    const existingIds = new Set(existing.items.map(m => m.tmdb_id));

    // Only insert movies we don't have yet
    const newMovies = tmdbMovies.filter(m => !existingIds.has(m.id));

    for (const movie of newMovies) {
      try {
        await pb.collection('movies').create(transformTMDBMovie(movie));
        console.log(`Cached: ${movie.title}`);
      } catch (error) {
        // Ignore individual cache errors (race conditions, etc.)
        console.log(`Cache skip: ${movie.title}`);
      }
    }

    if (newMovies.length > 0) {
      console.log(`Cached ${newMovies.length} new movies`);
    }
  } catch (error) {
    console.log('Cache batch operation failed:', error.message);
  }
}

/**
 * Add movie to user's collection
 */
export async function addToMyMovies(userId, movieId, options = {}) {
  try {
    const record = await pb.collection('user_movies').create({
      user: userId,
      movie: movieId,
      category: options.category || '',
      comment: options.comment || '',
      watched: options.watched || false
    });
    return { success: true, record };
  } catch (error) {
    // Check if it's a duplicate
    if (error.message?.includes('unique')) {
      return { success: false, error: 'Movie already in your collection' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Check if TMDB is configured
 */
export function isTMDBConfigured() {
  return TMDB_API_KEY && TMDB_API_KEY !== 'YOUR_TMDB_API_KEY_HERE';
}
