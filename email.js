import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { buildApprovalEmail } from './emailTemplates.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Hashava <noreply@hashava.org.il>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo.png');
const HAS_LOGO = fs.existsSync(LOGO_PATH);

export async function sendApprovalEmail(app) {
  const { subject, html, text } = buildApprovalEmail(app);

  const attachments = [];
  if (HAS_LOGO) {
    attachments.push({
      filename: 'logo.png',
      content: fs.readFileSync(LOGO_PATH).toString('base64'),
      content_type: 'image/png',
      content_id: 'hashava-logo',
    });
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [app.email],
    reply_to: REPLY_TO,
    subject,
    html,
    text,
    attachments,
  });

  if (error) throw new Error(error.message || 'Resend failed');
  return data;
}