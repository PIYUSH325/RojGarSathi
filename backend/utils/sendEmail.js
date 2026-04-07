const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const buildTransporter = () => {
  const user = (process.env.SMTP_EMAIL || '').trim();
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    throw new Error('SMTP_EMAIL and SMTP_PASSWORD must be configured');
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = buildTransporter();

  await transporter.sendMail({
    from: `RojgarSathi Support <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
