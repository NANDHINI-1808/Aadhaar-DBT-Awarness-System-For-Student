import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import { runWithRLS } from '../config/rlsPrisma';
import { getAIChatResponse, AIGuideContext } from '../services/aiService';
import { decryptBankAccount, maskBankAccount } from '../utils/crypto';

/**
 * Handle AI Guide chats (POST /api/chat)
 */
export async function chatWithGuide(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    // Fetch user details, messages history, and available schemes under RLS
    const data = await runWithRLS(userId, role, async (tx) => {
      const profile = await tx.profile.findUnique({ where: { userId } });
      const scholarships = await tx.scholarship.findMany({
        include: { requirements: true }
      });
      const dbtSteps = await tx.userDBTStep.findMany({
        where: { userId, completed: true }
      });
      const chatHistory = await tx.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 30 // Send last 30 messages for conversation context
      });

      return { profile, scholarships, dbtSteps, chatHistory };
    });

    const { profile, scholarships, dbtSteps, chatHistory } = data;

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Save the user's message to ChatMessage log (No sensitive credentials logged here)
    await runWithRLS(userId, role, async (tx) => {
      return tx.chatMessage.create({
        data: {
          userId,
          role: 'user',
          content: message
        }
      });
    });

    // 1. Calculate DBT Seeding readiness score
    const stepDefinitions = ['net_banking_request', 'maadhaar_upload', 'physical_consent'];
    const completedKeys = dbtSteps.map((s: any) => s.stepKey);
    let readinessScore = 0;
    stepDefinitions.forEach((stepKey) => {
      if (completedKeys.includes(stepKey)) {
        readinessScore += 33;
      }
    });
    if (completedKeys.length === 3) readinessScore = 100;

    // 2. Prepare uploaded documents checklist
    const uploadedDocuments: { documentType: string; status: string }[] = [];
    if (profile.casteCertificatePath) {
      uploadedDocuments.push({ documentType: 'Caste Certificate', status: 'VERIFIED' });
    } else {
      uploadedDocuments.push({ documentType: 'Caste Certificate', status: 'MISSING' });
    }
    
    if (profile.incomeCertificatePath) {
      uploadedDocuments.push({ documentType: 'Income Certificate', status: 'VERIFIED' });
    } else {
      uploadedDocuments.push({ documentType: 'Income Certificate', status: 'MISSING' });
    }

    if (profile.encryptedBankAccount) {
      uploadedDocuments.push({ documentType: 'Bank Passbook', status: 'VERIFIED' });
    } else {
      uploadedDocuments.push({ documentType: 'Bank Passbook', status: 'MISSING' });
    }

    // 3. Mask bank account for Claude context
    let maskedAccount = 'Not Provided';
    if (profile.encryptedBankAccount) {
      const decrypted = decryptBankAccount(profile.encryptedBankAccount);
      maskedAccount = maskBankAccount(decrypted);
    }

    // 4. Compile schemes and requirements
    const schemesAvailable = scholarships.map((s: any) => ({
      name: s.name,
      requirements: s.requirements.map((r: any) => r.documentType),
      amount: s.amount,
      deadline: s.endDate ? new Date(s.endDate).toLocaleDateString('en-IN') : 'N/A',
      description: s.description
    }));

    // 5. Assemble Context (Excludes raw passwords, salts, peppers, raw bank details)
    const context: AIGuideContext = {
      studentName: profile.name || 'Student',
      category: profile.category || 'General',
      state: profile.state || 'None',
      familyIncome: profile.familyIncome || 0,
      cgpa: profile.cgpa || 0,
      dbtReadinessScore: readinessScore,
      bankName: profile.bankName || 'Not Seeding',
      maskedAccount,
      seedingStatus: profile.aadhaarSeedingStatus || 'Not Started',
      uploadedDocuments,
      schemesAvailable
    };

    // 6. Compile chat array for Claude API
    const formattedHistory = chatHistory.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));
    
    // Add current message to the list
    formattedHistory.push({ role: 'user', content: message });

    // 7. Get Claude reply
    const reply = await getAIChatResponse(formattedHistory, context);

    // 8. Save assistant reply to DB
    await runWithRLS(userId, role, async (tx) => {
      return tx.chatMessage.create({
        data: {
          userId,
          role: 'assistant',
          content: reply
        }
      });
    });

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({ message: 'Error communicating with AI Guide.' });
  }
}

/**
 * Fetch chat messages history (GET /api/chat/history)
 */
export async function getChatHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    const chatHistory = await runWithRLS(userId, role, async (tx) => {
      return tx.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 50
      });
    });

    return res.status(200).json(chatHistory);
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({ message: 'Error retrieving chat history.' });
  }
}
