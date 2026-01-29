/**
 * Authentication helpers for movie-fone
 */

import { pb, isAuthenticated, clearAuth, getCurrentUser } from './pb.js';

// Redirect to login if not authenticated
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Login with email and password
export async function login(email, password) {
    try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        return { success: true, user: authData.record };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Register new user
export async function register(email, password, passwordConfirm) {
    try {
        const user = await pb.collection('users').create({
            email,
            password,
            passwordConfirm
        });
        // Auto-login after registration
        await login(email, password);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Logout
export function logout() {
    clearAuth();
    window.location.href = '/index.html';
}

// Get current user info
export { getCurrentUser, isAuthenticated };
