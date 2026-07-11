import crypto from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

if (GEMINI_API_KEY) {
  console.log('AI Guide: Active using Google Gemini API.');
} else if (OPENAI_API_KEY) {
  console.log('AI Guide: Active using OpenAI API.');
} else if (ANTHROPIC_API_KEY) {
  console.log('AI Guide: Active using Anthropic API.');
} else {
  console.warn('Warning: No AI API Key found (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY). AI Guide will run in fallback mock mode.');
}

export interface AIGuideContext {
  studentName: string;
  category: string;
  state: string;
  familyIncome: number;
  cgpa: number;
  dbtReadinessScore: number;
  bankName: string;
  maskedAccount: string;
  seedingStatus: string;
  uploadedDocuments: { documentType: string; status: string }[];
  schemesAvailable: { name: string; requirements: string[]; amount: number; deadline: string; description: string }[];
}

/**
 * Compiles the system instructions with student details and database schemes
 */
function buildSystemInstruction(context: AIGuideContext): string {
  const docsList = context.uploadedDocuments
    .map((d) => `- ${d.documentType}: ${d.status}`)
    .join('\n');

  const schemesList = context.schemesAvailable
    .map((s) => `- Name: ${s.name} (Amount: ₹${(s.amount || 0).toLocaleString('en-IN')}, Deadline: ${s.deadline || 'N/A'}) - ${s.description || ''} - Requires: ${(s.requirements || []).join(', ')}`)
    .join('\n');

  return `You are the official AI Guide of the Aadhaar DBT for Students Portal, representing the Department of Social Justice & Empowerment (DoSJE), Government of India.

Your primary mission is to answer questions about:
1. Aadhaar-linked accounts vs. DBT-seeded accounts (use the address delivery analogy: linking is like knowing your village name; seeding/NPCI mapping is like registering your exact home address so benefits are delivered instantly).
2. How to map or seed bank accounts on the NPCI database.
3. Scholarship eligibility criteria, deadlines, and application procedures.
4. Personalized scholarship recommendations based ONLY on the student profile data below.
5. Missing document alerts.

LANGUAGE BEHAVIOR (CRITICAL):
- Detect the language the student is writing in (English, Tamil, Hindi, or mixed Hinglish/Tanglish).
- You MUST reply in that same language. If they query in Tamil, reply in clean Tamil. If they query in Hinglish/Tanglish (Tamil or Hindi written in English alphabets), reply in similar easy-to-understand conversational language.

STRICT DATA RULES:
- Never disclose raw passwords or Aadhaar numbers.
- Refer ONLY to the masked bank account provided in the context.
- Keep your tone supportive, reassuring, and clear. Avoid overly dense administrative jargon.

STUDENT PROFILE DATA:
- Name: ${context.studentName}
- Social Category: ${context.category}
- State of Residence: ${context.state}
- Annual Family Income: ₹${context.familyIncome.toLocaleString('en-IN')}
- Current Academic CGPA / Marks: ${context.cgpa}
- Seeding Status: ${context.seedingStatus || 'Not Started'} (DBT Readiness Score: ${context.dbtReadinessScore || 0}%)
- Bank Name: ${context.bankName}
- Masked Bank Account: ${context.maskedAccount}

UPLOADED DOCUMENTS STATUS:
${docsList || 'None'}

AVAILABLE SCHOLARSHIP SCHEMES & REQUIREMENTS (FROM DATABASE):
${schemesList || 'None'}

When asked "What scholarships do I qualify for?", cross-reference their profile (Category, CGPA, Income, State) with the AVAILABLE SCHOLARSHIP SCHEMES to recommend the specific matched programs, and list what documents they are missing to apply.`;
}

/**
 * Call Google Gemini API
 */
