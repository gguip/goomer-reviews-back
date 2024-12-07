const { admin } = require('./firebase');

// Collection names
const collections = {
  REVIEWS: 'reviews',
  USERS: 'users'
};

// Initialize Firestore collections and indexes
const initializeDatabase = async () => {
  try {
    const db = admin.firestore();
    
    // Verify collections exist by attempting to get their metadata
    const collectionsToVerify = [
      collections.REVIEWS,
      collections.USERS
    ];

    for (const collectionName of collectionsToVerify) {
      const collection = db.collection(collectionName);
      await collection.limit(1).get();
      console.log(`Collection ${collectionName} verified`);
    }

    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Database helper functions
const getDb = () => {
  return admin.firestore();
};

const db = {
  // Review helpers
  reviews: {
    async create(data) {
      const reviewRef = getDb().collection(collections.REVIEWS).doc();
      await reviewRef.set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return reviewRef.id;
    },

    async getAll() {
      const snapshot = await getDb()
        .collection(collections.REVIEWS)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getById(id) {
      const doc = await getDb().collection(collections.REVIEWS).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async getByUser(userId) {
      const snapshot = await getDb()
        .collection(collections.REVIEWS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async update(id, data) {
      const reviewRef = getDb().collection(collections.REVIEWS).doc(id);
      await reviewRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return id;
    },

    async delete(id) {
      await getDb().collection(collections.REVIEWS).doc(id).delete();
      return id;
    }
  },

  // Transaction helper
  async runTransaction(callback) {
    return getDb().runTransaction(callback);
  }
};

module.exports = {
  collections,
  initializeDatabase,
  db
};
