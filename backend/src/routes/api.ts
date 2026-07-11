import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  resendVerification
} from '../controllers/authController';
import {
  getProfile,
  updateProfileStep,
  uploadDocument
} from '../controllers/profileController';
import {
  getEligibleScholarships,
  getDBTStatus,
  updateDBTStep
} from '../controllers/scholarshipController';
import {
  chatWithGuide,
  getChatHistory
} from '../controllers/aiController';
import {
  getAdminStats
} from '../controllers/adminController';
import { generateAwarenessPoster } from '../services/pdfGenerator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { authLimiter, chatLimiter } from '../middleware/rateLimiter';

const router = Router();

// ==========================================
// 1. Authentication Routes (httpOnly Cookies)
// ==========================================
router.post('/auth/register', authLimiter, register);
router.get('/auth/verify-email', verifyEmail);
router.post('/auth/login', authLimiter, login);
router.post('/auth/forgot-password', authLimiter, forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', logout);
router.post('/auth/resend-verification', resendVerification);

// ==========================================
// 2. Profile Wizard Routes (Step 1-4)
// ==========================================
router.get('/profile', authenticateToken, getProfile);
router.patch('/profile/:step', authenticateToken, updateProfileStep);
router.post('/profile/upload', authenticateToken, upload.single('document'), uploadDocument);

// ==========================================
// 3. Scholarship Seeding & Matching Routes
// ==========================================
router.get('/scholarships/eligible', authenticateToken, getEligibleScholarships);

// ==========================================
// 4. DBT Status & Checklist Routes
// ==========================================
router.get('/dbt/status', authenticateToken, getDBTStatus);
router.post('/dbt/step', authenticateToken, updateDBTStep);

// ==========================================
// 5. AI Guide Proxy Chat Router
// ==========================================
router.post('/chat', authenticateToken, chatLimiter, chatWithGuide);
router.get('/chat/history', authenticateToken, getChatHistory);

// ==========================================
// 6. Admin Panel Overview Statistics
// ==========================================
router.get('/admin/stats', authenticateToken, requireAdmin, getAdminStats);

// ==========================================
// 7. General PDF Poster Resource Endpoint
// ==========================================
router.get('/resources/poster', async (req, res) => {
  try {
    const posterBuffer = await generateAwarenessPoster();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Aadhaar_DBT_Awareness_Poster.pdf"');
    return res.send(posterBuffer);
  } catch (error) {
    console.error('Download poster error:', error);
    return res.status(500).json({ message: 'Error generating printable poster PDF.' });
  }
});

export default router;
