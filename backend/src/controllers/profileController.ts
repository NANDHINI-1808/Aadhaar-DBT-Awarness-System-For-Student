import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { runWithRLS } from '../config/rlsPrisma';
import {
  encryptBankAccount,
  decryptBankAccount,
  hashAadhaar,
  maskBankAccount,
  isValidAadhaar
} from '../utils/crypto';

// Step Zod validation schemas
const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.enum(['SC', 'ST', 'OBC', 'General']),
  state: z.string().min(2, 'State must be specified'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
});

const step2Schema = z.object({
  college: z.string().min(2, 'College name is required'),
  university: z.string().min(2, 'University name is required'),
  department: z.string().min(2, 'Department is required'),
  course: z.string().min(2, 'Course name is required'),
  yearOfStudy: z.number().int().min(1).max(5),
  semester: z.number().int().min(1).max(10),
  cgpa: z.number().min(0).max(10)
});

const step3Schema = z.object({
  familyIncome: z.number().min(0, 'Family income must be positive'),
  casteCertificatePath: z.string().optional().nullable(),
  casteCertificateName: z.string().optional().nullable(),
  incomeCertificatePath: z.string().optional().nullable(),
  incomeCertificateName: z.string().optional().nullable(),
  priorScholarshipHistory: z.string().optional().nullable()
});

const step4Schema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  bankAccount: z.string().min(9, 'Bank account number must be at least 9 digits'),
  aadhaar: z.string(), // Checked for format or fallback masking
  aadhaarSeedingStatus: z.enum(['YES', 'NO', 'NOT_SURE'])
});

/**
 * Fetch current user's profile
 */
export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    // Run inside database Row-Level Security
    const profile = await runWithRLS(userId, role, async (tx) => {
      return tx.profile.findUnique({
        where: { userId }
      });
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Mask bank account
    let maskedAccount = '';
    if (profile.encryptedBankAccount) {
      const decrypted = decryptBankAccount(profile.encryptedBankAccount);
      maskedAccount = maskBankAccount(decrypted);
    }

    // Never return raw encrypt/decrypt or hashes/pepper in response
    const sanitizedProfile = {
      ...profile,
      bankAccount: maskedAccount,
      encryptedBankAccount: undefined,
      aadhaarHash: undefined,
      aadhaarSet: !!profile.aadhaarHash
    };

    return res.status(200).json(sanitizedProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Error retrieving profile.' });
  }
}

/**
 * Update wizard steps
 */
export async function updateProfileStep(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    const step = parseInt(req.params.step, 10);
    let updateData: any = {};

    if (step === 1) {
      const body = step1Schema.parse(req.body);
      updateData = { ...body, currentWizardStep: Math.max(2, step + 1) };
    } else if (step === 2) {
      const body = step2Schema.parse(req.body);
      updateData = { ...body, currentWizardStep: Math.max(3, step + 1) };
    } else if (step === 3) {
      const body = step3Schema.parse(req.body);
      updateData = { ...body, currentWizardStep: Math.max(4, step + 1) };
    } else if (step === 4) {
      const body = step4Schema.parse(req.body);

      // Check if Aadhaar is modified or if it is masked fallback
      let finalAadhaarHash: string | undefined = undefined;
      if (body.aadhaar && !body.aadhaar.includes('X') && !body.aadhaar.includes('*')) {
        if (!isValidAadhaar(body.aadhaar)) {
          return res.status(400).json({ message: 'Aadhaar must be a 12-digit number.' });
        }
        finalAadhaarHash = hashAadhaar(body.aadhaar);
      }

      // Check if Bank Account is modified or if it is masked fallback
      let finalBankAccountEncrypted: string | undefined = undefined;
      if (body.bankAccount && !body.bankAccount.startsWith('XXXX')) {
        finalBankAccountEncrypted = encryptBankAccount(body.bankAccount);
      }

      updateData = {
        bankName: body.bankName,
        aadhaarSeedingStatus: body.aadhaarSeedingStatus,
        wizardCompleted: true
      };

      if (finalAadhaarHash) {
        updateData.aadhaarHash = finalAadhaarHash;
      }
      if (finalBankAccountEncrypted) {
        updateData.encryptedBankAccount = finalBankAccountEncrypted;
      }
    } else {
      return res.status(400).json({ message: 'Invalid wizard step.' });
    }

    const updatedProfile = await runWithRLS(userId, role, async (tx) => {
      return tx.profile.update({
        where: { userId },
        data: updateData
      });
    });

    let maskedAccount = '';
    if (updatedProfile.encryptedBankAccount) {
      const decrypted = decryptBankAccount(updatedProfile.encryptedBankAccount);
      maskedAccount = maskBankAccount(decrypted);
    }

    const sanitized = {
      ...updatedProfile,
      bankAccount: maskedAccount,
      encryptedBankAccount: undefined,
      aadhaarHash: undefined,
      aadhaarSet: !!updatedProfile.aadhaarHash
    };

    return res.status(200).json(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(`Step ${req.params.step} update error:`, error);
    return res.status(500).json({ message: `Error updating profile step ${req.params.step}.` });
  }
}

/**
 * Handle document uploads (Multer)
 */
export async function uploadDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // In a real S3 setting, we'd upload file.buffer.
    // Locally, multer saves it and provides path.
    return res.status(200).json({
      filepath: `/uploads/${file.filename}`,
      filename: file.originalname
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ message: 'Error uploading file.' });
  }
}
