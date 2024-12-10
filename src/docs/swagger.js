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
            restaurantName: {
              type: 'string',
              description: 'Name of the restaurant',
            },
            address: {
              type: 'string',
              description: 'Restaurant address',
            },
            city: {
              type: 'string',
              description: 'Restaurant city',
            },
            ratings: {
              type: 'object',
              properties: {
                food: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: 'Food quality rating',
                },
                service: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: 'Service quality rating',
                },
                environment: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: 'Environment quality rating',
                },
              },
            },
            price: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Price rating',
            },
            comment: {
              type: 'string',
              description: 'Review comment',
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                description: 'URL of the review image',
              },
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
