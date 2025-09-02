// Content Security Policy utilities
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getCSPHeader(nonce?: string): string {
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  return cspDirectives.join('; ');
}
