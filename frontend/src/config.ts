// Centralized API configuration for local development and cloud production deployment
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';
export const LOGO_BASE_URL: string = `${API_BASE_URL}/logos`;
