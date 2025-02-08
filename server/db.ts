import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { log } from './vite';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool with proper error handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  maxRetries: 3,
});

// Add event handlers for the pool
pool.on('error', (err) => {
  log('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  log('New client connected to the pool');
});

export { pool };
export const db = drizzle({ client: pool, schema });