async function callGemini(systemPrompt: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const contents = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error body:', errorBody);
    throw new Error(`Gemini API returned error ${response.status}: ${response.statusText} - ${errorBody}`);
  }

  const json: any = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API.');
  return text;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(systemPrompt: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned error: ${response.statusText}`);
  }

  const json: any = await response.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI API.');
  return text;
}

/**
 * Custom Knowledge-Base FAQ Router covering all 150+ specified question tags
 */
function checkFAQDatabase(msg: string, context: AIGuideContext): string | null {
  const q = msg.toLowerCase().trim();

  // Helper for check lists
  const docStatus = context.uploadedDocuments.map(d => `${d.documentType}: ${d.status}`).join('\n');
  const studentInfo = `Profile: CGPA: ${context.cgpa}, Category: ${context.category}, Income: ₹${context.familyIncome.toLocaleString('en-IN')}, State: ${context.state}.`;
  
  // Direct matching checks
  // 1. Aadhaar / Seeding / NPCI / DBT Basics
  if (q === 'what is aadhaar?' || q === 'what is aadhaar') {
    return `**What is Aadhaar?**
Aadhaar is a 12-digit unique identity number issued by the UIDAI (Unique Identification Authority of India) on behalf of the Government of India. It serves as a proof of identity and address across India and is mandatory to receive central and state government direct benefit transfers (DBT).`;
  }
  if (q.includes('what is dbt') || q.includes('use of dbt') || q === 'what is dbt?' || q === 'what is dbt') {
    return `**What is DBT (Direct Benefit Transfer)?**
Direct Benefit Transfer (DBT) is a major government reform initiative to transfer subsidies, scholarships, and benefits directly into the beneficiary's Aadhaar-seeded bank account. It eliminates middle-men, removes duplicates, and prevents leaks or delays in fund distribution.`;
  }
  if (q.includes('what is npci mapping') || q.includes('npci mapped account') || q.includes('purpose of npci') || q.includes('npci status')) {
    return `**What is NPCI Mapping?**
The National Payments Corporation of India (NPCI) operates the central database mapper. An NPCI-mapped account is a bank account that is registered with NPCI to receive Aadhaar-based payments. Under DBT, government portals send money to your Aadhaar number, and NPCI routes it directly to whichever bank account you have mapped. Only one bank account can be NPCI-mapped at a time.`;
  }
  if (q.includes('link my aadhaar with my bank account') || q.includes('what should i do if my bank account is not linked') || q.includes('difference between aadhaar linked and dbt enabled')) {
    return `**Aadhaar Linking vs. DBT Enabling (NPCI Seeding)**
- **Aadhaar Linking**: Simply means submitting your Aadhaar card to your bank for identity verification (KYC).
- **Aadhaar Seeding / DBT Enabling (NPCI Mapping)**: Instructs your bank to link your account to the central NPCI database to receive direct scholarship payments.
If your bank is not seeded, please log in to your Net Banking portal or visit your local bank branch to submit the **NPCI Consent Form** (available in our Awareness Center page).`;
  }
  if (q.includes('what is aadhaar seeding') || q.includes('how can i seed my aadhaar')) {
    return `**How to seed Aadhaar with Bank Account?**
1. **Net Banking**: Log in, search for "Aadhaar Seeding/NPCI Mapping," enter your 12-digit Aadhaar number, and verify with OTP.
2. **Offline**: Download the NPCI Consent Form, fill it in, and submit it directly to your bank teller. It usually takes 2-3 working days to activate.`;
  }
  if (q.includes('verify my aadhaar') || q.includes('aadhaar is active')) {
    return `**How to verify if Aadhaar is active:**
Go to the official UIDAI website (resident.uidai.gov.in/aadhaarverification) or open the mAadhaar application. Enter your Aadhaar number and captcha to verify if your status is Active. You should also verify that your correct mobile number is linked for receiving OTPs.`;
  }
  if (q.includes('e-kyc') || q.includes('ekyc')) {
    return `**What is e-KYC?**
e-KYC (Electronic Know Your Customer) is a secure paperless process to verify your identity using Aadhaar authentication. Government scholarship systems require e-KYC to verify your name, age, and address details. You can complete it in your student profile wizard by submitting OTP received on your Aadhaar-registered mobile.`;
  }
  if (q.includes('parent\'s bank account') || q.includes('parents bank account')) {
    return `**Can I use my parent's bank account for scholarships?**
No, you cannot use your parents' bank account. The scholarship bank account must belong to the student applying for the scheme, and it must be mapped to your own Aadhaar card on the NPCI database. Payments to third-party accounts will fail the DBT verification.`;
  }

  // 2. Scholarship Discovery & Application Procedures
  if (q.includes('what are government scholarships') || q.includes('types of scholarship')) {
    return `**Government Scholarships Overview**
Government scholarships are financial benefits funded by Central and State ministries. Categories include Merit-based, Income-based, Minority schemes, Category-specific (SC/ST/OBC), Girl Student scholarships, First Graduate programs, and Professional Course support (Engineering/Medical/Agriculture).`;
  }
  if (q.includes('how can i apply for scholarships') || q.includes('application process for scholarships') || q.includes('steps after submitting')) {
    return `**How to Apply for Scholarships:**
1. Complete your student profile and check eligible matches on our portal.
2. Visit the [National Scholarship Portal (NSP)](https://scholarships.gov.in).
3. Register using your Aadhaar-linked mobile number.
4. Complete the online form, upload required certificates, and submit.
5. Your college will verify your academic documents, which are then routed to state officers for DBT approval.`;
  }
  if (q.includes('who is eligible') || q.includes('how can i check if i am eligible') || q.includes('how is eligibility calculated') || q.includes('know which scholarships i am eligible for')) {
    return `**How Scholarship Eligibility is Determined:**
Eligibility is automatically calculated by matching your profile fields with the scheme rules:
- **Academics**: Your CGPA must meet the minimum threshold (e.g. 8.0 for Central Sector, 6.0 for AICTE).
- **Financial Status**: Annual family income must be below the limit (e.g. 2.5 Lakhs for SC/ST, 4.5 Lakhs for Central Sector).
- **Social Demographics**: Category (SC, ST, OBC, General), gender, residency state, and course of study (e.g., Engineering, Medical).`;
  }
  if (q.includes('what documents are required') || q.includes('documents required for scholarship applications') || q.includes('can i apply without')) {
    return `**Required Documents Checklist:**
Common documents include:
- Caste/Community Certificate (for reservation schemes)
- Income Certificate (issued by Tahsildar/SDM)
- Marksheet of previous class/semester
- Bank Passbook with visible IFSC and Account Number
- Bonafide Student Certificate from your college
- Aadhaar Card copy
*Note: You cannot apply without verified Income and Community Certificates if the scheme strictly targets income or caste classes.*`;
  }
  if (q.includes('national scholarship portal') || q.includes('nsp scholarship') || q.includes('what is the nsp') || q.includes('register on the scholarship portal')) {
    return `**What is the National Scholarship Portal (NSP)?**
The National Scholarship Portal (NSP) is the digital gateway of the Government of India for applying, processing, and distributing central, state, and UGC scholarships. You can register on scholarships.gov.in using your Aadhaar number.`;
  }
  if (q.includes('bonafide certificate')) {
    return `**What is a Bonafide Certificate?**
A Bonafide Certificate is an official document issued by your college registrar or principal verifying that you are currently enrolled as a regular student in that institution. It is a mandatory document for almost all scholarship applications.`;
  }
  if (q.includes('income certificate required') || q.includes('why is a community certificate required')) {
    return `**Why are Income and Community Certificates required?**
- **Income Certificate**: Verifies that your family's annual income is below the scholarship's financial limit.
- **Community Certificate**: Verifies your social category (SC/ST/OBC/MBC) to check eligibility for reserved government schemes. Both must be issued by a competent revenue officer (like Tahsildar).`;
  }
  if (q.includes('income limit for scholarships')) {
    return `**General Scholarship Family Income Limits:**
- SC/ST Post-Matric: ₹2,50,000 / year
- OBC Post-Matric: ₹1,50,000 / year
- Minority Post-Matric: ₹2,00,000 / year
- Central Sector Scheme: ₹4,50,000 / year
- AICTE Pragati & Saksham: ₹8,00,000 / year`;
  }
  if (q.includes('what is a minority scholarship') || q.includes('what is a merit scholarship') || q.includes('what is a post-matric scholarship') || q.includes('what is a pre-matric scholarship')) {
    return `**Scholarship Scheme Classifications:**
- **Pre-Matric**: For students studying in classes 1 to 10.
- **Post-Matric**: For students pursuing intermediate, diploma, undergraduate, and postgraduate studies.
- **Merit-based**: Awarded strictly on academic score percentiles (e.g. above 80%).
- **Minority**: Dedicated for students belonging to notified minority communities (Muslims, Sikhs, Christians, Buddhists, Jains, Parsis).`;
  }

  // 3. Application Operations & Statuses
  if (q.includes('how do i upload documents') || q.includes('file formats are allowed') || q.includes('maximum file size') || q.includes('upload a new document') || q.includes('delete uploaded')) {
    return `**Document Upload Instructions:**
1. Scan your documents clearly using a mobile scanner.
2. Ensure files are in **PDF or JPEG** format.
3. Maximum allowed file size is usually **200 KB** per document on the NSP portal.
4. Go to Step 3 of the Profile Wizard to upload documents, or upload them directly on NSP during application.`;
  }
  if (q.includes('edit my application') || q.includes('save my application and continue later') || q.includes('enter incorrect information')) {
    return `**Editing Applications:**
- On our portal: You can update your profile details anytime by clicking on the Wizard options.
- On NSP: You can save your draft application and edit details multiple times. However, once you click **"Final Submit"**, you cannot edit your application unless it is marked as defective and returned to you by your college registrar.`;
  }
  if (q.includes('track my application status') || q.includes('status of my scholarship') || q.includes('why is my application still pending')) {
    return `**Tracking Your Application:**
Log in to your account dashboard on the National Scholarship Portal (NSP) or state portal. It will show the current progress level (e.g., "Verification Pending at Institute," "Pending at State Board," or "Approved by Ministry"). Institutional verification is the first step and usually takes 1-2 weeks.`;
  }
  if (q.includes('under review') || q.includes('approved') || q.includes('rejected') || q.includes('rejection') || q.includes('appeal against')) {
    return `**Understanding Application Statuses:**
- **Under Review**: Your documents are being verified by either the college or ministry officers.
- **Approved**: Your application has passed verification, and the scholarship amount is scheduled for DBT disbursement.
- **Rejected**: Your application was denied. Common reasons include exceeding the income limit, mismatch in names, or uploading incorrect certificates. You can re-apply by correcting the documents if the portal opens the correction window.`;
  }

  // 4. DBT Payments & Timeline
  if (q.includes('how long does scholarship approval take') || q.includes('when will the scholarship amount be credited') || q.includes('how long does dbt payment take') || q.includes('delayed') || q.includes('failed')) {
    return `**Scholarship DBT Timelines & Delays:**
- **Approval Time**: Typically takes 1 to 3 months after college verification.
- **Disbursement**: Payments are usually credited during the final quarter of the academic year.
- **Delays / Failures**: Usually happen if your bank account is inactive, frozen due to low transactions, or if your Aadhaar is not seeded on the NPCI database (which prevents DBT routing). Ensure your account is active and mapped!`;
  }
  if (q.includes('dbt credited') || q.includes('check if my scholarship amount is credited') || q.includes('payment history') || q.includes('status of my dbt payment')) {
    return `**Checking if DBT payment is credited:**
1. Check your bank account statement for entries with "DBT" or "PFMS" (Public Financial Management System).
2. Visit the PFMS portal (pfms.nic.in) and click "Track NSP Payments" or "Know Your Payment" by entering your account details or Aadhaar number.
3. You will receive an SMS from your bank when a DBT transaction occurs.`;
  }
  if (q.includes('update my ifsc') || q.includes('change my bank account number') || q.includes('correct my bank account details')) {
    return `**How to update Bank Account / IFSC Details:**
You can update your bank details in Step 4 of our profile wizard. On NSP, you can update your account number and IFSC details if your application is marked as "Defective" by the college registrar. Note that your bank account name MUST match the name on your Aadhaar card.`;
  }

  // 5. Special Schemes & Specific Targets
  if (q.includes('pm scholarship') || q.includes('pmss')) {
    return `**Prime Minister Scholarship Scheme (PMSS):**
Provides financial assistance to the wards and widows of deceased or retired Central Armed Police Forces (CAPF) and Assam Rifles personnel for pursuing professional degree courses (Engineering, Medical, Agriculture, etc.). Eligible candidates get up to ₹36,000 annually.`;
  }
  if (q.includes('central sector scholarship') || q.includes('central sector scheme')) {
    return `**Central Sector Scheme of Scholarship (CSSS):**
Offered by the Ministry of Education, Govt of India, for college and university students. Meritorious students who score above the 80th percentile in class 12 and have a family income under ₹4,50,000/year receive ₹20,000/year to cover higher education costs.`;
  }
  if (q.includes('sc scholarship') || q.includes('st scholarship') || q.includes('obc scholarship') || q.includes('bc scholarship') || q.includes('minority scholarship')) {
    return `**Social Category Scholarships:**
- **SC Post-Matric**: Max family income limit is ₹2,50,000/year. Fully covers course fee.
- **ST Post-Matric**: Max income limit is ₹2,50,000/year. Sponsored by Ministry of Tribal Affairs.
- **OBC/BC/MBC Post-Matric**: Max income limit is ₹1,50,000/year (or ₹3,00,000 for BC EBC in states like Bihar/Tamil Nadu).`;
  }
  if (q.includes('engineering') || q.includes('ece student')) {
    return `**Scholarships for Engineering Students:**
Top options include:
- AICTE Pragati (for female students: up to ₹50,000/year)
- Saksham Scholarship (for disabled students: up to ₹50,000/year)
- Reliance Foundation Undergraduate Scholarships (up to ₹2,00,000/year)
- Aditya Birla Scholarships (merit-based in premier institutes: up to ₹1,00,000/year)
- L&T Build India Scholarship (for Civil/Electrical M.Tech).`;
  }
  if (q.includes('girls') || q.includes('female') || q.includes('single girl')) {
    return `**Scholarships for Girls:**
- **AICTE Pragati Scheme**: ₹50,000/year for girls pursuing technical degrees.
- **Indira Gandhi Single Girl Child Scholarship**: PG scholarship of ₹36,200/year for single girl children.
- **L’Oréal India Young Women in Science**: Up to ₹2,50,000 for girls pursuing natural science degrees.
- **Fair & Lovely Career Foundation Scholarship**: Supports vocational or professional degree courses.`;
  }
  if (q.includes('first graduate') || q.includes('first-year student') || q.includes('college student') || q.includes('diploma') || q.includes('pg student') || q.includes('private college') || q.includes('rural student') || q.includes('hosteller') || q.includes('day scholar')) {
    return `**Specific Student Scopes:**
- **First Graduate Scheme**: Tuition fee waiver (e.g. ₹25,000/year in Tamil Nadu) for students who are the first graduates in their families.
- **College / PG / Diploma**: Eligible for State and Central Post-Matric schemes, provided the college is UGC-recognized.
- **Hostellers vs Day Scholars**: Post-matric schemes provide a higher maintenance allowance/hostel fee stipend for hostellers compared to day scholars.`;
  }
  if (q.includes('disabled') || q.includes('differently-abled') || q.includes('specially abled')) {
    return `**Scholarships for Disabled Students:**
- **Saksham Scholarship (AICTE)**: Provides ₹50,000/year for students with >40% disability pursuing technical degree/diploma courses.
- **National Fellowship for Persons with Disabilities (NFPwD)**: Supports postgraduate research and higher studies. Requires an official disability certificate.`;
  }
  if (q.includes('ews') || q.includes('economically weaker') || q.includes('dr. ambedkar post-matric scholarship for ebc')) {
    return `**Scholarships for EWS/EBC Students:**
- **Dr. Ambedkar Post-Matric Scheme for EBC**: For general category students with a family income under ₹1,00,000/year.
- **Vidyasaarathi NSF Scholarships**: Corporate CSR schemes supporting economically weaker students.`;
  }
  if (q.includes('sports')) {
    return `**National Sports Talent Search Scheme Scholarship:**
Identifies and supports state-level and national-level winners aged 8-18 in Olympic sports. Provides training stidends and ₹15,000 scholarship support.`;
  }

  // 6. Rules, Limits, and General Queries
  if (q.includes('apply for more than one') || q.includes('receive two scholarships')) {
    return `**Multiple Scholarship Applications Rules:**
- **Can I apply for more than one?** Yes, you can submit applications for multiple schemes to check matching eligibility.
- **Can I receive two scholarships?** **No.** Under government regulations, you can only claim one government scholarship in an academic year. If you qualify for multiple, you must choose one and decline the others. Receiving multiple direct transfers for the same academic session can lead to blacklisting.`;
  }
  if (q.includes('is aadhaar mandatory') || q.includes('is npci mapping mandatory') || q.includes('apply for scholarships without aadhaar')) {
    return `**Is Aadhaar & NPCI Mapping mandatory?**
Yes, Aadhaar is mandatory for all Central and State DBT scholarship schemes. NPCI mapping is also mandatory because the treasury uses Aadhaar-based payments to transfer funds. If you do not have Aadhaar or NPCI mapping, the portal cannot verify your account and the DBT transaction will fail.`;
  }
  if (q.includes('update my mobile number') || q.includes('mobile number in aadhaar')) {
    return `**How to update your mobile number in Aadhaar:**
You must visit your nearest authorized **Aadhaar Enrollment Center**. Biometric authentication (fingerprint/iris scan) is required to update details. It cannot be done online. Once updated, you will receive OTPs on your new mobile number.`;
  }
  if (q.includes('download my application receipt') || q.includes('print my application') || q.includes('reference number') || q.includes('download my scholarship certificate')) {
    return `**Receipts, Certificates, and Reference Numbers:**
After final submission on the National Scholarship Portal, a permanent **Application ID / Reference Number** is generated. You can download and print the application form directly from your dashboard's "Print Application" section. No separate certificate is issued until the scheme is fully completed.`;
  }
  if (q.includes('reset my password') || q.includes('change my profile') || q.includes('update my income') || q.includes('update my category') || q.includes('change my email') || q.includes('update my mobile number in the portal')) {
    return `**Updating Portal Settings:**
- **Password**: Click "Forgot Password" on the login screen to receive a reset link on your registered email.
- **Profile / Income / Category / Email**: Go to the Profile Wizard on our portal to update your credentials. Ensure all inputs match your official Government certificates to avoid verification failure.`;
  }
  if (q.includes('report a problem') || q.includes('contact the administrator') || q.includes('contact scholarship support') || q.includes('get help') || q.includes('contact the scholarship department')) {
    return `**Support Details:**
- **NSP Helpdesk**: Call 0120-6619540 or email helpdesk@nsp.gov.in.
- **Our Portal Support**: Reach out to the System Administrator by visiting the support dashboard or downloading the portal handbook from the Awareness Center page.`;
  }
  if (q.includes('benefits of using') || q.includes('how can this portal help') || q.includes('benefits of scholarships')) {
    return `**Benefits of our Aadhaar DBT Awareness Portal:**
This platform empowers students by offering:
- Instant matching with 30+ scholarship schemes.
- A 3-step visual DBT tracker resolving Aadhaar-bank mapping confusion.
- Live multi-lingual AI Guide answering questions in English, Tamil, and Hindi.
- Full security with encrypted at-rest bank details.`;
  }

  // Not matched by specific FAQs
  return null;
}

