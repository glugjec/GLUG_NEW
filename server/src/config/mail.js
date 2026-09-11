import nodemailer from 'nodemailer';

const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = hasSmtp
  ? nodemailer.createTransport(
      process.env.SMTP_SERVICE === 'gmail' || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com'))
        ? {
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
            },
          }
        : {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
            },
          }
    )
  : null;

export async function sendOtpMail({ to, otp, purpose = 'registration' }) {
  const from = process.env.EMAIL_FROM || '"GLUG Community" <no-reply@glug.dev>';
  const subject = `Your GLUG Verification Code: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0e17; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background-color: #101522; border: 1px solid #1a2336; border-radius: 16px; padding: 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: 1px; }
          .subtitle { font-size: 13px; color: #8b9bb4; margin-top: 4px; }
          .content { text-align: center; }
          .title { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
          .desc { font-size: 14px; color: #8b9bb4; line-height: 1.5; margin-bottom: 24px; }
          .otp-box { display: inline-block; background-color: #141a2a; border: 2px dashed #2563eb; border-radius: 12px; padding: 14px 28px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; font-family: monospace; margin-bottom: 24px; }
          .note { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #1a2336; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">GLUG</div>
            <div class="subtitle">GNU/Linux User Group Community</div>
          </div>
          <div class="content">
            <div class="title">Verify Your Email Address</div>
            <p class="desc">Use the 6-digit one-time code below to complete your ${purpose}:</p>
            <div class="otp-box">${otp}</div>
            <p class="desc" style="margin-bottom: 16px;">This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
          <div class="note">
            If you didn't request this code, you can safely ignore this email. Someone may have mistakenly typed your email address.
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n' + '='.repeat(54));
    console.log('  [GLUG DEV MODE] NODEMAILER OTP CONSOLE FALLBACK');
    console.log(`  To: ${to}`);
    console.log(`  Purpose: ${purpose}`);
    console.log(`  Verification OTP: >>> ${otp} <<<`);
    console.log(`  Valid for: 10 minutes`);
    console.log('='.repeat(54) + '\n');
    return { success: true, mode: 'dev-console' };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: `Your GLUG verification code is: ${otp}. It expires in 10 minutes.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Nodemailer Error]', err);
    throw new Error('Failed to send verification email');
  }
}
