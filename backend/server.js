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
app.set('trust proxy', 1);            // required for real IP on Render
app.use(cors());
app.use(express.json({ limit: '128kb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));

const EMAIL_DELAY_MINUTES = Number(process.env.EMAIL_DELAY_MINUTES || 10);
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || '2535';

/* ============================================================
   IP HELPERS
   ============================================================ */
const T_LANGS = ['en','he','ar','es','fr','de','ru','pl','pt','it'];

const CC_LANG = {
  IL:'he', PL:'pl', US:'en', FR:'fr', GB:'en', CA:'en', AR:'es', RU:'ru', UA:'ru',
  DE:'de', HU:'en', AU:'en', ZA:'en', BR:'pt', MX:'es', BY:'ru', LT:'en', LV:'en',
  RO:'en', CZ:'en', AT:'de', NL:'en', BE:'fr', SE:'en', CH:'de', ES:'es', IT:'it',
  TR:'en', IR:'en', MA:'ar', TN:'ar', EG:'ar', IQ:'ar', YE:'ar', SY:'ar', LB:'ar',
  IN:'en', CN:'en', JP:'en', NZ:'en', IE:'en', PT:'pt', GR:'en', BG:'en', RS:'en',
  HR:'en', SK:'en', SI:'en', MD:'en', GE:'en', AZ:'en', KZ:'ru', UZ:'ru', EE:'en',
  FI:'en', NO:'en', DK:'en'
};

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const first = String(xff).split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || '';
}

function isPrivateIP(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^(fc|fd)/i.test(ip)) return true;
  return false;
}

async function lookupCountry(ip) {
  if (!ip || isPrivateIP(ip)) return { country: null, country_code: null };
  try {
    const r = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'hashava-backend' }
    });
    if (!r.ok) return { country: null, country_code: null };
    const data = await r.json();
    return {
      country: data.country_name || null,
      country_code: data.country_code || null
    };
  } catch {
    return { country: null, country_code: null };
  }
}

/* ============================================================
   ADMIN MIDDLEWARE
   ============================================================ */
function requireAdmin(req, res, next) {
  const key = String(req.headers['x-admin-key'] || '');
  if (key !== ADMIN_PIN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/* ============================================================
   VISIT TRACKING — logs IP on every page visit
   ============================================================ */
app.post('/api/visit', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const ua = (req.headers['user-agent'] || '').slice(0, 500);
    const hint = String((req.body && req.body.hintLang) || 'en').toLowerCase();
    const fallback = T_LANGS.includes(hint) ? hint : 'en';

    const geo = await lookupCountry(ip);
    const language = (geo.country_code && CC_LANG[geo.country_code]) || fallback;

    await supabase.from('visits').insert({
      ip: ip || null,
      country: geo.country,
      country_code: geo.country_code,
      language,
      user_agent: ua
    });

    res.json({ language, country: geo.country, country_code: geo.country_code });
  } catch (err) {
    console.error('[visit]', err?.message || err);
    res.json({ language: 'en' });
  }
});

/* ============================================================
   APPLICATIONS — create
   ============================================================ */
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

    const ip = getClientIp(req);
    const geo = await lookupCountry(ip);

    const { data, error } = await supabase
      .from('applications')
      .insert({
        ip: ip || null,
        country_code: geo.country_code || null,
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

/* ============================================================
   ADMIN — stats
   ============================================================ */
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalApps },
      { count: sentApps },
      { count: pendingApps },
      { count: totalVisits },
      { count: todayVisits },
      { count: todayApps }
    ] = await Promise.all([
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('email_sent', true),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('email_sent', false),
      supabase.from('visits').select('*', { count: 'exact', head: true }),
      supabase.from('visits').select('*', { count: 'exact', head: true }).gte('created_at', dayAgo),
      supabase.from('applications').select('*', { count: 'exact', head: true }).gte('created_at', dayAgo)
    ]);

    const { data: countryRows } = await supabase
      .from('visits')
      .select('country, country_code')
      .not('country_code', 'is', null);

    const map = {};
    (countryRows || []).forEach(v => {
      const k = v.country_code || '??';
      if (!map[k]) map[k] = { country_code: k, country: v.country || 'Unknown', count: 0 };
      map[k].count++;
    });

    res.json({
      totalApplications: totalApps || 0,
      emailsSent: sentApps || 0,
      pendingEmails: pendingApps || 0,
      totalVisits: totalVisits || 0,
      todayVisits: todayVisits || 0,
      todayApplications: todayApps || 0,
      countries: Object.values(map).sort((a, b) => b.count - a.count).slice(0, 12)
    });
  } catch (err) {
    console.error('[admin stats]', err?.message || err);
    res.status(500).json({ error: 'Failed' });
  }
});

/* ============================================================
   ADMIN — applications list
   ============================================================ */
app.get('/api/admin/applications', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ applications: data || [] });
  } catch (err) {
    console.error('[admin apps]', err?.message || err);
    res.status(500).json({ error: 'Failed' });
  }
});

/* ============================================================
   ADMIN — visits list
   ============================================================ */
app.get('/api/admin/visits', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ visits: data || [] });
  } catch (err) {
    console.error('[admin visits]', err?.message || err);
    res.status(500).json({ error: 'Failed' });
  }
});

/* ============================================================
   EMAIL SWEEP LOOP
   ============================================================ */
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
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            status: 'emailed'
          })
          .eq('id', row.id);
        console.log('[email sent]', row.id, '→', row.email, `(${row.language})`);
      } catch (err) {
        console.error('[email failed]', row.id, err?.message || err);
        await supabase
          .from('applications')
          .update({
            email_error: String(err?.message || err).slice(0, 500),
            email_attempts: (row.email_attempts || 0) + 1
          })
          .eq('id', row.id);
      }
    }
  } catch (err) {
    console.error('[sweep]', err?.message || err);
  }
}

setInterval(sweepDueEmails, 30_000);
sweepDueEmails();

/* ============================================================
   HEALTH / CRON
   ============================================================ */
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ ok: true, service: 'hashava-backend', ts: Date.now() }));

app.post('/api/cron/send-pending', async (_req, res) => {
  await sweepDueEmails();
  res.json({ ok: true });
});

/* ============================================================
   START
   ============================================================ */
app.listen(PORT, () => {
  console.log(`[hashava-backend] listening on :${PORT}`);
  console.log(`[hashava-backend] email delay: ${EMAIL_DELAY_MINUTES} min`);
  console.log(`[hashava-backend] admin PIN: ${ADMIN_PIN === '2535' ? 'default (2535)' : 'custom'}`);
});
