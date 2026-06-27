import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),

  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),

  RABBITMQ_URL: Joi.string()
    .pattern(/^amqp:\/\//)
    .default('amqp://localhost:5672'),

  SEED_ADMIN_EMAIL: Joi.string().email().required(),
  SEED_ADMIN_PASSWORD: Joi.string().min(8).required(),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('debug'),

  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  CACHE_TTL: Joi.number().default(600),

  GITHUB_WEBHOOK_SECRET: Joi.string().default(''),
});