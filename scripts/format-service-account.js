/**
 * Helper script to format Firebase Service Account JSON for .env file
 * Usage: node scripts/format-service-account.js <path-to-service-account.json>
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const serviceAccountPath = process.argv[2];
const backendEnvPath = join(rootDir, 'server', '.env');

if (!serviceAccountPath) {
  console.log('📝 Firebase Service Account Formatter\n');
  console.log('Usage: node scripts/format-service-account.js <path-to-service-account.json>\n');
  console.log('Steps to get Service Account:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Select your project');
  console.log('3. Go to Project Settings > Service Accounts');
  console.log('4. Click "Generate new private key"');
  console.log('5. Save the JSON file');
  console.log('6. Run this script with the path to that JSON file\n');
  console.log('Example: node scripts/format-service-account.js ~/Downloads/my-project-key.json\n');
  process.exit(0);
}

if (!existsSync(serviceAccountPath)) {
  console.error(`❌ File not found: ${serviceAccountPath}`);
  process.exit(1);
}

try {
  const serviceAccountJson = readFileSync(serviceAccountPath, 'utf-8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Validate it's a service account
  if (serviceAccount.type !== 'service_account') {
    console.error('❌ This does not appear to be a Firebase Service Account JSON file');
    process.exit(1);
  }
  
  // Format as single-line string for .env
  const formatted = JSON.stringify(serviceAccount);
  
  // Read existing .env or create new
  let envContent = '';
  if (existsSync(backendEnvPath)) {
    envContent = readFileSync(backendEnvPath, 'utf-8');
  } else {
    envContent = `PORT=3001
FRONTEND_URL=http://localhost:5173
`;
  }
  
  // Update or add FIREBASE_SERVICE_ACCOUNT
  if (envContent.includes('FIREBASE_SERVICE_ACCOUNT=')) {
    envContent = envContent.replace(
      /FIREBASE_SERVICE_ACCOUNT=.*/,
      `FIREBASE_SERVICE_ACCOUNT=${formatted}`
    );
  } else {
    envContent += `FIREBASE_SERVICE_ACCOUNT=${formatted}\n`;
  }
  
  writeFileSync(backendEnvPath, envContent);
  
  console.log('✅ Successfully configured Firebase Service Account in server/.env');
  console.log('🔄 Please restart the backend server for changes to take effect\n');
  
} catch (error) {
  console.error('❌ Error processing service account:', error.message);
  process.exit(1);
}

