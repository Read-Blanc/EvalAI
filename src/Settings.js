import { useState, useContext, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { UserContext } from "./UserContext";
import "./Settings.css";

function Toggle({ on, onChange }) {
  return (
    <button
      className={`settings-toggle ${on ? "settings-toggle-on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span className="settings-toggle-knob" />
    </button>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="settings-section-card">
      <div className="settings-section-head">
        <div className="settings-section-title">{title}</div>
        {desc && <div className="settings-section-desc">{desc}</div>}
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

// Confirmation modal for account deletion
function DeleteModal({ userEmail, onConfirm, onCancel, deleting }) {
  const [typed, setTyped] = useState("");
  const confirmed = typed === userEmail;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-icon">⚠️</div>
        <h2 className="settings-modal-title">Delete your account?</h2>
        <p className="settings-modal-body">
          This will permanently delete your account and{" "}
          <strong>all associated data</strong> — assessments, submissions,
          grades, and results. This cannot be undone.
        </p>
        <div className="settings-modal-confirm-label">
          Type your email address to confirm:
          <strong> {userEmail}</strong>
        </div>
        <input
          className="settings-input settings-modal-input"
          type="email"
          placeholder={userEmail}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
        />
        <div className="settings-modal-actions">
          <button
            className="settings-btn-ghost-modal"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="settings-btn-delete-confirm"
            onClick={onConfirm}
            disabled={!confirmed || deleting}
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings({ onNavigate }) {
  const { user, setUser, logout } = useContext(UserContext);
  const isLecturer = user?.role === "lecturer";

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const defaultNotifs = isLecturer
    ? { new_submission: true, graded_override: false, reminders: true }
    : { graded: true, new_assessment: true, reminders: false };
  const [notifs, setNotifs] = useState(defaultNotifs);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [appearance, setAppearance] = useState({
    compactMode: false,
    showScoreColors: true,
  });

  const [toast, setToast] = useState({ msg: "", err: false });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg: "", err: false }), 3500);
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("full_name, notification_prefs, appearance_prefs")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
        if (data?.notification_prefs)
          setNotifs((p) => ({ ...p, ...data.notification_prefs }));
        if (data?.appearance_prefs)
          setAppearance((p) => ({ ...p, ...data.appearance_prefs }));
      });
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showToast("Full name is required.", true);
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      showToast("Failed to update profile.", true);
      return;
    }
    setUser((prev) => ({ ...prev, fullName: fullName.trim() }));
    showToast("Profile updated.");
  };

  const handleChangePwd = async () => {
    if (pwdNew.length < 8) {
      showToast("Password must be at least 8 characters.", true);
      return;
    }
    if (pwdNew !== pwdConfirm) {
      showToast("Passwords do not match.", true);
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwdNew });
    setSavingPwd(false);
    if (error) {
      showToast(error.message ?? "Failed to change password.", true);
      return;
    }
    setPwdNew("");
    setPwdConfirm("");
    showToast("Password changed successfully.");
  };

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: notifs })
      .eq("id", user.id);
    setSavingNotifs(false);
    if (error) {
      showToast("Failed to save preferences.", true);
      return;
    }
    showToast("Notification preferences saved.");
  };

  const handleSaveAppearance = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ appearance_prefs: appearance })
      .eq("id", user.id);
    if (error) {
      showToast("Failed to save appearance settings.", true);
      return;
    }
    showToast("Appearance settings saved.");
  };

  // ── Real account deletion via Edge Function ─────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke(
        "delete-account",
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );

      if (error || !data?.success) {
        throw new Error(error?.message ?? "Deletion failed");
      }

      // Sign out locally and go to landing
      await supabase.auth.signOut();
      logout?.();
    } catch (err) {
      console.error("Delete account error:", err);
      showToast("Failed to delete account. Please contact support.", true);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const initials = (user?.fullName || user?.email || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const strength = [
    pwdNew.length >= 8,
    /[A-Z]/.test(pwdNew),
    /[0-9]/.test(pwdNew),
    /[^A-Za-z0-9]/.test(pwdNew),
  ];
  const pwdOk = pwdNew.length >= 8 && pwdNew === pwdConfirm;

  const notifRows = isLecturer
    ? [
        {
          key: "new_submission",
          label: "New submission",
          desc: "Notify when a student submits an assessment.",
        },
        {
          key: "graded_override",
          label: "Grading overrides",
          desc: "Notify when an AI grade is manually changed.",
        },
        {
          key: "reminders",
          label: "Deadline reminders",
          desc: "Remind when assessments are closing soon.",
        },
      ]
    : [
        {
          key: "graded",
          label: "Assessment graded",
          desc: "Notify when my submission has been graded.",
        },
        {
          key: "new_assessment",
          label: "New assessment",
          desc: "Notify when a new assessment is available.",
        },
        {
          key: "reminders",
          label: "Deadline reminders",
          desc: "Remind before an assessment closes.",
        },
      ];

  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <div className="settings-topbar-title">Settings</div>
      </div>

      <div className="settings-content">
        {/* Account card */}
        <div className="settings-account-card">
          <div className="settings-account-avatar">{initials}</div>
          <div className="settings-account-info">
            <div className="settings-account-name">
              {user?.fullName || "No name set"}
            </div>
            <div className="settings-account-email">{user?.email}</div>
            <span className="settings-role-badge">
              {isLecturer ? "Lecturer" : "Student"}
            </span>
          </div>
        </div>

        {/* Profile */}
        <Section title="Profile" desc="Update your display name.">
          <div className="settings-field">
            <label className="settings-label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="settings-input"
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">Email Address</label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="settings-input settings-input-disabled"
            />
            <p className="settings-hint">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>
          <div className="settings-field">
            <label className="settings-label">Role</label>
            <input
              type="text"
              value={isLecturer ? "Lecturer" : "Student"}
              disabled
              className="settings-input settings-input-disabled"
            />
          </div>
          <button
            className="settings-btn-primary"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </Section>

        {/* Password */}
        <Section title="Password" desc="Change your account password.">
          <div className="settings-field">
            <label className="settings-label">New Password</label>
            <div className="settings-input-row">
              <input
                type={showPwd ? "text" : "password"}
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                placeholder="At least 8 characters"
                className="settings-input"
              />
              <button
                type="button"
                className="settings-show-btn"
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            {pwdNew && (
              <div className="settings-strength">
                <div className="settings-strength-bars">
                  {strength.map((met, i) => (
                    <div
                      key={i}
                      className={`settings-strength-bar ${met ? "met" : ""}`}
                    />
                  ))}
                </div>
                <div className="settings-strength-labels">
                  {[
                    ["8+ chars", strength[0]],
                    ["Uppercase", strength[1]],
                    ["Number", strength[2]],
                    ["Symbol", strength[3]],
                  ].map(([l, m]) => (
                    <span key={l} className={m ? "met" : ""}>
                      {m ? "✓" : "·"} {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="settings-field">
            <label className="settings-label">Confirm Password</label>
            <input
              type={showPwd ? "text" : "password"}
              value={pwdConfirm}
              onChange={(e) => setPwdConfirm(e.target.value)}
              placeholder="Repeat new password"
              className="settings-input"
            />
            {pwdConfirm && pwdNew !== pwdConfirm && (
              <p className="settings-hint settings-hint-error">
                Passwords do not match.
              </p>
            )}
          </div>
          <button
            className="settings-btn-primary"
            onClick={handleChangePwd}
            disabled={savingPwd || !pwdOk}
          >
            {savingPwd ? "Changing…" : "Change Password"}
          </button>
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          desc={`Control which notifications you receive as a ${isLecturer ? "lecturer" : "student"}.`}
        >
          {notifRows.map(({ key, label, desc }) => (
            <div key={key} className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">{label}</div>
                <div className="settings-toggle-desc">{desc}</div>
              </div>
              <Toggle
                on={notifs[key] ?? false}
                onChange={(val) => setNotifs((p) => ({ ...p, [key]: val }))}
              />
            </div>
          ))}
          <button
            className="settings-btn-primary"
            onClick={handleSaveNotifs}
            disabled={savingNotifs}
          >
            {savingNotifs ? "Saving…" : "Save Preferences"}
          </button>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" desc="Customise how the interface looks.">
          <div className="settings-toggle-row">
            <div>
              <div className="settings-toggle-label">Compact mode</div>
              <div className="settings-toggle-desc">
                Reduce spacing in lists for a denser view.
              </div>
            </div>
            <Toggle
              on={appearance.compactMode}
              onChange={(val) =>
                setAppearance((p) => ({ ...p, compactMode: val }))
              }
            />
          </div>
          <div className="settings-toggle-row">
            <div>
              <div className="settings-toggle-label">Score colour coding</div>
              <div className="settings-toggle-desc">
                Show green / amber / red on scores throughout the app.
              </div>
            </div>
            <Toggle
              on={appearance.showScoreColors}
              onChange={(val) =>
                setAppearance((p) => ({ ...p, showScoreColors: val }))
              }
            />
          </div>
          <button
            className="settings-btn-primary"
            onClick={handleSaveAppearance}
          >
            Save Appearance
          </button>
        </Section>

        {/* Role-specific info */}
        {isLecturer && (
          <Section
            title="Grading Defaults"
            desc="Default behaviour when grading submissions."
          >
            <div className="settings-info-box">
              AI grading runs automatically on submission. You can override any
              score manually in the Grading Queue. Future versions will allow
              setting per-assessment rubric weights here.
            </div>
          </Section>
        )}

        {!isLecturer && (
          <Section
            title="Privacy"
            desc="What your lecturers can see about your activity."
          >
            <div className="settings-info-box">
              Lecturers can see your submitted answers, scores, and submission
              timestamps. They cannot see your draft answers or activity outside
              of submitted assessments.
            </div>
          </Section>
        )}

        {/* Danger zone */}
        <div className="settings-danger-card">
          <div className="settings-section-head">
            <div className="settings-danger-title">Danger Zone</div>
            <div className="settings-section-desc">
              Irreversible actions. Proceed with caution.
            </div>
          </div>
          <div className="settings-section-body settings-danger-row">
            <div>
              <div className="settings-toggle-label">Delete account</div>
              <div className="settings-toggle-desc">
                Permanently removes your account, all assessments, submissions,
                and grades. This cannot be undone.
              </div>
            </div>
            <button
              className="settings-btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div
          className={`settings-toast ${toast.err ? "settings-toast-err" : ""}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteModal
          userEmail={user?.email ?? ""}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
