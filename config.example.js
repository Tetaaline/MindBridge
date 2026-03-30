/**
 * MindBridge — Configuration Template
 * ─────────────────────────────────────────────────────────────────
 * This is the TEMPLATE file. It is safe to commit to GitHub.
 *
 * To run the app locally:
 *   1. Copy this file → config.js
 *   2. Fill in your real API keys in config.js
 *   3. config.js is gitignored and will NOT be pushed to GitHub
 *
 * API keys are submitted separately in the assignment comment section.
 * ─────────────────────────────────────────────────────────────────
 */

const CONFIG = {

  /**
   * Stream Chat — Real-time encrypted messaging
   * Get a free key at: https://getstream.io
   * Steps: Create App → Development mode → Chat → Authentication
   *        → enable "Disable Auth Checks" → copy API Key
   */
  STREAM_API_KEY: 'YOUR_STREAM_API_KEY',

  /**
   * The Guardian Open Platform — Mental health news articles
   * Get a free key at: https://open-platform.theguardian.com/access/
   * Steps: Register as Developer → confirm email → copy API Key
   * Free tier: 5,000 requests/day, works on any domain
   */
  GUARDIAN_API_KEY: 'YOUR_GUARDIAN_API_KEY',

};
