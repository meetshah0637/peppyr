/**
 * Backend API Server for Peppyr
 * Handles authentication, user management, and template/message CRUD operations
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from server directory
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// __filename and __dirname already defined above

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'https://peppyr.online',
  'https://www.peppyr.online',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) return callback(null, true);
    
    // Check exact match first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin matches any allowed origin (handles www vs non-www)
    const originMatches = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      // Exact match
      if (origin === allowed) return true;
      // Handle www vs non-www variations
      const originDomain = origin.replace(/^https?:\/\/(www\.)?/, '');
      const allowedDomain = allowed.replace(/^https?:\/\/(www\.)?/, '');
      return originDomain === allowedDomain;
    });
    
    if (originMatches) {
      return callback(null, true);
    }
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // In Vercel, be more permissive for same deployment
    if (process.env.VERCEL && origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Log blocked origin for debugging
    console.warn('CORS blocked origin:', origin, 'Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Firebase Admin SDK
let db = null;
try {
  let serviceAccount = null;

  // Try to load from environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } 
  // Fallback to service-account.json file
  else {
    try {
      const serviceAccountPath = join(__dirname, 'service-account.json');
      const serviceAccountFile = readFileSync(serviceAccountPath, 'utf-8');
      serviceAccount = JSON.parse(serviceAccountFile);
    } catch (fileError) {
      // File doesn't exist or can't be read - that's okay, we'll use mock mode
    }
  }

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
    db = getFirestore();
  } else {
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  console.warn('Server will run in mock mode without database.');
}

// Mock storage for development (when Firebase is not configured)
const mockStorage = {
  users: new Map(),
  templates: new Map(),
  parameters: new Map(),
  contacts: new Map(),
  activities: new Map(),
  contactLists: new Map(),
  projects: new Map()
};

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    if (!admin.apps.length) {
      // Mock mode - accept any token format for development
      // If token looks like a UID, use it; otherwise treat as mock token
      if (token.startsWith('user_') || token.length > 20) {
        req.user = { uid: token, email: 'dev@example.com' };
      } else {
        req.user = { uid: `mock_${Date.now()}`, email: 'dev@example.com' };
      }
      return next();
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!admin.apps.length) {
      // Mock mode
      const mockUid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockUser = {
        uid: mockUid,
        email,
        displayName: displayName || null,
        createdAt: new Date().toISOString()
      };
      mockStorage.users.set(mockUid, mockUser);
      return res.json({ 
        user: mockUser,
        token: mockUid // In real mode, this would be a Firebase ID token
      });
    }

    // Create user with Firebase Admin
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || null
    });

    // Create user document in Firestore
    if (db) {
      await db.collection('users').doc(userRecord.uid).set({
        email: userRecord.email,
        displayName: userRecord.displayName || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Get custom token (client will exchange this for ID token)
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      },
      customToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message || 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!admin.apps.length) {
      // Mock mode - find user by email
      const user = Array.from(mockStorage.users.values()).find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      return res.json({
        user,
        token: user.uid
      });
    }

    // Note: Firebase Admin doesn't have a direct login method
    // The client should use Firebase Auth SDK for login, then send the ID token
    // This endpoint is for getting user info after client-side login
    res.status(400).json({ 
      error: 'Use Firebase Auth SDK on client for login, then use /api/auth/verify endpoint' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

app.post('/api/auth/verify', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Ensure user document exists
    if (db) {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          email: req.user.email || null,
          displayName: req.user.name || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await userRef.update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email || null,
        displayName: req.user.name || null
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// Template/Message endpoints
app.get('/api/templates', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { projectId } = req.query;

    if (!db) {
      // Mock mode
      let templates = Array.from(mockStorage.templates.values())
        .filter(t => t.userId === uid);
      
      if (projectId) {
        templates = templates.filter(t => t.projectId === projectId);
      }
      
      templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(templates);
    }

    let query = db.collection('templates').where('userId', '==', uid);
    
    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }
    
    let snapshot;
    try {
      snapshot = await query.orderBy('createdAt', 'desc').get();
    } catch (error) {
      // If orderBy fails (e.g., missing index), try without it
      snapshot = await query.get();
    }

    const templates = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        ...data,
        projectId: data.projectId || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        lastUsed: data.lastUsed?.toDate?.()?.toISOString() || data.lastUsed
      });
    });

    // Sort in memory if orderBy wasn't used
    if (templates.length > 0 && !snapshot.query._delegate?._query?.orderBy) {
      templates.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    }

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

app.post('/api/templates', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const templateData = req.body;

    // Remove id if present (will be generated by Firestore)
    const { id, ...data } = templateData;

    const template = {
      ...data,
      userId: uid,
      projectId: data.projectId || null,
      createdAt: new Date().toISOString(),
      copyCount: data.copyCount || 0,
      lastUsed: data.lastUsed || null,
      isArchived: data.isArchived || false,
      isFavorite: data.isFavorite || false
    };

    if (!db) {
      // Mock mode
      const mockId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockTemplate = { ...template, id: mockId };
      mockStorage.templates.set(mockId, mockTemplate);
      return res.json(mockTemplate);
    }

    const docRef = await db.collection('templates').add({
      ...template,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const createdTemplate = {
      id: docRef.id,
      ...template
    };

    res.status(201).json(createdTemplate);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

app.put('/api/templates/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updates = req.body;

    // Remove userId from updates (should not be changed)
    const { userId, ...updateData } = updates;

    if (!db) {
      // Mock mode
      const template = mockStorage.templates.get(id);
      if (!template || template.userId !== uid) {
        return res.status(404).json({ error: 'Template not found' });
      }
      const updated = { ...template, ...updateData };
      mockStorage.templates.set(id, updated);
      return res.json(updated);
    }

    const templateRef = db.collection('templates').doc(id);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const templateData = templateDoc.data();
    if (templateData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: Not your template' });
    }

    // Convert ISO strings back to Timestamps if needed
    const firestoreUpdates = { ...updateData };
    if (updateData.createdAt && typeof updateData.createdAt === 'string') {
      firestoreUpdates.createdAt = admin.firestore.Timestamp.fromDate(new Date(updateData.createdAt));
    }
    if (updateData.lastUsed && typeof updateData.lastUsed === 'string') {
      firestoreUpdates.lastUsed = admin.firestore.Timestamp.fromDate(new Date(updateData.lastUsed));
    }

    await templateRef.update(firestoreUpdates);

    const updatedDoc = await templateRef.get();
    const updatedData = updatedDoc.data();

    res.json({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
      lastUsed: updatedData.lastUsed?.toDate?.()?.toISOString() || updatedData.lastUsed
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

app.delete('/api/templates/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    if (!db) {
      // Mock mode - soft delete
      const template = mockStorage.templates.get(id);
      if (!template || template.userId !== uid) {
        return res.status(404).json({ error: 'Template not found' });
      }
      template.isArchived = true;
      mockStorage.templates.set(id, template);
      return res.json({ success: true });
    }

    const templateRef = db.collection('templates').doc(id);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const templateData = templateDoc.data();
    if (templateData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: Not your template' });
    }

    // Soft delete by archiving
    await templateRef.update({ isArchived: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// User Parameters endpoints
app.get('/api/parameters', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      // Mock mode
      return res.json({});
    }

    const paramsRef = db.collection('userParameters').doc(uid);
    const paramsDoc = await paramsRef.get();

    if (paramsDoc.exists) {
      const data = paramsDoc.data();
      res.json(data.parameters || {});
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Get parameters error:', error);
    res.status(500).json({ error: 'Failed to fetch parameters' });
  }
});

app.put('/api/parameters', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { parameters } = req.body;

    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({ error: 'Invalid parameters object' });
    }

    if (!db) {
      // Mock mode
      if (!mockStorage.parameters) {
        mockStorage.parameters = new Map();
      }
      mockStorage.parameters.set(uid, parameters);
      return res.json(parameters);
    }

    const paramsRef = db.collection('userParameters').doc(uid);
    await paramsRef.set({
      userId: uid,
      parameters: parameters,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json(parameters);
  } catch (error) {
    console.error('Update parameters error:', error);
    res.status(500).json({ error: 'Failed to update parameters' });
  }
});

// Contact List/Batch Management endpoints
app.get('/api/contact-lists', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      // Mock mode
      const lists = Array.from(mockStorage.contactLists.values())
        .filter(l => l.userId === uid)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.json(lists);
    }

    let snapshot;
    try {
      snapshot = await db.collection('contactLists')
        .where('userId', '==', uid)
        .orderBy('updatedAt', 'desc')
        .get();
    } catch (error) {
      console.warn('OrderBy failed, trying without orderBy:', error.message);
      // Try without orderBy if index is missing
      snapshot = await db.collection('contactLists')
        .where('userId', '==', uid)
        .get();
    }

    const lists = [];
    
    // Fetch all lists first
    snapshot.forEach(doc => {
      const data = doc.data();
      lists.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      });
    });

    // Recalculate actual contact counts from database
    for (const list of lists) {
      try {
        const contactsSnapshot = await db.collection('contacts')
          .where('userId', '==', uid)
          .where('listId', '==', list.id)
          .get();
        
        const actualCount = contactsSnapshot.size;
        const storedCount = list.contactCount || 0;
        
        // Update the count in the response
        list.contactCount = actualCount;
        
        // If there's a mismatch, update the stored count in database
        if (actualCount !== storedCount) {
          const listRef = db.collection('contactLists').doc(list.id);
          await listRef.update({
            contactCount: actualCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (error) {
        console.error(`  ❌ Error calculating count for list ${list.id}:`, error.message);
        // Keep the stored count if calculation fails
      }
    }

    // Sort in memory if orderBy wasn't used
    if (lists.length > 0 && !snapshot.query._delegate?._query?.orderBy) {
      lists.sort((a, b) => {
        const aTime = new Date(a.updatedAt || 0).getTime();
        const bTime = new Date(b.updatedAt || 0).getTime();
        return bTime - aTime;
      });
    }

    res.json(lists);
  } catch (error) {
    console.error('Get contact lists error:', error);
    res.status(500).json({ error: 'Failed to fetch contact lists' });
  }
});

app.post('/api/contact-lists', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, description, source, csvFileName, projectId } = req.body;

    const listName = (name || 'Untitled List').trim();
    
    if (!listName) {
      return res.status(400).json({ error: 'List name cannot be empty' });
    }

    // Check for duplicate name
    if (!db) {
      // Mock mode - check for duplicates
      const existingList = Array.from(mockStorage.contactLists.values())
        .find(l => l.userId === uid && l.name.toLowerCase().trim() === listName.toLowerCase());
      if (existingList) {
        return res.status(400).json({ error: `A list with the name "${listName}" already exists. Please use a different name.` });
      }
    } else {
      // Check for duplicate name in Firestore
      const existingListsSnapshot = await db.collection('contactLists')
        .where('userId', '==', uid)
        .where('name', '==', listName)
        .limit(1)
        .get();
      
      if (!existingListsSnapshot.empty) {
        return res.status(400).json({ error: `A list with the name "${listName}" already exists. Please use a different name.` });
      }
    }

    const listData = {
      userId: uid,
      projectId: projectId || null,
      name: listName,
      description: description || null,
      source: source || 'manual',
      csvFileName: csvFileName || null,
      contactCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!db) {
      // Mock mode
      const mockId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockList = { ...listData, id: mockId };
      mockStorage.contactLists.set(mockId, mockList);
      return res.status(201).json(mockList);
    }

    const docRef = await db.collection('contactLists').add({
      ...listData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const createdList = {
      id: docRef.id,
      ...listData
    };

    res.status(201).json(createdList);
  } catch (error) {
    console.error('Create contact list error:', error);
    res.status(500).json({ error: 'Failed to create contact list' });
  }
});

app.put('/api/contact-lists/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updates = req.body;

    if (!db) {
      // Mock mode
      const list = mockStorage.contactLists.get(id);
      if (!list || list.userId !== uid) {
        return res.status(404).json({ error: 'Contact list not found' });
      }
      const updated = { ...list, ...updates, updatedAt: new Date().toISOString() };
      mockStorage.contactLists.set(id, updated);
      return res.json(updated);
    }

    const listRef = db.collection('contactLists').doc(id);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return res.status(404).json({ error: 'Contact list not found' });
    }

    const listData = listDoc.data();
    if (listData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: Not your list' });
    }

    await listRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedDoc = await listRef.get();
    const updatedData = updatedDoc.data();

    res.json({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt
    });
  } catch (error) {
    console.error('Update contact list error:', error);
    res.status(500).json({ error: 'Failed to update contact list' });
  }
});

app.delete('/api/contact-lists/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    if (!db) {
      // Mock mode
      const list = mockStorage.contactLists.get(id);
      if (!list || list.userId !== uid) {
        return res.status(404).json({ error: 'Contact list not found' });
      }
      // Delete associated contacts
      const contactsToDelete = Array.from(mockStorage.contacts.values())
        .filter(c => c.listId === id && c.userId === uid);
      contactsToDelete.forEach(contact => {
        mockStorage.contacts.delete(contact.id);
      });
      mockStorage.contactLists.delete(id);
      return res.json({ success: true });
    }

    const listRef = db.collection('contactLists').doc(id);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return res.status(404).json({ error: 'Contact list not found' });
    }

    const listData = listDoc.data();
    if (listData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: Not your list' });
    }

    // Delete all associated contacts
    const contactsSnapshot = await db.collection('contacts')
      .where('userId', '==', uid)
      .where('listId', '==', id)
      .get();
    
    const deletePromises = contactsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    

    // Delete the list itself
    await listRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact list error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to delete contact list' });
  }
});

// Contact/Lead Management endpoints
app.get('/api/contacts', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { status, search, listId } = req.query;

    if (!db) {
      // Mock mode
      let contacts = Array.from(mockStorage.contacts.values())
        .filter(c => c.userId === uid);
      
      if (listId) {
        contacts = contacts.filter(c => c.listId === listId);
      }
      
      if (status) {
        contacts = contacts.filter(c => c.status === status);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        contacts = contacts.filter(c => 
          `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchLower) ||
          (c.company && c.company.toLowerCase().includes(searchLower)) ||
          (c.email && c.email.toLowerCase().includes(searchLower))
        );
      }
      
      contacts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.json(contacts);
    }

    let query = db.collection('contacts').where('userId', '==', uid);
    
    
    if (listId) {
      query = query.where('listId', '==', listId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Note: Firestore requires an index for multiple where clauses with orderBy
    // If orderBy fails, try without it
    let snapshot;
    try {
      snapshot = await query.orderBy('updatedAt', 'desc').get();
    } catch (error) {
      console.warn('OrderBy failed, trying without orderBy:', error.message);
      // Try without orderBy if index is missing
      snapshot = await query.get();
    }
    
    let contacts = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const contact = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        lastContactedAt: data.lastContactedAt?.toDate?.()?.toISOString() || data.lastContactedAt
      };
      contacts.push(contact);
      if (listId) {
      }
    });
    
    
    // Sort in memory if orderBy wasn't used (fallback case)
    if (contacts.length > 0 && !snapshot.query._delegate?._query?.orderBy) {
      contacts.sort((a, b) => {
        const aTime = new Date(a.updatedAt || 0).getTime();
        const bTime = new Date(b.updatedAt || 0).getTime();
        return bTime - aTime;
      });
    }
    
    // Client-side search filtering if needed
    if (search) {
      const searchLower = search.toLowerCase();
      contacts = contacts.filter(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
        return fullName.includes(searchLower) ||
          (c.company && c.company.toLowerCase().includes(searchLower)) ||
          (c.email && c.email.toLowerCase().includes(searchLower));
      });
    }

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.post('/api/contacts', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const contactData = req.body;

    const { id, ...data } = contactData;

    const contact = {
      ...data,
      userId: uid,
      projectId: data.projectId || null,
      listId: data.listId || null,
      templateId: data.templateId || null,
      templateTitle: data.templateTitle || null,
      status: data.status || 'pending',
      tags: data.tags || [],
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastContactedAt: data.lastContactedAt || null
    };


    if (!db) {
      // Mock mode
      const mockId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockContact = { ...contact, id: mockId };
      mockStorage.contacts.set(mockId, mockContact);
      return res.status(201).json(mockContact);
    }

    const docRef = await db.collection('contacts').add({
      ...contact,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const createdContact = {
      id: docRef.id,
      ...contact
    };


    // Update contact count for the list if listId is provided
    if (contact.listId) {
      try {
        const listRef = db.collection('contactLists').doc(contact.listId);
        await listRef.update({
          contactCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error('Failed to update list contact count:', err);
        // Don't fail the request if count update fails
      }
    }

    res.status(201).json(createdContact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

app.put('/api/contacts/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updates = req.body;

    const { userId, ...updateData } = updates;
    updateData.updatedAt = new Date().toISOString();

    if (!db) {
      // Mock mode
      const contact = mockStorage.contacts.get(id);
      if (!contact || contact.userId !== uid) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      const updated = { ...contact, ...updateData };
      mockStorage.contacts.set(id, updated);
      return res.json(updated);
    }

    const contactRef = db.collection('contacts').doc(id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactData = contactDoc.data();
    if (contactData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: Not your contact' });
    }

    // Handle listId changes - update counts for old and new lists
    const oldListId = contactData.listId;
    const newListId = updateData.listId;
    
    if (oldListId !== newListId && db) {
      try {
        // Decrement old list count
        if (oldListId) {
          const oldListRef = db.collection('contactLists').doc(oldListId);
          await oldListRef.update({
            contactCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        // Increment new list count
        if (newListId) {
          const newListRef = db.collection('contactLists').doc(newListId);
          await newListRef.update({
            contactCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (err) {
        console.error('Failed to update list contact counts:', err);
        // Don't fail the request if count update fails
      }
    }

    const firestoreUpdates = { ...updateData };
    if (updateData.createdAt && typeof updateData.createdAt === 'string') {
      firestoreUpdates.createdAt = admin.firestore.Timestamp.fromDate(new Date(updateData.createdAt));
    }
    if (updateData.updatedAt && typeof updateData.updatedAt === 'string') {
      firestoreUpdates.updatedAt = admin.firestore.Timestamp.fromDate(new Date(updateData.updatedAt));
    }
    if (updateData.lastContactedAt && typeof updateData.lastContactedAt === 'string') {
      firestoreUpdates.lastContactedAt = admin.firestore.Timestamp.fromDate(new Date(updateData.lastContactedAt));
    }

    await contactRef.update({
      ...firestoreUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedDoc = await contactRef.get();
    const updatedData = updatedDoc.data();

    res.json({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt,
      lastContactedAt: updatedData.lastContactedAt?.toDate?.()?.toISOString() || updatedData.lastContactedAt
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

app.delete('/api/contacts/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    if (!db) {
      // Mock mode
      const contact = mockStorage.contacts.get(id);
      if (!contact || contact.userId !== uid) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      mockStorage.contacts.delete(id);
      return res.json({ success: true });
    }

    const contactRef = db.collection('contacts').doc(id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactData = contactDoc.data();
    if (contactData.userId !== uid) {
      return res.status(403).json({ error: 'Forbidden: Not your contact' });
    }

    // Decrement contact count for the list if listId exists
    if (contactData.listId) {
      try {
        const listRef = db.collection('contactLists').doc(contactData.listId);
        await listRef.update({
          contactCount: admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error('Failed to update list contact count:', err);
        // Don't fail the request if count update fails
      }
    }

    await contactRef.delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Activity Tracking endpoints
app.get('/api/contacts/:contactId/activities', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { contactId } = req.params;

    if (!db) {
      // Mock mode
      const activities = Array.from(mockStorage.activities.values())
        .filter(a => a.contactId === contactId && a.userId === uid)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(activities);
    }

    const snapshot = await db.collection('activities')
      .where('contactId', '==', contactId)
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const activities = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      });
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.post('/api/activities', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const activityData = req.body;

    const { id, ...data } = activityData;

    const activity = {
      ...data,
      userId: uid,
      createdAt: new Date().toISOString(),
      metadata: data.metadata || {}
    };

    if (!db) {
      // Mock mode
      const mockId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockActivity = { ...activity, id: mockId };
      mockStorage.activities.set(mockId, mockActivity);
      return res.status(201).json(mockActivity);
    }

    const docRef = await db.collection('activities').add({
      ...activity,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const createdActivity = {
      id: docRef.id,
      ...activity
    };

    res.status(201).json(createdActivity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Analytics endpoints
app.get('/api/analytics/metrics', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { projectId } = req.query;

    if (!db) {
      // Mock mode - return sample metrics
      const contacts = Array.from(mockStorage.contacts.values())
        .filter(c => c.userId === uid);
      
      const totalContacts = contacts.length;
      const contacted = contacts.filter(c => ['contacted', 'replied', 'meeting_scheduled', 'meeting_completed'].includes(c.status)).length;
      const replied = contacts.filter(c => c.status === 'replied' || c.status === 'meeting_scheduled' || c.status === 'meeting_completed').length;
      const meetingsScheduled = contacts.filter(c => c.status === 'meeting_scheduled' || c.status === 'meeting_completed').length;
      const meetingsCompleted = contacts.filter(c => c.status === 'meeting_completed').length;
      
      const responseRate = contacted > 0 ? (replied / contacted) * 100 : 0;
      const meetingConversionRate = contacted > 0 ? (meetingsScheduled / contacted) * 100 : 0;
      
      return res.json({
        totalContacts,
        contacted,
        replied,
        meetingsScheduled,
        meetingsCompleted,
        responseRate: Math.round(responseRate * 100) / 100,
        meetingConversionRate: Math.round(meetingConversionRate * 100) / 100
      });
    }

    // Get all contacts for user (filtered by project if specified)
    let contactsQuery = db.collection('contacts').where('userId', '==', uid);
    if (projectId) {
      contactsQuery = contactsQuery.where('projectId', '==', projectId);
    }
    const contactsSnapshot = await contactsQuery.get();

    const contacts = [];
    contactsSnapshot.forEach(doc => {
      contacts.push(doc.data());
    });

    const totalContacts = contacts.length;
    const contacted = contacts.filter(c => ['contacted', 'replied', 'meeting_scheduled', 'meeting_completed'].includes(c.status)).length;
    const replied = contacts.filter(c => c.status === 'replied' || c.status === 'meeting_scheduled' || c.status === 'meeting_completed').length;
    const meetingsScheduled = contacts.filter(c => c.status === 'meeting_scheduled' || c.status === 'meeting_completed').length;
    const meetingsCompleted = contacts.filter(c => c.status === 'meeting_completed').length;

    const responseRate = contacted > 0 ? (replied / contacted) * 100 : 0;
    const meetingConversionRate = contacted > 0 ? (meetingsScheduled / contacted) * 100 : 0;

    res.json({
      totalContacts,
      contacted,
      replied,
      meetingsScheduled,
      meetingsCompleted,
      responseRate: Math.round(responseRate * 100) / 100,
      meetingConversionRate: Math.round(meetingConversionRate * 100) / 100
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/analytics/template-performance', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { projectId } = req.query;

    if (!db) {
      // Mock mode - return sample data
      return res.json([]);
    }

    // Get all activities for user (filtered by project if specified)
    let activitiesSnapshot;
    if (projectId) {
      // Get template IDs for the project first
      const templatesSnapshot = await db.collection('templates')
        .where('userId', '==', uid)
        .where('projectId', '==', projectId)
        .get();
      const templateIds = templatesSnapshot.docs.map(doc => doc.id);
      
      if (templateIds.length === 0) {
        // No templates in project, return empty
        return res.json([]);
      }
      
      // Firestore 'in' query supports up to 10 items, so we'll filter client-side if more
      if (templateIds.length <= 10) {
        activitiesSnapshot = await db.collection('activities')
          .where('userId', '==', uid)
          .where('type', '==', 'message_sent')
          .where('templateId', 'in', templateIds)
          .get();
      } else {
        // For more than 10, filter client-side
        const allActivities = await db.collection('activities')
          .where('userId', '==', uid)
          .where('type', '==', 'message_sent')
          .get();
        const filteredDocs = allActivities.docs.filter(doc => {
          const data = doc.data();
          return templateIds.includes(data.templateId);
        });
        // Create a mock snapshot structure
        activitiesSnapshot = {
          docs: filteredDocs.map(doc => ({
            id: doc.id,
            data: () => doc.data()
          })),
          size: filteredDocs.length,
          forEach: function(callback) {
            this.docs.forEach(doc => callback(doc));
          }
        };
      }
    } else {
      activitiesSnapshot = await db.collection('activities')
        .where('userId', '==', uid)
        .where('type', '==', 'message_sent')
        .get();
    }

    const templateStats = {};
    
    activitiesSnapshot.forEach(doc => {
      const activity = doc.data();
      if (activity.templateId) {
        if (!templateStats[activity.templateId]) {
          templateStats[activity.templateId] = {
            templateId: activity.templateId,
            templateTitle: activity.templateTitle || 'Unknown',
            timesUsed: 0,
            responsesReceived: 0,
            meetingsScheduled: 0
          };
        }
        templateStats[activity.templateId].timesUsed++;
      }
    });

    // Get response activities (filtered by project if specified)
    let responsesSnapshot;
    if (projectId) {
      const templatesSnapshot = await db.collection('templates')
        .where('userId', '==', uid)
        .where('projectId', '==', projectId)
        .get();
      const templateIds = templatesSnapshot.docs.map(doc => doc.id);
      
      if (templateIds.length > 0) {
        if (templateIds.length <= 10) {
          responsesSnapshot = await db.collection('activities')
            .where('userId', '==', uid)
            .where('type', '==', 'message_received')
            .where('templateId', 'in', templateIds)
            .get();
        } else {
          const allResponses = await db.collection('activities')
            .where('userId', '==', uid)
            .where('type', '==', 'message_received')
            .get();
          const filteredDocs = allResponses.docs.filter(doc => {
            const data = doc.data();
            return templateIds.includes(data.templateId);
          });
          responsesSnapshot = {
            docs: filteredDocs.map(doc => ({ id: doc.id, data: () => doc.data() })),
            forEach: function(callback) { this.docs.forEach(doc => callback(doc)); }
          };
        }
      } else {
        responsesSnapshot = { docs: [], forEach: () => {} };
      }
    } else {
      responsesSnapshot = await db.collection('activities')
        .where('userId', '==', uid)
        .where('type', '==', 'message_received')
        .get();
    }

    responsesSnapshot.forEach(doc => {
      const activity = doc.data();
      if (activity.templateId && templateStats[activity.templateId]) {
        templateStats[activity.templateId].responsesReceived++;
      }
    });

    // Get meeting scheduled activities (filtered by project if specified)
    let meetingsSnapshot;
    if (projectId) {
      const templatesSnapshot = await db.collection('templates')
        .where('userId', '==', uid)
        .where('projectId', '==', projectId)
        .get();
      const templateIds = templatesSnapshot.docs.map(doc => doc.id);
      
      if (templateIds.length > 0) {
        if (templateIds.length <= 10) {
          meetingsSnapshot = await db.collection('activities')
            .where('userId', '==', uid)
            .where('type', '==', 'meeting_scheduled')
            .where('templateId', 'in', templateIds)
            .get();
        } else {
          const allMeetings = await db.collection('activities')
            .where('userId', '==', uid)
            .where('type', '==', 'meeting_scheduled')
            .get();
          const filteredDocs = allMeetings.docs.filter(doc => {
            const data = doc.data();
            return templateIds.includes(data.templateId);
          });
          meetingsSnapshot = {
            docs: filteredDocs.map(doc => ({ id: doc.id, data: () => doc.data() })),
            forEach: function(callback) { this.docs.forEach(doc => callback(doc)); }
          };
        }
      } else {
        meetingsSnapshot = { docs: [], forEach: () => {} };
      }
    } else {
      meetingsSnapshot = await db.collection('activities')
        .where('userId', '==', uid)
        .where('type', '==', 'meeting_scheduled')
        .get();
    }

    meetingsSnapshot.forEach(doc => {
      const activity = doc.data();
      if (activity.templateId && templateStats[activity.templateId]) {
        templateStats[activity.templateId].meetingsScheduled++;
      }
    });

    // Calculate rates
    const performance = Object.values(templateStats).map(stat => ({
      ...stat,
      responseRate: stat.timesUsed > 0 ? Math.round((stat.responsesReceived / stat.timesUsed) * 10000) / 100 : 0,
      meetingConversionRate: stat.timesUsed > 0 ? Math.round((stat.meetingsScheduled / stat.timesUsed) * 10000) / 100 : 0
    }));

    res.json(performance);
  } catch (error) {
    console.error('Get template performance error:', error);
    res.status(500).json({ error: 'Failed to fetch template performance' });
  }
});

// ============================================
// Projects/Client Management Endpoints
// ============================================

// GET /api/projects - Get all projects for user
app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      // Mock mode
      const projects = Array.from(mockStorage.projects?.values() || [])
        .filter(p => p.userId === uid)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.json(projects);
    }

    let snapshot;
    try {
      // Try with orderBy first (requires index)
      snapshot = await db.collection('projects')
        .where('userId', '==', uid)
        .orderBy('updatedAt', 'desc')
        .get();
    } catch (error) {
      // If orderBy fails (missing index), try without it
      console.warn('GET /api/projects - orderBy failed, trying without orderBy:', error.message);
      snapshot = await db.collection('projects')
        .where('userId', '==', uid)
        .get();
    }

    const projects = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const project = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
      projects.push(project);
    });

    // Sort in memory if orderBy wasn't used
    if (projects.length > 0) {
      projects.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime; // Descending order
      });
    }


    // Recalculate counts for each project
    for (const project of projects) {
      try {
        // Count templates
        const templatesSnapshot = await db.collection('templates')
          .where('userId', '==', uid)
          .where('projectId', '==', project.id)
          .get();
        
        // Count contacts
        const contactsSnapshot = await db.collection('contacts')
          .where('userId', '==', uid)
          .where('projectId', '==', project.id)
          .get();
        
        const templateCount = templatesSnapshot.size;
        const contactCount = contactsSnapshot.size;
        
        project.templateCount = templateCount;
        project.contactCount = contactCount;
        
        // Update if counts changed (only if they're different from stored values)
        const storedTemplateCount = project.templateCount || 0;
        const storedContactCount = project.contactCount || 0;
        if (templateCount !== storedTemplateCount || contactCount !== storedContactCount) {
          const projectRef = db.collection('projects').doc(project.id);
          await projectRef.update({
            templateCount,
            contactCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (error) {
        console.error(`Error calculating counts for project ${project.id}:`, error);
        // Set defaults if counting fails
        project.templateCount = project.templateCount || 0;
        project.contactCount = project.contactCount || 0;
      }
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Create new project
app.post('/api/projects', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const projectData = req.body;

    const { id, ...data } = projectData;

    const project = {
      ...data,
      userId: uid,
      templateCount: 0,
      contactCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!db) {
      // Mock mode
      const mockId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockProject = { ...project, id: mockId };
      if (!mockStorage.projects) {
        mockStorage.projects = new Map();
      }
      mockStorage.projects.set(mockId, mockProject);
      return res.status(201).json(mockProject);
    }

    const docRef = await db.collection('projects').add({
      ...project,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const createdProject = {
      id: docRef.id,
      ...project
    };

    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
app.put('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const updates = req.body;

    if (!db) {
      // Mock mode
      const project = mockStorage.projects?.get(id);
      if (!project || project.userId !== uid) {
        return res.status(404).json({ error: 'Project not found' });
      }
      const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
      mockStorage.projects.set(id, updated);
      return res.json(updated);
    }

    const docRef = db.collection('projects').doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== uid) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await docRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updated = await docRef.get();
    const data = updated.data();
    res.json({
      id: updated.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    if (!db) {
      // Mock mode
      const project = mockStorage.projects?.get(id);
      if (!project || project.userId !== uid) {
        return res.status(404).json({ error: 'Project not found' });
      }
      mockStorage.projects.delete(id);
      return res.json({ success: true });
    }

    const docRef = db.collection('projects').doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== uid) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Export app for serverless environments (Vercel)
export default app;

// Start server only if not in serverless environment
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`🚀 Peppyr API server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    if (!db) {
    }
  });
}

