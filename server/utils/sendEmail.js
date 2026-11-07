import nodemailer from "nodemailer";

let transporter;

const isConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// Created on first use, so the server starts even when email isn't set up
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.EMAIL_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

// Never throws. Returns true if sent, false if skipped or failed.
export const sendEmail = async ({ to, subject, html }) => {
  if (!isConfigured()) {
    console.log(`Email skipped (not configured): "${subject}" to ${to}`);
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `"ShopEase" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`Email failed: ${err.message}`);
    return false;
  }
};