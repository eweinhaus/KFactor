/**
 * Vitest setup file
 * Runs before all tests
 */

// Load environment variables for tests
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local for tests (if it exists) - suppress verbose output
const envPath = path.resolve(process.cwd(), '.env.local');

// Suppress dotenv verbose output
// Note: dotenv uses its own logger, so we suppress via environment variable
if (!process.env.DOTENV_CONFIG_QUIET) {
  process.env.DOTENV_CONFIG_QUIET = 'true';
}

dotenv.config({ 
  path: envPath,
  debug: false,  // Suppress verbose dotenv output
});

// Set test environment variables
process.env.NODE_ENV = 'test';

