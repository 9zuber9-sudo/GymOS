const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const geminiKey = process.env.GEMINI_API_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !supabaseKey || !geminiKey) {
  console.error("Required environment variables are missing.");
  process.exit(1);
}

const supabaseHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
};

async function verify() {
  let failed = false;

  const auth = await fetch(`${url}/auth/v1/settings`, {
    headers: supabaseHeaders,
  });
  console.log(`Supabase auth endpoint: ${auth.status}`);
  failed ||= !auth.ok;
  if (auth.ok) {
    const settings = await auth.json();
    console.log(
      `Email signup: enabled=${!settings.disable_signup} confirmation_required=${!settings.mailer_autoconfirm}`,
    );
  }

  if (serviceRoleKey) {
    const admin = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    console.log(`Supabase admin authentication: ${admin.status}`);
    failed ||= !admin.ok;
    if (admin.ok) {
      const body = await admin.json();
      const users = body.users || [];
      console.log(
        `Auth accounts on first page: total=${users.length} confirmed=${users.filter((user) => Boolean(user.email_confirmed_at)).length} pending_confirmation=${users.filter((user) => !user.email_confirmed_at).length}`,
      );
    }
  } else {
    console.log("Supabase admin authentication: not configured");
    failed = true;
  }

  for (const table of [
    { name: "workouts", column: "id" },
    { name: "body_weight_logs", column: "id" },
    { name: "notes", column: "id" },
    { name: "workout_templates", column: "id" },
    { name: "gymmi_chats", column: "id" },
    { name: "gymmi_daily_usage", column: "user_id" },
    { name: "profiles", column: "id" },
    { name: "friendships", column: "id" },
    { name: "direct_messages", column: "id" },
    { name: "shared_workouts", column: "id" },
  ]) {
    const response = await fetch(
      `${url}/rest/v1/${table.name}?select=${table.column}&limit=1`,
      { headers: supabaseHeaders },
    );
    console.log(`Table ${table.name}: ${response.status}`);
    failed ||= !response.ok;
  }

  const gemini = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with exactly: GYMOS_OK" }] }],
      }),
    },
  );
  let validResponse = false;
  if (gemini.ok) {
    const body = await gemini.json();
    validResponse = Boolean(
      body.candidates?.[0]?.content?.parts?.some((part) =>
        String(part.text || "").includes("GYMOS_OK"),
      ),
    );
  }
  console.log(
    `Gemini ${model}: ${gemini.status} valid_response=${validResponse}`,
  );
  failed ||= !gemini.ok || !validResponse;

  if (failed) process.exit(1);
}

verify().catch((error) => {
  console.error(`Connection check failed: ${error.message}`);
  process.exit(1);
});
