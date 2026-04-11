import { neon } from '@neondatabase/serverless';

export const sql = neon(import.meta.env.VITE_NEON_DB_URL);

export function escapeIlike(value) {
  return String(value || '').replace(/[%*,()]/g, '').trim();
}