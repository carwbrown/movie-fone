/**
 * PocketBase client setup
 * Following plainvanillaweb.com principles - ES modules, no build step
 */

// Import PocketBase from CDN
import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.21.1/dist/pocketbase.es.mjs';

// For development
const isDev = window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';

export const pb = new PocketBase(
  isDev 
    ? 'http://127.0.0.1:8090' 
    : 'http://34.41.45.234:8090' // Change in production
);

// Create and export the PocketBase instance

// Disable auto-cancellation
pb.autoCancellation(false);


// Helper to check if user is authenticated
export function isAuthenticated() {
    return pb.authStore.isValid;
}

// Helper to get current user
export function getCurrentUser() {
    return pb.authStore.model;
}

// Helper to clear auth (logout)
export function clearAuth() {
    pb.authStore.clear();
}

// Listen for auth state changes
export function onAuthChange(callback) {
    return pb.authStore.onChange((token, model) => {
        callback(model, token);
    });
}
