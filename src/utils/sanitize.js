// SIMPAH - HTML Sanitization Utility
// Prevents XSS attacks by escaping user-generated content before rendering with innerHTML

/**
 * Escape HTML special characters to prevent XSS injection.
 * Use this for ANY user-generated content that will be rendered via innerHTML.
 * 
 * @param {string} str - Raw string (potentially containing HTML/script tags)
 * @returns {string} Escaped string safe for innerHTML rendering
 * 
 * @example
 * // Before (UNSAFE):
 * innerHTML = `<div>${r.notes}</div>`
 * 
 * // After (SAFE):
 * innerHTML = `<div>${escapeHTML(r.notes)}</div>`
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize a URL to prevent javascript: protocol injection.
 * Only allows http:, https:, and data: (for images) protocols.
 * 
 * @param {string} url - Raw URL string
 * @returns {string} Sanitized URL or empty string if unsafe
 */
export function sanitizeURL(url) {
  if (!url) return '';
  const trimmed = url.trim();
  // Allow only safe protocols
  if (/^(https?:|data:image\/)/i.test(trimmed)) {
    return trimmed;
  }
  // Relative paths are OK
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }
  return '';
}
