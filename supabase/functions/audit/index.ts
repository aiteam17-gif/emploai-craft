import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AuditEvent = {
  ts: number;
  actorId: string;
  orgId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  details?: Record<string, unknown>;
};

// Append-only audit sink persisting to Postgres via service role
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const event = (await req.json()) as AuditEvent;
    if (!event || !event.actorId || !event.entityType || !event.entityId || !event.action) {
      return new Response(JSON.stringify({ error: "invalid event" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "missing service config" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const prevHash = null;
    const payload = { created_at: new Date(event.ts ?? Date.now()).toISOString(), actor_id: event.actorId, org_id: event.orgId ?? null, entity_type: event.entityType, entity_id: event.entityId, action: event.action, details: event.details ?? null, prev_hash: prevHash, event_hash: null };
    const { error } = await supabase.from("audit_logs").insert(payload);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true, ts: Date.now() }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


