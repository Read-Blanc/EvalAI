import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// sentence-transformers/all-MiniLM-L6-v2 — fast, accurate semantic similarity
const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { submission_id } = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: "submission_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key so we can read/write all rows regardless of RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const hfKey = Deno.env.get("HUGGINGFACE_API_KEY") ?? "";

    // Fetch all answers for the submission, joined with question details
    const { data: answers, error: fetchErr } = await supabase
      .from("answers")
      .select("id, answer_text, questions(marks, sample_answer)")
      .eq("submission_id", submission_id);

    if (fetchErr || !answers) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch answers", detail: fetchErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score all answers in parallel — avoids sequential cold-start timeouts
    const results = await Promise.all(answers.map(async (answer) => {
      const sampleAnswer = answer.questions?.sample_answer;
      const answerText   = answer.answer_text;

      // Skip if either side is empty — cannot compute similarity
      if (!sampleAnswer?.trim() || !answerText?.trim()) {
        return { id: answer.id, ai_score: null };
      }

      // Call HuggingFace Inference API
      const hfRes = await fetch(HF_MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: answerText,
            sentences: [sampleAnswer],
          },
          // wait_for_model prevents 503 when the model is cold-starting
          options: { wait_for_model: true },
        }),
      });

      if (!hfRes.ok) {
        const errText = await hfRes.text();
        console.error(`HuggingFace error for answer ${answer.id}:`, errText);
        return { id: answer.id, ai_score: null };
      }

      // Response is an array of cosine similarities, e.g. [0.847]
      const scores     = await hfRes.json();
      const raw        = Array.isArray(scores) ? scores[0] : null;
      const similarity = typeof raw === "number" ? Math.max(0, Math.min(1, raw)) : null;

      // Persist the score
      if (similarity !== null) {
        await supabase
          .from("answers")
          .update({ ai_score: similarity })
          .eq("id", answer.id);
      }

      return { id: answer.id, ai_score: similarity };
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
