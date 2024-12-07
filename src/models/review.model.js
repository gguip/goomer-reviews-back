const { db } = require('../config/firebase');

const reviewsCollection = db.collection('reviews');

const reviewsModel = {
    create: async (reviewData) => {
        try {
            const docRef = await reviewsCollection.add({
                ...reviewData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    },

    getPaginated: async ({ page = 1, limit = 10, userId = null }) => {
        try {
            let query = reviewsCollection.orderBy('createdAt', 'desc');
            
            if (userId) {
                query = query.where('userId', '==', userId);
            }

            // Get total count
            const countSnapshot = await query.count().get();
            const total = countSnapshot.data().count;
            
            // Calculate pagination
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            
            // Get paginated data
            query = query.limit(limit).offset(offset);
            const snapshot = await query.get();
            
            const reviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
            }));

            return {
                reviews,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('Error getting paginated reviews:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const doc = await reviewsCollection.doc(id).get();
            if (!doc.exists) {
                return null;
            }
            const data = doc.data();
            return { 
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            };
        } catch (error) {
            console.error('Error getting review:', error);
            throw error;
        }
    },

    update: async (id, updateData) => {
        try {
            const docRef = reviewsCollection.doc(id);
            await docRef.update({
                ...updateData,
                updatedAt: new Date()
            });
            const updated = await docRef.get();
            const data = updated.data();
            return { 
                id: updated.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            };
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            await reviewsCollection.doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }
};

module.exports = reviewsModel;
