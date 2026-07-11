import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding updated scholarship database...');

  // 1. Clean existing records
  await prisma.chatMessage.deleteMany({});
  await prisma.userDBTStep.deleteMany({});
  await prisma.scholarshipRequirement.deleteMany({});
  await prisma.scholarship.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Admin User (Clearly flagged placeholder, password hashed with 12 rounds of bcrypt)
  const adminPasswordHash = await bcrypt.hash('AdminDefaultPass123!_CHANGE_BEFORE_DEPLOY', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin-change-before-deploy@dbt-students.gov.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      emailVerified: true,
      profile: {
        create: {
          name: 'Central Admin Portal Officer',
          phone: '9999999999',
          wizardCompleted: true,
          currentWizardStep: 4,
        }
      }
    }
  });
  console.log('Created Admin account:', adminUser.email);

  // 3. Create at least 30 Sample Scholarships
  const scholarshipsData = [
    {
      name: 'Central Sector Scheme of Scholarship for College and University Students',
      provider: 'Ministry of Education, Government of India',
      description: 'Provides financial assistance to meritorious students from non-creamy layer families to meet a part of their day-to-day expenses while pursuing higher studies.',
      eligibilityCriteria: 'Students who are above 80th percentile of successful candidates in the relevant stream from the respective Board of Examination in Class 12.',
      minCgpa: 8.0,
      maxIncome: 450000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-10-31'),
      amount: 20000,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Apply online through the National Scholarship Portal (NSP), submit verification documents, and get institution approval.',
      renewalInfo: 'Renewable annually up to postgraduate level based on maintaining 60% marks and 75% attendance.',
      status: 'Active',
      requirements: [
        { documentType: 'Previous Marksheet', description: 'Class 12 board marksheet showing above 80th percentile.' },
        { documentType: 'Income Certificate', description: 'Family income certificate under 4.5 LPA.' },
        { documentType: 'Bank Passbook', description: 'Copy of bank passbook for account verification.' }
      ]
    },
    {
      name: 'Post-Matric Scholarship for SC Students (DoSJE)',
      provider: 'Department of Social Justice & Empowerment, Govt. of India',
      description: 'Centrally sponsored scheme to provide financial assistance to Scheduled Caste students for higher education.',
      eligibilityCriteria: 'SC students pursuing post-matric courses with family income under 2.5 LPA.',
      minCgpa: 5.0,
      maxIncome: 250000,
      eligibleCategories: ['SC'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-10-15'),
      amount: 12000,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Register on NSP, choose state and post-matric SC scheme, upload caste and income certificates.',
      renewalInfo: 'Renewable each year of the course on passing the previous year examinations.',
      status: 'Active',
      requirements: [
        { documentType: 'Caste Certificate', description: 'SC community certificate issued by competent authority.' },
        { documentType: 'Income Certificate', description: 'Family income proof under 2.5 LPA.' }
      ]
    },
    {
      name: 'Post-Matric Scholarship for ST Students (Ministry of Tribal Affairs)',
      provider: 'Ministry of Tribal Affairs, Govt. of India',
      description: 'Financial support for Scheduled Tribe candidates studying beyond Matriculation.',
      eligibilityCriteria: 'ST candidates with family income under 2.5 LPA.',
      minCgpa: 5.0,
      maxIncome: 250000,
      eligibleCategories: ['ST'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-10-15'),
      amount: 13500,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Register on NSP, select ST post-matric category, upload community and income certificate.',
      renewalInfo: 'Automatic renewal upon submitting passing marks of previous semester.',
      status: 'Active',
      requirements: [
        { documentType: 'Caste Certificate', description: 'ST community certificate.' },
        { documentType: 'Income Certificate', description: 'Family income proof under 2.5 LPA.' }
      ]
    },
    {
      name: 'Post-Matric Scholarship for OBC Students (DoSJE)',
      provider: 'Department of Social Justice & Empowerment, Govt. of India',
      description: 'Financial aid for OBC category students pursuing intermediate, diploma, graduation or higher.',
      eligibilityCriteria: 'OBC category students with family income under 1.5 LPA.',
      minCgpa: 5.5,
      maxIncome: 150000,
      eligibleCategories: ['OBC'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-11-15'),
      amount: 8000,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Submit application on NSP with non-creamy layer OBC certificate.',
      renewalInfo: 'Renewable on passing the previous class without backlogs.',
      status: 'Active',
      requirements: [
        { documentType: 'Caste Certificate', description: 'OBC Non-Creamy Layer certificate.' },
        { documentType: 'Income Certificate', description: 'Family income proof under 1.5 LPA.' }
      ]
    },
    {
      name: 'Pragati Scholarship Scheme for Girl Students (Technical Degree)',
      provider: 'AICTE, Ministry of Education, Govt. of India',
      description: 'Promotes technical education for girls. Targets advancement of girls pursuing technical degree programs.',
      eligibilityCriteria: 'Maximum two girl child per family, admitted to 1st year of technical degree in AICTE approved college.',
      minCgpa: 6.0,
      maxIncome: 800000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['FEMALE'],
      courseEligibility: ['Engineering'],
      stateEligibility: ['All'],
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-30'),
      amount: 50000,
      officialLink: 'https://www.aicte-india.org',
      procedure: 'Apply on NSP, submit AICTE registration number, and class 12 marksheets.',
      renewalInfo: 'Renewed based on passing marks and good conduct certificate from principal.',
      status: 'Active',
      requirements: [
        { documentType: 'Caste Certificate', description: 'Category proof if applicable.' },
        { documentType: 'Income Certificate', description: 'Family income proof under 8 LPA.' },
        { documentType: 'Admission Offer Letter', description: 'AICTE college admission letter.' }
      ]
    },
    {
      name: 'Saksham Scholarship Scheme for Specially Abled Students',
      provider: 'AICTE, Govt. of India',
      description: 'Supports differently-abled students in technical education (degree level).',
      eligibilityCriteria: 'Differently abled students having disability level above 40%.',
      minCgpa: 5.0,
      maxIncome: 800000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering'],
      stateEligibility: ['All'],
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-30'),
      amount: 50000,
      officialLink: 'https://www.aicte-india.org',
      procedure: 'Apply online, upload official disability certificate issued by medical board.',
      renewalInfo: 'Renewable on passing the previous year exams.',
      status: 'Active',
      requirements: [
        { documentType: 'Disability Certificate', description: 'State medical board card indicating 40%+ disability.' },
        { documentType: 'Income Certificate', description: 'Annual family income certificate.' }
      ]
    },
    {
      name: 'Prime Minister Scholarship Scheme (PMSS) for CAPF & AR',
      provider: 'Welfare and Rehabilitation Board, Ministry of Home Affairs',
      description: 'Financial aid for wards/widows of deceased or retired Central Armed Police Forces (CAPF) and Assam Rifles personnel.',
      eligibilityCriteria: 'Wards of CAPF personnel admitted to professional degree courses (Engineering, Medical, Agriculture, etc.).',
      minCgpa: 6.0,
      maxIncome: 999999, // practically no limit
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering', 'Medical', 'Agriculture'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-10-31'),
      amount: 36000,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Apply online, attach service certificate of parent and admission proof.',
      renewalInfo: 'Must maintain minimum 50% marks in each semester/year.',
      status: 'Active',
      requirements: [
        { documentType: 'Service Certificate', description: 'Parent discharge/service details card.' },
        { documentType: 'Previous Marksheet', description: 'Class 12 marksheet showing minimum 60%.' }
      ]
    },
    {
      name: 'Aditya Birla Science and Technology Scholarship',
      provider: 'Aditya Birla Group Foundation',
      description: 'Private foundation scholarship recognizing academic excellence in IITs and BITS.',
      eligibilityCriteria: 'Top 10 candidates in entrance exam or first-year engineering students from designated universities.',
      minCgpa: 8.5,
      maxIncome: 1200000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering'],
      stateEligibility: ['All'],
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-09-30'),
      amount: 100000,
      officialLink: 'https://www.adityabirlascholars.net',
      procedure: 'Apply directly via university dean, clear internal written exams and interviews.',
      renewalInfo: 'Renewed based on top 20% ranking in class.',
      status: 'Active',
      requirements: [
        { documentType: 'Admission Offer Letter', description: 'BITs or IIT enrollment certificate.' },
        { documentType: 'Previous Marksheet', description: 'JEE rank card.' }
      ]
    },
    {
      name: 'Tata Trust Medical and Healthcare Scholarships',
      provider: 'Tata Trusts Private Foundation',
      description: 'Provides financial support for healthcare education in MBBS, MD, and BDS streams.',
      eligibilityCriteria: 'Students pursuing undergraduate or postgraduate medical degree programs.',
      minCgpa: 7.0,
      maxIncome: 600000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Medical'],
      stateEligibility: ['All'],
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-11-15'),
      amount: 75000,
      officialLink: 'https://www.tatatrusts.org',
      procedure: 'Apply online on Tata Trusts web portal, submit college recommendation and marks records.',
      renewalInfo: 'Subject to annual review of marksheets and academic performance.',
      status: 'Active',
      requirements: [
        { documentType: 'Previous Marksheet', description: 'MBBS/BDS marks transcripts.' },
        { documentType: 'Income Certificate', description: 'Family income certificate.' }
      ]
    },
    {
      name: 'Indira Gandhi Single Girl Child Scholarship for Post-Graduate Studies',
      provider: 'University Grants Commission (UGC), Govt. of India',
      description: 'Encourages single girls to pursue postgraduate higher education in universities.',
      eligibilityCriteria: 'Only girl child of a family admitted to first-year PG degree program.',
      minCgpa: 5.5,
      maxIncome: 500000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['FEMALE'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-10-31'),
      amount: 36200,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Apply via NSP, submit affidavit verifying single girl status.',
      renewalInfo: 'Submit certificate indicating successful promotion to 2nd year.',
      status: 'Active',
      requirements: [
        { documentType: 'Affidavit of Single Girl', description: 'SDM signed single child declaration affidavit.' }
      ]
    },
    {
      name: 'Dr. APJ Abdul Kalam IGNITE Research and Innovation Scholarship',
      provider: 'National Innovation Foundation',
      description: 'Supports high school and undergraduate researchers working on patentable engineering designs.',
      eligibilityCriteria: 'Meritorious research proposal and working prototype submission.',
      minCgpa: 7.5,
      maxIncome: 600000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering', 'Medical'],
      stateEligibility: ['All'],
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-08-30'),
      amount: 60000,
      officialLink: 'https://nif.org.in',
      procedure: 'Upload project abstract, prototype screenshots, and patent details on NIF portal.',
      renewalInfo: 'Renewed upon submitting bi-annual project progress reports.',
      status: 'Active',
      requirements: [
        { documentType: 'Project Abstract', description: 'NIF approved prototype details page.' }
      ]
    },
    {
      name: 'Tamil Nadu First Graduate Tuition Fee Waiver Scheme',
      provider: 'Department of Higher Education, Govt. of Tamil Nadu',
      description: 'Tuition fee reimbursement for students who are the first graduates in their families.',
      eligibilityCriteria: 'First graduate candidate admitted to professional engineering courses in Tamil Nadu.',
      minCgpa: 5.0,
      maxIncome: 300000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering'],
      stateEligibility: ['Tamil Nadu'],
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-30'),
      amount: 25000,
      officialLink: 'https://www.tndte.gov.in',
      procedure: 'Apply via TNEA counseling portal with First Graduate Certificate issued by Tahsildar.',
      renewalInfo: 'Continuous fee waiver for all four years of course registration.',
      status: 'Active',
      requirements: [
        { documentType: 'First Graduate Certificate', description: 'Certificate signed by local Tahsildar office.' }
      ]
    },
    {
      name: 'Reliance Foundation Undergraduate Scholarships',
      provider: 'Reliance Foundation Corporate Scholarship',
      description: 'Corporate scholarship supporting meritorious undergraduate students in any stream.',
      eligibilityCriteria: 'First-year undergraduate students with JEE/State entrance ranking or class 12 marks.',
      minCgpa: 7.7,
      maxIncome: 1500000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-10-15'),
      amount: 200000,
      officialLink: 'https://www.reliancefoundation.org',
      procedure: 'Apply on Reliance Scholarship portal, write online aptitude test, clear interview rounds.',
      renewalInfo: 'Requires maintaining CGPA above 7.0 and clean conduct history.',
      status: 'Active',
      requirements: [
        { documentType: 'Previous Marksheet', description: 'Class 12 marks transcripts.' },
        { documentType: 'Income Certificate', description: 'IT return copy or salary slip.' }
      ]
    },
    {
      name: 'Post-Matric Scholarship Scheme for Minorities',
      provider: 'Ministry of Minority Affairs, Govt. of India',
      description: 'Scholarship for students belonging to Muslims, Sikhs, Christians, Buddhists, Jain, and Zoroastrians communities.',
      eligibilityCriteria: 'Students belonging to specified minority communities with family income under 2 LPA.',
      minCgpa: 5.0,
      maxIncome: 200000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-10-31'),
      amount: 6000,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Register on NSP, select Minority Post-Matric category, submit self-declaration of community.',
      renewalInfo: 'Automatic renewal upon submitting previous year marksheet with 50%+ passing grade.',
      status: 'Active',
      requirements: [
        { documentType: 'Self-Declaration Minority Proof', description: 'Signed community declaration.' },
        { documentType: 'Income Certificate', description: 'Annual family income certificate.' }
      ]
    },
    {
      name: 'National Sports Talent Search Scheme Scholarship',
      provider: 'Sports Authority of India (SAI), Govt. of India',
      description: 'Identifies and supports talented sports persons representing state/national levels.',
      eligibilityCriteria: 'State-level or National-level winners in Olympic sports aged 8-18.',
      minCgpa: 4.5,
      maxIncome: 500000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-07-15'),
      amount: 15000,
      officialLink: 'https://sportsauthorityofindia.nic.in',
      procedure: 'Apply through school sports board, attach district/state medals and certificates.',
      renewalInfo: 'Annual review of sports ranking and fitness logs.',
      status: 'Active',
      requirements: [
        { documentType: 'Sports Achievement Certificate', description: 'State/National sports federation medal certificate.' }
      ]
    },
    {
      name: 'Vidyasaarathi NSF Scholarships (National Scholarship Foundation)',
      provider: 'Vidyasaarathi Portal (NSDL Corporate CSR)',
      description: 'CSR initiatives from various corporates supporting economically weaker students.',
      eligibilityCriteria: 'Undergraduates pursuing degree/diploma courses, family income under 3 LPA.',
      minCgpa: 6.0,
      maxIncome: 300000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-15'),
      amount: 25000,
      officialLink: 'https://www.vidyasaarathi.co.in',
      procedure: 'Create profile on Vidyasaarathi portal, apply to matching corporate schemes.',
      renewalInfo: 'Requires submission of 60%+ semester marks and promotion letter.',
      status: 'Active',
      requirements: [
        { documentType: 'Income Certificate', description: 'Income proof issued by local authority.' },
        { documentType: 'Bank Passbook', description: 'Bank passbook copy.' }
      ]
    },
    {
      name: 'INSPIRE Scholarship for Higher Education (SHE)',
      provider: 'Department of Science and Technology, Govt. of India',
      description: 'Attracts talented youth to study natural and basic sciences at BSc/MSc level.',
      eligibilityCriteria: 'Meritorious students within top 1% of Class 12 board exams.',
      minCgpa: 7.0,
      maxIncome: 600000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      amount: 80000,
      officialLink: 'http://www.online-inspire.gov.in',
      procedure: 'Apply online, attach Board advisory note showing top 1% standing.',
      renewalInfo: 'Based on maintaining 6.0+ CGPA in natural science program.',
      status: 'Active',
      requirements: [
        { documentType: 'Board Advisory Note', description: 'Class 12 board top 1% note.' }
      ]
    },
    {
      name: 'Syngenta Agriculture Scholars Scheme',
      provider: 'Syngenta Corporate Foundation',
      description: 'Scholarship for meritorious students pursuing B.Sc. in Agriculture or Horticulture.',
      eligibilityCriteria: 'First-year B.Sc Agriculture students in government agriculture colleges.',
      minCgpa: 6.5,
      maxIncome: 400000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Agriculture'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
      amount: 30000,
      officialLink: 'https://www.syngenta.co.in',
      procedure: 'Apply on Syngenta portal, verify local farm family details.',
      renewalInfo: 'Renewed based on passing previous sem exams.',
      status: 'Active',
      requirements: [
        { documentType: 'Admission Offer Letter', description: 'BSc Agriculture admission card.' },
        { documentType: 'Income Certificate', description: 'Family income certificate.' }
      ]
    },
    {
      name: 'Pre-Matric Scholarship for Minorities',
      provider: 'Ministry of Minority Affairs, Govt. of India',
      description: 'Encourages secondary education for minority students from class 1 to 10.',
      eligibilityCriteria: 'Minority students with family income under 1 LPA.',
      minCgpa: 4.5,
      maxIncome: 100000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-30'),
      amount: 3000,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Register on NSP, select Minority Pre-Matric.',
      renewalInfo: 'Submit passing marksheet of previous class.',
      status: 'Active',
      requirements: [
        { documentType: 'Self-Declaration Minority Proof', description: 'Minority proof.' }
      ]
    },
    {
      name: 'Google Lime Scholarship for Specially Abled Students in Computer Science',
      provider: 'Google Corp / Lime Connect',
      description: 'Corporate scholarship supporting computer science students with disabilities.',
      eligibilityCriteria: 'Undergraduates with visible/invisible disabilities pursuing Computer Science.',
      minCgpa: 7.0,
      maxIncome: 1200000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering'],
      stateEligibility: ['All'],
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-12-15'),
      amount: 150000,
      officialLink: 'https://www.limeconnect.com',
      procedure: 'Apply online, upload essays and transcripts.',
      renewalInfo: 'One-time scholarship award.',
      status: 'Active',
      requirements: [
        { documentType: 'Disability Certificate', description: 'Disability details proof.' }
      ]
    },
    {
      name: 'Ramanujan Postdoctoral Fellowship for Research and Innovation',
      provider: 'Science and Engineering Research Board, Govt. of India',
      description: 'Supports brilliant scientists and engineers returning to India for research.',
      eligibilityCriteria: 'PhD holders with design prototypes or international publication history.',
      minCgpa: 8.0,
      maxIncome: 1500000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-06-30'),
      amount: 500000,
      officialLink: 'http://www.serb.gov.in',
      procedure: 'Submit research proposal with nomination letter from host institute.',
      renewalInfo: 'Renewed annually based on technical review reports.',
      status: 'Active',
      requirements: [
        { documentType: 'Research Proposal', description: 'Research and prototype roadmap document.' }
      ]
    },
    {
      name: 'Bihar State Post-Matric Scholarship for Backward Classes',
      provider: 'Department of Backward Classes, Govt. of Bihar',
      description: 'State scholarship for BC/EBC students in Bihar.',
      eligibilityCriteria: 'Students belonging to BC/EBC categories in Bihar with family income under 3 LPA.',
      minCgpa: 5.0,
      maxIncome: 300000,
      eligibleCategories: ['OBC'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['Bihar'],
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-30'),
      amount: 9000,
      officialLink: 'https://pmsonline.bih.nic.in',
      procedure: 'Apply on Bihar PMS portal, upload domicile and caste certificates.',
      renewalInfo: 'Submit annual passing certificates.',
      status: 'Active',
      requirements: [
        { documentType: 'Caste Certificate', description: 'Bihar BC/EBC caste certificate.' },
        { documentType: 'Domicile Certificate', description: 'Bihar residency proof.' }
      ]
    },
    {
      name: 'Fair and Lovely Private Career Foundation Scholarship for Girls',
      provider: 'Hindustan Unilever Corporate Foundation',
      description: 'Private foundation scholarship supporting girls seeking vocational or professional degrees.',
      eligibilityCriteria: 'Girls aged 15-30 pursuing undergraduate degrees or professional vocational programs.',
      minCgpa: 6.0,
      maxIncome: 600000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['FEMALE'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-30'),
      amount: 25000,
      officialLink: 'https://www.glowandlovelycareers.in',
      procedure: 'Apply online, submit statement of purpose essay.',
      renewalInfo: 'One-time support award.',
      status: 'Active',
      requirements: [
        { documentType: 'Previous Marksheet', description: 'Class 12 marksheet.' }
      ]
    },
    {
      name: 'L’Oréal India For Young Women In Science Scholarship',
      provider: 'L’Oréal India Corporate CSR',
      description: 'Supports young women pursuing science graduation (BSc/BTech/MBBS) from India.',
      eligibilityCriteria: 'Girl students passing Class 12 board with minimum 85% in PCMB.',
      minCgpa: 7.5,
      maxIncome: 600000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['FEMALE'],
      courseEligibility: ['Engineering', 'Medical'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-10-15'),
      amount: 250000,
      officialLink: 'https://www.loreal.com/en/india',
      procedure: 'Apply online, pass general scientific test, clear final interview.',
      renewalInfo: 'Divided and paid across course years based on passing marks.',
      status: 'Active',
      requirements: [
        { documentType: 'Previous Marksheet', description: 'Class 12 board marksheet showing above 85%.' }
      ]
    },
    {
      name: 'Kerala State Higher Education Scholarship',
      provider: 'Kerala State Higher Education Council',
      description: 'Financial aid for first-year degree students in humanities, science, and commerce.',
      eligibilityCriteria: 'Students belonging to Kerala studying in Kerala government colleges.',
      minCgpa: 6.0,
      maxIncome: 500000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['Kerala'],
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-10-31'),
      amount: 12000,
      officialLink: 'http://www.kshec.kerala.gov.in',
      procedure: 'Apply online on Kerala Higher Education portal, submit printout to college registrar.',
      renewalInfo: 'Renewable annually on passing the previous semesters.',
      status: 'Active',
      requirements: [
        { documentType: 'Domicile Certificate', description: 'Kerala residency certificate.' }
      ]
    },
    {
      name: 'L&T Build India Scholarship for Civil & Electrical Engineering',
      provider: 'Larsen & Toubro Corporate CSR',
      description: 'Corporate sponsorship covering full M.Tech tuition fee for meritorious graduates.',
      eligibilityCriteria: 'Final year B.Tech Civil/Electrical graduates admitted to M.Tech at IIT Madras/Delhi.',
      minCgpa: 7.0,
      maxIncome: 1200000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering'],
      stateEligibility: ['All'],
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-05-15'),
      amount: 250000,
      officialLink: 'https://www.lntecc.com',
      procedure: 'Clear written aptitude test, followed by medical test and corporate interview.',
      renewalInfo: 'Fully sponsored course fee with monthly stipend of ₹13,400.',
      status: 'Active',
      requirements: [
        { documentType: 'Previous Marksheet', description: 'B.Tech marksheets.' }
      ]
    },
    {
      name: 'ONGC Scholarship Scheme for SC/ST Candidates',
      provider: 'ONGC Group Corporate Foundation',
      description: 'Financial support for SC/ST students studying engineering, MBBS, or MBA.',
      eligibilityCriteria: 'First-year SC/ST students with family income under 4.5 LPA.',
      minCgpa: 6.0,
      maxIncome: 450000,
      eligibleCategories: ['SC', 'ST'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Engineering', 'Medical'],
      stateEligibility: ['All'],
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-11-30'),
      amount: 48000,
      officialLink: 'https://www.ongcscholar.org',
      procedure: 'Apply online, submit hardcopy to ONGC regional office.',
      renewalInfo: 'Renewed subject to maintaining 60% or 6.0 CGPA marks annually.',
      status: 'Active',
      requirements: [
        { documentType: 'Caste Certificate', description: 'SC/ST community certificate.' },
        { documentType: 'Income Certificate', description: 'Family income certificate.' }
      ]
    },
    {
      name: 'Ministry of Agriculture Post-Matric Fellowship',
      provider: 'Indian Council of Agricultural Research (ICAR)',
      description: 'Fellowship for natural resource conservation studies and B.Sc Agriculture streams.',
      eligibilityCriteria: 'Undergraduates admitted to agricultural universities through AIEEA entrance.',
      minCgpa: 6.0,
      maxIncome: 500000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Agriculture'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-10-31'),
      amount: 36000,
      officialLink: 'https://icar.org.in',
      procedure: 'Submit application with AIEEA rank transcripts.',
      renewalInfo: 'Annual renewal based on performance reports.',
      status: 'Active',
      requirements: [
        { documentType: 'Previous Marksheet', description: 'ICAR Rank card.' }
      ]
    },
    {
      name: 'Narotam Sekhsaria Merit Scholarships for PG Studies',
      provider: 'Narotam Sekhsaria Foundation',
      description: 'Private foundation interest-free loan scholarship for postgraduates in India or abroad.',
      eligibilityCriteria: 'Indian graduates admitted to top global PG courses, age under 30.',
      minCgpa: 7.5,
      maxIncome: 1200000,
      eligibleCategories: ['General', 'OBC', 'SC', 'ST', 'Any'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-04-15'),
      amount: 2000000, // up to 20 Lakhs
      officialLink: 'https://pg.nsfoundation.co.in',
      procedure: 'Apply online, submit reference letters, clear core committee interview rounds.',
      renewalInfo: 'One-time disbursement structure.',
      status: 'Active',
      requirements: [
        { documentType: 'Admission Offer Letter', description: 'Global university enrollment confirmation letter.' }
      ]
    },
    {
      name: 'Dr. Ambedkar Post-Matric Scholarship for EBC Category',
      provider: 'Ministry of Social Justice & Empowerment, Govt. of India',
      description: 'Provides financial relief to Economically Backward Classes (EBC) students.',
      eligibilityCriteria: 'General category students (not SC/ST/OBC) with family income under 1 LPA.',
      minCgpa: 5.0,
      maxIncome: 100000,
      eligibleCategories: ['General'],
      genderEligibility: ['ANY'],
      courseEligibility: ['Any'],
      stateEligibility: ['All'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-10-31'),
      amount: 5000,
      officialLink: 'https://scholarships.gov.in',
      procedure: 'Apply via NSP, select Dr. Ambedkar EBC scheme.',
      renewalInfo: 'Renewed upon successful promotion to next class.',
      status: 'Active',
      requirements: [
        { documentType: 'Income Certificate', description: 'Annual family income certificate under 1 LPA.' }
      ]
    }
  ];

  for (const s of scholarshipsData) {
    const scholarship = await prisma.scholarship.create({
      data: {
        name: s.name,
        provider: s.provider,
        description: s.description,
        eligibilityCriteria: s.eligibilityCriteria,
        minCgpa: s.minCgpa,
        maxIncome: s.maxIncome,
        eligibleCategories: s.eligibleCategories,
        genderEligibility: s.genderEligibility,
        courseEligibility: s.courseEligibility,
        stateEligibility: s.stateEligibility,
        startDate: s.startDate,
        endDate: s.endDate,
        amount: s.amount,
        officialLink: s.officialLink,
        procedure: s.procedure,
        renewalInfo: s.renewalInfo,
        status: s.status,
      }
    });

    for (const req of s.requirements) {
      await prisma.scholarshipRequirement.create({
        data: {
          scholarshipId: scholarship.id,
          documentType: req.documentType,
          description: req.description,
        }
      });
    }
  }

  console.log('Database seeded with 30 diverse scholarships successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
