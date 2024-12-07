const admin = require('firebase-admin');
const { initializeFirebase } = require('../config/firebase');

async function testFirebaseAuth() {
  try {
    // Initialize Firebase
    const db = initializeFirebase();
    if (!db) {
      throw new Error('Failed to initialize Firebase');
    }

    // Create a test user
    const userEmail = 'test@example.com';
    const userPassword = 'testPassword123';

    try {
      // Try to create a test user
      const userRecord = await admin.auth().createUser({
        email: userEmail,
        password: userPassword,
        emailVerified: false,
        disabled: false
      });

      console.log('✅ Successfully created test user:');
      console.log('User ID:', userRecord.uid);
      console.log('Email:', userRecord.email);

      // Try to get user by email
      const userByEmail = await admin.auth().getUserByEmail(userEmail);
      console.log('✅ Successfully retrieved user by email');

      // Try to generate a custom token
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      console.log('✅ Successfully generated custom token');

      // Clean up - delete the test user
      await admin.auth().deleteUser(userRecord.uid);
      console.log('✅ Successfully deleted test user');

      return true;
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('Test user already exists, cleaning up...');
        const user = await admin.auth().getUserByEmail(userEmail);
        await admin.auth().deleteUser(user.uid);
        console.log('Cleaned up existing test user');
        // Try again
        return testFirebaseAuth();
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Firebase Authentication test failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    return false;
  }
}

// Run the test
testFirebaseAuth()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
