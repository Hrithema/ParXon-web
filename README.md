# ParXon

A gentle, accessible companion web-app for daily movement and support
with Parkinson's — timed exercises, short educational stories,
BMI/water calculators, voice commands, and caregiver tracking with
missed-exercise notifications.

## Features

- **Guided exercises** across three stages, with a countdown timer
  and spoken instructions.
- **Voice commands** ("stage 1 exercise 3", "games", "BMI", "water")
  for hands-free navigation.
- **Patient/caregiver accounts.** A patient shares a short invite
  code; once a caregiver enters it, they can see that patient's
  exercise history from their own device.
- **Daily notifications.** If a linked patient hasn't logged an
  exercise by the end of the day, their caregiver gets a push
  notification and an email automatically — no one needs the app
  open for this to happen.
- Built with accessibility in mind: Atkinson Hyperlegible typeface,
  large tap targets, reduced-motion support, and screen-reader-
  friendly markup throughout.

## Stack

- Frontend: plain HTML/CSS/JS, no build step, no framework.
- Backend: [Supabase](https://supabase.com) — Postgres database,
  authentication, and a scheduled Edge Function for notifications.
- Notifications: [OneSignal](https://onesignal.com) (push) and
  [Resend](https://resend.com) (email).
- Hosting: any static host (Netlify, Vercel, GitHub Pages, etc.).

## Project structure

```
index.html                          Page shell + header/nav
app.js                              All app logic and views
styles.css                          Design tokens and styling
config.js                           Your Supabase/OneSignal keys (edit this)
schema.sql                          Database tables + security policies
cron.sql                            Schedules the daily notification check
supabase/functions/daily-check/     Edge Function: checks logs, sends notifications
SETUP.md                            Full step-by-step setup walkthrough
```

## Setup

See [`SETUP.md`](./SETUP.md) for the complete walkthrough —
creating your Supabase/OneSignal/Resend accounts, running the
database schema, filling in `config.js`, testing locally, and
deploying both the site and the notification function.

Quick version once you've followed that guide:

```bash
# clone and open locally
git clone <this-repo-url>
cd parxon
npx serve .
```

Then push to GitHub and connect the repo to Netlify or Vercel for
a live deployment — no build command needed, it's a static site.

## Security notes

- The `SUPABASE_ANON_KEY` in `config.js` is meant to be public —
  actual access control comes from the Row-Level Security policies
  in `schema.sql`, which restrict every table so a caregiver can
  only ever see data for patients explicitly linked to them.
- The Supabase **service role** key (used only by the notification
  function) must never be placed in `config.js` or any other
  browser-facing file — it bypasses all security rules. It belongs
  only in the Edge Function's environment variables, as described
  in `SETUP.md`.

## Disclaimer

ParXon is a companion for daily movement and general information —
it is not a substitute for medical advice. Always consult a
healthcare provider about symptoms, exercise plans, or medication.