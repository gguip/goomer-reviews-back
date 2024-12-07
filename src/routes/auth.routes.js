const express = require('express');
const router = express.Router();
const { getAuth, generateCustomToken, verifyIdToken } = require('../config/firebase');
const fetch = require('node-fetch');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 * 
 * components:
 *   schemas:
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *         user:
 *           type: object
 *           properties:
 *             uid:
 *               type: string
 *               description: User ID
 *             email:
 *               type: string
 *               description: User email
 *             name:
 *               type: string
 *               description: User display name
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         details:
 *           type: string
 *           description: Detailed error information
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: User password (min 6 characters)
 *               name:
 *                 type: string
 *                 description: User's display name
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const userRecord = await getAuth().createUser({
            email,
            password,
            displayName: name,
        });

        // Generate a custom token for immediate sign-in
        const customToken = await generateCustomToken(userRecord.uid);

        res.status(201).json({
            message: 'User created successfully',
            token: customToken,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            error: 'Error creating user',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user and get ID token
 *     description: Authenticate a user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // First, sign in with email and password to get the refresh token
        const signInResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                }),
            }
        );

        const signInData = await signInResponse.json();
        
        if (!signInResponse.ok) {
            throw new Error(signInData.error.message);
        }

        // Get user details
        const userRecord = await getAuth().getUserByEmail(email);

        res.json({
            message: 'Authentication successful',
            idToken: signInData.idToken,
            refreshToken: signInData.refreshToken, // Firebase refresh token
            expiresIn: signInData.expiresIn,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            error: 'Authentication failed',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile
 *     description: Get the current user's profile information
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       description: User ID
 *                     email:
 *                       type: string
 *                       description: User email
 *                     name:
 *                       type: string
 *                       description: User display name
 *       401:
 *         description: No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/user', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decodedToken = await verifyIdToken(token);
        const userRecord = await getAuth().getUser(decodedToken.uid);

        res.json({
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            error: 'Error getting user profile',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/token:
 *   get:
 *     summary: Get a custom token for testing
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Custom token generated successfully
 *       500:
 *         description: Error generating token
 */
router.get('/token', async (req, res) => {
    try {
        // Create a custom token for testing
        const customToken = await generateCustomToken('test-user');
        res.json({ customToken });
    } catch (error) {
        console.error('Error creating custom token:', error);
        res.status(500).json({ error: 'Error creating token' });
    }
});

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify an ID token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token verified successfully
 *       400:
 *         description: Invalid token
 *       500:
 *         description: Error verifying token
 */
router.post('/verify', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'ID token is required' });
        }

        const decodedToken = await verifyIdToken(idToken);
        res.json({ 
            uid: decodedToken.uid,
            email: decodedToken.email,
            verified: true
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ error: 'Error verifying token' });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh authentication token
 *     description: Exchange a refresh token for a new ID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token obtained during login
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        // Exchange refresh token for a new ID token using Firebase Auth REST API
        const response = await fetch(
            `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }).toString()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Token refresh failed:', data.error);
            throw new Error(data.error.message || 'Failed to refresh token');
        }

        // Return the new tokens
        res.json({
            idToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            error: 'Failed to refresh token',
            details: error.message,
            code: 'auth/refresh-failed'
        });
    }
});

/**
 * @swagger
 * /api/auth/validate:
 *   get:
 *     tags: [Authentication]
 *     summary: Validate authentication token
 *     description: Validates the current authentication token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid or expired token
 */
router.get('/validate', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await verifyIdToken(token);
        
        if (decodedToken) {
            return res.status(200).json({ 
                valid: true,
                user: {
                    email: decodedToken.email,
                    uid: decodedToken.uid
                }
            });
        }
        
        res.status(401).json({ error: 'Invalid token' });
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
