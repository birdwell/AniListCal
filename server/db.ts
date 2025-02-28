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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 5,
});

pool.on("error", (err: Error) => {
  log(`Database pool error: ${err.message}`);

  if (
    err.message.includes("Connection terminated") ||
    err.message.includes("Connection ended unexpectedly")
  ) {
    log("Attempting to recover from connection error...");
    return;
  }

  log("Fatal database error, exiting...");
  process.exit(-1);
});

(async () => {
  try {
    const client = await pool.connect();
    log("Database connection test successful");
    client.release();
  } catch (err) {
    log(`Failed to connect to database: ${err}`);
    process.exit(-1);
  }
})();

export { pool };
