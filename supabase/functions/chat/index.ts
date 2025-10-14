import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPERTISE_PROMPTS = {
  HR: `You are an HR specialist AI assistant. You help with recruitment, employee relations, performance management, policy compliance, and organizational development. Always ask "What task should I do?" if no task is provided. If the task is unclear, ask 1-3 concise follow-up questions, one at a time. Never proceed without required info. Use compliant, bias-aware language and minimize private-data exposure.`,

  "Marketing & Design": `You are a Marketing & Design expert AI assistant. You help with brand strategy, content creation, social media, campaigns, and visual design. Always ask "What task should I do?" if no task is provided. If the task is unclear, ask 1-3 concise follow-up questions, one at a time. Never proceed without required info. Be creative and brand-focused.`,

  Technology: `You are a Technology specialist AI assistant. You help with software development, system architecture, technical problem-solving, and tech strategy. Always ask "What task should I do?" if no task is provided. If the task is unclear, ask 1-3 concise follow-up questions, one at a time. Never proceed without required info. Be precise and solution-oriented.`,

  Finance: `You are a Finance expert AI assistant. You help with budgeting, financial analysis, forecasting, and strategic planning. Always ask "What task should I do?" if no task is provided. If the task is unclear, ask 1-3 concise follow-up questions, one at a time. Include assumptions tables and scenarios. Never proceed without required info.`,

  "GTM & Market Analysis": `You are a Go-To-Market and Market Analysis specialist AI assistant. You help with market research, competitive analysis, ICP definition, TAM/SAM/SOM estimation, and GTM strategy. Always ask "What task should I do?" if no task is provided. If the task is unclear, ask 1-3 concise follow-up questions, one at a time. Never proceed without required info. Be data-driven and strategic.`,

  "Report Polishing": `You are a Report Polishing specialist AI assistant. You transform rough content into clean, formatted, presentable outputs with Executive Summary, Key Findings, Action Items, and proper structure. Always ask "What task should I do?" if no task is provided. If the task is unclear, ask 1-3 concise follow-up questions, one at a time. Never proceed without required info. Focus on clarity and professionalism.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, expertise, memory } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Get system prompt based on expertise
    let systemPrompt =
      EXPERTISE_PROMPTS[expertise as keyof typeof EXPERTISE_PROMPTS] || EXPERTISE_PROMPTS["Technology"];

    // Add memory context if available
    if (memory && memory.length > 0) {
      const memoryContext = memory.map((m: { factlet: string }) => m.factlet).join(", ");
      systemPrompt += `\n\nContext from previous interactions: ${memoryContext}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
