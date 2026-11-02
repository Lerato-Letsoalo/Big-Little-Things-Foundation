const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPasswordResetEmail(toEmail, toName, resetLink) {
  const mailOptions = {
    from: `"Big Little Things Foundation" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your password — Big Little Things Foundation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #264653;">Reset your password</h2>
        <p>Hi ${toName || 'there'},</p>
        <p>We received a request to reset the password for your Big Little Things Foundation account.</p>
        <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #D0021B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset my password
          </a>
        </p>
        <p style="color: #777; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #777; font-size: 12px;">Or copy this link: ${resetLink}</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };