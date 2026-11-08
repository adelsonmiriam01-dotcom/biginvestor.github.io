# Hashava Backend (Render + Supabase + Resend)

## 1. Supabase
1. Create a project at https://supabase.com
2. SQL Editor → paste `supabase-schema.sql` → Run
3. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## 2. Resend
1. Sign up at https://resend.com
2. Add & verify your domain
3. Create an API key → copy into `RESEND_API_KEY`
4. Set `EMAIL_FROM` to a verified sender, e.g. `Hashava <noreply@yourdomain.com>`

## 3. Render
1. Push this folder to GitHub
2. Render → New → Web Service → connect repo
3. Build: `npm install` · Start: `npm start`
4. Add the env vars from `.env.example`
5. Deploy → copy the public URL → set `PUBLIC_BASE_URL`

## 4. Frontend
Set `BACKEND_URL` in `index.html` to your Render URL.

## 5. Verify
- `GET https://<your-app>.onrender.com/health` → `{ ok: true }`
- Submit an application → row appears in Supabase → email arrives 10 min later.

## Note on Render Free tier
Free services sleep after 15 min idle. The sweep loop resumes on wake.
To guarantee emails on time, add a Render Cron Job hitting
`POST /api/cron/send-pending` every 5 minutes, or use https://cron-job.org.
