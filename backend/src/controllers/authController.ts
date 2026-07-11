import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../config/db';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setTokenCookies,
  clearTokenCookies,
  verifyRefreshToken
} from '../utils/tokens';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

/**
 * Register step 0
 */
export async function register(req: Request, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(body.password, 12);
    
    // Generate verification token (24h expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and profile structure
    await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        emailVerified: false,
        verificationToken: tokenHash,
        verificationTokenExpires: expires,
        profile: {
          create: {
            currentWizardStep: 1,
            wizardCompleted: false
          }
        }
      }
    });

    // Send verification link via email
    await sendVerificationEmail(body.email, token);

    return res.status(201).json({
      message: 'Registration successful. A verification email has been sent to your inbox.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
}

/**
 * Verify Email Route
 */
export async function verifyEmail(req: Request, res: Response) {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send('Verification token is missing.');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: tokenHash,
        verificationTokenExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).send('Invalid or expired verification token.');
    }

    // Mark email verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      }
    });

    // Redirect to login with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).send('Internal server error during email verification.');
  }
}

/**
 * Resend Email Verification Token
 */
export async function resendVerification(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return success anyway to avoid revealing account existence
      return res.status(200).json({ message: 'If the email exists, a verification link has been sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'This email is already verified.' });
    }

    // Re-generate verification token (24h expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: tokenHash,
        verificationTokenExpires: expires
      }
    });

    await sendVerificationEmail(email, token);

    return res.status(200).json({ message: 'Verification link resent successfully.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Login Route
 */
export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { profile: true }
    });

    // Prevent password leaking & maintain uniform error response
    if (!user) {
      return res.status(401).json({ message: 'Invalid email, password, or unverified email.' });
    }

    const isMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email, password, or unverified email.' });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: 'Invalid email, password, or unverified email.' });
    }

    // Issue JWTs
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Save hashed refresh token to DB
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt
      }
    });

    // Set Cookies
    setTokenCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        wizardCompleted: user.profile?.wizardCompleted || false,
        name: user.profile?.name || ''
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
}

/**
 * Forgot Password
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const body = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetTokenHash,
          resetTokenExpires: expires
        }
      });

      await sendPasswordResetEmail(body.email, resetToken);
    }

    // Uniform response for security (no leakage)
    return res.status(200).json({
      message: 'If the email matches our records, a password reset link has been sent.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Reset Password
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const resetTokenHash = crypto.createHash('sha256').update(body.token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: resetTokenHash,
        resetTokenExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Hash password with bcrypt (12 rounds)
    const newPasswordHash = await bcrypt.hash(body.password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Refresh Access Token (Token Rotation)
 */
export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const oldTokenHash = hashToken(refreshToken);

    // Look up refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldTokenHash },
      include: { user: true }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Cleanup token if expired
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      clearTokenCookies(res);
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    // Issue new tokens (rotation)
    const newAccessToken = generateAccessToken({ userId: storedToken.userId, role: storedToken.user.role });
    const newRefreshToken = generateRefreshToken({ userId: storedToken.userId });
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Delete old token, save new one
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newRefreshTokenHash,
          userId: storedToken.userId,
          expiresAt
        }
      })
    ]);

    // Set Cookies
    setTokenCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({ status: 'Tokens refreshed' });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Logout
 */
export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      // Remove from database
      await prisma.refreshToken.deleteMany({
        where: { tokenHash }
      });
    }

    clearTokenCookies(res);
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error during logout.' });
  }
}
