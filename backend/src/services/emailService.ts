import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dbt-students.gov.in';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: SMTP_USER && SMTP_PASS ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined,
});

/**
 * Sends verification email to a new user
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Aadhaar DBT Portal" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email - Aadhaar DBT Student Portal',
    html: `
      <div style="font-family: 'Inter', sans-serif; padding: 20px; background-color: #FBF8F2; color: #333;">
        <h2 style="color: #0A2647;">Aadhaar DBT for Students Portal</h2>
        <p>Welcome! Thank you for registering on the government-style student awareness and self-service portal.</p>
        <p>Please click the button below to verify your email address. This link is valid for 24 hours.</p>
        <div style="margin: 20px 0;">
          <a href="${verificationLink}" style="background-color: #0A2647; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button above does not work, copy and paste the following URL into your browser:</p>
        <p style="font-size: 12px; color: #0A2647; word-break: break-all;">${verificationLink}</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 20px;" />
        <p style="font-size: 11px; color: #999;">Ministry of Social Justice & Empowerment, Department of Social Justice & Empowerment (DoSJE).</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends a password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Aadhaar DBT Portal" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Reset Password - Aadhaar DBT Student Portal',
    html: `
      <div style="font-family: 'Inter', sans-serif; padding: 20px; background-color: #FBF8F2; color: #333;">
        <h2 style="color: #0A2647;">Aadhaar DBT for Students Portal</h2>
        <p>You requested a password reset for your account. Please click the button below to reset your password. This link is valid for 1 hour.</p>
        <div style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #FF9933; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
        <p style="font-size: 12px; color: #0A2647; word-break: break-all;">${resetLink}</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 20px;" />
        <p style="font-size: 11px; color: #999;">Ministry of Social Justice & Empowerment, Department of Social Justice & Empowerment (DoSJE).</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Sends scholarship deadline reminder
 */
export async function sendScholarshipReminderEmail(email: string, studentName: string, schemeName: string, deadlineDate: string, amount: number) {
  const mailOptions = {
    from: `"Aadhaar DBT Portal" <${FROM_EMAIL}>`,
    to: email,
    subject: `Urgent: Deadline approaching for ${schemeName}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; padding: 20px; background-color: #FBF8F2; color: #333;">
        <h2 style="color: #0A2647;">Aadhaar DBT for Students Portal</h2>
        <p>Dear ${studentName},</p>
        <p>This is a friendly reminder that the deadline to apply for the <strong>${schemeName}</strong> is approaching fast.</p>
        <p><strong>Scheme Details:</strong></p>
        <ul>
          <li><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</li>
          <li><strong>Application Deadline:</strong> ${deadlineDate}</li>
        </ul>
        <p>Please log in to your dashboard to make sure your profile is 100% complete and your bank account is Aadhaar DBT seeded, so you don't face any issues during disbursement.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #0F8B45; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Portal Dashboard
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 20px;" />
        <p style="font-size: 11px; color: #999;">Ministry of Social Justice & Empowerment, Department of Social Justice & Empowerment (DoSJE).</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
