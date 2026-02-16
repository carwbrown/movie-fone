/**
 * Security utilities for user input sanitization
 *
 * CRITICAL: Always use these functions when displaying user-generated content
 * to prevent XSS (Cross-Site Scripting) attacks.
 *
 * @module security
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 *
 * @param {string} str - User input string
 * @returns {string} - HTML-escaped string safe for innerHTML
 *
 * @example
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHTML(userInput);
 * element.innerHTML = safe; // Displays as text, doesn't execute
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escape quotes and backslashes for PocketBase filter strings
 * Prevents filter injection attacks
 *
 * @param {string} value - Filter value from user input
 * @returns {string} - Escaped filter value
 *
 * @example
 * const userSearch = 'O\'Reilly'; // Contains single quote
 * const filter = `title = "${escapeFilter(userSearch)}"`;
 * // Safe: title = "O\'Reilly"
 */
export function escapeFilter(value) {
  if (typeof value !== 'string') return '';

  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/'/g, "\\'");    // Escape single quotes
}
