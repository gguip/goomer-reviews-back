const Joi = require('joi');

// Restaurant validation schemas
const restaurantSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(100)
      .messages({
        'string.empty': 'Restaurant name is required',
        'string.min': 'Restaurant name must be at least 2 characters long',
        'string.max': 'Restaurant name cannot exceed 100 characters'
      }),
    address: Joi.string().required().min(5).max(200)
      .messages({
        'string.empty': 'Address is required',
        'string.min': 'Address must be at least 5 characters long',
        'string.max': 'Address cannot exceed 200 characters'
      }),
    cuisine: Joi.string().required().min(2).max(50)
      .messages({
        'string.empty': 'Cuisine type is required',
        'string.min': 'Cuisine type must be at least 2 characters long',
        'string.max': 'Cuisine type cannot exceed 50 characters'
      }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/)
      .messages({
        'string.pattern.base': 'Phone number must be between 8 and 20 characters and can only contain numbers, spaces, and the following special characters: + - ( )'
      })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100)
      .messages({
        'string.min': 'Restaurant name must be at least 2 characters long',
        'string.max': 'Restaurant name cannot exceed 100 characters'
      }),
    address: Joi.string().min(5).max(200)
      .messages({
        'string.min': 'Address must be at least 5 characters long',
        'string.max': 'Address cannot exceed 200 characters'
      }),
    cuisine: Joi.string().min(2).max(50)
      .messages({
        'string.min': 'Cuisine type must be at least 2 characters long',
        'string.max': 'Cuisine type cannot exceed 50 characters'
      }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{8,20}$/)
      .messages({
        'string.pattern.base': 'Phone number must be between 8 and 20 characters and can only contain numbers, spaces, and the following special characters: + - ( )'
      })
  })
};

// Review validation schemas
const reviewSchemas = {
  create: Joi.object({
    restaurantId: Joi.string().required()
      .messages({
        'string.empty': 'Restaurant ID is required'
      }),
    rating: Joi.number().required().min(1).max(5)
      .messages({
        'number.base': 'Rating must be a number',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
        'any.required': 'Rating is required'
      }),
    comment: Joi.string().required().min(10).max(500)
      .messages({
        'string.empty': 'Review comment is required',
        'string.min': 'Review comment must be at least 10 characters long',
        'string.max': 'Review comment cannot exceed 500 characters'
      })
  }),

  update: Joi.object({
    rating: Joi.number().min(1).max(5)
      .messages({
        'number.base': 'Rating must be a number',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5'
      }),
    comment: Joi.string().min(10).max(500)
      .messages({
        'string.min': 'Review comment must be at least 10 characters long',
        'string.max': 'Review comment cannot exceed 500 characters'
      })
  })
};

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number().integer().min(1).max(100).default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  }),
  
  restaurantFilters: Joi.object({
    cuisine: Joi.string().min(2).max(50),
    search: Joi.string().min(2).max(100)
  })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (!error) {
      return next();
    }

    const errors = error.details.reduce((acc, err) => {
      acc[err.path[0]] = err.message;
      return acc;
    }, {});

    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  };
};

module.exports = {
  validate,
  restaurantSchemas,
  reviewSchemas,
  querySchemas
};
