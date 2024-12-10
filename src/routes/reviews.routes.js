const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../config/firebase');
const multer = require('multer');
const { uploadFile, deleteFile } = require('../config/cloudinary');
const reviewModel = require('../models/review.model');
const fetch = require('node-fetch');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The review ID
 *         userId:
 *           type: string
 *           description: The user ID who created the review
 *         restaurantName:
 *           type: string
 *           description: Name of the restaurant
 *         address:
 *           type: string
 *           description: Restaurant address
 *         city:
 *           type: string
 *           description: Restaurant city
 *         ratings:
 *           type: object
 *           properties:
 *             food:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *             service:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *             environment:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *         price:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PaginatedReviewsResponse:
 *       type: object
 *       properties:
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of reviews
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *             currentPage:
 *               type: integer
 *               description: Current page number
 *             limit:
 *               type: integer
 *               description: Number of items per page
 *             hasNextPage:
 *               type: boolean
 *               description: Whether there is a next page
 *             hasPrevPage:
 *               type: boolean
 *               description: Whether there is a previous page
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         details:
 *           type: string
 */

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Helper function to refresh token
async function refreshToken(refreshToken) {
    try {
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
            throw new Error(data.error.message || 'Failed to refresh token');
        }

        return {
            idToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in
        };
    } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
    }
}

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews with optional user filter
 *     description: Retrieve all reviews, optionally filtered by user ID
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter reviews by user ID (optional)
 *     responses:
 *       200:
 *         description: List of reviews
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        
        const result = await reviewModel.getPaginated({
            userId,
            limit: 100 // Set a reasonable limit for non-paginated requests
        });

        res.json(result.reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Error fetching reviews', details: error.message });
    }
});

/**
 * @swagger
 * /api/reviews/paginated:
 *   get:
 *     tags: [Reviews]
 *     summary: Get paginated reviews
 *     description: Retrieve reviews with traditional pagination. Reviews are ordered by creation date (newest first).
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of reviews per page (max 50)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter reviews by user ID (optional)
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of reviews
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                     hasNextPage:
 *                       type: boolean
 *                       description: Whether there is a next page
 *                     hasPrevPage:
 *                       type: boolean
 *                       description: Whether there is a previous page
 *             example:
 *               reviews:
 *                 - id: "review1"
 *                   userId: "user123"
 *                   restaurantName: "Amazing Restaurant"
 *                   address: "123 Food St"
 *                   city: "Foodville"
 *                   ratings:
 *                     food: 5
 *                     service: 4
 *                     environment: 5
 *                   price: 3
 *                   comment: "Great experience!"
 *                   images: ["https://example.com/image1.jpg"]
 *                   createdAt: "2024-01-01T00:00:00Z"
 *                   updatedAt: "2024-01-01T00:00:00Z"
 *               pagination:
 *                 total: 100
 *                 totalPages: 10
 *                 currentPage: 1
 *                 limit: 10
 *                 hasNextPage: true
 *                 hasPrevPage: false
 *       400:
 *         description: Invalid request parameters
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
router.get('/paginated', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const { userId } = req.query;

        const result = await reviewModel.getPaginated({
            page,
            limit,
            userId
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Error fetching reviews', details: error.message });
    }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     description: Retrieve a specific review by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review details
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    try {
        const review = await reviewModel.getById(req.params.id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(review);
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ error: 'Error fetching review', details: error.message });
    }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *               - address
 *               - city
 *               - ratings
 *               - price
 *               - comment
 *             properties:
 *               restaurantName:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               ratings:
 *                 type: object
 *                 properties:
 *                   food:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   environment:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   service:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *               price:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 */
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { restaurantName, address, city, price, comment, ratings, images } = req.body;
        const userId = req.user.uid;

        // Handle array of binary image data
        let imageUrls = [];
        if (images && Array.isArray(images) && images.length > 0) {
            try {
                // Process each image in parallel
                const uploadPromises = images.map(async (base64Image) => {
                    // Create a buffer from the binary data
                    const buffer = Buffer.from(base64Image, 'base64');
                    
                    // Create a mock file object for Cloudinary upload
                    const mockFile = {
                        buffer,
                        mimetype: 'image/jpeg' // You might want to make this dynamic based on the actual image type
                    };

                    // Upload to Cloudinary
                    return await uploadFile(mockFile);
                });

                // Wait for all uploads to complete
                imageUrls = await Promise.all(uploadPromises);
            } catch (error) {
                console.error('Error uploading images:', error);
                return res.status(400).json({ error: 'Failed to upload images', details: error.message });
            }
        }

        // Create the review with image URLs
        const review = await reviewModel.create({
            userId,
            restaurantName,
            address,
            city,
            ratings: typeof ratings === 'string' ? JSON.parse(ratings) : ratings,
            price,
            comment,
            images: imageUrls
        });

        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Error creating review', details: error.message });
    }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const { restaurantName, address, city, ratings, price, comment } = req.body;
        const reviewId = req.params.id;

        const existingReview = await reviewModel.getById(reviewId);
        if (!existingReview) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if the user owns the review
        if (existingReview.userId !== req.user.uid) {
            return res.status(403).json({ error: 'Not authorized to update this review' });
        }

        const updateData = {
            ...(restaurantName && { restaurantName }),
            ...(address && { address }),
            ...(city && { city }),
            ...(ratings && { ratings }),
            ...(price && { price: Number(price) }),
            ...(comment && { comment }),
            updatedAt: new Date().toISOString()
        };

        await reviewModel.update(reviewId, updateData);
        
        const updatedReview = await reviewModel.getById(reviewId);
        res.json(updatedReview);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Error updating review', details: error.message });
    }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const review = await reviewModel.getById(reviewId);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if the user owns the review or is an admin
        if (review.userId !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this review' });
        }

        // Delete images from Cloudinary if they exist
        if (review.images && review.images.length > 0) {
            for (const imageUrl of review.images) {
                await deleteFile(imageUrl);
            }
        }

        await reviewModel.delete(reviewId);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Error deleting review', details: error.message });
    }
});

module.exports = router;
