import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { fetchIssues, raiseIssue, submitFeedback } from "../../slices/IssueSlice";
import { Loader } from "../Loader";
import { useSocket } from "../../hooks/useSocket";
import { Modal, Input, Select, Textarea, Tabs } from "../shared";
import { ResidentIssueCard } from "./IssueRaising/ResidentIssueCard";
import { ResidentIssueDetailsModal } from "./IssueRaising/ResidentIssueDetailsModal";
import "../../assets/css/Resident/IssueRaising.css";

const R_CATEGORIES = ["Plumbing", "Electrical", "Security", "Maintenance", "Pest Control", "Waste Management"];
const C_CATEGORIES = ["Streetlight", "Elevator", "Garden", "Common Area"];

export const IssueRaising = () => {
  const dispatch = useDispatch();
  const { issues, loading } = useSelector((state) => state.Issue);
  const socket = useSocket("");

  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("Resident");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { title: "", category: "", description: "", location: "", otherCategory: "" },
  });
  const category = watch("category");

  // Data loading
  useEffect(() => { dispatch(fetchIssues()); }, [dispatch]);
  useEffect(() => {
    if (!socket) return;
    const refresh = () => dispatch(fetchIssues());
    socket.on("issue:updated", refresh);
    return () => socket.off("issue:updated", refresh);
  }, [socket, dispatch]);

  useEffect(() => {
    if (formSubmitting && !loading) { setFormSubmitting(false); setIsIssueFormOpen(false); reset(); }
  }, [loading, formSubmitting, reset]);

  // Actions
  const onSubmit = (data) => {
    setFormSubmitting(true);
    dispatch(raiseIssue({ ...data, categoryType: activeTab, otherCategory: data.category === "Other" ? data.otherCategory : undefined }))
      .unwrap()
      .then(() => toast.success("Issue raised successfully!"))
      .catch((err) => { setFormSubmitting(false); toast.error(err || "Failed to raise issue."); });
  };

  const handleIssueAction = async (id, action) => {
    const url = action === "confirm"
      ? `/resident/issue/confirmIssue/${id}`
      : `/resident/issue/rejectIssueResolution/${id}`;
    try {
      const res = await fetch(url, { method: "POST", credentials: "include" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!data.success) throw new Error(data.message || `Failed to ${action}`);
      toast.success(action === "confirm" ? "Issue confirmed! Payment process initiated." : "Issue reopened!");
      setIsDetailsPopupOpen(false);
      dispatch(fetchIssues());
    } catch (err) { toast.error(err.message || "Action not allowed"); }
  };

  const handleFeedbackSubmit = async () => {
    setFeedbackSubmitting(true);
    dispatch(submitFeedback({ id: selectedIssue._id, feedback: feedbackText, rating: feedbackRating }))
      .unwrap()
      .then(() => { toast.success("Feedback submitted!"); setIsDetailsPopupOpen(false); setFeedbackText(""); setFeedbackRating(5); dispatch(fetchIssues()); })
      .catch((err) => toast.error(err || "Failed to submit feedback."))
      .finally(() => setFeedbackSubmitting(false));
  };

  const closeIssueForm = () => { if (!formSubmitting) { setIsIssueFormOpen(false); reset(); } };
  const showDetails = (issue) => { setSelectedIssue(issue); setIsDetailsPopupOpen(true); };

  // Derived data
  const filteredIssues = issues?.filter((i) => i?.categoryType === activeTab);
  const pendingCount = issues?.filter((i) => i?.status === "Pending")?.length || 0;
  const resolvedCount = issues?.filter((i) => i?.status === "Resolved")?.length || 0;

  return (
    <div>
      <ToastContainer position="top-center" />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="section-title">Issue Management</h4>
        <button id="raiseIssueBtn" className="btn btn-success" onClick={() => setIsIssueFormOpen(true)}>
          <i className="bi bi-plus-lg me-2" />Raise an Issue
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: "Resident Issues", value: "Resident" },
          { label: "Community Issues", value: "Community" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Stats */}
      <div className="ir-stats-grid mb-4">
        <div className="ir-stat-card" style={{ borderLeftColor: "green" }}>
          <p className="card-label">Total Issues (this month)</p>
          <h2 className="card-value text-success">{issues?.length || 0}</h2>
        </div>
        <div className="ir-stat-card" style={{ borderLeftColor: "var(--warning)" }}>
          <p className="card-label">Pending Issues</p>
          <h2 className="card-value text-warning">{pendingCount}</h2>
        </div>
        <div className="ir-stat-card" style={{ borderLeftColor: "blue" }}>
          <p className="card-label">Resolved Issues</p>
          <h2 className="card-value text-primary">{resolvedCount}</h2>
        </div>
      </div>

      {/* Issues List */}
      <h4 className="table-title">{activeTab} Issues</h4>
      <div className="row ir-issues-grid">
        {loading && (
          <div className="col-12 d-flex justify-content-center py-5"><Loader /></div>
        )}
        {!loading && filteredIssues?.filter(Boolean).length > 0
          ? filteredIssues.filter(Boolean).map((issue) => (
            <ResidentIssueCard key={issue._id} issue={issue} onViewDetails={showDetails} />
          ))
          : !loading && (
            <div className="col-12 shadow-sm rounded-2 no-bookings d-flex gap-3 justify-content-center align-items-center text-muted">
              <i className="bi bi-exclamation-triangle fs-3" />
              <h4 className="m-0">No issues found</h4>
            </div>
          )}
      </div>

      {/* Raise Issue Modal */}
      <Modal isOpen={isIssueFormOpen} onClose={closeIssueForm} title="Raise an Issue" size="md"
        footer={
          <>
            <button type="button" onClick={closeIssueForm} disabled={formSubmitting} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="button" onClick={handleSubmit(onSubmit)} disabled={formSubmitting} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontWeight: 600, cursor: formSubmitting ? "not-allowed" : "pointer", opacity: formSubmitting ? 0.7 : 1 }}>
              {formSubmitting ? "Submitting..." : "Submit Issue"}
            </button>
          </>
        }
      >
        {formSubmitting && <div style={{ textAlign: "center", padding: 20 }}><div className="spinner-border text-primary" role="status" /></div>}
        <div style={{ background: activeTab === "Resident" ? "#e8f5e8" : "#fff3e0", color: activeTab === "Resident" ? "#2e7d32" : "#ef6c00", padding: "8px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
          <i className={`bi ${activeTab === "Resident" ? "bi-house-door" : "bi-building"}`} style={{ marginRight: 6 }} />{activeTab} Issue
        </div>
        <Input label="Issue Title" required id="title" placeholder="Brief title of the issue..." disabled={formSubmitting} {...register("title", { required: true })} />
        <Select label="Category" required id="category" placeholder="Choose a category..." disabled={formSubmitting} {...register("category", { required: true })}>
          <option value="">Choose a category...</option>
          {(activeTab === "Resident" ? R_CATEGORIES : C_CATEGORIES).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          <option value="Other">Other</option>
        </Select>
        {category === "Other" && <Input label="Specify Category" required id="otherCategory" placeholder="Enter custom category" disabled={formSubmitting} {...register("otherCategory", { required: true })} />}
        <div style={{ background: "#e3f2fd", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13, color: "#1565c0" }}>
          <i className="bi bi-info-circle" style={{ marginRight: 8 }} />Priority is automatically determined based on issue type, timing, and urgency keywords
        </div>
        <Input label={`Location${activeTab === "Community" ? " *" : " (Optional)"}`} id="location" placeholder="e.g., Block A, Floor 3, Apt 302" disabled={formSubmitting} {...register("location", { required: activeTab === "Community" })} />
        <Textarea label="Description" required id="description" rows={5} placeholder="Detailed description of the issue..." disabled={formSubmitting} {...register("description", { required: true })} />
      </Modal>

      {/* Details Modal */}
      <ResidentIssueDetailsModal
        issue={selectedIssue}
        isOpen={isDetailsPopupOpen}
        onClose={() => setIsDetailsPopupOpen(false)}
        onConfirm={(id) => handleIssueAction(id, "confirm")}
        onReject={(id) => handleIssueAction(id, "reject")}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        feedbackRating={feedbackRating}
        setFeedbackRating={setFeedbackRating}
        feedbackSubmitting={feedbackSubmitting}
        onFeedbackSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};