/**
 * Localized Fallback Mock Response Generator (for Offline Testing)
 */
function getOfflineMockResponse(userMessage: string, context: AIGuideContext): string {
  const msg = userMessage.toLowerCase().trim();
  const name = context.studentName || 'Student';

  // 1. Intercept with custom FAQ Database lookup first!
  const faqAnswer = checkFAQDatabase(msg, context);
  if (faqAnswer) {
    return faqAnswer;
  }

  // Build dynamic scholarship list from context
  const topSchemes = context.schemesAvailable.slice(0, 5);
  const schemeList = topSchemes.map(s =>
    `• **${s.name}** — ₹${(s.amount || 0).toLocaleString('en-IN')} (Deadline: ${s.deadline || 'N/A'})`
  ).join('\n');

  // Missing documents
  const missingDocs = context.uploadedDocuments.filter(d => d.status === 'MISSING').map(d => d.documentType);
  const missingDocsText = missingDocs.length > 0
    ? `⚠️ **Missing Documents**: ${missingDocs.join(', ')}. Please upload these to complete your applications.`
    : '✅ All required documents are uploaded.';

  // --- Tamil detection ---
  const isTamil = !!msg.match(/[\u0B80-\u0BFF]/) || ['enna', 'iruka', 'vanakkam', 'epdi', 'eppadi', 'yenna', 'aadhaar enna', 'scholarship enna', 'dbt enna', 'naan', 'ennaku', 'enakku', 'ethana', 'evlo', 'panna', 'pannanum', 'seiyanum', 'vendum', 'thaguthi', 'vasathi', 'kalvi', 'panam', 'vaangu', 'vaanga', 'apply panna', 'mudiyuma'].some(t => msg.includes(t));

  // --- Hindi detection ---
  const isHindi = !!msg.match(/[\u0900-\u097F]/) || ['kya hai', 'kaise', 'bataiye', 'batao', 'mujhe', 'kaun sa', 'chahiye', 'milega', 'kab tak', 'kahan', 'konsa', 'kitna', 'apply kaise', 'scholarship kya', 'dbt kya', 'aadhaar kya', 'document kya', 'paisa kab'].some(t => msg.includes(t));

  // ==================== TAMIL RESPONSES ====================
  if (isTamil) {
    const tamilSchemes = topSchemes.map(s => `• **${s.name}** — ₹${(s.amount || 0).toLocaleString('en-IN')}`).join('\n');

    if (msg.includes('dbt') || msg.includes('seed') || msg.includes('link') || msg.includes('npci') || msg.includes('சீடிங்') || msg.includes('இணைப்பு')) {
      return `வணக்கம் ${name}! 🙏\n\n**ஆதார் இணைப்பு vs DBT சீடிங் — என்ன வேறுபாடு?**\n\n1. **ஆதார் இணைப்பு (Linking)** = உங்கள் வங்கி கணக்கில் ஆதார் எண்ணை KYC-க்காக இணைப்பது. இது உங்கள் அடையாளத்தை உறுதிப்படுத்துகிறது.\n\n2. **DBT சீடிங் (NPCI Mapping)** = உங்கள் ஆதார் எண்ணை NPCI தரவுத்தளத்தில் உங்கள் வங்கி கணக்குடன் மேப்பிங் செய்வது. இது செய்தால் மட்டுமே அரசு உதவித்தொகை நேரடியாக உங்கள் கணக்கிற்கு வரும்.\n\n**உங்கள் தற்போதைய நிலை**: ${context.seedingStatus} (${context.dbtReadinessScore}% தயார்)\n\n**செய்ய வேண்டியவை:**\n• நெட் பேங்கிங் மூலம் சீடிங் கோரிக்கை சமர்ப்பிக்கவும்\n• mAadhaar அல்லது UIDAI போர்டலில் நிலையை சரிபார்க்கவும்\n• வங்கி கிளையில் NPCI ஒப்புதல் படிவத்தை சமர்ப்பிக்கவும்`;
    }

    if (msg.includes('scholarship') || msg.includes('உதவித்தொகை') || msg.includes('ஸ்காலர்ஷிப்') || msg.includes('thaguthi') || msg.includes('தகுதி') || msg.includes('apply') || msg.includes('எவ்வளவு') || msg.includes('panam')) {
      return `வணக்கம் ${name}! 🎓\n\n**உங்கள் சுயவிவரத்தின்படி பரிந்துரைக்கப்படும் உதவித்தொகைகள்:**\n\n${tamilSchemes}\n\n**உங்கள் தகுதி விவரங்கள்:**\n• வகை: ${context.category}\n• CGPA: ${context.cgpa}\n• குடும்ப வருமானம்: ₹${(context.familyIncome || 0).toLocaleString('en-IN')}\n• மாநிலம்: ${context.state}\n\n${missingDocsText}\n\n**விண்ணப்பிக்க:** National Scholarship Portal (scholarships.gov.in) இல் பதிவு செய்து, உங்கள் ஆவணங்களை பதிவேற்றி, கல்லூரி ஒப்புதல் பெறவும்.`;
    }

    if (msg.includes('document') || msg.includes('ஆவணம்') || msg.includes('certificate') || msg.includes('upload')) {
      return `${name}, உங்கள் ஆவண நிலை:\n\n${context.uploadedDocuments.map(d => `• ${d.documentType}: ${d.status === 'VERIFIED' ? '✅ சரிபார்க்கப்பட்டது' : '❌ விடுபட்டது'}`).join('\n')}\n\n**பொதுவாக தேவைப்படும் ஆவணங்கள்:**\n• சாதி சான்றிதழ் (Caste Certificate)\n• வருமான சான்றிதழ் (Income Certificate)\n• வங்கி பாஸ்புக் (Bank Passbook)\n• முந்தைய மதிப்பெண் பட்டியல் (Previous Marksheet)\n• ஆதார் அட்டை நகல்`;
    }

    return `வணக்கம் ${name}! 🙏 நான் உங்கள் ஆதார் DBT உதவி வழிகாட்டி. நீங்கள் எதைப்பற்றியும் கேட்கலாம்: உதவித்தொகைகள், ஆதார் இணைப்பு, DBT மேப்பிங், காலக்கெடு, தேவையான ஆவணங்கள் போன்ற அனைத்து விவரங்களுக்கும் என்னிடம் பதில் உள்ளது!`;
  }

  // ==================== HINDI RESPONSES ====================
  if (isHindi) {
    const hindiSchemes = topSchemes.map(s => `• **${s.name}** — ₹${(s.amount || 0).toLocaleString('en-IN')}`).join('\n');

    if (msg.includes('dbt') || msg.includes('seed') || msg.includes('link') || msg.includes('npci') || msg.includes('आधार') || msg.includes('सीडिंग')) {
      return `नमस्ते ${name}! 🙏\n\n**आधार लिंकिंग vs DBT सीडिंग — क्या फ़र्क है?**\n\n1. **आधार लिंकिंग** = बैंक में KYC के लिए आधार नंबर जोड़ना। यह सिर्फ पहचान प्रमाण है।\n\n2. **DBT सीडिंग (NPCI मैपिंग)** = NPCI डेटाबेस पर आपके आधार को बैंक खाते से मैप करना। **बिना सीडिंग के छात्रवृत्ति का पैसा सीधे खाते में नहीं आएगा।**\n\n**आपकी वर्तमान स्थिति**: ${context.seedingStatus} (${context.dbtReadinessScore}% तैयार)\n\n**क्या करें:**\n• नेट बैंकिंग से सीडिंग रिक्वेस्ट दें\n• mAadhaar या UIDAI पोर्टल पर स्टेटस चेक करें\n• बैंक ब्रांच में NPCI कंसेंट फॉर्म जमा करें`;
    }

    if (msg.includes('scholarship') || msg.includes('छात्रवृत्ति') || msg.includes('eligible') || msg.includes('योग्यता') || msg.includes('apply') || msg.includes('कितना') || msg.includes('पैसा')) {
      return `नमस्ते ${name}! 🎓\n\n**आपकी प्रोफाइल के अनुसार छात्रवृत्तियाँ:**\n\n${hindiSchemes}\n\n**आपकी योग्यता:**\n• श्रेणी: ${context.category}\n• CGPA: ${context.cgpa}\n• पारिवारिक आय: ₹${(context.familyIncome || 0).toLocaleString('en-IN')}\n• राज्य: ${context.state}\n\n${missingDocsText}\n\n**आवेदन करने के लिए:** National Scholarship Portal (scholarships.gov.in) पर रजिस्टर करें, डॉक्यूमेंट अपलोड करें, और कॉलेज अप्रूवल लें।`;
    }

    return `नमस्ते ${name}! 🙏 मैं आपका आधार DBT गाइड हूँ। आप मुझसे छात्रवृत्ति, आधार सीडिंग, आवश्यक दस्तावेज और अंतिम तिथियों के बारे में कुछ भी पूछ सकते हैं।`;
  }

  // English fallback default
  return `Hello ${name}! 🙏\n\nI'm your Aadhaar DBT Scholarship Guide. Here's a quick summary of your profile:\n\n**📊 Your Profile:**\n• Category: ${context.category} | CGPA: ${context.cgpa}\n• Income: ₹${(context.familyIncome || 0).toLocaleString('en-IN')} | State: ${context.state}\n• DBT Readiness: ${context.dbtReadinessScore}% | Bank: ${context.bankName}\n\n**🎓 Top Scholarships For You:**\n${schemeList || 'Complete your profile to see matching scholarships.'}\n\n**📄 Document Status:**\n${missingDocsText}\n\n**Ask me about:**\n• Scholarships → "What scholarships can I apply for?"\n• DBT Seeding → "How do I seed my bank account?"\n• Documents → "What documents do I need?"\n• Deadlines → "When are the deadlines?"\n• Aadhaar → "How to check Aadhaar mapping?"\n• CGPA → "What CGPA do I need?"\n\nI support **English, Tamil (தமிழ்), and Hindi (हिंदी)**! 🌐`;
}

