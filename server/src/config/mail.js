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
  const from = process.env.EMAIL_FROM || '"GLUG Community" <glug.jec@gmail.com>';
  const subject = `Your GLUG Verification Code: ${otp}`;
  const purposeLabel =
    purpose === 'registration' || purpose === 'register'
      ? 'account registration'
      : purpose === 'reset'
      ? 'password reset'
      : purpose;

  const digits = String(otp).split('');

  const digitCellsHtml = digits
    .map(
      (d) => `
      <td align="center" valign="middle" style="padding: 0 4px;">
        <div style="width: 44px; height: 54px; line-height: 54px; background: #0c111e; border: 1.5px solid #2563eb; border-radius: 12px; font-size: 28px; font-weight: 800; color: #60a5fa; text-align: center; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);">
          ${d}
        </div>
      </td>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GLUG Verification Code</title>
      </head>
      <body style="margin: 0; padding: 28px 12px; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 0 auto;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f1422; border: 1px solid #1a2336; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #6366f1 100%);"></td>
                </tr>

                <tr>
                  <td style="padding: 38px 32px 32px 32px; text-align: center;">
                    <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin-bottom: 2px;">GLUG</div>
                    <div style="font-size: 12px; color: #60a5fa; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">GNU/Linux User Group</div>

                    <div style="margin-bottom: 22px;">
                      <span style="background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.08em; display: inline-block;">
                        One-Time Security Code
                      </span>
                    </div>

                    <h1 style="font-size: 21px; font-weight: 700; color: #f8fafc; margin: 0 0 10px 0;">Verify Your Email Address</h1>
                    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 26px 0;">
                      Thank you for connecting with the GLUG community. Use the 6-digit verification code below to complete your <strong style="color: #cbd5e1;">${purposeLabel}</strong>:
                    </p>

                    <div style="background: #131929; border: 1px solid #1e293b; border-radius: 18px; padding: 22px 14px 18px 14px; margin-bottom: 20px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);">
                      <table align="center" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          ${digitCellsHtml}
                        </tr>
                      </table>

                      <div style="margin-top: 16px;">
                        <span style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #34d399; font-weight: 600; display: inline-block;">
                          Valid for 10 minutes
                        </span>
                      </div>
                    </div>

                    <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.22); border-radius: 12px; padding: 12px 16px; text-align: left; margin-bottom: 24px;">
                      <div style="font-size: 12px; color: #fca5a5; line-height: 1.5;">
                        <strong>Security Note:</strong> Never share this code with anyone. GLUG administrators will never ask for your verification code or password.
                      </div>
                    </div>

                    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                      If you didn't request this verification, you can safely ignore this email. Someone may have mistyped their email address.
                    </p>

                    <div style="height: 1px; background: #1a2336; margin: 28px 0 20px 0;"></div>

                    <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; font-weight: 500;">
                      GNU/Linux User Group • Jorhat Engineering College
                    </p>
                    <p style="font-size: 11px; color: #475569; margin: 0;">
                      Open minds build brighter tomorrows.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
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
      text: `Your GLUG verification code is: ${otp}. It expires in 10 minutes. Do not share it with anyone.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Nodemailer Error]', err);
    throw new Error('Failed to send verification email');
  }
}
