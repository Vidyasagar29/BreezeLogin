const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const adminPin = requiredEnv("BREEZE_ADMIN_PIN");
    if (request.headers.get("x-admin-pin") !== adminPin) {
      return jsonResponse({ error: "Invalid admin PIN" }, 401);
    }

    const payload = await request.json();

    if (payload.action === "login-url") {
      const apiKey = encodeURIComponent(requiredEnv("BREEZE_API_KEY"));
      return jsonResponse({
        login_url: `https://api.icicidirect.com/apiuser/login?api_key=${apiKey}`,
      });
    }

    if (payload.action === "save-code") {
      const accessCode = String(payload.access_code || "").trim();
      if (!accessCode) {
        return jsonResponse({ error: "access_code is required" }, 400);
      }

      const supabaseUrl = requiredEnv("SUPABASE_URL");
      const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
      const table = Deno.env.get("SUPABASE_TABLE") || "breeze_access_codes";
      const endpoint = `${supabaseUrl}/rest/v1/${table}?on_conflict=id`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          id: "latest",
          access_code: accessCode,
          note: payload.note || null,
          source: "github-pages-edge-function",
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        return jsonResponse({ error: message || "Supabase write failed" }, 500);
      }

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse({ error: message }, 500);
  }
});
