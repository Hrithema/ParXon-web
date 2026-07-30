(function () {
  "use strict";

  /* ============================================================
     SUPABASE CLIENT
     ============================================================ */

  const sb = window.supabase.createClient(
    window.PARXON_CONFIG.SUPABASE_URL,
    window.PARXON_CONFIG.SUPABASE_ANON_KEY
  );

  /* ============================================================
     DATA  (unchanged from the original app)
     ============================================================ */

  const EXERCISES = [
    { id: 1, name: "Seated Marching", seconds: 60,
      instructions: "Sit tall in a sturdy chair with both feet flat on the floor. Lift your right knee toward your chest, lower it, then lift your left knee. Keep your back straight and breathe steadily throughout." },
    { id: 2, name: "Shoulder Rolls", seconds: 45,
      instructions: "Roll both shoulders slowly forward five times, then slowly backward five times. Keep your neck relaxed and let your arms hang loosely at your sides." },
    { id: 3, name: "Wrist Circles", seconds: 45,
      instructions: "Extend both arms out in front of you. Rotate your wrists in slow, gentle circles — five times in each direction." },
    { id: 4, name: "Neck Rotation", seconds: 45,
      instructions: "Slowly turn your head to look over your right shoulder, return to center, then turn to look over your left shoulder. Move gently and stop if you feel strain." },
    { id: 5, name: "Ankle Pumps", seconds: 45,
      instructions: "While seated, lift your toes up toward your shins, then point them away from you. Repeat slowly to keep your ankles limber." },
    { id: 6, name: "Trunk Rotation", seconds: 60,
      instructions: "Sit tall with your hands resting on your hips. Gently rotate your upper body to the right, return to center, then rotate to the left." },
    { id: 7, name: "Sit-to-Stand", seconds: 60,
      instructions: "With a sturdy chair behind you, lean slightly forward and stand up using your leg muscles. Pause, then lower yourself back down with control. Use the armrests for support if you need to." },
    { id: 8, name: "Heel-to-Toe Walk", seconds: 60,
      instructions: "Walking in a straight line near a wall for support, place the heel of one foot directly in front of the toes of the other with each step." },
    { id: 9, name: "Arm Raises", seconds: 45,
      instructions: "Raise both arms out to your sides up to shoulder height, then lower them slowly. Keep the movement smooth and controlled." },
    { id: 10, name: "Finger Taps", seconds: 45,
      instructions: "Tap your thumb to each fingertip in turn, moving from index finger to little finger and back, as smoothly as you comfortably can." },
    { id: 11, name: "Balance Hold", seconds: 45,
      instructions: "Standing near a wall or counter for support, hold your weight on one foot for as long as is comfortable, then switch to the other foot." },
    { id: 12, name: "Facial Expression Practice", seconds: 45,
      instructions: "Practice broad facial expressions: raise your eyebrows high, smile as widely as you can, then open your mouth wide. This helps keep facial muscles active." },
    { id: 13, name: "Deep Breathing", seconds: 60,
      instructions: "Breathe in slowly through your nose for a count of four, hold briefly, then breathe out through your mouth for a count of four. Let your shoulders drop with each exhale." },
  ];

  const STAGES = {
    1: { label: "Stage 1 — Foundations", count: 13 },
    2: { label: "Stage 2 — Building Strength", count: 10 },
    3: { label: "Stage 3 — Balance & Control", count: 5 },
  };

  const STORIES = [
    { title: "Understanding Parkinson's, Gently", excerpt: "A plain-language look at what's happening in the body — and what isn't as scary as it sounds.",
      body: "Parkinson's affects the way the brain sends signals to the muscles, which is why movement can feel slower or less predictable some days. It looks different from person to person, and it changes gradually, which gives plenty of room to adapt routines along the way. Many people continue doing the things they love for years by pacing themselves and leaning on small daily habits rather than any single big fix." },
    { title: "Staying Active, One Small Step at a Time", excerpt: "Why short, regular movement matters more than occasional big efforts.",
      body: "Regular movement — even in short bursts — helps maintain flexibility, balance, and mood. It doesn't need to look like a workout. A few minutes of stretching after breakfast, a short walk in the afternoon, or the exercises in this app spread across the day can add up. The goal is consistency, not intensity: showing up for a few gentle minutes most days beats pushing hard once in a while." },
    { title: "Eating and Drinking Well", excerpt: "Simple habits around meals and hydration that support energy and medication timing.",
      body: "Staying hydrated supports energy, digestion, and focus, so keeping a water bottle nearby as a visual reminder can help. Some medications work best on a consistent schedule relative to meals, so it's worth asking a care team about timing. Fibre-rich foods and regular meals can also help with common digestive changes that come with Parkinson's." },
    { title: "Working with Tremor, Not Against It", excerpt: "Practical adjustments that make daily tasks a little easier.",
      body: "Tremor can be frustrating, but small adjustments often help more than fighting it directly: resting the arm on a table while eating, using slightly heavier utensils, or building in a brief pause before a precise task. None of these fix the tremor, but they can make everyday moments smoother and less tiring." },
    { title: "You Don't Have to Do This Alone", excerpt: "Why a support network — family, friends, or a local group — makes a real difference.",
      body: "A diagnosis affects more than the person who receives it; it ripples out to family and friends too. Support groups, whether in person or online, connect people with others who understand the day-to-day reality. Caregivers benefit from support as well — it's easier to support someone else when you're not carrying everything alone." },
    { title: "Protecting Sleep", excerpt: "Why rest is part of the treatment plan, not a luxury.",
      body: "Sleep quality often changes with Parkinson's, and poor sleep can make daily symptoms feel more pronounced. A calm wind-down routine, a consistent bedtime, and a cool dark room all help. If sleep problems persist, they're worth raising with a doctor — there are often adjustments that can help." },
  ];

  /* ============================================================
     AUTH / PROFILE STATE
     ============================================================ */

  let currentSession = null;
  let currentProfile = null; // { id, username, role, invite_code }

  async function loadProfile(userId) {
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    currentProfile = error ? null : data;
    return currentProfile;
  }

  sb.auth.onAuthStateChange(async (_event, session) => {
    currentSession = session;
    if (session) await loadProfile(session.user.id);
    else currentProfile = null;
    render();
  });

  /* ============================================================
     UTILITIES  (unchanged)
     ============================================================ */

  const app = document.getElementById("app");
  const header = document.getElementById("siteHeader");
  let activeTimer = null;
  let toastTimeout = null;

  function navigate(hash) {
    if (location.hash === hash) { render(); }
    else { location.hash = hash; }
  }

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function toast(message) {
    let t = document.querySelector(".toast");
    if (t) t.remove();
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = message;
    document.body.appendChild(t);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.remove(), 3200);
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      toast("Speech isn't supported on this device.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }

  function clearActiveTimer() {
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
  }

  function randomInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
    let out = "";
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function startOfTodayISO() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  /* ---------- Voice command recognition (unchanged) ---------- */

  function listenForCommand() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast("Voice commands aren't supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    toast("Listening… try “stage 1 exercise 3”, “games”, “B M I”, or “water”.");

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      handleVoiceCommand(command);
    };
    recognition.onerror = () => toast("Didn't catch that — please try again.");
    recognition.start();
  }

  function handleVoiceCommand(command) {
    const stageMatch = command.match(/stage\s*(\d+)/);
    const exerciseMatch = command.match(/exercise\s*(\d+)/);

    if (stageMatch && exerciseMatch) {
      const stage = stageMatch[1], ex = exerciseMatch[1];
      if (STAGES[stage] && ex >= 1 && ex <= STAGES[stage].count) {
        navigate(`#/exercise/${stage}/${ex}`);
        return;
      }
      toast("I heard a stage and exercise, but that combination doesn't exist.");
      return;
    }
    if (stageMatch && STAGES[stageMatch[1]]) { navigate(`#/stage/${stageMatch[1]}`); return; }
    if (command.includes("game") || command.includes("stor")) { navigate("#/games"); return; }
    if (command.includes("bmi")) { navigate("#/bmi"); return; }
    if (command.includes("water")) { navigate("#/water"); return; }
    if (command.includes("home")) { navigate("#/home"); return; }
    toast(`Command not recognized: “${command}”`);
  }

  /* ============================================================
     PUSH NOTIFICATIONS (OneSignal)
     Only runs if you've set ONESIGNAL_APP_ID in config.js. Tags
     the caregiver's device with their Supabase user id, so the
     daily server-side check can target notifications at them.
     ============================================================ */

  async function initPushForCaregiver() {
    const appId = window.PARXON_CONFIG.ONESIGNAL_APP_ID;
    if (!appId || appId.startsWith("YOUR-") || !window.OneSignal) return;
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({ appId });
        await OneSignal.login(currentSession.user.id);
        await OneSignal.Notifications.requestPermission();
      });
    } catch (e) { /* push is optional — fail quietly */ }
  }

  /* ============================================================
     ROUTER
     ============================================================ */

  const PUBLIC_ROUTES = ["#/login", "#/signup", "#/", "#/splash"];

  function currentRoute() {
    return location.hash || "#/splash";
  }

  function requireAuth(hash) {
    if (!currentSession && !PUBLIC_ROUTES.includes(hash)) {
      location.hash = "#/login";
      return false;
    }
    if (currentSession && (hash === "#/login" || hash === "#/signup")) {
      location.hash = currentProfile && currentProfile.role ? "#/home" : "#/role";
      return false;
    }
    if (currentSession && currentProfile && !currentProfile.role && hash !== "#/role") {
      location.hash = "#/role";
      return false;
    }
    return true;
  }

  async function render() {
    clearActiveTimer();
    const hash = currentRoute();
    if (!requireAuth(hash)) return;

    header.hidden = !currentSession;

    const parts = hash.replace(/^#\//, "").split("/");
    const route = parts[0];

    switch (route) {
      case "splash": case "": renderSplash(); break;
      case "login": renderLogin(); break;
      case "signup": renderSignup(); break;
      case "role": renderRole(); break;
      case "home": await renderHome(); break;
      case "patient": await renderPatientDetail(parts[1]); break;
      case "stage": renderStage(parts[1]); break;
      case "exercise": renderExercise(parts[1], parts[2]); break;
      case "games": parts[1] ? renderGameDetail(parts[1]) : renderGames(); break;
      case "bmi": renderBMI(); break;
      case "water": renderWater(); break;
      default: renderNotFound();
    }
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.addEventListener("hashchange", render);
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    navigate("#/login");
  });

  /* ============================================================
     VIEWS — AUTH
     ============================================================ */

  function renderSplash() {
    app.innerHTML = `
      <div class="view splash">
        <div class="splash-mark" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12" stroke="white" stroke-width="2.2"/>
            <path d="M14 7v7l5 3" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>ParXon</h1>
        <p class="splash-tagline">A calm companion for daily movement, timed exercises, and steady support.</p>
      </div>`;
    setTimeout(() => {
      navigate(currentSession ? "#/home" : "#/login");
    }, 1400);
  }

  function renderLogin() {
    app.innerHTML = `
      <div class="view auth-wrap">
        <div class="card">
          <h1>Welcome back</h1>
          <p style="color:var(--text-muted)">Log in to continue your routine.</p>
          <form id="loginForm" novalidate>
            <label for="email">Email</label>
            <input type="text" id="email" autocomplete="email" required>
            <label for="password">Password</label>
            <input type="password" id="password" autocomplete="current-password" required>
            <div id="loginError" class="field-error" hidden></div>
            <button type="submit" class="btn btn-primary btn-block btn-lg">Log in</button>
          </form>
        </div>
        <p class="auth-switch">New here? <a href="#/signup">Create an account</a></p>
      </div>`;

    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const errorBox = document.getElementById("loginError");

      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        return;
      }
    });
  }

  function renderSignup() {
    app.innerHTML = `
      <div class="view auth-wrap">
        <div class="card">
          <h1>Create your account</h1>
          <p style="color:var(--text-muted)">It only takes a moment.</p>
          <form id="signupForm" novalidate>
            <label for="newUsername">Your name</label>
            <input type="text" id="newUsername" autocomplete="name" required>
            <label for="newEmail">Email</label>
            <input type="text" id="newEmail" autocomplete="email" required>
            <label for="newPassword">Password</label>
            <input type="password" id="newPassword" autocomplete="new-password" required minlength="6">
            <div id="signupError" class="field-error" hidden></div>
            <button type="submit" class="btn btn-primary btn-block btn-lg">Sign up</button>
          </form>
        </div>
        <p class="auth-switch">Already have an account? <a href="#/login">Log in</a></p>
      </div>`;

    document.getElementById("signupForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("newUsername").value.trim();
      const email = document.getElementById("newEmail").value.trim();
      const password = document.getElementById("newPassword").value;
      const errorBox = document.getElementById("signupError");

      if (!username || !email || password.length < 6) {
        errorBox.textContent = "Please fill in every field — password needs at least 6 characters.";
        errorBox.hidden = false;
        return;
      }

      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        return;
      }
      if (!data.session) {
        errorBox.textContent = "Check your email to confirm your account, then log in.";
        errorBox.hidden = false;
        return;
      }

      await sb.from("profiles").insert({ id: data.user.id, username });
    });
  }

  function renderRole() {
    app.innerHTML = `
      <div class="view">
        <div class="hero">
          <h1>Who's using ParXon?</h1>
          <p style="color:var(--text-muted)">This helps us tailor tips throughout the app.</p>
        </div>
        <div class="role-grid">
          <button type="button" class="role-card" id="roleUser">
            <span class="role-icon" aria-hidden="true">🧍</span>
            <strong>I have Parkinson's</strong>
            <span style="color:var(--text-muted); font-size:0.9rem">Exercises, timers, and daily tips</span>
          </button>
          <button type="button" class="role-card" id="roleGiver">
            <span class="role-icon" aria-hidden="true">🤝</span>
            <strong>I'm a caregiver</strong>
            <span style="color:var(--text-muted); font-size:0.9rem">Support guidance and shared routines</span>
          </button>
        </div>
      </div>`;

    const choose = async (role) => {
      const updates = { role };
      if (role === "patient") updates.invite_code = randomInviteCode();
      await sb.from("profiles").update(updates).eq("id", currentSession.user.id);
      await loadProfile(currentSession.user.id);
      if (role === "caregiver") await initPushForCaregiver();
      navigate("#/home");
    };
    document.getElementById("roleUser").addEventListener("click", () => choose("patient"));
    document.getElementById("roleGiver").addEventListener("click", () => choose("caregiver"));
  }

  /* ============================================================
     VIEWS — HOME  (branches by role)
     ============================================================ */

  async function renderHome() {
    if (currentProfile.role === "caregiver") await renderCaregiverHome();
    else await renderPatientHome();
  }

  async function renderPatientHome() {
    const { count: todayCount } = await sb
      .from("exercise_logs")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", currentSession.user.id)
      .gte("completed_at", startOfTodayISO());

    app.innerHTML = `
      <div class="view">
        <div class="hero">
          <span class="eyebrow">Today</span>
          <h1>Hi, ${esc(currentProfile.username)}</h1>
          <p style="color:var(--text-muted)">Pick a stage, browse stories, or check in on your numbers.</p>
        </div>

        <div class="card card-tight" style="margin-bottom:var(--space-4)">
          <h3 style="margin-bottom:4px">Your invite code</h3>
          <p style="color:var(--text-muted); margin-bottom:8px">Share this with a caregiver so they can follow your progress.</p>
          <div class="invite-code">${esc(currentProfile.invite_code || "—")}</div>
          <p style="color:var(--text-muted); margin:8px 0 0">${todayCount > 0 ? "✅ You've logged an exercise today." : "You haven't logged an exercise yet today."}</p>
        </div>

        <h2>Exercise stages</h2>
        <div class="tile-grid" id="stageTiles"></div>

        <h2 style="margin-top:var(--space-5)">More</h2>
        <div class="tile-grid">
          <button type="button" class="tile" data-nav="#/games">
            <span class="tile-label">📖 Stories</span>
            <span class="tile-sub">Short reads on living well with Parkinson's</span>
          </button>
          <button type="button" class="tile" data-nav="#/bmi">
            <span class="tile-label">⚖️ BMI Calculator</span>
            <span class="tile-sub">Check your body mass index</span>
          </button>
          <button type="button" class="tile" data-nav="#/water">
            <span class="tile-label">💧 Water Intake</span>
            <span class="tile-sub">Estimate your daily hydration goal</span>
          </button>
        </div>

        <div class="voice-fab">
          <button type="button" class="btn btn-accent btn-lg" id="voiceBtn">
            🎙️ Speak a command
          </button>
        </div>
      </div>`;

    const stageTiles = document.getElementById("stageTiles");
    Object.entries(STAGES).forEach(([num, cfg]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile";
      btn.innerHTML = `<span class="tile-label">Stage ${num}</span><span class="tile-sub">${esc(cfg.label.split("—")[1].trim())} · ${cfg.count} exercises</span>`;
      btn.addEventListener("click", () => navigate(`#/stage/${num}`));
      stageTiles.appendChild(btn);
    });

    app.querySelectorAll("[data-nav]").forEach(btn =>
      btn.addEventListener("click", () => navigate(btn.dataset.nav)));

    document.getElementById("voiceBtn").addEventListener("click", listenForCommand);
  }

  async function renderCaregiverHome() {
    const { data: links } = await sb
      .from("links")
      .select("patient_id, profiles!links_patient_id_fkey(username)")
      .eq("caregiver_id", currentSession.user.id);

    const patients = links || [];

    const rows = await Promise.all(patients.map(async (link) => {
      const { count } = await sb
        .from("exercise_logs")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", link.patient_id)
        .gte("completed_at", startOfTodayISO());
      return { id: link.patient_id, username: link.profiles?.username || "Patient", doneToday: count > 0 };
    }));

    const patientRows = rows.length
      ? rows.map(p => `
          <button type="button" class="exercise-row" data-patient="${p.id}">
            <span class="exercise-num" style="background:${p.doneToday ? "var(--primary)" : "var(--danger)"}">${p.doneToday ? "✓" : "!"}</span>
            <span class="exercise-name">${esc(p.username)}</span>
            <span class="exercise-time">${p.doneToday ? "Exercised today" : "Not yet today"}</span>
          </button>`).join("")
      : `<p style="color:var(--text-muted)">No patients linked yet — enter an invite code below to connect one.</p>`;

    app.innerHTML = `
      <div class="view">
        <div class="hero">
          <span class="eyebrow">Caregiver dashboard</span>
          <h1>Hi, ${esc(currentProfile.username)}</h1>
          <p style="color:var(--text-muted)">Your linked patients and today's status.</p>
        </div>

        <div class="exercise-list" style="margin-bottom:var(--space-4)">${patientRows}</div>

        <div class="card card-tight">
          <h3>Link a patient</h3>
          <p style="color:var(--text-muted)">Enter the invite code they see on their home screen.</p>
          <form id="linkForm" novalidate>
            <input type="text" id="inviteCode" placeholder="e.g. 7QK4XZ" required style="text-transform:uppercase">
            <div id="linkError" class="field-error" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">Connect</button>
          </form>
        </div>

        <h2 style="margin-top:var(--space-5)">More</h2>
        <div class="tile-grid">
          <button type="button" class="tile" data-nav="#/games">
            <span class="tile-label">📖 Stories</span>
            <span class="tile-sub">Short reads on living well with Parkinson's</span>
          </button>
        </div>
      </div>`;

    app.querySelectorAll("[data-patient]").forEach(btn =>
      btn.addEventListener("click", () => navigate(`#/patient/${btn.dataset.patient}`)));
    app.querySelectorAll("[data-nav]").forEach(btn =>
      btn.addEventListener("click", () => navigate(btn.dataset.nav)));

    document.getElementById("linkForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = document.getElementById("inviteCode").value.trim().toUpperCase();
      const errorBox = document.getElementById("linkError");
      const { error } = await sb.rpc("link_caregiver_to_patient", { code });
      if (error) {
        errorBox.textContent = "That code didn't match a patient — double-check and try again.";
        errorBox.hidden = false;
        return;
      }
      toast("Linked! Refreshing your dashboard.");
      render();
    });
  }

  async function renderPatientDetail(patientId) {
    const { data: patient } = await sb.from("profiles").select("username").eq("id", patientId).single();
    const { data: logs } = await sb
      .from("exercise_logs")
      .select("*")
      .eq("patient_id", patientId)
      .order("completed_at", { ascending: false })
      .limit(30);

    if (!patient) { renderNotFound(); return; }

    const rows = (logs || []).map(l => {
      const ex = EXERCISES[l.exercise_id - 1];
      const when = new Date(l.completed_at).toLocaleString();
      return `
        <div class="exercise-row" style="cursor:default">
          <span class="exercise-num">${l.stage}</span>
          <span class="exercise-name">${esc(ex ? ex.name : "Exercise " + l.exercise_id)}</span>
          <span class="exercise-time">${esc(when)}</span>
        </div>`;
    }).join("");

    app.innerHTML = `
      <div class="view">
        <button type="button" class="back-link" id="backHome">← Dashboard</button>
        <h1>${esc(patient.username)}'s activity</h1>
        <p style="color:var(--text-muted)">Most recent 30 completed exercises.</p>
        <div class="exercise-list">${rows || "<p style='color:var(--text-muted)'>No exercises logged yet.</p>"}</div>
      </div>`;

    document.getElementById("backHome").addEventListener("click", () => navigate("#/home"));
  }

  /* ============================================================
     VIEWS — STAGES / EXERCISES
     ============================================================ */

  function renderStage(stageNum) {
    const cfg = STAGES[stageNum];
    if (!cfg) { renderNotFound(); return; }

    const rows = EXERCISES.slice(0, cfg.count).map((ex, i) => `
      <button type="button" class="exercise-row" data-num="${i + 1}">
        <span class="exercise-num">${i + 1}</span>
        <span class="exercise-name">${esc(ex.name)}</span>
        <span class="exercise-time">${ex.seconds}s</span>
      </button>`).join("");

    app.innerHTML = `
      <div class="view">
        <button type="button" class="back-link" id="backHome">← Home</button>
        <div class="stage-header">
          <h1>${esc(cfg.label)}</h1>
        </div>
        <div class="exercise-list">${rows}</div>
      </div>`;

    document.getElementById("backHome").addEventListener("click", () => navigate("#/home"));
    app.querySelectorAll(".exercise-row").forEach(btn =>
      btn.addEventListener("click", () => navigate(`#/exercise/${stageNum}/${btn.dataset.num}`)));
  }

  async function logCompletion(stageNum, exerciseNum) {
    if (!currentProfile || currentProfile.role !== "patient") return;
    await sb.from("exercise_logs").insert({
      patient_id: currentSession.user.id,
      stage: parseInt(stageNum, 10),
      exercise_id: parseInt(exerciseNum, 10),
    });
  }

  function renderExercise(stageNum, exNum) {
    const cfg = STAGES[stageNum];
    const idx = parseInt(exNum, 10) - 1;
    if (!cfg || idx < 0 || idx >= cfg.count) { renderNotFound(); return; }

    const ex = EXERCISES[idx];
    let remaining = ex.seconds;
    let running = false;

    app.innerHTML = `
      <div class="view exercise-detail">
        <button type="button" class="back-link" id="backStage">← ${esc(cfg.label)}</button>
        <h1>${esc(ex.name)}</h1>
        <p style="color:var(--text-muted)">Exercise ${exNum} of ${cfg.count}</p>

        <div class="timer-ring-wrap" id="ringWrap">
          <span class="timer-value" id="timerValue" aria-live="polite">${formatTime(remaining)}</span>
        </div>

        <div class="action-row">
          <button type="button" class="btn btn-primary btn-lg" id="startPauseBtn">▶ Start</button>
          <button type="button" class="btn btn-outline" id="speakBtn">🔊 Speak instructions</button>
        </div>

        <div class="exercise-instructions">
          <h3>Instructions</h3>
          <p>${esc(ex.instructions)}</p>
        </div>
      </div>`;

    document.getElementById("backStage").addEventListener("click", () => navigate(`#/stage/${stageNum}`));
    document.getElementById("speakBtn").addEventListener("click", () => speak(ex.instructions));

    const ringWrap = document.getElementById("ringWrap");
    const timerValue = document.getElementById("timerValue");
    const startPauseBtn = document.getElementById("startPauseBtn");

    startPauseBtn.addEventListener("click", () => {
      if (running) {
        clearActiveTimer();
        running = false;
        ringWrap.classList.remove("running");
        startPauseBtn.textContent = "▶ Resume";
      } else {
        running = true;
        ringWrap.classList.add("running");
        startPauseBtn.textContent = "⏸ Pause";
        activeTimer = setInterval(() => {
          remaining -= 1;
          timerValue.textContent = formatTime(remaining);
          if (remaining <= 0) {
            clearActiveTimer();
            logCompletion(stageNum, exNum);
            advanceExercise(stageNum, cfg, idx);
          }
        }, 1000);
      }
    });
  }

  function advanceExercise(stageNum, cfg, idx) {
    const nextIdx = (idx + 1) % cfg.count;
    toast(nextIdx === 0 ? "Stage complete — starting over. Great work!" : "Nice work! Moving to the next exercise.");
    navigate(`#/exercise/${stageNum}/${nextIdx + 1}`);
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, totalSeconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }

  /* ============================================================
     VIEWS — STORIES / CALCULATORS  (unchanged)
     ============================================================ */

  function renderGames() {
    const cards = STORIES.map((s, i) => `
      <button type="button" class="story-card" data-idx="${i}">
        <div class="story-title">${esc(s.title)}</div>
        <div class="story-excerpt">${esc(s.excerpt)}</div>
      </button>`).join("");

    app.innerHTML = `
      <div class="view">
        <button type="button" class="back-link" id="backHome">← Home</button>
        <h1>Stories &amp; Tips</h1>
        <p style="color:var(--text-muted)">Short reads, whenever you have a few minutes.</p>
        ${cards}
      </div>`;

    document.getElementById("backHome").addEventListener("click", () => navigate("#/home"));
    app.querySelectorAll(".story-card").forEach(btn =>
      btn.addEventListener("click", () => navigate(`#/games/${btn.dataset.idx}`)));
  }

  function renderGameDetail(idx) {
    const story = STORIES[idx];
    if (!story) { renderNotFound(); return; }
    app.innerHTML = `
      <div class="view">
        <button type="button" class="back-link" id="backGames">← Stories</button>
        <div class="card">
          <h1>${esc(story.title)}</h1>
          <p>${esc(story.body)}</p>
        </div>
      </div>`;
    document.getElementById("backGames").addEventListener("click", () => navigate("#/games"));
  }

  function renderBMI() {
    app.innerHTML = `
      <div class="view">
        <button type="button" class="back-link" id="backHome">← Home</button>
        <div class="card">
          <h1>⚖️ BMI Calculator</h1>
          <form id="bmiForm" novalidate>
            <label for="weight">Weight (kg)</label>
            <input type="number" id="weight" min="1" step="0.1" required>
            <label for="height">Height (cm)</label>
            <input type="number" id="height" min="1" step="0.1" required>
            <button type="submit" class="btn btn-primary btn-block btn-lg">Calculate</button>
          </form>
          <div id="bmiResult" aria-live="polite"></div>
        </div>
      </div>`;

    document.getElementById("backHome").addEventListener("click", () => navigate("#/home"));
    document.getElementById("bmiForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const weight = parseFloat(document.getElementById("weight").value);
      const heightCm = parseFloat(document.getElementById("height").value);
      const resultBox = document.getElementById("bmiResult");

      if (!weight || !heightCm) {
        resultBox.innerHTML = `<div class="result-banner result-danger">❌ Please enter a valid weight and height.</div>`;
        return;
      }
      const heightM = heightCm / 100;
      const bmi = weight / (heightM * heightM);
      let cls = "result-ok", msg = "";
      if (bmi < 18.5) { cls = "result-warn"; msg = "⚠️ Underweight — worth mentioning at your next check-up."; }
      else if (bmi < 25) { cls = "result-ok"; msg = "✅ Normal weight — keep up your current routine."; }
      else if (bmi < 30) { cls = "result-warn"; msg = "⚠️ Overweight — small changes to diet and activity can help."; }
      else { cls = "result-danger"; msg = "❗ Obese range — consider discussing weight management with a doctor."; }

      resultBox.innerHTML = `<div class="result-banner ${cls}">Your BMI: ${bmi.toFixed(2)}<br>${msg}</div>`;
    });
  }

  function renderWater() {
    app.innerHTML = `
      <div class="view">
        <button type="button" class="back-link" id="backHome">← Home</button>
        <div class="card">
          <h1>💧 Water Intake Calculator</h1>
          <form id="waterForm" novalidate>
            <label for="wWeight">Weight (kg)</label>
            <input type="number" id="wWeight" min="1" step="0.1" required>
            <fieldset>
              <legend>Activity level</legend>
              <div class="radio-row"><input type="radio" id="low" name="activity" value="1.0" checked><label for="low">Low</label></div>
              <div class="radio-row"><input type="radio" id="moderate" name="activity" value="1.2"><label for="moderate">Moderate</label></div>
              <div class="radio-row"><input type="radio" id="high" name="activity" value="1.4"><label for="high">High</label></div>
            </fieldset>
            <button type="submit" class="btn btn-primary btn-block btn-lg">Calculate</button>
          </form>
          <div id="waterResult" aria-live="polite"></div>
        </div>
      </div>`;

    document.getElementById("backHome").addEventListener("click", () => navigate("#/home"));
    document.getElementById("waterForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const weight = parseFloat(document.getElementById("wWeight").value);
      const multiplier = parseFloat(document.querySelector('input[name="activity"]:checked').value);
      const resultBox = document.getElementById("waterResult");

      if (!weight) {
        resultBox.innerHTML = `<div class="result-banner result-danger">❌ Please enter a valid weight.</div>`;
        return;
      }
      const liters = (weight * 35 * multiplier) / 1000;
      let cls = "result-ok", msg = "";
      if (liters < 2) { cls = "result-warn"; msg = "⚠️ Try to drink a bit more — staying hydrated helps energy and balance."; }
      else if (liters < 3) { cls = "result-ok"; msg = "✅ You're on track! Keep it steady through the day."; }
      else { cls = "result-ok"; msg = "🚀 Great hydration target — keep it up."; }

      resultBox.innerHTML = `<div class="result-banner ${cls}">💧 Recommended daily intake: ${liters.toFixed(2)} L<br>${msg}</div>`;
    });
  }

  function renderNotFound() {
    app.innerHTML = `
      <div class="view">
        <div class="card">
          <h1>Page not found</h1>
          <p>That page doesn't exist.</p>
          <a class="btn btn-primary" href="#/home">Back to Home</a>
        </div>
      </div>`;
  }


  sb.auth.getSession().then(async ({ data }) => {
    currentSession = data.session;
    if (currentSession) await loadProfile(currentSession.user.id);
    render();
  });
})();