/**
 * Vercel Serverless Function wrapper for Express backend
 * This file exports the Express app for Vercel's serverless environment
 */

import app from '../server/index.js';

// Export Express app for Vercel serverless functions
// Vercel's @vercel/node adapter handles Express apps automatically
export default app;

