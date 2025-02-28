import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { log } from "./vite";
import * as dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create a function to initialize the pool
const createPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: 5,
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  });
};

let pool = createPool();
let isReconnecting = false;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

// Handle pool errors
pool.on("error", (err: Error) => {
  log(`Database pool error: ${err.message}`);

  if (
    err.message.includes("Connection terminated") ||
    err.message.includes("Connection ended unexpectedly") ||
    err.message.includes("terminating connection due to administrator command")
  ) {
    // Don't try to reconnect if we're already in the process
    if (!isReconnecting) {
      handleReconnection();
    }
    return;
  }

  // For other errors, log but don't crash
  log(`Database error occurred: ${err.message}`);
});

// Function to handle reconnection logic
async function handleReconnection() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    log(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts. Will continue with degraded functionality.`);
    reconnectAttempts = 0; // Reset for future attempts
    isReconnecting = false;
    return;
  }

  isReconnecting = true;
  reconnectAttempts++;
  
  log(`Attempting to reconnect to database (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
  
  try {
    // First, try to end the current pool gracefully
    await pool.end().catch(err => log(`Error ending pool: ${err.message}`));
    
    // Create a new pool
    pool = createPool();
    
    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    log(`Successfully reconnected to database after ${reconnectAttempts} attempts`);
    reconnectAttempts = 0;
    isReconnecting = false;
  } catch (error) {
    log(`Reconnection attempt ${reconnectAttempts} failed: ${error}`);
    
    // Wait before trying again - exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    log(`Will retry in ${delay}ms...`);
    
    setTimeout(() => {
      handleReconnection();
    }, delay);
  }
}

// Initial connection test
(async () => {
  try {
    const client = await pool.connect();
    log("Database connection test successful");
    client.release();
  } catch (err) {
    log(`Failed to connect to database: ${err}`);
    // Don't exit, try to reconnect instead
    handleReconnection();
  }
})();

export { pool };
