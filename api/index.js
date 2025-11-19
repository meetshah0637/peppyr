/**
 * Vercel Serverless Function wrapper for Express backend
 * This file exports the Express app for Vercel's serverless environment
 */

import app from '../server/index.js';

// Export as Vercel serverless function
export default app;

