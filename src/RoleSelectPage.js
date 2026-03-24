import { useState } from "react";
import { supabase } from "./supabaseClient";
import { useUser } from "./UserContext";
import "./RoleSelectPage.css";

function RoleSelectPage({ onNavigate }) {
  const { user, setUser } = useUser();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ role: selected })
      .eq("id", user.id);

    if (updateErr) {
      setError("Failed to save your role. Please try again.");
      setSaving(false);
      return;
    }

    // Update local user context
    setUser((prev) => ({ ...prev, role: selected }));
    onNavigate("dashboard", { ...user, role: selected });
    setSaving(false);
  };

  return (
    <div className="rsp-page">
      <div className="rsp-card">
        <div className="rsp-logo">EvalAI</div>

        <h1 className="rsp-title">One last step</h1>
        <p className="rsp-sub">
          Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!
          Tell us how you'll be using EvalAI.
        </p>

        <div className="rsp-options">
          <button
            className={`rsp-option ${selected === "student" ? "rsp-option-active" : ""}`}
            onClick={() => setSelected("student")}
          >
            <div className="rsp-option-icon">🎓</div>
            <div className="rsp-option-body">
              <div className="rsp-option-title">I'm a Student</div>
              <div className="rsp-option-desc">
                Take assessments and view my results
              </div>
            </div>
            <div className="rsp-option-check">
              {selected === "student" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#1a1a1a" />
                  <path
                    d="M4.5 8l2.5 2.5 4.5-4.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </button>

          <button
            className={`rsp-option ${selected === "lecturer" ? "rsp-option-active" : ""}`}
            onClick={() => setSelected("lecturer")}
          >
            <div className="rsp-option-icon">📋</div>
            <div className="rsp-option-body">
              <div className="rsp-option-title">I'm a Lecturer</div>
              <div className="rsp-option-desc">
                Create assessments and grade submissions
              </div>
            </div>
            <div className="rsp-option-check">
              {selected === "lecturer" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#1a1a1a" />
                  <path
                    d="M4.5 8l2.5 2.5 4.5-4.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </button>
        </div>

        {error && <div className="rsp-error">{error}</div>}

        <button
          className="rsp-btn"
          onClick={handleConfirm}
          disabled={!selected || saving}
        >
          {saving ? "Saving…" : "Continue →"}
        </button>

        <p className="rsp-note">
          You can't change this later, so choose carefully.
        </p>
      </div>
    </div>
  );
}

export default RoleSelectPage;
