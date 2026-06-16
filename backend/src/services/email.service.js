const { sendEmail } = require('../config/mailer');

// Minimal, brand-neutral HTML. We keep inline styles here because email
// clients strip <style> blocks and ignore external CSS.
const baseTemplate = (heading, body, cta) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">${heading}</h1>
    <div style="font-size: 15px; line-height: 1.6; color: #333;">${body}</div>
    ${cta || ''}
    <p style="font-size: 12px; color: #999; margin-top: 32px;">Rakiz &middot; If you did not expect this email, you can safely ignore it.</p>
  </div>
`;

const button = (url, label) => `
  <div style="margin: 24px 0;">
    <a href="${url}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px;">${label}</a>
  </div>
  <p style="font-size: 13px; color: #666;">Or paste this link into your browser:<br/><span style="word-break: break-all; color: #0f172a;">${url}</span></p>
`;

const sendVerificationEmail = async ({ to, name, token }) => {
  const link = `${process.env.API_URL}/api/auth/verify-email?token=${token}`;
  const html = baseTemplate(
    'Confirm your email',
    `<p>Hi ${name}, welcome to Rakiz. Confirm your email address to activate your account.</p>`,
    button(link, 'Verify email')
  );

  return sendEmail({ to, subject: 'Verify your Rakiz account', html });
};

const sendWelcomeEmail = async ({ to, name }) => {
  const html = baseTemplate(
    'Your account is ready',
    `<p>Hi ${name}, your email is verified and your Rakiz account is active. You can now sign in and start sending, requesting, and splitting money.</p>`
  );

  return sendEmail({ to, subject: 'Welcome to Rakiz', html });
};

module.exports = { sendVerificationEmail, sendWelcomeEmail };
