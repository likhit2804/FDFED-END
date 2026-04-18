import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { fetchIssues, raiseIssue, submitFeedback } from "../../slices/IssueSlice";
import { AlertCircle, CheckCircle, ListChecks } from "lucide-react";
import { Loader } from "../Loader";
import { useSocket } from "../../hooks/useSocket";
import { EmptyState, Modal, Input, Select, StatCard, Textarea, Tabs } from "../shared";
import { ResidentIssueCard } from "./IssueRaising/ResidentIssueCard";
import { ResidentIssueDetailsModal } from "./IssueRaising/ResidentIssueDetailsModal";
import { ManagerActionButton, ManagerPageShell, ManagerSection } from "../Manager/ui";
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
    <ManagerPageShell
      eyebrow="Issues"
      title="Raise and track issues with a unified resident desk."
      description="Same shell and control language as manager pages so status, cards, and actions stay predictable."
      chips={[`${issues?.length || 0} issues tracked`, `${pendingCount} pending`]}
      className="resident-ui-page resident-issues-page"
    >
      <ToastContainer position="top-center" />

      <ManagerSection
        eyebrow="Issue Desk"
        title="Issue management"
        description="Create issues and monitor progress by resident/community category."
        actions={
          <ManagerActionButton variant="primary" onClick={() => setIsIssueFormOpen(true)}>
            <i className="bi bi-plus-lg me-1" />
            Raise an Issue
          </ManagerActionButton>
        }
      >

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
      <div className="ue-stat-grid mb-4">
        <StatCard label="Total Issues" value={issues?.length || 0} icon={<ListChecks size={22} />} iconColor="#7c3aed" iconBg="#f3edff" />
        <StatCard label="Pending Issues" value={pendingCount} icon={<AlertCircle size={22} />} iconColor="#d95d4f" iconBg="#feefed" />
        <StatCard label="Resolved Issues" value={resolvedCount} icon={<CheckCircle size={22} />} iconColor="#8b5cf6" iconBg="#f5f3ff" />
      </div>

      {/* Issues List */}
      <h4 className="table-title">{activeTab} issues</h4>
      <div className="ue-entity-grid ir-issues-grid">
        {loading && (
          <div className="col-12 d-flex justify-content-center py-5"><Loader /></div>
        )}
        {!loading && filteredIssues?.filter(Boolean).length > 0
          ? filteredIssues.filter(Boolean).map((issue) => (
            <ResidentIssueCard key={issue._id} issue={issue} onViewDetails={showDetails} />
          ))
          : !loading && (
            <EmptyState icon={<AlertCircle size={42} />} title="No issues found" sub="Raise an issue to begin tracking updates." />
          )}
      </div>
      </ManagerSection>

      {/* Raise Issue Modal */}
      <Modal isOpen={isIssueFormOpen} onClose={closeIssueForm} title="Raise an Issue" size="md"
        footer={
          <>
            <button type="button" className="manager-ui-button manager-ui-button--secondary" onClick={closeIssueForm} disabled={formSubmitting}>Cancel</button>
            <button type="button" className="manager-ui-button manager-ui-button--primary" onClick={handleSubmit(onSubmit)} disabled={formSubmitting}>
              {formSubmitting ? "Submitting..." : "Submit Issue"}
            </button>
          </>
        }
      >
        {formSubmitting && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Loader label="Submitting issue..." size={34} />
          </div>
        )}
        <div style={{ background: activeTab === "Resident" ? "#f3edff" : "#f5f3ff", color: "#6d28d9", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <i className={`bi ${activeTab === "Resident" ? "bi-house-door" : "bi-building"}`} style={{ marginRight: 6 }} />{activeTab} Issue
        </div>
        <Input label="Issue Title" required id="title" placeholder="Brief title of the issue..." disabled={formSubmitting} {...register("title", { required: true })} />
        <Select label="Category" required id="category" placeholder="Choose a category..." disabled={formSubmitting} {...register("category", { required: true })}>
          <option value="">Choose a category...</option>
          {(activeTab === "Resident" ? R_CATEGORIES : C_CATEGORIES).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          <option value="Other">Other</option>
        </Select>
        {category === "Other" && <Input label="Specify Category" required id="otherCategory" placeholder="Enter custom category" disabled={formSubmitting} {...register("otherCategory", { required: true })} />}
        <div style={{ background: "#f5f3ff", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#5b21b6" }}>
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
    </ManagerPageShell>
  );
};
