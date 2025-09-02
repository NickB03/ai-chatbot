// Security utilities
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is or use a server-safe sanitizer
    return html;
  }
  return DOMPurify.sanitize(html);
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function validateInput(input: string, maxLength = 1000): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  if (input.length > maxLength) {
    return false;
  }
  // Check for potentially malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i
  ];
  
  return !maliciousPatterns.some(pattern => pattern.test(input));
}

export function generateSecureToken(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
