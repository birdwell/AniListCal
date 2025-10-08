import log from 'loglevel';

// Configure log level based on environment
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Set log level based on environment
if (isDevelopment) {
  log.setLevel('debug'); // Show all logs in development
} else if (isProduction) {
  log.setLevel('warn'); // Only show warnings and errors in production
} else {
  log.setLevel('info'); // Default fallback
}

// Create a logger interface that matches console methods for easy migration
export const logger = {
  trace: log.trace.bind(log),
  debug: log.debug.bind(log),
  info: log.info.bind(log),
  log: log.info.bind(log), // Map console.log to info level
  warn: log.warn.bind(log),
  error: log.error.bind(log),
};

// Export the raw loglevel instance if needed for advanced usage
export { log };

// Log the current configuration on startup (only in development)
if (isDevelopment) {
  logger.debug(`[Logger] Initialized with level: ${log.getLevel()} (${isDevelopment ? 'development' : 'production'} mode)`);
}
