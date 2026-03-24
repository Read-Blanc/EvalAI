import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// router.huggingface.co is the current supported endpoint
const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Compute cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { submission_id } = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: "submission_id is required" }),
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

    const hfKey = Deno.env.get("HUGGINGFACE_API_KEY") ?? "";

    // Step 1: Fetch answers
    const { data: answers, error: fetchErr } = await supabase
      .from("answers")
      .select("id, answer_text, question_id")
      .eq("submission_id", submission_id);

    if (fetchErr || !answers) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch answers",
          detail: fetchErr?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Found ${answers.length} answers for submission ${submission_id}`,
    );

    // Step 2: Fetch questions separately
    const questionIds = answers.map((a) => a.question_id).filter(Boolean);
    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, marks, sample_answer")
      .in("id", questionIds);

    if (qErr) console.error("Failed to fetch questions:", qErr.message);

    const qLookup = {};
    (questions ?? []).forEach((q) => {
      qLookup[q.id] = q;
    });

    // Step 3: Score each answer using feature-extraction + cosine similarity
    const results = [];

    for (const answer of answers) {
      const question = qLookup[answer.question_id];
      const sampleAnswer = question?.sample_answer ?? "";
      const answerText = answer.answer_text ?? "";

      if (!sampleAnswer.trim() || !answerText.trim()) {
        console.log(`Skipping answer ${answer.id} — empty text or sample`);
        results.push({ id: answer.id, ai_score: null });
        continue;
      }

      try {
        // Get embeddings for both texts in one request
        const hfRes = await fetch(HF_MODEL_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: [answerText, sampleAnswer],
            options: { wait_for_model: true },
          }),
        });

        const responseText = await hfRes.text();
        console.log(
          `HF status ${hfRes.status} for answer ${answer.id}:`,
          responseText.slice(0, 200),
        );

        if (!hfRes.ok) {
          results.push({ id: answer.id, ai_score: null });
          continue;
        }

        const embeddings = JSON.parse(responseText);

        // embeddings is [[...vec1...], [...vec2...]]
        let similarity: number | null = null;
        if (Array.isArray(embeddings) && embeddings.length === 2) {
          const vec1 = embeddings[0];
          const vec2 = embeddings[1];
          if (Array.isArray(vec1) && Array.isArray(vec2)) {
            const raw = cosineSimilarity(vec1, vec2);
            similarity = Math.max(0, Math.min(1, raw));
          }
        }

        console.log(`Similarity for answer ${answer.id}: ${similarity}`);

        if (similarity !== null) {
          const { error: updateErr } = await supabase
            .from("answers")
            .update({ ai_score: similarity })
            .eq("id", answer.id);

          if (updateErr) {
            console.error(`Update failed for ${answer.id}:`, updateErr.message);
          } else {
            console.log(`Saved ai_score ${similarity} for answer ${answer.id}`);
          }
        }

        results.push({ id: answer.id, ai_score: similarity });
      } catch (e) {
        console.error(`Exception for answer ${answer.id}:`, e);
        results.push({ id: answer.id, ai_score: null });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Top-level error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
