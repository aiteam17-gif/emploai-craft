import { supabase } from "@/integrations/supabase/client";

export type AuditEvent = {
  ts?: number;
  actorId: string;
  orgId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  details?: Record<string, unknown>;
};

export async function appendAudit(event: AuditEvent) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...event, ts: event.ts ?? Date.now() }),
  });
  if (!res.ok) {
    // Non-blocking: log client-side; do not throw
    console.warn("audit append failed", await res.text());
  }
}

export async function auditTaskViewed(userId: string, taskId: string) {
  await appendAudit({ actorId: userId, entityType: "task", entityId: taskId, action: "view" });
}


