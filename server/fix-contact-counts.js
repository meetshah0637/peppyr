/**
 * Script to fix contactCount for all contact lists
 * Recalculates the actual count from contacts collection
 * 
 * Usage: node fix-contact-counts.js
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
try {
  const serviceAccountPath = join(__dirname, 'service-account.json');
  
  if (!existsSync(serviceAccountPath)) {
    console.error('❌ Error: service-account.json not found in server directory');
    process.exit(1);
  }
  
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  const db = admin.firestore();
  
  async function fixContactCounts() {
    try {
      console.log('\n📊 Fetching all contact lists...');
      const listsSnapshot = await db.collection('contactLists').get();
      
      if (listsSnapshot.empty) {
        console.log('✅ No contact lists found.');
        process.exit(0);
      }
      
      console.log(`Found ${listsSnapshot.size} list(s) to check\n`);
      
      let fixed = 0;
      let unchanged = 0;
      
      for (const listDoc of listsSnapshot.docs) {
        const listData = listDoc.data();
        const listId = listDoc.id;
        const storedCount = listData.contactCount || 0;
        
        // Count actual contacts for this list
        const contactsSnapshot = await db.collection('contacts')
          .where('listId', '==', listId)
          .get();
        
        const actualCount = contactsSnapshot.size;
        
        if (storedCount !== actualCount) {
          console.log(`📝 List: "${listData.name}" (ID: ${listId})`);
          console.log(`   Stored count: ${storedCount}`);
          console.log(`   Actual count: ${actualCount}`);
          console.log(`   Updating to ${actualCount}...`);
          
          await listDoc.ref.update({
            contactCount: actualCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ✅ Fixed!\n`);
          fixed++;
        } else {
          console.log(`✓ List: "${listData.name}" - Count correct (${actualCount})\n`);
          unchanged++;
        }
      }
      
      console.log(`\n✅ Summary:`);
      console.log(`   Fixed: ${fixed} list(s)`);
      console.log(`   Unchanged: ${unchanged} list(s)`);
      
    } catch (error) {
      console.error('\n❌ Error fixing contact counts:', error);
      process.exit(1);
    }
  }
  
  fixContactCounts().then(() => {
    process.exit(0);
  });
  
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

