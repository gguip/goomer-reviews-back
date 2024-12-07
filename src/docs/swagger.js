const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Goomer Reviews API',
      version: '1.0.0',
      description: 'API documentation for Goomer Reviews service',
      contact: {
        name: 'API Support',
        email: 'support@goomer.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Review unique identifier',
            },
            userId: {
              type: 'string',
              description: 'ID of the user who created the review',
            },
            restaurantId: {
              type: 'string',
              description: 'ID of the restaurant being reviewed',
            },
            rating: {
              type: 'number',
              description: 'Rating score (1-5)',
              minimum: 1,
              maximum: 5,
            },
            comment: {
              type: 'string',
              description: 'Review comment',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Review creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Review last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
