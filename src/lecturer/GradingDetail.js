import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  ArrowLeft,
  Robot,
  PencilSimple,
  FloppyDisk,
  X,
  CheckCircle,
  Clock,
  Cpu,
} from "@phosphor-icons/react";
import "./GradingDetail.css";

function CircularProgress({ value, max, size = 104, strokeWidth = 9 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);
  const color = pct >= 0.75 ? "#10b981" : pct >= 0.5 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function gradeLabel(pct) {
  if (pct === null) return "Not Graded";
  if (pct >= 90) return "Excellent";
  if (pct >= 75) return "Good";
  if (pct >= 60) return "Satisfactory";
  return "Needs Improvement";
}

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function GradingDetail({ submission, onNavigate }) {
  const [answers, setAnswers] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [gradingMode, setGradingMode] = useState(null);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState(submission?.status ?? "");
  const [aiScoring, setAiScoring] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchAnswers = useCallback(async () => {
    if (!submission) return;
    setLoading(true);

    // Step 1: fetch answers without join
    const { data: rawAnswers, error } = await supabase
      .from("answers")
      .select("id, answer_text, ai_score, marks_awarded, question_id")
      .eq("submission_id", submission.id);

    if (error || !rawAnswers) {
      setLoading(false);
      return;
    }

    // Step 2: fetch questions separately
    const questionIds = rawAnswers.map((a) => a.question_id).filter(Boolean);
    const { data: questions } = await supabase
      .from("questions")
      .select("id, text, marks, sample_answer, order_index")
      .in("id", questionIds);

    // Build lookup
    const qLookup = {};
    (questions ?? []).forEach((q) => {
      qLookup[q.id] = q;
    });

    // Merge and sort
    const merged = rawAnswers.map((a) => ({
      ...a,
      questions: qLookup[a.question_id] ?? null,
    }));

    const sorted = merged.sort(
      (a, b) =>
        (a.questions?.order_index ?? 0) - (b.questions?.order_index ?? 0),
    );

    setAnswers(sorted);

    const init = {};
    sorted.forEach((a) => {
      init[a.id] = a.marks_awarded !== null ? String(a.marks_awarded) : "";
    });
    setOverrides(init);
    setLoading(false);
  }, [submission]);

  useEffect(() => {
    fetchAnswers();
    setStatus(submission?.status ?? "");
    setOverrideMode(false);
    setGradingMode(null);
  }, [fetchAnswers, submission]);

  const handleRunAI = async () => {
    setAiScoring(true);
    try {
      const { error } = await supabase.functions.invoke("grade-submission", {
        body: { submission_id: submission.id },
      });
      if (error) throw error;
      await fetchAnswers();
      showToast("AI grading complete.");
    } catch (e) {
      console.error("AI grading error:", e);
      showToast("AI grading failed. Please try again.");
    } finally {
      setAiScoring(false);
    }
  };

  const handleChooseMode = (mode) => {
    setGradingMode(mode);
    setOverrideMode(true);
    if (mode === "auto") {
      const init = {};
      answers.forEach((a) => {
        const suggested =
          a.ai_score !== null
            ? Math.round(a.ai_score * (a.questions?.marks ?? 0))
            : a.marks_awarded !== null
              ? a.marks_awarded
              : 0;
        init[a.id] = String(suggested);
      });
      setOverrides(init);
    }
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      for (const answer of answers) {
        const val = parseInt(overrides[answer.id], 10);
        if (!isNaN(val)) {
          const { error } = await supabase
            .from("answers")
            .update({ marks_awarded: val })
            .eq("id", answer.id);
          if (error) throw error;
        }
      }
      const { error: sErr } = await supabase
        .from("submissions")
        .update({ status: "Graded" })
        .eq("id", submission.id);
      if (sErr) throw sErr;
      setStatus("Graded");
      setOverrideMode(false);
      setGradingMode(null);
      showToast("Grades saved successfully.");
      await fetchAnswers();
    } catch {
      showToast("Failed to save grades. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!submission) {
    return (
      <div className="gd-page">
        <div className="gd-empty">
          No submission selected.
          <button onClick={() => onNavigate("grading")}>Return to queue</button>
        </div>
      </div>
    );
  }

  const totalMarks = answers.reduce(
    (sum, a) => sum + (a.questions?.marks ?? 0),
    0,
  );
  const awardedMarks = answers.reduce(
    (sum, a) => sum + (a.marks_awarded ?? 0),
    0,
  );
  const pct =
    status === "Graded" && totalMarks > 0
      ? Math.round((awardedMarks / totalMarks) * 100)
      : null;
  const hasAiScores = answers.some((a) => a.ai_score !== null);

  return (
    <div className="gd-page">
      {/* Topbar */}
      <div className="gd-topbar">
        <nav className="gd-breadcrumb">
          <button
            className="gd-crumb-link"
            onClick={() => onNavigate("grading")}
          >
            <ArrowLeft size={13} style={{ marginRight: 4 }} />
            Grading Queue
          </button>
          <span className="gd-crumb-sep">/</span>
          <span className="gd-crumb-link">{submission.assessmentTitle}</span>
          <span className="gd-crumb-sep">/</span>
          <span className="gd-crumb-current">{submission.studentName}</span>
        </nav>
        <div className="gd-topbar-actions">
          {!overrideMode && status === "Graded" && (
            <button
              className="gd-btn-ghost"
              onClick={() => {
                setGradingMode("manual");
                setOverrideMode(true);
              }}
            >
              <PencilSimple size={14} style={{ marginRight: 5 }} />
              Edit Grades
            </button>
          )}
        </div>
      </div>

      <div className="gd-body">
        <div className="gd-title-row">
          <div>
            <h1 className="gd-title">{submission.assessmentTitle}</h1>
            <div className="gd-meta">
              {submission.studentName} &bull; Submitted {submission.date}
            </div>
          </div>
          <span
            className={`gd-badge-complete ${status !== "Graded" ? "gd-badge-pending" : ""}`}
          >
            {status === "Graded" ? (
              <>
                <CheckCircle
                  size={12}
                  weight="fill"
                  style={{ marginRight: 4 }}
                />
                Graded
              </>
            ) : (
              <>
                <Clock size={12} style={{ marginRight: 4 }} />
                Pending Review
              </>
            )}
          </span>
        </div>

        {/* Metric cards */}
        <div className="gd-metrics-row">
          {[
            {
              label: "Questions",
              value: loading ? "—" : answers.length,
              sub: "in this submission",
            },
            {
              label: "Total Marks",
              value: loading ? "—" : totalMarks,
              sub: "available",
            },
            {
              label: "Marks Awarded",
              value: status === "Graded" ? awardedMarks : "—",
              sub: pct !== null ? `${pct}% score` : "not yet graded",
              color:
                pct !== null
                  ? pct >= 75
                    ? "#10b981"
                    : pct >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                  : "#999",
            },
            {
              label: "Status",
              value: status === "Graded" ? "Graded" : "Pending",
              sub: "submission status",
              color: status === "Graded" ? "#059669" : "#1a1a1a",
            },
          ].map((m) => (
            <div key={m.label} className="gd-metric-card">
              <div className="gd-metric-label">{m.label}</div>
              <div
                className="gd-metric-value"
                style={m.color ? { color: m.color } : {}}
              >
                {m.value}
              </div>
              <div className="gd-metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#aaa",
              fontSize: 14,
            }}
          >
            Loading answers…
          </div>
        ) : (
          <div className="gd-main">
            <div className="gd-content">
              {answers.length === 0 ? (
                <div
                  className="gd-section-card"
                  style={{ textAlign: "center", color: "#aaa", fontSize: 14 }}
                >
                  No answers found for this submission.
                </div>
              ) : (
                answers.map((a, idx) => (
                  <div key={a.id}>
                    {/* Question */}
                    <div className="gd-section-card">
                      <div className="gd-section-header">
                        <span className="gd-section-label">
                          Question {idx + 1}
                        </span>
                        <span className="gd-max-pts">
                          Max: {a.questions?.marks ?? 0} marks
                        </span>
                      </div>
                      <p className="gd-prompt-text">
                        {a.questions?.text ?? "—"}
                      </p>
                      {a.questions?.sample_answer && (
                        <div className="gd-sample-answer-box">
                          <div className="gd-sample-answer-label">
                            Reference Answer
                          </div>
                          <p className="gd-sample-answer-text">
                            {a.questions.sample_answer}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Student answer */}
                    <div className="gd-section-card">
                      <div className="gd-section-header">
                        <span className="gd-section-label">Student Answer</span>
                        <div className="gd-section-header-right">
                          {a.ai_score !== null && (
                            <span className="gd-ai-similarity-badge">
                              <Cpu size={11} style={{ marginRight: 3 }} />
                              AI: {Math.round(a.ai_score * 100)}%
                            </span>
                          )}
                          <span className="gd-word-count">
                            {wordCount(a.answer_text)} words
                          </span>
                        </div>
                      </div>
                      <div className="gd-answer-box">
                        {a.answer_text ? (
                          a.answer_text
                            .split("\n\n")
                            .map((para, i) => <p key={i}>{para}</p>)
                        ) : (
                          <p style={{ color: "#aaa" }}>No answer submitted.</p>
                        )}
                      </div>
                      {a.marks_awarded !== null && !overrideMode && (
                        <div className="gd-awarded-badge">
                          <CheckCircle
                            size={12}
                            weight="fill"
                            style={{ marginRight: 4 }}
                          />
                          Awarded: {a.marks_awarded} / {a.questions?.marks ?? 0}{" "}
                          marks
                        </div>
                      )}
                      {overrideMode && (
                        <div className="gd-override-row">
                          <div className="gd-override-field-label">
                            <span>Q{idx + 1}</span>
                            {a.ai_score !== null && (
                              <span className="gd-ai-hint">
                                AI:{" "}
                                {Math.round(
                                  a.ai_score * (a.questions?.marks ?? 0),
                                )}
                                /{a.questions?.marks ?? 0}
                              </span>
                            )}
                          </div>
                          <input
                            className="gd-override-input"
                            type="number"
                            min="0"
                            max={a.questions?.marks ?? 0}
                            value={overrides[a.id] ?? ""}
                            onChange={(e) =>
                              setOverrides((prev) => ({
                                ...prev,
                                [a.id]: e.target.value,
                              }))
                            }
                          />
                          <span className="gd-override-max">
                            / {a.questions?.marks ?? 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar */}
            <aside className="gd-sidebar">
              <div className="gd-side-card">
                <div className="gd-grade-header">Overall Grade</div>
                <div className="gd-score-circle-wrap">
                  <div className="gd-score-ring">
                    <CircularProgress
                      value={status === "Graded" ? awardedMarks : 0}
                      max={totalMarks > 0 ? totalMarks : 1}
                    />
                    <div className="gd-score-overlay">
                      {status === "Graded" ? (
                        <>
                          <span className="gd-score-num">{awardedMarks}</span>
                          <span className="gd-score-denom">/{totalMarks}</span>
                        </>
                      ) : (
                        <span className="gd-score-pending">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="gd-grade-label">{gradeLabel(pct)}</div>
                {pct !== null && (
                  <div className="gd-grade-pct">{pct}% Score</div>
                )}
              </div>

              <div className="gd-side-card">
                {[
                  { label: "Student", value: submission.studentName },
                  { label: "Assessment", value: submission.assessmentTitle },
                  { label: "Status", value: status },
                  { label: "Submitted", value: submission.date },
                ].map((row) => (
                  <div key={row.label} className="gd-info-row">
                    <span className="gd-info-label">{row.label}</span>
                    <span className="gd-info-value">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="gd-side-card">
                <h3 className="gd-override-title">Grading</h3>

                {!overrideMode ? (
                  <>
                    {status === "Graded" && (
                      <p className="gd-override-desc">
                        Grades saved. Click "Edit Grades" in the toolbar to make
                        changes.
                      </p>
                    )}
                    {status !== "Graded" && aiScoring && (
                      <div className="gd-ai-loading">
                        <div className="gd-ai-spinner" />
                        <p className="gd-override-desc">Running AI grading…</p>
                      </div>
                    )}
                    {status !== "Graded" && !aiScoring && hasAiScores && (
                      <>
                        <p className="gd-override-desc">
                          AI scores ready. Choose how to finalise marks.
                        </p>
                        <button
                          className="gd-btn-mode gd-btn-mode-auto"
                          onClick={() => handleChooseMode("auto")}
                        >
                          <span className="gd-btn-mode-title">
                            <Robot size={14} style={{ marginRight: 5 }} />
                            Auto Grade
                          </span>
                          <span className="gd-btn-mode-sub">
                            Pre-fill marks from AI scores
                          </span>
                        </button>
                        <button
                          className="gd-btn-mode gd-btn-mode-manual"
                          onClick={() => handleChooseMode("manual")}
                        >
                          <span className="gd-btn-mode-title">
                            <PencilSimple
                              size={14}
                              style={{ marginRight: 5 }}
                            />
                            Grade Manually
                          </span>
                          <span className="gd-btn-mode-sub">
                            Enter marks yourself
                          </span>
                        </button>
                        <button
                          className="gd-btn-ai-rerun"
                          onClick={handleRunAI}
                          disabled={aiScoring}
                        >
                          <Robot size={12} style={{ marginRight: 4 }} />
                          Re-run AI Grading
                        </button>
                      </>
                    )}
                    {status !== "Graded" && !aiScoring && !hasAiScores && (
                      <>
                        <p className="gd-override-desc">
                          Use AI to suggest marks based on semantic similarity,
                          or grade manually.
                        </p>
                        <button
                          className="gd-btn-ai"
                          onClick={handleRunAI}
                          disabled={aiScoring}
                        >
                          <Robot size={15} style={{ marginRight: 6 }} />
                          Run AI Grading
                        </button>
                        <button
                          className="gd-btn-override"
                          onClick={() => handleChooseMode("manual")}
                        >
                          <PencilSimple size={14} style={{ marginRight: 5 }} />
                          Grade Manually
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="gd-override-desc">
                      {gradingMode === "auto"
                        ? "AI-suggested marks pre-filled. Adjust if needed, then save."
                        : "Enter marks for each question in the answer cards above."}
                    </p>
                    <div className="gd-override-actions">
                      <button
                        className="gd-btn-ghost-sm"
                        onClick={() => {
                          setOverrideMode(false);
                          setGradingMode(null);
                          fetchAnswers();
                        }}
                        disabled={saving}
                      >
                        <X size={13} style={{ marginRight: 4 }} />
                        Cancel
                      </button>
                      <button
                        className="gd-btn-primary-sm"
                        onClick={handleSaveGrades}
                        disabled={saving}
                      >
                        <FloppyDisk size={13} style={{ marginRight: 4 }} />
                        {saving ? "Saving…" : "Save Grades"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      {toast && <div className="gd-toast">{toast}</div>}
    </div>
  );
}

export default GradingDetail;
