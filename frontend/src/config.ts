/**
 * Centralized API and environment configuration.
 * When deployed on Vercel, set VITE_API_URL to your Render backend URL
 * (e.g., https://cognivault-api.onrender.com).
 */
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
