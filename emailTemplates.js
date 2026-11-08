import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEmailStrings, RTL_LANGS } from './i18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo.png');
const HAS_LOGO = fs.existsSync(LOGO_PATH);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  catch { return String(d); }
}

export function buildApprovalEmail(app) {
  const lang = app.language && EMAIL_I18N_LANGS.includes(app.language) ? app.language : 'en';
  const s = getEmailStrings(lang);
  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  const alignRight = dir === 'rtl' ? 'right' : 'left';
  const alignLeft  = dir === 'rtl' ? 'left'  : 'right';

  const fullName = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ');
  const firstName = app.first_name || fullName.split(' ')[0] || '';
  const greeting = s.greeting.replace('{name}', esc(firstName));

  const supportUrl = process.env.SUPPORT_CONTACT_URL || 'mailto:support@hashava.org.il';
  const publicBase = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const logoSrc = HAS_LOGO ? 'cid:hashava-logo' : (publicBase ? `${publicBase}/public/logo.png` : '');

  const row = (label, value) => `
    <tr>
      <td style="padding:9px 0;font-size:13px;font-weight:600;color:#8a94a3;text-align:${alignRight};vertical-align:top;width:42%;">
        ${esc(label)}
      </td>
      <td style="padding:9px 0;font-size:13px;font-weight:700;color:#14243d;text-align:${alignLeft};vertical-align:top;word-break:break-word;">
        ${esc(value)}
      </td>
    </tr>`;

  const rowsHtml = [
    row(s.labels.fullName, fullName),
    row(s.labels.dob,      fmtDate(app.dob)),
    row(s.labels.gender,   app.gender || '—'),
    row(s.labels.country,  app.country),
    row(s.labels.email,    app.email),
    row(s.labels.phone,    app.phone),
    row(s.labels.appId,    String(app.id).slice(0, 8).toUpperCase()),
  ].join('');

  const logoBlock = logoSrc
    ? `<img src="${logoSrc}" alt="Hashava" width="64" height="64" style="display:inline-block;border-radius:14px;background:#ffffff;padding:8px;box-shadow:0 4px 14px rgba(0,0,0,.18);" />`
    : `<div style="display:inline-block;width:64px;height:64px;border-radius:14px;background:#ffffff;color:#14243d;font-weight:900;font-size:22px;line-height:64px;letter-spacing:.06em;">IHRA</div>`;

  const html = `<!DOCTYPE html>
<html lang="${esc(lang)}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(s.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef0f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef0f4;padding:28px 14px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(20,36,61,.10);">

      <!-- Header / Logo -->
      <tr>
        <td style="background:linear-gradient(135deg,#14243d 0%,#1d3050 55%,#243b61 100%);padding:30px 28px 26px;text-align:center;">
          ${logoBlock}
          <div style="margin-top:14px;font-size:11px;letter-spacing:.22em;color:#b3c1d4;font-weight:800;text-transform:uppercase;">
            Hashava &middot; IHRA
          </div>
        </td>
      </tr>

      <!-- Approval icon -->
      <tr>
        <td align="center" style="padding:34px 24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" valign="middle" width="88" height="88"
                  style="width:88px;height:88px;background:#eaf6f0;border-radius:50%;">
                <span style="font-size:42px;line-height:88px;color:#2e7d5b;font-weight:900;">&#10003;</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Greeting + intro -->
      <tr>
        <td style="padding:22px 34px 0;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.28;color:#14243d;font-weight:800;letter-spacing:-.02em;">
            ${greeting}
          </h1>
          <p style="margin:0;font-size:15px;line-height:1.68;color:#4b5768;">
            ${esc(s.intro)}
          </p>
        </td>
      </tr>

      <!-- Details card -->
      <tr>
        <td style="padding:26px 34px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background:#f7f8fa;border:1px solid #e8ebf0;border-radius:14px;padding:18px 20px;">
            <tr>
              <td colspan="2" style="padding-bottom:8px;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a94a3;text-align:${alignRight};">
                ${esc(s.detailsTitle)}
              </td>
            </tr>
            ${rowsHtml}
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:28px 34px 0;text-align:center;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.68;color:#4b5768;">
            ${esc(s.body)}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td align="center" style="border-radius:12px;background:linear-gradient(180deg,#d7a244,#b8812a);box-shadow:0 8px 20px rgba(184,129,42,.30);">
                <a href="${esc(supportUrl)}" target="_blank" rel="noopener"
                   style="display:inline-block;padding:16px 30px;font-size:15px;font-weight:800;color:#1a1408;text-decoration:none;letter-spacing:.01em;border-radius:12px;">
                  ${esc(s.button)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:34px 34px 30px;text-align:center;">
          <div style="height:1px;background:#eef1f5;margin-bottom:18px;"></div>
          <p style="margin:0;font-size:11.5px;line-height:1.7;color:#8a94a3;">
            ${esc(s.footer)}
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    greeting,
    '',
    s.intro,
    '',
    s.body,
    '',
    `${s.detailsTitle}:`,
    `${s.labels.fullName}: ${fullName}`,
    `${s.labels.dob}: ${fmtDate(app.dob)}`,
    `${s.labels.gender}: ${app.gender || '—'}`,
    `${s.labels.country}: ${app.country}`,
    `${s.labels.email}: ${app.email}`,
    `${s.labels.phone}: ${app.phone}`,
    `${s.labels.appId}: ${String(app.id).slice(0,8).toUpperCase()}`,
    '',
    `${s.button}: ${supportUrl}`,
    '',
    s.footer,
  ].join('\n');

  return { subject: s.subject, html, text };
}

const EMAIL_I18N_LANGS = ['en','he','ar','es','fr','de','ru','pl','pt','it'];