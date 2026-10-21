import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ACCOUNTS = {
  user: { email: "demo.user@moneytransfertracker.app", name: "Demo User", role: "demo" },
  admin: { email: "demo.admin@moneytransfertracker.app", name: "Demo Admin", role: "demo_admin" },
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function sampleTransfers(userId: string) {
  const people = ["Rahim Uddin", "Karim Ahmed", "Fatema Begum", "Ayesha Khan"];
  const methods = ["Bkash", "Nagad", "Taptap Send", "Mobile Banking", "Bank Transfer"];
  const rows = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - Math.floor(i / 2), 3 + ((i * 5) % 24));
    const sent = 300 + ((i * 137) % 1500);
    rows.push({
      id: `demo-${i}`, user_id: userId, date: d.toISOString().slice(0, 10),
      recipient_name: people[i % people.length], amount_sent: sent, sent_currency: "SAR",
      amount_received: Math.round(sent * 32.1), received_currency: "BDT",
      payment_method: methods[i % methods.length], reference: `TX${10230 + i}`,
    });
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body?.role === "admin" ? "admin" : body?.role === "user" ? "user" : null;
    if (!kind) return json({ error: "role must be 'user' or 'admin'" }, 400);
    const acct = ACCOUNTS[kind];

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });

    const password = crypto.randomUUID() + crypto.randomUUID();
    let userId: string | undefined;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list?.users.find((u) => u.email === acct.email)?.id;

    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: acct.email, password, email_confirm: true, user_metadata: { full_name: acct.name },
      });
      if (error) throw error;
      userId = data.user.id;
    } else {
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
    }

    await admin.from("user_roles").upsert({ user_id: userId, role: acct.role }, { onConflict: "user_id,role" });

    const { count } = await admin.from("transfers").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (!count) {
      await admin.from("transfers").upsert(sampleTransfers(userId), { onConflict: "user_id,id" });
      await admin.from("notes").upsert([{
        id: "demo-note-1", user_id: userId, date: new Date().toISOString().slice(0, 10),
        title: "Welcome to the demo", body: "Feel free to add, edit and delete anything — this is a shared demo account.",
      }], { onConflict: "user_id,id" });
    }

    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({ email: acct.email, password });
    if (signErr || !signIn.session) throw signErr ?? new Error("No session");
    return json({ access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
