// CORS utilities
export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

export function getCorsHeaders(options: CorsOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Set origin
  if (options.origin === true) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (typeof options.origin === 'string') {
    headers['Access-Control-Allow-Origin'] = options.origin;
  } else if (Array.isArray(options.origin)) {
    // For arrays, you'd typically check the request origin against the array
    // For now, we'll use the first one as default
    headers['Access-Control-Allow-Origin'] = options.origin[0] || '*';
  }
  
  // Set methods
  if (options.methods) {
    headers['Access-Control-Allow-Methods'] = options.methods.join(', ');
  } else {
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  }
  
  // Set allowed headers
  if (options.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = options.allowedHeaders.join(', ');
  } else {
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  }
  
  // Set credentials
  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}

export function isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

export function getDefaultCorsOptions(): CorsOptions {
  return {
    origin: process.env.NODE_ENV === 'development' ? true : [
      'http://localhost:3000',
      'https://your-domain.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  };
}
