import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import { runWithRLS } from '../config/rlsPrisma';

/**
 * Smart course matching engine
 */
function isCourseEligible(studentCourse: string, requiredCourses: string[]): boolean {
  if (requiredCourses.includes('Any')) return true;
  
  const cleanStudent = (studentCourse || '').toLowerCase();
  
  for (const reqCourse of requiredCourses) {
    const cleanReq = reqCourse.toLowerCase();
    
    if (cleanReq === 'engineering') {
      if (cleanStudent.includes('eng') || cleanStudent.includes('tech') || cleanStudent.includes('b.e') || cleanStudent.includes('architecture')) {
        return true;
      }
    }
    if (cleanReq === 'medical') {
      if (cleanStudent.includes('mbb') || cleanStudent.includes('bd') || cleanStudent.includes('med') || cleanStudent.includes('dent') || cleanStudent.includes('health')) {
        return true;
      }
    }
    if (cleanReq === 'agriculture') {
      if (cleanStudent.includes('agri') || cleanStudent.includes('horti') || cleanStudent.includes('farm') || cleanStudent.includes('forest')) {
        return true;
      }
    }
    
    // Direct matches
    if (cleanStudent.includes(cleanReq) || cleanReq.includes(cleanStudent)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get eligible scholarships for the logged-in student (smart eligibility engine)
 */
export async function getEligibleScholarships(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch student profile and all active scholarships inside database RLS context
    const data = await runWithRLS(userId, role, async (tx) => {
      const profile = await tx.profile.findUnique({ where: { userId } });
      const scholarships = await tx.scholarship.findMany({
        where: { status: 'Active' },
        include: { requirements: true }
      });
      return { profile, scholarships };
    });

    const { profile, scholarships } = data;

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Run eligibility engine against all 30 scholarships
    const evaluatedList = scholarships.map((s: any) => {
      const reasons: string[] = [];
      let isEligible = true;

      // 1. Check Category
      const profileCategory = profile.category || 'General';
      const categoryMatch = s.eligibleCategories.includes('Any') || 
                            s.eligibleCategories.includes('any') ||
                            s.eligibleCategories.includes(profileCategory);
      if (!categoryMatch) {
        isEligible = false;
        reasons.push(`Restricted to category: ${s.eligibleCategories.join('/')} (Your profile: ${profileCategory}).`);
      } else {
        reasons.push(`Social category matches scheme definition.`);
      }

      // 2. Check Family Income
      if (profile.familyIncome !== null && profile.familyIncome > s.maxIncome) {
        isEligible = false;
        reasons.push(`Family income (₹${profile.familyIncome.toLocaleString('en-IN')}) exceeds the ₹${s.maxIncome.toLocaleString('en-IN')} limit.`);
      } else if (profile.familyIncome !== null) {
        reasons.push(`Family income is below the ₹${s.maxIncome.toLocaleString('en-IN')} limit.`);
      }

      // 3. Check Academic performance (CGPA)
      if (profile.cgpa !== null && profile.cgpa < s.minCgpa) {
        isEligible = false;
        reasons.push(`Academic CGPA (${profile.cgpa}) is below the required ${s.minCgpa}.`);
      } else if (profile.cgpa !== null) {
        reasons.push(`Academic performance meets minimum CGPA requirement (${s.minCgpa}).`);
      }

      // 4. Check Gender Eligibility
      const profileGender = profile.gender || 'MALE';
      const genderMatch = s.genderEligibility.includes('ANY') || 
                          s.genderEligibility.includes('any') || 
                          s.genderEligibility.includes(profileGender);
      if (!genderMatch) {
        isEligible = false;
        reasons.push(`Restricted to ${s.genderEligibility.join('/')} candidates (Your gender: ${profileGender}).`);
      } else {
        reasons.push(`Gender eligibility conditions met.`);
      }

      // 5. Check Course/Program Eligibility
      const profileCourse = profile.course || '';
      const courseMatch = isCourseEligible(profileCourse, s.courseEligibility);
      if (!courseMatch) {
        isEligible = false;
        reasons.push(`Restricted to courses: ${s.courseEligibility.join('/')} (Your course: ${profileCourse || 'Not Specified'}).`);
      } else {
        reasons.push(`Course study line matches eligibility.`);
      }

      // 6. Check State residency
      const profileState = profile.state || '';
      const stateMatch = s.stateEligibility.includes('All') || 
                         s.stateEligibility.includes('all') || 
                         s.stateEligibility.map((st: string) => st.toLowerCase()).includes(profileState.toLowerCase());
      if (!stateMatch) {
        isEligible = false;
        reasons.push(`Restricted to residents of: ${s.stateEligibility.join('/')} (Your state: ${profileState || 'Not Specified'}).`);
      } else {
        reasons.push(`Residency state requirements met.`);
      }

      // Cross-reference documents uploaded by the student
      const docsRequired = s.requirements.map((req: any) => {
        let hasUploaded = false;
        const cleanDocType = req.documentType.toLowerCase();
        
        if (cleanDocType.includes('caste') && profile.casteCertificatePath) {
          hasUploaded = true;
        } else if (cleanDocType.includes('income') && profile.incomeCertificatePath) {
          hasUploaded = true;
        } else if (cleanDocType.includes('bank') && profile.encryptedBankAccount) {
          hasUploaded = true;
        } else if (cleanDocType.includes('marksheet') && profile.cgpa) {
          hasUploaded = true;
        } else if (cleanDocType.includes('admission') && profile.college) {
          hasUploaded = true;
        } else if (cleanDocType.includes('first graduate') && profile.priorScholarshipHistory) {
          // simple check
          hasUploaded = true;
        } else if (cleanDocType.includes('disability') && profile.casteCertificatePath) {
          // fallback
          hasUploaded = true;
        }
        
        return {
          documentType: req.documentType,
          description: req.description,
          status: hasUploaded ? 'UPLOADED' : 'MISSING'
        };
      });

      return {
        ...s,
        isEligible,
        reasons,
        docsRequired
      };
    });

    // Sort: Eligible first, then descending by amount
    const sortedList = evaluatedList.sort((a: any, b: any) => {
      if (a.isEligible === b.isEligible) {
        return b.amount - a.amount;
      }
      return a.isEligible ? -1 : 1;
    });

    return res.status(200).json(sortedList);
  } catch (error) {
    console.error('Get eligible scholarships error:', error);
    return res.status(500).json({ message: 'Error retrieving scholarships matching.' });
  }
}

/**
 * Get DBT seeding readiness status
 */
export async function getDBTStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    const stepDefinitions = [
      { key: 'net_banking_request', label: 'Submit Seeding Request via Net Banking', weight: 33 },
      { key: 'maadhaar_upload', label: 'Verify status via mAadhaar or UIDAI Portal', weight: 33 },
      { key: 'physical_consent', label: 'Submit Physical NPCI Consent Form to Bank Branch', weight: 34 }
    ];

    const completedSteps = await runWithRLS(userId, role, async (tx) => {
      return tx.userDBTStep.findMany({
        where: { userId, completed: true }
      });
    });

    const completedKeys = completedSteps.map((s: any) => s.stepKey);

    let score = 0;
    const stepsWithStatus = stepDefinitions.map((step) => {
      const isCompleted = completedKeys.includes(step.key);
      if (isCompleted) {
        score += step.weight;
      }
      return {
        ...step,
        completed: isCompleted
      };
    });

    if (stepsWithStatus.every(s => s.completed)) {
      score = 100;
    }

    return res.status(200).json({
      steps: stepsWithStatus,
      readinessScore: score
    });
  } catch (error) {
    console.error('Get DBT status error:', error);
    return res.status(500).json({ message: 'Error retrieving DBT readiness status.' });
  }
}

/**
 * Toggle/update status of a DBT seeding step
 */
export async function updateDBTStep(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });

    const { stepKey, completed } = req.body;
    if (!stepKey || typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'stepKey and completed (boolean) are required.' });
    }

    const updated = await runWithRLS(userId, role, async (tx) => {
      return tx.userDBTStep.upsert({
        where: {
          userId_stepKey: {
            userId,
            stepKey
          }
        },
        update: { completed },
        create: {
          userId,
          stepKey,
          completed
        }
      });
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update DBT step error:', error);
    return res.status(500).json({ message: 'Error updating DBT seeding step.' });
  }
}
