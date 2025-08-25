import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Vietnamese phone number validation
const vietnamesePhoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;

export const userValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(vietnamesePhoneRegex).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  customerCreate: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(vietnamesePhoneRegex).optional(),
    company: Joi.string().max(100).optional(),
    position: Joi.string().max(100).optional(),
    value: Joi.number().positive().required(),
    source: Joi.string().valid('website', 'social', 'referral', 'ads', 'cold', 'event').required()
  }),

  codeGeneration: Joi.object({
    prompt: Joi.string().min(10).max(1000).required(),
    language: Joi.string().valid('javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php', 'go', 'rust').required(),
    complexity: Joi.string().valid('beginner', 'intermediate', 'advanced').optional()
  }),

  documentProcessing: Joi.object({
    processingTypes: Joi.array().items(
      Joi.string().valid('summary', 'translation', 'ocr', 'entities')
    ).min(1).required(),
    targetLanguage: Joi.string().valid('vi', 'en', 'zh', 'ja').optional()
  }),

  contentGeneration: Joi.object({
    prompt: Joi.string().min(10).max(500).required(),
    type: Joi.string().valid('blog', 'social', 'email', 'marketing').required(),
    tone: Joi.string().valid('professional', 'casual', 'formal', 'friendly').optional()
  })
};

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters but preserve Vietnamese
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = sanitizeInput(value);
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Query validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.query = sanitizeInput(value);
    next();
  };
};