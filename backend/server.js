import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { supabase } from './lib/supabase.js';
import { sendApprovalEmail } from './lib/email.js';
import { resolveLanguage } from './lib/i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '128kb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));

const EMAIL_DELAY_MINUTES = Number(process.env.EMAIL_DELAY_MINUTES || 10);
const PORT = process.env.PORT || 3000;

/* ---------------- POST /api/applications ---------------- */
app.post('/api/applications', async (req, res) => {
  try {
    const b = req.body || {};
    const required = ['firstName', 'lastName', 'dob', 'country', 'email', 'phone'];
    for (const k of required) {
      if (!b[k] || String(b[k]).trim() === '') {
        return res.status(400).json({ error: `Missing required field: ${k}` });
      }
    }

    const lang = typeof b.language === 'string' && b.language
      ? b.language
      : resolveLanguage(b.country);

    const scheduledSendAt = new Date(Date.now() + EMAIL_DELAY_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('applications')
      .insert({
        first_name:      String(b.firstName).trim(),
        middle_name:     b.middleName ? String(b.middleName).trim() : null,
        last_name:       String(b.lastName).trim(),
        dob:             b.dob,
        gender:          b.gender || null,
        country:         String(b.country).trim(),
        email:           String(b.email).trim().toLowerCase(),
        phone:           String(b.phone).trim(),
        language:        lang,
        face_verified:   !!b.faceVerified,
        scheduled_send_at: scheduledSendAt,
        status:          'approved_pending_email',
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[application created]', data.id, lang, 'send at', scheduledSendAt);
    res.json({ ok: true, id: data.id, language: lang, scheduled_send_at: scheduledSendAt });
  } catch (err) {
    console.error('[create application]', err?.message || err);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

/* ---------------- Sweep loop ---------------- */
async function sweepDueEmails() {
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('email_sent', false)
      .lte('scheduled_send_at', nowIso)
      .limit(15);

    if (error) throw error;
    if (!data || data.length === 0) return;

    for (const row of data) {
      try {
        await sendApprovalEmail(row);
        await supabase
          .from('applications')
          .update({ email_sent: true, email_sent_at: new Date().toISOString(), status: 'emailed' })
          .eq('id', row.id);
        console.log('[email sent]', row.id, '→', row.email, `(${row.language})`);
      } catch (err) {
        console.error('[email failed]', row.id, err?.message || err);
      }
    }
  } catch (err) {
    console.error('[sweep]', err?.message || err);
  }
}

setInterval(sweepDueEmails, 30_000);
sweepDueEmails();

/* ---------------- Health / cron / info ---------------- */
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ ok: true, service: 'hashava-backend', ts: Date.now() }));

// Hit this from Render Cron or any uptime pinger
app.post('/api/cron/send-pending', async (_req, res) => {
  await sweepDueEmails();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[hashava-backend] listening on :${PORT} (delay ${EMAIL_DELAY_MINUTES} min)`);
});
