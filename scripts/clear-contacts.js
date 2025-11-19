/**
 * Script to clear all contacts from Firestore
 * 
 * Usage: node scripts/clear-contacts.js [--userId=USER_ID]
 * 
 * If --userId is provided, only deletes contacts for that user
 * If not provided, deletes ALL contacts (use with caution!)
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--userId='));
const userId = userIdArg ? userIdArg.split('=')[1] : null;
const confirmAll = args.includes('--confirm-all');

// Initialize Firebase Admin
try {
  // Try to find service-account.json in current directory or parent/server
  let serviceAccountPath = join(__dirname, 'service-account.json');
  if (!require('fs').existsSync(serviceAccountPath)) {
    serviceAccountPath = join(__dirname, '..', 'server', 'service-account.json');
  }
  if (!require('fs').existsSync(serviceAccountPath)) {
    serviceAccountPath = join(process.cwd(), 'server', 'service-account.json');
  }
  
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  const db = admin.firestore();
  
  async function clearContacts() {
    try {
      let query = db.collection('contacts');
      
      if (userId) {
        console.log(`\n⚠️  Will delete contacts for user: ${userId}`);
        query = query.where('userId', '==', userId);
      } else {
        if (!confirmAll) {
          console.log('\n⚠️  WARNING: This will delete ALL contacts for ALL users!');
          console.log('   To proceed, run with --confirm-all flag');
          console.log('   Or specify a user with --userId=USER_ID');
          process.exit(1);
        }
        console.log('\n⚠️  WARNING: Deleting ALL contacts for ALL users!');
      }
      
      // Get all contacts
      console.log('\n📊 Fetching contacts...');
      const snapshot = await query.get();
      const count = snapshot.size;
      
      if (count === 0) {
        console.log('✅ No contacts found. Nothing to delete.');
        process.exit(0);
      }
      
      console.log(`\n📋 Found ${count} contact(s) to delete`);
      
      // Show first few contacts as preview
      if (count > 0 && count <= 5) {
        console.log('\nContacts to be deleted:');
        snapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  ${index + 1}. ${data.firstName || ''} ${data.lastName || ''} (${data.email || 'no email'}) - ID: ${doc.id}`);
        });
      } else if (count > 5) {
        console.log('\nFirst 5 contacts to be deleted:');
        let shown = 0;
        snapshot.forEach((doc) => {
          if (shown < 5) {
            const data = doc.data();
            console.log(`  ${shown + 1}. ${data.firstName || ''} ${data.lastName || ''} (${data.email || 'no email'}) - ID: ${doc.id}`);
            shown++;
          }
        });
        console.log(`  ... and ${count - 5} more`);
      }
      
      // Delete in batches (Firestore limit is 500 per batch)
      console.log('\n🗑️  Deleting contacts...');
      const batchSize = 500;
      const batches = [];
      let currentBatch = db.batch();
      let operationCount = 0;
      
      snapshot.forEach((doc) => {
        currentBatch.delete(doc.ref);
        operationCount++;
        
        if (operationCount === batchSize) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationCount = 0;
        }
      });
      
      if (operationCount > 0) {
        batches.push(currentBatch);
      }
      
      // Execute all batches
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        console.log(`  ✓ Deleted batch ${i + 1}/${batches.length}`);
      }
      
      console.log(`\n✅ Successfully deleted ${count} contact(s)!`);
      
    } catch (error) {
      console.error('\n❌ Error deleting contacts:', error);
      process.exit(1);
    }
  }
  
  clearContacts().then(() => {
    process.exit(0);
  });
  
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  console.error('\nMake sure service-account.json exists in the server/ directory');
  process.exit(1);
}