/**
 * Primary AI Chat Router with retry logic for rate limits
 */
export async function getAIChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context: AIGuideContext
): Promise<string> {
  const systemPrompt = buildSystemInstruction(context);
  const lastUserMsg = messages[messages.length - 1]?.content || '';

  // 1. Check custom offline FAQ first to ensure immediate matching for core query set
  const faqAnswer = checkFAQDatabase(lastUserMsg, context);
  if (faqAnswer) {
    return faqAnswer;
  }

  // 2. Try Gemini API with retry for rate limits
  if (GEMINI_API_KEY) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callGemini(systemPrompt, messages);
      } catch (err) {
        const errMsg = (err as Error).message || '';
        console.error(`Gemini API attempt ${attempt + 1} failed:`, errMsg);
        
        // If rate limited (429), wait and retry
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          const waitMs = (attempt + 1) * 5000; // 5s, 10s, 15s
          console.log(`Rate limited. Waiting ${waitMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }
        // For non-rate-limit errors, break immediately
        break;
      }
    }
  }

  // 3. Try OpenAI API
  if (OPENAI_API_KEY) {
    try {
      return await callOpenAI(systemPrompt, messages);
    } catch (err) {
      console.error('OpenAI API call failed:', (err as Error).message);
    }
  }

  // 4. Comprehensive knowledge-base fallback
  return getOfflineMockResponse(lastUserMsg, context);
}
