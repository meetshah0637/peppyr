/**
 * Helper script to verify Firebase configuration and guide Service Account setup
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Checking Firebase Configuration...\n');

// Check frontend .env
const frontendEnvPath = join(rootDir, '.env');
if (existsSync(frontendEnvPath)) {
  console.log('✅ Frontend .env file found');
  try {
    const envContent = readFileSync(frontendEnvPath, 'utf-8');
    const hasApiKey = envContent.includes('VITE_FIREBASE_API_KEY');
    const hasProjectId = envContent.includes('VITE_FIREBASE_PROJECT_ID');
    
    if (hasApiKey && hasProjectId) {
      console.log('✅ Frontend Firebase config appears to be set\n');
    } else {
      console.log('⚠️  Frontend Firebase config may be incomplete\n');
    }
  } catch (error) {
    console.log('⚠️  Could not read frontend .env file\n');
  }
} else {
  console.log('❌ Frontend .env file not found\n');
}

// Check backend .env
const backendEnvPath = join(rootDir, 'server', '.env');
if (existsSync(backendEnvPath)) {
  console.log('✅ Backend .env file found');
  try {
    const envContent = readFileSync(backendEnvPath, 'utf-8');
    const hasServiceAccount = envContent.includes('FIREBASE_SERVICE_ACCOUNT');
    
    if (hasServiceAccount && envContent.includes('"type":"service_account"')) {
      console.log('✅ Backend Firebase Service Account appears to be configured\n');
    } else {
      console.log('⚠️  Backend Firebase Service Account not configured\n');
      console.log('📝 To configure:');
      console.log('   1. Go to https://console.firebase.google.com/');
      console.log('   2. Select your project');
      console.log('   3. Go to Project Settings > Service Accounts');
      console.log('   4. Click "Generate new private key"');
      console.log('   5. Copy the JSON content');
      console.log('   6. Add to server/.env as: FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}\n');
    }
  } catch (error) {
    console.log('⚠️  Could not read backend .env file\n');
  }
} else {
  console.log('❌ Backend .env file not found');
  console.log('📝 Creating server/.env.example template...\n');
}

console.log('💡 Tip: The backend needs a Service Account (different from frontend config)');
console.log('   This allows the backend to verify Firebase ID tokens securely.\n');

