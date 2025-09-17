import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to check if we're in test mode
export function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.location.hostname === 'localhost' && 
    (process.env.NODE_ENV === 'test' || 
     document.querySelector('meta[name="test-mode"]')?.getAttribute('content') === 'true' ||
     window.location.search.includes('test-mode=true'));
}

// Helper function to get headers with test mode if needed
export function getFetchHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (isTestMode()) {
    headers['X-Test-Mode'] = 'true';
  }
  
  return headers;
}
