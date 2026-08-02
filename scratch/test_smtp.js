const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'no-reply@udtbusiness.com';

const recipient = 'cntechnologiesudt@gmail.com'; // Let's also check if they want to test custom domain email

async function main() {
  console.log('SMTP CONFIGURATION:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`From: ${from}`);
  console.log('--------------------');

  if (!host || !user || !pass) {
    console.error('SMTP configuration missing in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"UBT Test" <${from}>`,
      to: recipient,
      subject: 'UBT SMTP Test Mail',
      text: 'This is a test email sent from the UBT backend environment to verify SMTP connectivity and delivery.',
    });
    console.log('SUCCESS!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('SMTP SEND ERROR:');
    console.error(error);
  }
}

main().catch(console.error);
