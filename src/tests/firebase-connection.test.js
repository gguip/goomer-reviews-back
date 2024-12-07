const admin = require('firebase-admin');
const { initializeFirebase } = require('../config/firebase');

async function testFirebaseConnection() {
  try {
    // Initialize Firebase first
    const db = initializeFirebase();
    if (!db) {
      throw new Error('Failed to initialize Firebase');
    }

    // Try to get a reference to a test collection
    const testRef = db.collection('connection_test');
    
    // Try to write a document
    const testDoc = await testRef.add({
      test: 'Connection successful',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Successfully connected to Firebase!');
    console.log('Test document written with ID:', testDoc.id);
    
    // Clean up by deleting the test document
    await testDoc.delete();
    console.log('Test document cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    return false;
  }
}

// Run the test
testFirebaseConnection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
