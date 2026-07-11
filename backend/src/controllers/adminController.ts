import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import { runWithRLS } from '../config/rlsPrisma';

/**
 * Fetch aggregate stats for College/NGO admins
 * (DBT readiness, seeding statuses, common blockers, and department/college breakdowns)
 */
export async function getAdminStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    // Admins bypass standard student RLS policies by querying as ADMIN
    const stats = await runWithRLS(userId, role, async (tx) => {
      // Fetch all student profiles (exlude admins in final metrics)
      const profiles = await tx.profile.findMany({
        where: {
          user: {
            role: 'STUDENT'
          }
        },
        include: {
          user: true
        }
      });

      // Fetch all completed DBT steps for all students to calculate actual DBT scores
      const allDbtSteps = await tx.userDBTStep.findMany({
        where: {
          completed: true,
          user: {
            role: 'STUDENT'
          }
        }
      });

      const totalStudents = profiles.length;

      // Group steps completed by userId
      const userStepCounts: Record<string, number> = {};
      allDbtSteps.forEach((step: any) => {
        userStepCounts[step.userId] = (userStepCounts[step.userId] || 0) + 1;
      });

      let dbtReadyCount = 0;
      const seedingStatusCounts = { YES: 0, NO: 0, NOT_SURE: 0 };
      const collegeBreakdowns: Record<string, { total: number; ready: number }> = {};
      const departmentBreakdowns: Record<string, { total: number; ready: number }> = {};

      profiles.forEach((p: any) => {
        // Calculate DBT score
        const completedCount = userStepCounts[p.userId] || 0;
        const isDbtReady = completedCount === 3 || p.aadhaarSeedingStatus === 'YES';
        if (isDbtReady) {
          dbtReadyCount++;
        }

        // Seeding counts
        const status = p.aadhaarSeedingStatus || 'NOT_SURE';
        seedingStatusCounts[status as 'YES' | 'NO' | 'NOT_SURE']++;

        // College breakdown
        const college = p.college || 'Unspecified';
        if (!collegeBreakdowns[college]) {
          collegeBreakdowns[college] = { total: 0, ready: 0 };
        }
        collegeBreakdowns[college].total++;
        if (isDbtReady) collegeBreakdowns[college].ready++;

        // Department breakdown
        const dept = p.department || 'Unspecified';
        if (!departmentBreakdowns[dept]) {
          departmentBreakdowns[dept] = { total: 0, ready: 0 };
        }
        departmentBreakdowns[dept].total++;
        if (isDbtReady) departmentBreakdowns[dept].ready++;
      });

      const dbtReadinessPercentage = totalStudents > 0 ? Math.round((dbtReadyCount / totalStudents) * 100) : 0;

      return {
        totalStudents,
        dbtReadyCount,
        dbtReadinessPercentage,
        seedingStatusCounts,
        collegeBreakdowns,
        departmentBreakdowns
      };
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ message: 'Error retrieving administrator metrics.' });
  }
}
