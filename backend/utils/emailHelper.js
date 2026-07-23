const nodemailer = require('nodemailer');

/**
 * Sends an email using SMTP configs from environment variables if present,
 * or simulates sending by logging parameters to console.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Text body content
 * @param {string} [options.html] - Optional HTML body content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'no-reply@udtbusiness.com';

  // Check if SMTP is configured
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: Number(port) === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Udumalpet Business Tour" <${from}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`[SMTP] Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('[SMTP] Connection failed, falling back to simulation:', error.message);
    }
  }

  // Fallback to simulation mode
  console.log('\n--- EMAIL DISPATCH SIMULATION ---');
  console.log(`To:      ${to}`);
  console.log(`From:    no-reply@udtbusiness.com`);
  console.log(`Subject: ${subject}`);
  console.log('---------------------------------');
  console.log(text);
  console.log('---------------------------------\n');
  return { simulated: true };
};

module.exports = { sendEmail };
