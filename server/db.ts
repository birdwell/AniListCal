import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import { log } from './vite';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configure Neon with WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool for session storage only
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 5, // Smaller pool size since we're only using it for sessions
});

// Add simple error handling for the pool
pool.on('error', (err: Error) => {
  log(`Database pool error: ${err.message}`);
  
  // Don't exit on transient errors
  if (err.message.includes('Connection terminated') || 
      err.message.includes('Connection ended unexpectedly')) {
    log('Attempting to recover from connection error...');
    return;
  }
  
  log('Fatal database error, exiting...');
  process.exit(-1);
});

// Initialize database with session table
(async () => {
  try {
    const client = await pool.connect();
    log('Database connection test successful');
    
    // Initialize session table only
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    
    log('Session table initialized');
    client.release();
  } catch (err) {
    log(`Failed to connect to database: ${err}`);
    process.exit(-1);
  }
})();

export { pool };