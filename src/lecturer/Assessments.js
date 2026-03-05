import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import './Assessments.css';

const FILTERS = ['All', 'Draft', 'Active', 'Closed'];

const BLANK_QUESTION = {
  text:         '',
  marks:        '',
  answerLength: 'medium',
  sampleAnswer: '',
};

const BLANK_FORM = {
  title:     '',
  topic:     '',
  questions: [{ ...BLANK_QUESTION }],
};

// ── Helpers ────────────────────────────────────────────────────────────────
function statusClass(s) {
  return { Active: 'assess-badge-active', Draft: 'assess-badge-draft', Closed: 'assess-badge-closed' }[s] ?? '';
}

// Generates a random XXXX-XXXX access code — avoids visually confusable chars
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part  = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(4)}-${part(4)}`;
}

// ── Component ──────────────────────────────────────────────────────────────
function Assessments({ onNavigate }) {
  const { user } = useUser();

  const [assessments,  setAssessments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [form,         setForm]         = useState(BLANK_FORM);
  const [saving,          setSaving]          = useState(false);
  const [toast,           setToast]           = useState('');
  const [copiedId,        setCopiedId]        = useState(null); // tracks which row's code was just copied
  const [mutating,        setMutating]        = useState(false); // close / reopen / delete in progress
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);  // row awaiting delete confirmation

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setFetchError('');

    const { data, error } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        topic,
        status,
        access_code,
        created_at,
        questions ( id, marks )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setFetchError('Failed to load assessments.');
      setLoading(false);
      return;
    }

    setAssessments(data.map(a => ({
      id:          a.id,
      title:       a.title,
      topic:       a.topic,
      status:      a.status,
      accessCode:  a.access_code,
      questions:   a.questions.length,
      maxMarks:    a.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
      submissions: 0,
    })));
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  // ── Derived display values ────────────────────────────────────────────────
  const visible = activeFilter === 'All'
    ? assessments
    : assessments.filter(a => a.status === activeFilter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'All' ? assessments.length : assessments.filter(a => a.status === f).length;
    return acc;
  }, {});

  const totalMarks = form.questions.reduce((sum, q) => sum + (parseInt(q.marks, 10) || 0), 0);

  // ── Copy code to clipboard ────────────────────────────────────────────────
  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Form field helpers ────────────────────────────────────────────────────
  const setTopField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const setQuestionField = (idx, key) => (e) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === idx ? { ...q, [key]: e.target.value } : q),
    }));
  };

  const addQuestion    = () => setForm(prev => ({ ...prev, questions: [...prev.questions, { ...BLANK_QUESTION }] }));
  const removeQuestion = (idx) => setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));

  // ── Panel open / close ────────────────────────────────────────────────────
  const openCreatePanel = () => {
    setEditingId(null);
    setForm(BLANK_FORM);
    setPanelOpen(true);
  };

  const openEditPanel = async (a) => {
    setEditingId(a.id);
    setForm({ title: a.title, topic: a.topic || '', questions: [] });
    setPanelOpen(true);

    const { data, error } = await supabase
      .from('questions')
      .select('text, marks, answer_length, sample_answer')
      .eq('assessment_id', a.id)
      .order('order_index', { ascending: true });

    if (error) {
      showToast('Failed to load question details.');
      setPanelOpen(false);
      setEditingId(null);
      return;
    }

    setForm(prev => ({
      ...prev,
      questions: data.length > 0
        ? data.map(q => ({
            text:         q.text,
            marks:        String(q.marks),
            answerLength: q.answer_length,
            sampleAnswer: q.sample_answer || '',
          }))
        : [{ ...BLANK_QUESTION }],
    }));
  };

  const closePanel = () => {
    if (saving) return;
    setPanelOpen(false);
    setEditingId(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Write to Supabase ─────────────────────────────────────────────────────
  const saveAssessment = async (status) => {
    setSaving(true);
    try {
      let assessmentId;

      if (editingId) {
        // ── UPDATE path ──
        const updateData = { title: form.title, topic: form.topic, status };
        // Generate a fresh code when publishing a draft for the first time
        if (status === 'Active') updateData.access_code = generateAccessCode();

        const { error: aErr } = await supabase
          .from('assessments')
          .update(updateData)
          .eq('id', editingId);
        if (aErr) throw aErr;

        const { error: dErr } = await supabase
          .from('questions')
          .delete()
          .eq('assessment_id', editingId);
        if (dErr) throw dErr;

        assessmentId = editingId;
      } else {
        // ── INSERT path ──
        const insertData = { title: form.title, topic: form.topic, status, created_by: user.id };
        if (status === 'Active') insertData.access_code = generateAccessCode();

        const { data: assessment, error: aErr } = await supabase
          .from('assessments')
          .insert(insertData)
          .select()
          .single();
        if (aErr) throw aErr;
        assessmentId = assessment.id;
      }

      const { error: qErr } = await supabase
        .from('questions')
        .insert(
          form.questions.map((q, i) => ({
            assessment_id: assessmentId,
            order_index:   i,
            text:          q.text,
            marks:         parseInt(q.marks, 10) || 0,
            answer_length: q.answerLength,
            sample_answer: q.sampleAnswer,
          }))
        );
      if (qErr) throw qErr;

      closePanel();
      showToast(
        editingId
          ? (status === 'Draft' ? 'Draft updated successfully.' : 'Assessment published.')
          : (status === 'Draft' ? 'Assessment saved as draft.'  : 'Assessment published successfully.')
      );
      fetchAssessments();
    } catch (err) {
      showToast('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    saveAssessment('Draft');
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!form.title.trim() || form.questions.some(q => !q.text.trim())) return;
    saveAssessment('Active');
  };

  // ── Close / Reopen ────────────────────────────────────────────────────────
  const handleClose = async (id) => {
    setMutating(true);
    const { error } = await supabase
      .from('assessments')
      .update({ status: 'Closed' })
      .eq('id', id);
    if (error) showToast('Failed to close assessment.');
    else { showToast('Assessment closed.'); fetchAssessments(); }
    setMutating(false);
  };

  const handleReopen = async (id) => {
    setMutating(true);
    const { error } = await supabase
      .from('assessments')
      .update({ status: 'Active' })
      .eq('id', id);
    if (error) showToast('Failed to reopen assessment.');
    else { showToast('Assessment reopened.'); fetchAssessments(); }
    setMutating(false);
  };

  // ── Delete (cascading) ────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setMutating(true);
    try {
      // Fetch any submissions so we can delete their answers first
      const { data: subs } = await supabase
        .from('submissions')
        .select('id')
        .eq('assessment_id', id);

      if (subs && subs.length > 0) {
        const subIds = subs.map(s => s.id);
        await supabase.from('answers').delete().in('submission_id', subIds);
        await supabase.from('submissions').delete().eq('assessment_id', id);
      }

      await supabase.from('student_assessments').delete().eq('assessment_id', id);
      await supabase.from('questions').delete().eq('assessment_id', id);

      const { error } = await supabase.from('assessments').delete().eq('id', id);
      if (error) throw error;

      setConfirmDeleteId(null);
      showToast('Assessment deleted.');
      fetchAssessments();
    } catch (err) {
      showToast('Failed to delete assessment. Please try again.');
      console.error(err);
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="assess-page">

      {/* Topbar */}
      <div className="assess-topbar">
        <div>
          <div className="assess-topbar-title">Assessments</div>
          <div className="assess-topbar-sub">
            {loading ? 'Loading…' : `${assessments.length} assessment${assessments.length !== 1 ? 's' : ''} total`}
          </div>
        </div>
        <button className="assess-btn-primary" onClick={openCreatePanel}>
          + Create Assessment
        </button>
      </div>

      {/* Filter tabs */}
      <div className="assess-filter-row">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`assess-filter-tab ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
            <span className="assess-filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Assessments table */}
      <div className="assess-table-card">
        {fetchError ? (
          <div className="assess-empty" style={{ color: '#c33' }}>{fetchError}</div>
        ) : (
          <table className="assess-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Topic</th>
                <th>Questions</th>
                <th>Max Marks</th>
                <th>Submissions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="assess-empty">Loading assessments…</td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="assess-empty">
                    {activeFilter === 'All'
                      ? 'No assessments yet. Click "+ Create Assessment" to get started.'
                      : `No ${activeFilter.toLowerCase()} assessments.`}
                  </td>
                </tr>
              ) : (
                visible.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="assess-row-title">{a.title}</div>
                      {/* Show the access code chip on Active assessments */}
                      {a.status === 'Active' && a.accessCode && (
                        <div className="assess-row-code">
                          <span className="assess-code-value">{a.accessCode}</span>
                          <button
                            className="assess-code-copy"
                            onClick={() => copyCode(a.id, a.accessCode)}
                            title="Copy access code"
                          >
                            {copiedId === a.id ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="assess-row-topic">{a.topic || '—'}</td>
                    <td className="assess-row-num">{a.questions}</td>
                    <td className="assess-row-num">{a.maxMarks}</td>
                    <td className="assess-row-num">{a.submissions}</td>
                    <td>
                      <span className={`assess-badge ${statusClass(a.status)}`}>{a.status}</span>
                    </td>
                    <td>
                      <div className="assess-row-actions">

                        {/* ── Status-specific primary action ── */}
                        {a.status === 'Draft' && (
                          <button className="assess-action-btn" onClick={() => openEditPanel(a)}>
                            Edit
                          </button>
                        )}
                        {a.status === 'Active' && (
                          <button
                            className="assess-action-btn assess-action-grade"
                            onClick={() => onNavigate('grading')}
                          >
                            Grade
                          </button>
                        )}
                        {a.status === 'Closed' && (
                          <button
                            className="assess-action-btn assess-action-reopen"
                            onClick={() => handleReopen(a.id)}
                            disabled={mutating}
                          >
                            Reopen
                          </button>
                        )}

                        {/* ── Close (Draft and Active only) ── */}
                        {(a.status === 'Draft' || a.status === 'Active') && (
                          <button
                            className="assess-action-btn assess-action-close"
                            onClick={() => handleClose(a.id)}
                            disabled={mutating}
                          >
                            Close
                          </button>
                        )}

                        {/* ── Delete with inline confirm ── */}
                        {confirmDeleteId === a.id ? (
                          <>
                            <span className="assess-confirm-text">Sure?</span>
                            <button
                              className="assess-action-btn assess-action-danger"
                              onClick={() => handleDelete(a.id)}
                              disabled={mutating}
                            >
                              {mutating ? '…' : 'Delete'}
                            </button>
                            <button
                              className="assess-action-btn"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={mutating}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="assess-action-btn assess-action-danger"
                            onClick={() => setConfirmDeleteId(a.id)}
                          >
                            Delete
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="assess-toast">{toast}</div>}

      {/* Backdrop */}
      {panelOpen && <div className="assess-backdrop" onClick={closePanel} />}

      {/* Slide-out panel */}
      <aside className={`assess-panel ${panelOpen ? 'open' : ''}`}>
        <div className="assess-panel-header">
          <div className="assess-panel-title">
            {editingId ? 'Edit Assessment' : 'Create Assessment'}
          </div>
          <button className="assess-panel-close" onClick={closePanel} disabled={saving}>&#x2715;</button>
        </div>

        <form className="assess-panel-form">

          <div className="assess-field">
            <label className="assess-label">Assessment Title</label>
            <input
              className="assess-input"
              type="text"
              placeholder="e.g. CS-401 Midterm"
              value={form.title}
              onChange={setTopField('title')}
              required
            />
          </div>

          <div className="assess-field">
            <label className="assess-label">Topic Tag</label>
            <input
              className="assess-input"
              type="text"
              placeholder="e.g. Theory of Computation"
              value={form.topic}
              onChange={setTopField('topic')}
            />
          </div>

          <div className="assess-q-section">
            <div className="assess-q-section-header">
              <span>Questions ({form.questions.length})</span>
              {totalMarks > 0 && (
                <span className="assess-q-total">Total: {totalMarks} marks</span>
              )}
            </div>

            {form.questions.map((q, idx) => (
              <div key={idx} className="assess-q-card">
                <div className="assess-q-card-header">
                  <span className="assess-q-card-num">Question {idx + 1}</span>
                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      className="assess-q-remove-btn"
                      onClick={() => removeQuestion(idx)}
                      title="Remove question"
                    >
                      &#x2715;
                    </button>
                  )}
                </div>

                <div className="assess-field">
                  <label className="assess-label">Question Text</label>
                  <textarea
                    className="assess-textarea assess-textarea-lg"
                    placeholder="Enter the question prompt students will see..."
                    value={q.text}
                    onChange={setQuestionField(idx, 'text')}
                    required
                  />
                </div>

                <div className="assess-field-row">
                  <div className="assess-field">
                    <label className="assess-label">Marks</label>
                    <input
                      className="assess-input"
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={q.marks}
                      onChange={setQuestionField(idx, 'marks')}
                    />
                  </div>
                  <div className="assess-field">
                    <label className="assess-label">Expected Length</label>
                    <select
                      className="assess-select"
                      value={q.answerLength}
                      onChange={setQuestionField(idx, 'answerLength')}
                    >
                      <option value="short">Short (1–2 sentences)</option>
                      <option value="medium">Medium (1–2 paragraphs)</option>
                      <option value="long">Long (essay / extended)</option>
                    </select>
                  </div>
                </div>

                <div className="assess-field">
                  <label className="assess-label">Sample Answer</label>
                  <div className="assess-sample-hint">
                    Reference answer the SBERT model scores submissions against.
                  </div>
                  <textarea
                    className="assess-textarea assess-textarea-lg"
                    placeholder="Enter the model answer here..."
                    value={q.sampleAnswer}
                    onChange={setQuestionField(idx, 'sampleAnswer')}
                  />
                </div>
              </div>
            ))}

            <button type="button" className="assess-add-q-btn" onClick={addQuestion}>
              + Add Question
            </button>
          </div>

          <div className="assess-panel-footer">
            <button type="button" className="assess-btn-ghost" onClick={closePanel} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="assess-btn-ghost" onClick={handleSaveDraft} disabled={saving}>
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button type="submit" className="assess-btn-primary" onClick={handlePublish} disabled={saving}>
              {saving ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default Assessments;
