import cron from 'node-cron';
import prisma from '../config/db';
import { sendScholarshipReminderEmail } from './emailService';

/**
 * Initializes all background cron schedulers
 */
export function initCronJobs() {
  console.log('Background cron scheduler initialized.');

  // 1. Nightly reminder job (Runs at 2:00 AM every day: '0 2 * * *')
  cron.schedule('0 2 * * *', async () => {
    console.log('Executing nightly scholarship deadline reminders...');
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Find scholarships closing in next 7 days
      const closingScholarships = await prisma.scholarship.findMany({
        where: {
          endDate: {
            lte: sevenDaysFromNow,
            gt: new Date()
          }
        }
      });

      if (closingScholarships.length === 0) return;

      // Find all students with matching criteria
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          emailVerified: true
        },
        include: {
          profile: true
        }
      });

      for (const student of students) {
        if (!student.profile) continue;

        for (const scheme of closingScholarships) {
          // Check matching criteria
          const catMatch = scheme.eligibleCategories.includes(student.profile.category || '');
          const incomeMatch = (student.profile.familyIncome || 0) <= scheme.maxIncome;
          const marksMatch = (student.profile.cgpa || 0) >= scheme.minCgpa;

          if (catMatch && incomeMatch && marksMatch) {
            // Send email
            await sendScholarshipReminderEmail(
              student.email,
              student.profile.name || 'Student',
              scheme.name,
              scheme.endDate.toLocaleDateString('en-IN'),
              scheme.amount
            );
          }
        }
      }
    } catch (error) {
      console.error('Error during nightly scholarship cron reminders:', error);
    }
  });

  // 2. Proactive DBT readiness nudges (Runs hourly: '0 * * * *')
  // We can write it to scan and insert proactive assistant tips in ChatMessage table.
  cron.schedule('0 * * * *', async () => {
    console.log('Executing proactive DBT readiness nudges check...');
    try {
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

      // Find scholarships with deadlines within 5 days
      const urgentScholarships = await prisma.scholarship.findMany({
        where: {
          endDate: {
            lte: fiveDaysFromNow,
            gt: new Date()
          }
        }
      });

      if (urgentScholarships.length === 0) return;

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
          profile: true,
          dbtSteps: { where: { completed: true } }
        }
      });

      for (const student of students) {
        if (!student.profile || !student.profile.wizardCompleted) continue;

        // Calculate DBT readiness score
        const completedCount = student.dbtSteps.length;
        const readinessScore = completedCount === 3 ? 100 : completedCount * 33;

        // Trigger nudge if score is low (< 80%)
        if (readinessScore < 80) {
          // Find matching urgent scholarship
          for (const scheme of urgentScholarships) {
            const catMatch = scheme.eligibleCategories.includes(student.profile.category || '');
            const incomeMatch = (student.profile.familyIncome || 0) <= scheme.maxIncome;
            const marksMatch = (student.profile.cgpa || 0) >= scheme.minCgpa;

            if (catMatch && incomeMatch && marksMatch) {
              // Check if a nudge was already sent in the last 2 days to avoid spamming
              const recentNudge = await prisma.chatMessage.findFirst({
                where: {
                  userId: student.id,
                  role: 'assistant',
                  content: {
                    contains: 'DBT readiness is at'
                  },
                  createdAt: {
                    gt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                  }
                }
              });

              if (!recentNudge) {
                // Push proactive assistant nudge to ChatMessage log
                await prisma.chatMessage.create({
                  data: {
                    userId: student.id,
                    role: 'assistant',
                    content: `🔔 **Scholarship Alert**: Your DBT readiness is at ${readinessScore}% and your application deadline for the *${scheme.name}* is in less than 5 days. Want help completing the remaining bank seeding steps?`
                  }
                });
                console.log(`Pushed proactive DBT nudge for user: ${student.email}`);
              }
              break; // Only push one nudge per check
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during DBT readiness nudges cron check:', error);
    }
  });
}
