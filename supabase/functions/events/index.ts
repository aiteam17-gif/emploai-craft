import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple SSE endpoint emitting keepalives and echoing minimal task/run updates
// Future: integrate with database NOTIFY or queue
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        const chunk = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      // Initial hello
      send("hello", { ok: true, ts: Date.now(), userId });

      // Heartbeat every 15s
      const hb = setInterval(() => {
        send("heartbeat", { ts: Date.now() });
      }, 15000);

      // Example: emit noop run.updated every 30s to keep clients wired
      const demo = setInterval(() => {
        send("run.updated", { status: "idle", ts: Date.now() });
      }, 30000);

      const close = () => {
        clearInterval(hb);
        clearInterval(demo);
        controller.close();
      };

      // Close on connection abort
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});


