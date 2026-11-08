import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildApprovalEmail } from './emailTemplates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo.png');
const HAS_LOGO = fs.existsSync(LOGO_PATH);

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_RAW      = process.env.EMAIL_FROM || 'Hashava <noreply@hashava.org.il>';
const REPLY_TO_RAW  = process.env.EMAIL_REPLY_TO || '';

function parseAddress(str) {
  // Accepts "Name <email@domain.com>" or "email@domain.com"
  const m = String(str || '').match(/^\s*(.+?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: 'Hashava', email: String(str || '').trim() };
}

export async function sendApprovalEmail(app) {
  if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY is not configured');

  const { subject, html, text } = buildApprovalEmail(app);
  const sender = parseAddress(FROM_RAW);

  const payload = {
    sender,
    to: [{
      email: app.email,
      name: [app.first_name, app.last_name].filter(Boolean).join(' ') || undefined,
    }],
    subject,
    htmlContent: html,
    textContent: text,
  };

  if (REPLY_TO_RAW) payload.replyTo = parseAddress(REPLY_TO_RAW);

  // Inline logo via CID (Brevo supports contentId)
  if (HAS_LOGO) {
    payload.attachment = [{
      content: fs.readFileSync(LOGO_PATH).toString('base64'),
      name: 'logo.png',
      contentId: 'hashava-logo',
    }];
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }

  // Brevo returns 201 Created with { messageId }
  return res.json().catch(() => ({}));
}
