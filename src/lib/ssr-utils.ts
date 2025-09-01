// Server-side rendering utilities
export function isServer(): boolean {
  return typeof window === 'undefined';
}

export function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function safeLocalStorage() {
  if (isServer()) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    };
  }
  return localStorage;
}

export function safeSessionStorage() {
  if (isServer()) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    };
  }
  return sessionStorage;
}

export function safeDocument() {
  if (isServer()) {
    return null;
  }
  return document;
}

export function safeWindow() {
  if (isServer()) {
    return null;
  }
  return window;
}
