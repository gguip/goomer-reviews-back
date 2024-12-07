const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-credentials.json');

// Firebase configuration
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
};

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
}

// Initialize Firestore
const db = admin.firestore();

// Get Auth instance
const getAuth = () => admin.auth();

// Authentication middleware with detailed error logging
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'auth/no-token',
        message: 'No authorization header provided'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        code: 'auth/invalid-token-format',
        message: 'Authorization header must start with "Bearer "'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token missing',
        code: 'auth/missing-token',
        message: 'No token provided after Bearer'
      });
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: 'Token expired',
          code: 'auth/id-token-expired',
          message: 'Your session has expired. Please refresh your token.',
          requiresRefresh: true
        });
      }
      
      return res.status(401).json({ 
        error: 'Invalid token',
        code: error.code || 'auth/invalid-token',
        message: error.message
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Authentication failed',
      code: 'auth/unknown-error',
      message: error.message
    });
  }
};

// Generate a custom token for testing
const generateCustomToken = async (uid) => {
  try {
    const token = await getAuth().createCustomToken(uid);
    console.log('Generated custom token for uid:', uid);
    return token;
  } catch (error) {
    console.error('Error generating custom token:', error);
    throw new Error(`Error generating custom token: ${error.message}`);
  }
};

// Exchange custom token for ID token
const exchangeCustomToken = async (customToken) => {
  try {
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error.message);
    }

    return data.idToken;
  } catch (error) {
    console.error('Error exchanging custom token:', error);
    throw new Error(`Error exchanging custom token: ${error.message}`);
  }
};

// Verify ID token
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    console.log('Token verified successfully for uid:', decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error(`Error verifying ID token: ${error.message}`);
  }
};

module.exports = {
  admin,
  firebaseConfig,
  authenticateUser,
  getAuth,
  generateCustomToken,
  exchangeCustomToken,
  verifyIdToken,
  db
};
