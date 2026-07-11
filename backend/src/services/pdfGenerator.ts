import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates a beautiful, high-contrast, government-style PDF awareness poster
 * for students on Gram Panchayat or notice boards.
 */
export async function generateAwarenessPoster(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Standard A4 dimensions in points: 595.27 x 841.89 (width x height)
  const page = pdfDoc.addPage([595.27, 841.89]);
  const width = page.getWidth();
  const height = page.getHeight();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Draw Navy blue primary header block
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(10 / 255, 38 / 255, 71 / 255), // Navy blue: #0A2647
  });

  // 2. Draw Saffron and Green accent stripes underneath the header
  page.drawRectangle({
    x: 0,
    y: height - 106,
    width: width,
    height: 6,
    color: rgb(255 / 255, 153 / 255, 51 / 255), // Saffron: #FF9933
  });
  page.drawRectangle({
    x: 0,
    y: height - 112,
    width: width,
    height: 6,
    color: rgb(15 / 255, 139 / 255, 69 / 255), // Green: #0F8B45
  });

  // 3. Header Text
  page.drawText('SCHOLARSHIP DBT & AADHAAR SEEDING', {
    x: 40,
    y: height - 48,
    size: 22,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Ministry of Social Justice & Empowerment, Government of India', {
    x: 40,
    y: height - 72,
    size: 12,
    font: font,
    color: rgb(240 / 255, 240 / 255, 240 / 255),
  });

  // 4. Poster Body - Background color (Cream/Off-white #FBF8F2)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height - 112,
    color: rgb(251 / 255, 248 / 255, 242 / 255),
  });

  // 5. Section 1: The Core Difference (Aadhaar Linked vs. DBT Seeded)
  page.drawText('IMPORTANT NOTICE FOR ALL SCHOLARSHIP APPLICANTS', {
    x: 40,
    y: height - 150,
    size: 15,
    font: boldFont,
    color: rgb(10 / 255, 38 / 255, 71 / 255),
  });

  // Drawing Box 1 (Aadhaar-Linked Bank Account)
  page.drawRectangle({
    x: 40,
    y: height - 290,
    width: 240,
    height: 110,
    color: rgb(255 / 255, 255 / 255, 255 / 255),
    borderColor: rgb(220 / 255, 220 / 255, 220 / 255),
    borderWidth: 1,
  });
  
  page.drawRectangle({
    x: 40,
    y: height - 195,
    width: 240,
    height: 15,
    color: rgb(255 / 255, 153 / 255, 51 / 255), // Saffron header
  });

  page.drawText('1. Aadhaar Linked Account', {
    x: 50,
    y: height - 192,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText('• Means your bank associated your 12-digit\n  Aadhaar number with your account.\n• Good for identity validation.\n• DOES NOT guarantee automatic receipt\n  of government scholarship funds.', {
    x: 50,
    y: height - 275,
    size: 9,
    font: font,
    color: rgb(50 / 255, 50 / 255, 50 / 255),
    lineHeight: 14,
  });

  // Drawing Box 2 (DBT-Seeded Account)
  page.drawRectangle({
    x: 315,
    y: height - 290,
    width: 240,
    height: 110,
    color: rgb(255 / 255, 255 / 255, 255 / 255),
    borderColor: rgb(220 / 255, 220 / 255, 220 / 255),
    borderWidth: 1,
  });
  
  page.drawRectangle({
    x: 315,
    y: height - 195,
    width: 240,
    height: 15,
    color: rgb(15 / 255, 139 / 255, 69 / 255), // Green header
  });

  page.drawText('2. DBT Seeded Account (NPCI)', {
    x: 325,
    y: height - 192,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('• Your account is mapped on the central\n  NPCI (National Payments Corporation of India) mapper.\n• Government scholarship funds are sent via\n  Aadhaar Number directly to this account.\n• MANDATORY for Pre/Post-Matric schemes.', {
    x: 325,
    y: height - 275,
    size: 9,
    font: font,
    color: rgb(50 / 255, 50 / 255, 50 / 255),
    lineHeight: 14,
  });

  // 6. Section 2: Step-by-Step DBT Seeding Checklist
  page.drawText('HOW TO SEED YOUR BANK ACCOUNT FOR DBT', {
    x: 40,
    y: height - 340,
    size: 14,
    font: boldFont,
    color: rgb(10 / 255, 38 / 255, 71 / 255),
  });

  const steps = [
    { num: 'STEP 1', title: 'Visit your Bank Branch', desc: 'Ask for the "Aadhaar Seeding and NPCI Mapping Consent Form" from the bank executive.' },
    { num: 'STEP 2', title: 'Fill & Attach Aadhaar Copy', desc: 'Fill the form completely, enter your bank account and sign. Attach a self-attested copy of your Aadhaar card.' },
    { num: 'STEP 3', title: 'Submit & Get Receipt', desc: 'Submit the form. Ensure the clerk checks the "Map on NPCI mapper" checkbox and gives you an acknowledgment receipt.' },
    { num: 'STEP 4', title: 'Verify Online', desc: 'After 3-4 days, check the seeding status via the mAadhaar App or the official UIDAI resident portal.' }
  ];

  let currentY = height - 380;
  steps.forEach((step) => {
    // Number Circle representation
    page.drawRectangle({
      x: 40,
      y: currentY - 5,
      width: 50,
      height: 18,
      color: rgb(10 / 255, 38 / 255, 71 / 255),
    });
    page.drawText(step.num, {
      x: 46,
      y: currentY,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(step.title, {
      x: 100,
      y: currentY + 3,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(step.desc, {
      x: 100,
      y: currentY - 14,
      size: 9.5,
      font: font,
      color: rgb(80 / 255, 80 / 255, 80 / 255),
    });

    currentY -= 45;
  });

  // 7. Section 3: Pre-Matric & Post-Matric Scholarships details
  page.drawText('AVAILABLE SCHOLARSHIP SCHEMES (DoSJE)', {
    x: 40,
    y: currentY - 20,
    size: 14,
    font: boldFont,
    color: rgb(10 / 255, 38 / 255, 71 / 255),
  });

  page.drawRectangle({
    x: 40,
    y: currentY - 130,
    width: 515,
    height: 100,
    color: rgb(255 / 255, 255 / 255, 255 / 255),
    borderColor: rgb(220 / 255, 220 / 255, 220 / 255),
    borderWidth: 1,
  });

  page.drawText('1. Pre-Matric Scholarship Schemes:', {
    x: 55,
    y: currentY - 55,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText('• For students studying in Class 9 and 10.\n• Helps families meet early secondary education costs and supports retention.', {
    x: 55,
    y: currentY - 80,
    size: 9.5,
    font: font,
    color: rgb(80 / 255, 80 / 255, 80 / 255),
    lineHeight: 13,
  });

  page.drawText('2. Post-Matric Scholarship Schemes:', {
    x: 300,
    y: currentY - 55,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText('• For studies after Class 10 (ITI, Diploma, UG, PG, and Professional courses).\n• Covers tuition fees, maintenance charges, and online study allowances.', {
    x: 300,
    y: currentY - 80,
    size: 9.5,
    font: font,
    color: rgb(80 / 255, 80 / 255, 80 / 255),
    lineHeight: 13,
  });

  // Footer banner
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 45,
    color: rgb(10 / 255, 38 / 255, 71 / 255),
  });

  page.drawText('Apply on the National Scholarship Portal: scholarships.gov.in', {
    x: 140,
    y: 18,
    size: 11,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
