import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window (login, register, forgot-password)
  message: {
    message: 'Too many attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // Limit each IP to 15 chat messages per minute
  message: {
    message: 'Chat rate limit reached. Please wait a moment before sending more messages.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
