import nodemailer from "nodemailer";

const from = () => process.env.MAIL_FROM ?? "Distinto <hola@distinto.mx>";

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: { filename: string; path: string; cid: string }[],
) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`\n[correo distinto]\nPara: ${to}\nAsunto: ${subject}\n${text}\n`);
    return;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({ from: from(), to, subject, text, html, attachments });
}
