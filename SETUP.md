# ParXon — Setup Guide

This walks through everything needed to take the app from files
on your computer to a live site with real accounts, caregiver
tracking, and daily missed-exercise notifications.

## What's in this folder

- `index.html`, `app.js`, `styles.css` — the app itself.
- `config.js` — the one file you edit with your account keys.
- `schema.sql` — creates the database tables and security rules.
- `cron.sql` — schedules the daily notification check.
- `supabase/functions/daily-check/index.ts` — the code that runs
  once a day and sends the notifications.

---

## Step 1 — Create your accounts

- **Supabase** (supabase.com): sign up, click "New project," pick
  a name and a database password (save that password somewhere —
  you won't need it day-to-day, but you'll want it if you ever
  connect a database tool directly). Wait a minute or two for the
  project to finish provisioning.
- **Netlify** (netlify.com) or **Vercel** (vercel.com): sign up.
  Either works fine for a static site like this one; pick whichever
  you find more familiar.
- **OneSignal** (onesignal.com): sign up, create a new app, choose
  "Web Push" as the platform. You'll need your site's URL — you can
  come back and fill this in after Step 7 if you deploy first.
- **Resend** (resend.com): sign up. On the free tier you can send
  test emails right away from a resend.dev address; sending from
  your own domain needs a quick DNS verification step, which you
  can also do later.

## Step 2 — Set up the database

- In your Supabase project, go to **SQL Editor → New query**.
- Paste in the entire contents of `schema.sql` and click **Run**.
- This creates three tables (`profiles`, `links`, `exercise_logs`)
  and the security rules that keep a caregiver from seeing anyone's
  data except a patient who's explicitly linked to them.
- Go to **Authentication → Providers** and confirm Email is
  enabled (it is by default). For faster testing, you can also go
  to **Authentication → Settings** and turn off "Confirm email" —
  this lets test accounts log in immediately after signup instead
  of needing to click a confirmation link. You can turn it back on
  before real users sign up if you want that extra verification step.

## Step 3 — Fill in your keys

- In Supabase, go to **Project Settings → API**. Copy the
  **Project URL** and the **anon / public** key.
- Open `config.js` and paste them into `SUPABASE_URL` and
  `SUPABASE_ANON_KEY`.
- Leave `ONESIGNAL_APP_ID` as the placeholder for now — you'll come
  back to it in Step 8. The app works fine without it; push
  notifications just won't fire until it's filled in.

## Step 4 — Test locally

- Open `index.html` directly in a browser, or serve the folder
  with any static server (e.g. `npx serve .`).
- Sign up as a patient: create an account, choose "I have
  Parkinson's" on the role screen. You should land on the home
  screen and see an invite code.
- Complete a short exercise (let its timer run out) — this writes
  a row to `exercise_logs`. You should see "You've logged an
  exercise today" appear on the home screen afterward.
- Sign up a second account (a different email) as a caregiver.
  On the caregiver's home screen, enter the patient's invite code
  and click Connect. The patient should now appear in the list with
  their today's status.
- Click the patient's row to see their exercise history.

If all of that works, accounts, logging, and linking are working
correctly end to end.

## Step 5 — Deploy the frontend

- Push this folder to a GitHub repository.
- In Netlify or Vercel, "Import project" / "New site from Git,"
  point it at the repo. No build command is needed — it's a static
  site, so the publish directory is just the repo root.
- Once deployed, you'll get a live URL. Everything from Step 4
  should work identically there.

## Step 6 — Deploy the notification function

- Install the Supabase CLI (`npm install -g supabase`) and log in
  (`supabase login`).
- From this folder, link the CLI to your project:
  `supabase link --project-ref YOUR-PROJECT-REF` (find the ref in
  your Supabase project URL or Settings → General).
- Deploy the function:
  `supabase functions deploy daily-check`
- Set its environment variables — in the Supabase dashboard, go to
  **Edge Functions → daily-check → Settings**, and add:
  - `SUPABASE_URL` — same as in config.js
  - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → **service_role**
    key. This is different from the anon key and must never appear
    in `config.js` or anywhere in the browser-facing code — it
    bypasses all the security rules, which is exactly why the
    function needs it and the browser must not have it.
  - `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` — from your
    OneSignal app's Settings → Keys & IDs.
  - `RESEND_API_KEY` — from your Resend dashboard.
  - `RESEND_FROM` — an email address you're allowed to send from
    (a resend.dev address works for testing).

## Step 7 — Schedule the daily check

- Open `cron.sql`, replace `YOUR-PROJECT-REF` and
  `YOUR-SERVICE-ROLE-KEY` with your real values.
- Run it once in the Supabase SQL Editor, same as `schema.sql`.
- This tells Postgres to call your function every day at 18:00 UTC.
  Adjust the time in the `'0 18 * * *'` line if you want it to run
  at a different hour — that string is a standard cron schedule
  (minute, hour, day, month, weekday).
- You can trigger it manually any time to test, without waiting for
  the schedule, by running:
  `select net.http_post(url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/daily-check', headers := jsonb_build_object('Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY'));`

## Step 8 — Turn on push notifications

- In OneSignal, under your app's settings, add your live site URL
  (from Step 5) as the allowed origin for web push.
- Fill in `ONESIGNAL_APP_ID` in `config.js` with the real app ID,
  and redeploy the frontend (push to GitHub again — Netlify/Vercel
  redeploys automatically).
- Log in as a caregiver on the live site; the browser will prompt
  for notification permission. Accept it.
- From here, any day a linked patient hasn't logged an exercise by
  the time the cron job runs, that caregiver gets a push
  notification and an email.

---

## A note on what "live" means here

Once deployed, this app has: real password-based accounts (hashed
and managed by Supabase, not stored in plain text anywhere),
data that's shared correctly between a patient's and a caregiver's
devices, and a daily check that runs on Supabase's servers whether
or not anyone has the app open. That's a genuinely different thing
from the original prototype, which kept everything in one browser's
local storage and had no server-side component at all.

What this setup does *not* include, if you take this further:
rate-limiting on signup/login, a way for a patient to revoke a
caregiver's access once linked, or handling for a caregiver linked
to more than a handful of patients (the dashboard queries are
simple and would want pagination past that point). None of those
block getting started — they're the natural next additions once
the core flow is working.