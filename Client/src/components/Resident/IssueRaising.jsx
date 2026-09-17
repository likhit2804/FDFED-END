import {
  Suspense,
  lazy,
  useEffect,
  useState
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchIssues, raiseIssue, submitFeedback } from "../../slices/IssueSlice";
import {
  AlertCircle,
  CheckCircle,
  ListChecks,
  PhoneCall,
  ShieldAlert,
  Clock
} from "lucide-react";
import { Loader } from "../Loader";
import { useSocket } from "../../hooks/useSocket";
import { EmptyState, Modal, Input, Select, StatCard, Textarea, Tabs } from "../shared";
import { ResidentIssueCard } from "./IssueRaising/ResidentIssueCard";
import { ManagerActionButton, ManagerPageShell, ManagerRecordGrid, ManagerSection } from "../shared/roleUI";
import "../../assets/css/Resident/IssueRaising.css";
const LazyResidentIssueDetailsModal = lazy(() =>
  import("./IssueRaising/ResidentIssueDetailsModal").then((module) => ({
    default: module.ResidentIssueDetailsModal,
  })),
);
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
  const [emergencyContacts, setEmergencyContacts] = useState({
    estateOffice: { name: "Estate Office", contact: "101", extension: "101" },
    securityGate: { name: "Main Security Gate", contact: "100", extension: "100" },
  });
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { title: "", category: "", description: "", location: "", otherCategory: "" },
  });
  const category = watch("category");
  // Data loading
  useEffect(() => { dispatch(fetchIssues()); }, [dispatch]);
  useEffect(() => {
    axios
      .get("/resident/issue/emergency-contacts")
      .then((res) => {
        if (res.data?.success && res.data?.contacts) {
          setEmergencyContacts(res.data.contacts);
        }
      })
      .catch((err) => console.error("Failed to load emergency contacts:", err));
  }, []);
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      console.log("🔄 [RESIDENT SOCKET] issue:updated received -> refetching issues...");
      dispatch(fetchIssues());
    };
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
  const handleIssueAction = async (payloadOrId, action) => {
    const id = typeof payloadOrId === "object" ? payloadOrId.id : payloadOrId;
    const body = typeof payloadOrId === "object" ? { rating: payloadOrId.rating, feedback: payloadOrId.feedback } : {};
    const url = action === "confirm"
      ? `/resident/issue/confirmIssue/${id}`
      : `/resident/issue/rejectIssueResolution/${id}`;
    try {
      const res = await axios.post(url, body);
      const data = res.data || {};
      if (!data.success) throw new Error(data.message || `Failed to ${action}`);
      toast.success(action === "confirm" ? "Work approved & rating submitted! Payment initiated." : "Issue reopened for review!");
      setIsDetailsPopupOpen(false);
      dispatch(fetchIssues());
    } catch (err) { toast.error(err.response?.data?.message || err.message || "Action not allowed"); }
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
  const filteredIssues = issues
    ?.filter((i) => i?.categoryType === activeTab)
    ?.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
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
        {/* Emergency Hotline Quick Dial Banner */}
        <div
          className="mb-4 p-3 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: "42px", height: "42px", background: "rgba(239, 68, 68, 0.15)", color: "var(--danger-500, #ef4444)" }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="fw-semibold text-danger d-flex align-items-center gap-2" style={{ fontSize: "14px" }}>
                <span>Emergency Hotlines</span>
                <span className="badge bg-danger text-white rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>Urgent SLA: 30m</span>
              </div>
              <p className="mb-0 text-muted" style={{ fontSize: "12.5px" }}>
                For immediate life-safety emergencies (Fire, Lift Entrapment, Major Leaks), dial Security Gate or Estate Office directly:
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">
            <a
              href={`tel:${emergencyContacts?.securityGate?.contact || "100"}`}
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-pill shadow-sm"
              style={{ fontSize: "12px", fontWeight: 600 }}
              title={`Call Security Gate: ${emergencyContacts?.securityGate?.contact || "100"}`}
            >
              <PhoneCall size={14} /> {emergencyContacts?.securityGate?.name || "Security Gate"} ({emergencyContacts?.securityGate?.contact || "100"})
            </a>
            <a
              href={`tel:${emergencyContacts?.estateOffice?.contact || "101"}`}
              className="btn btn-sm btn-outline-warning text-dark d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-pill shadow-sm"
              style={{ fontSize: "12px", fontWeight: 600 }}
              title={`Call Estate Office: ${emergencyContacts?.estateOffice?.contact || "101"}`}
            >
              <PhoneCall size={14} /> {emergencyContacts?.estateOffice?.name || "Estate Office"} ({emergencyContacts?.estateOffice?.contact || "101"})
            </a>
          </div>
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
        <div className="ue-stat-grid mb-4">
          <StatCard label="Total Issues" value={issues?.length || 0} icon={<ListChecks size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
          <StatCard label="Pending Issues" value={pendingCount} icon={<AlertCircle size={22} />} iconColor="var(--danger-500)" iconBg="var(--danger-soft)" />
          <StatCard label="Resolved Issues" value={resolvedCount} icon={<CheckCircle size={22} />} iconColor="var(--info-600)" iconBg="var(--surface-2)" />
        </div>
        {/* Issues List */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="manager-ui-section__title mb-0">{activeTab} issues (Latest First)</h4>
          <span className="text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "12px" }}>
            <Clock size={13} /> SLA Targets: Urgent (30m) • High (4h) • Normal (24h)
          </span>
        </div>
        {loading ? (
          <div className="manager-ui-empty" style={{ width: "100%", display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader />
          </div>
        ) : filteredIssues?.filter(Boolean).length > 0 ? (
          <ManagerRecordGrid>
            {filteredIssues.filter(Boolean).map((issue, index) => (
              <ResidentIssueCard key={issue._id} issue={issue} index={index} onViewDetails={showDetails} />
            ))}
          </ManagerRecordGrid>
        ) : (
          <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "30px 0" }}>
            <EmptyState icon={<AlertCircle size={42} />} title="No issues found" sub="Raise an issue to begin tracking updates." />
          </div>
        )}
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
        <div style={{ background: activeTab === "Resident" ? "var(--info-soft)" : "var(--surface-2)", color: "var(--brand-700)", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <i className={`bi ${activeTab === "Resident" ? "bi-house-door" : "bi-building"}`} style={{ marginRight: 6 }} />{activeTab} Issue
        </div>
        <Input label="Issue Title" required id="title" placeholder="Brief title of the issue..." disabled={formSubmitting} {...register("title", { required: true })} />
        <Select label="Category" required id="category" placeholder="Choose a category..." disabled={formSubmitting} {...register("category", { required: true })}>
          <option value="">Choose a category...</option>
          {(activeTab === "Resident" ? R_CATEGORIES : C_CATEGORIES).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          <option value="Other">Other</option>
        </Select>
        {category === "Other" && <Input label="Specify Category" required id="otherCategory" placeholder="Enter custom category" disabled={formSubmitting} {...register("otherCategory", { required: true })} />}
        <div style={{ background: "var(--surface-2)", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "var(--brand-700)" }}>
          <i className="bi bi-info-circle" style={{ marginRight: 8 }} />
          Priority is automatically calculated based on category, urgency keywords, and time of day.
        </div>
        <Input label={`Location${activeTab === "Community" ? " *" : " (Optional)"}`} id="location" placeholder="e.g., Block A, Floor 3, Apt 302" disabled={formSubmitting} {...register("location", { required: activeTab === "Community" })} />
        <Textarea label="Description" required id="description" rows={5} placeholder="Detailed description of the issue..." disabled={formSubmitting} {...register("description", { required: true })} />
      </Modal>
      {/* Details Modal */}
      {isDetailsPopupOpen ? (
        <Suspense fallback={<Loader label="Loading issue details..." size={24} />}>
          <LazyResidentIssueDetailsModal
            issue={issues?.find((i) => i._id === selectedIssue?._id) || selectedIssue}
            isOpen={isDetailsPopupOpen}
            onClose={() => setIsDetailsPopupOpen(false)}
            onConfirm={(payload) => handleIssueAction(payload, "confirm")}
            onReject={(id) => handleIssueAction(id, "reject")}
          />
        </Suspense>
      ) : null}
    </ManagerPageShell>
  );
};
