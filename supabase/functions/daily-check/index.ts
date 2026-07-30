import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("_SERVICE_ROLE_KEY")!;
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "ParXon <notifications@yourdomain.com>";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function startOfTodayISO(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function sendPush(caregiverUserId: string, patientName: string) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;
  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [caregiverUserId],
      headings: { en: "ParXon" },
      contents: { en: `${patientName} hasn't logged an exercise today.` },
    }),
  });
}

async function sendEmail(toEmail: string, patientName: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: toEmail,
      subject: `${patientName} hasn't exercised today`,
      html: `<p>Hi,</p><p><strong>${patientName}</strong> hasn't logged an exercise in ParXon yet today. A quick check-in might help.</p>`,
    }),
  });
}

Deno.serve(async (_req) => {
  // 1. All patients.
  const { data: patients, error: patientsError } = await sb
    .from("profiles")
    .select("id, username")
    .eq("role", "patient");

  if (patientsError) {
    return new Response(JSON.stringify({ error: patientsError.message }), { status: 500 });
  }

  const todayStart = startOfTodayISO();
  let notified = 0;

  for (const patient of patients ?? []) {
    const { count } = await sb
      .from("exercise_logs")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id)
      .gte("completed_at", todayStart);

    if ((count ?? 0) > 0) continue; 
    const { data: links } = await sb
      .from("links")
      .select("caregiver_id")
      .eq("patient_id", patient.id);

    for (const link of links ?? []) {
      const { data: userData } = await sb.auth.admin.getUserById(link.caregiver_id);
      const email = userData?.user?.email;

      await sendPush(link.caregiver_id, patient.username);
      if (email) await sendEmail(email, patient.username);
      notified++;
    }
  }

  return new Response(JSON.stringify({ ok: true, patientsChecked: patients?.length ?? 0, notificationsSent: notified }), {
    headers: { "Content-Type": "application/json" },
  });
});