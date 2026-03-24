// supabase/functions/check-time-limit/index.ts
// Called by TakeTest.js before allowing submission.
// Returns { allowed: true } or { allowed: false, reason: '...' }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { assessment_id, student_id, started_at } = await req.json();

    if (!assessment_id || !student_id || !started_at) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get assessment duration
    const { data: assessment, error } = await supabase
      .from("assessments")
      .select("duration_minutes, status")
      .eq("id", assessment_id)
      .single();

    if (error || !assessment) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Assessment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Assessment must be active
    if (assessment.status !== "Active") {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Assessment is no longer active",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // No time limit set — always allowed
    if (!assessment.duration_minutes) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if student already submitted
    const { data: existing } = await supabase
      .from("submissions")
      .select("id")
      .eq("assessment_id", assessment_id)
      .eq("student_id", student_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Already submitted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check time elapsed
    const startTime = new Date(started_at).getTime();
    const now = Date.now();
    const elapsedMins = (now - startTime) / 60000;
    const limitMins = assessment.duration_minutes;

    // Allow 60 seconds grace period for network latency
    const graceSecs = 60;
    const allowed = elapsedMins <= limitMins + graceSecs / 60;

    console.log(
      `Student ${student_id}: elapsed=${elapsedMins.toFixed(2)}min, limit=${limitMins}min, allowed=${allowed}`,
    );

    return new Response(
      JSON.stringify({
        allowed,
        elapsed_minutes: Math.round(elapsedMins),
        limit_minutes: limitMins,
        reason: allowed
          ? null
          : `Time limit exceeded (${Math.round(elapsedMins)} min > ${limitMins} min)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ allowed: true }), // fail open — don't block on server error
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
