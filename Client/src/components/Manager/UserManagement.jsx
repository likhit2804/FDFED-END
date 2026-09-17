import "../../assets/css/Manager/userManagement.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Key, Pencil, Shield, Trash2, Users } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { Loader } from "../Loader";
import { ConfirmModal, Input, Modal, StatCard, Tabs, Textarea } from "../shared";
import { RegistrationCodesModal, RegistrationCodesView } from "./UserManagement/RegistrationCodesModal";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar
} from "./ui";
const DynamicForm = ({ fields, initial = {}, onSubmit, submitLabel = "Save" }) => {
  const [form, setForm] = useState(() =>
    fields.reduce((accumulator, field) => ({ ...accumulator, [field.key]: initial[field.key] ?? "" }), {})
  );
  const [errors, setErrors] = useState({});
  useEffect(() => {
    setForm(fields.reduce((accumulator, field) => ({ ...accumulator, [field.key]: initial[field.key] ?? "" }), {}));
    setErrors({});
  }, [fields, initial]);
  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };
  const validate = () => {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    fields.forEach((field) => {
      const value = String(form[field.key] ?? "").trim();
      if (field.required && !value) {
        nextErrors[field.key] = `${field.label} is required`;
        return;
      }
      if (field.type === "email" && value && !emailRegex.test(value)) {
        nextErrors[field.key] = "Enter a valid email address";
        return;
      }
      if (field.pattern && value && !field.pattern.test(value)) {
        nextErrors[field.key] = field.error || `Invalid ${field.label.toLowerCase()}`;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  return (
    <form
      className="um-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!validate()) return;
        onSubmit(form);
      }}
    >
      {fields.map((field) => (
        <div key={field.key} style={{ marginBottom: 16 }}>
          {field.type === "textarea" ? (
            <Textarea label={field.label} value={form[field.key]} onChange={(event) => handleChange(field.key, event.target.value)} />
          ) : (
            <Input
              label={field.label}
              type={field.type || "text"}
              value={form[field.key]}
              onChange={(event) => handleChange(field.key, event.target.value)}
              placeholder={field.placeholder || ""}
              required={Boolean(field.required)}
              error={errors[field.key]}
            />
          )}
          {field.type === "textarea" && errors[field.key] ? (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--danger-500)" }}>{errors[field.key]}</p>
          ) : null}
        </div>
      ))}
      <div className="um-form-actions">
        <button type="submit" className="manager-ui-button manager-ui-button--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
const ENTITY_CONFIG = {
  resident: {
    label: "Resident",
    endpoint: "resident",
    fields: [
      { key: "residentFirstname", label: "First Name", required: true },
      { key: "residentLastname", label: "Last Name", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "uCode", label: "UCode / Flat", required: true },
      { key: "contact", label: "Contact", pattern: /^[0-9]{10}$/, error: "Contact must be 10 digits" },
    ],
    cardTitle: (resident) => `${resident.residentFirstname || ""} ${resident.residentLastname || ""}`.trim(),
    cardSubtitle: (resident) => resident.uCode || resident.flat || "Resident",
    cardMeta: (resident) => [
      { label: "Email", value: resident.email || "-" },
      { label: "Contact", value: resident.contact || "-" },
    ],
    idKey: "Rid",
    mapServerToForm: (item) => ({
      residentFirstname: item.residentFirstname || item.firstName || "",
      residentLastname: item.residentLastname || item.lastName || "",
      email: item.email || "",
      uCode: item.uCode || item.flat || "",
      contact: item.contact || "",
    }),
  },
  security: {
    label: "Security",
    endpoint: "security",
    fields: [
      { key: "securityName", label: "Name" },
      { key: "securityEmail", label: "Email", type: "email" },
      { key: "securityContact", label: "Contact" },
      { key: "securityAddress", label: "Address" },
      { key: "securityShift", label: "Shift" },
    ],
    cardTitle: (security) => security.name || "Security staff",
    cardSubtitle: (security) => security.workplace || security.gate || "Gate assignment",
    cardMeta: (security) => [
      { label: "Shift", value: security.Shift || security.securityShift || "-" },
      { label: "Contact", value: security.contact || "-" },
    ],
    idKey: "Sid",
    mapServerToForm: (item) => ({
      securityName: item.name || "",
      securityEmail: item.email || "",
      securityContact: item.contact || "",
      securityAddress: item.address || "",
      securityShift: item.Shift || "",
      gate: item.workplace || "",
    }),
  },
  worker: {
    label: "Worker",
    endpoint: "worker",
    fields: [
      { key: "workerName", label: "Name", required: true },
      { key: "workerEmail", label: "Email", type: "email", required: true },
      { key: "workerJobRole", label: "Job Role", required: true },
      { key: "workerContact", label: "Contact", pattern: /^[0-9]{10}$/, error: "Contact must be 10 digits" },
      { key: "workerAddress", label: "Address" },
      { key: "workerSalary", label: "Salary", pattern: /^\d+(\.\d{1,2})?$/, error: "Salary must be a valid non-negative number" },
    ],
    cardTitle: (worker) => worker.name || "Worker",
    cardSubtitle: (worker) => worker.jobRole || worker.workerJobRole || "Assigned role",
    cardMeta: (worker) => [
      { label: "Contact", value: worker.contact || "-" },
      { label: "Salary", value: worker.salary || "-" },
    ],
    idKey: "Wid",
    mapServerToForm: (item) => ({
      workerName: item.name || "",
      workerEmail: item.email || "",
      workerJobRole: item.jobRole || "",
      workerContact: item.contact || "",
      workerAddress: item.address || "",
      workerSalary: item.salary || "",
    }),
  },
};
const TAB_TO_ENTITY = { residents: "resident", security: "security", workers: "worker" };
export default function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("residents");
  const [lists, setLists] = useState({ resident: [], security: [], worker: [] });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [codesVisible, setCodesVisible] = useState(false);
  const [codesList, setCodesList] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [communityNameForCodes, setCommunityNameForCodes] = useState("");
  const [codesSearch, setCodesSearch] = useState("");
  const [selectedFlats, setSelectedFlats] = useState(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);
  const currentEntity = TAB_TO_ENTITY[activeTab] || "resident";
  const config = ENTITY_CONFIG[currentEntity] || ENTITY_CONFIG.resident;
  const stats = useMemo(
    () => ({
      residents: lists.resident.length,
      security: lists.security.length,
      workers: lists.worker.length,
      residentCodes: codesList.length,
      total: lists.resident.length + lists.security.length + lists.worker.length,
    }),
    [lists, codesList]
  );
  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/manager/userManagement");
      const data = response.data;
      setLists({
        resident: data.R || [],
        security: data.S || [],
        worker: data.W || [],
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLists();
    fetchRegistrationCodes();
  }, []);
  const fetchRegistrationCodes = async () => {
    setCodesLoading(true);
    try {
      const response = await axios.get("/manager/registration-codes");
      const data = response.data;
      if (data.success) {
        setCodesList(data.flats || []);
        setCommunityNameForCodes(data.communityName || "");
      }
    } finally {
      setCodesLoading(false);
    }
  };
  const regenerateCode = async (flatNumber, flatNumbers = null) => {
    try {
      setIsRegenerating(true);
      const payload = flatNumbers ? { flatNumbers } : { flatNumber: flatNumber ?? undefined };
      const response = await axios.post("/manager/registration-codes/regenerate", payload);
      const data = response.data;
      if (flatNumber && !flatNumbers) {
        if (data.success && data.newCode) {
          setCodesList((previous) =>
            previous.map((flat) =>
              flat.flatNumber === flatNumber ? { ...flat, registrationCode: data.newCode } : flat
            )
          );
        }
      } else {
        await fetchRegistrationCodes();
        setSelectedFlats(new Set());
      }
    } finally {
      setIsRegenerating(false);
    }
  };
  const toggleSelectFlat = (flatNumber) => {
    setSelectedFlats((previous) => {
      const next = new Set(previous);
      if (next.has(flatNumber)) next.delete(flatNumber);
      else next.add(flatNumber);
      return next;
    });
  };
  const toggleSelectAll = (filtered) => {
    setSelectedFlats(
      selectedFlats.size >= filtered.length ? new Set() : new Set(filtered.map((flat) => flat.flatNumber))
    );
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard!");
  };
  const openCodesModal = () => {
    setCodesVisible(true);
    setCodesSearch("");
    setSelectedFlats(new Set());
    fetchRegistrationCodes();
  };
  const setListForEntity = (entity, updater) => {
    setLists((previous) => ({ ...previous, [entity]: updater(previous[entity]) }));
  };
  const openAdd = () => {
    setModalConfig({ entity: currentEntity, mode: "add", fields: config.fields, initial: {}, id: null });
    setModalVisible(true);
  };
  const openEdit = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`/manager/userManagement/${config.endpoint}/${id}`);
      const data = response.data;
      const payload = data.r || data[currentEntity] || data;
      setModalConfig({
        entity: currentEntity,
        mode: "edit",
        fields: config.fields,
        initial: config.mapServerToForm(payload || {}),
        id,
      });
      setModalVisible(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load data for edit");
    } finally {
      setLoading(false);
    }
  };
  const saveEntity = async (values, idForUpdate) => {
    try {
      setLoading(true);
      const payload = { ...values };
      if (idForUpdate) payload[config.idKey] = idForUpdate;
      const response = await axios.post(`/manager/userManagement/${config.endpoint}`, payload);
      const data = response.data;
      if (!data?.success) {
        toast.error(data?.message || "Save failed");
        return;
      }
      const saved = data[currentEntity];
      setListForEntity(currentEntity, (previous) =>
        data.isUpdate ? previous.map((item) => (item._id === saved._id ? saved : item)) : [saved, ...previous]
      );
      setModalVisible(false);
      setModalConfig(null);
    } finally {
      setLoading(false);
    }
  };
  const askDelete = (id) => {
    setConfirmPayload({ entity: currentEntity, id });
    setConfirmVisible(true);
  };
  const doDelete = async () => {
    if (!confirmPayload) return;
    try {
      setLoading(true);
      const { entity, id } = confirmPayload;
      const entityConfig = ENTITY_CONFIG[entity];
      const response = await axios.delete(`/manager/userManagement/${entityConfig.endpoint}/${id}`);
      const data = response.data;
      if (!data?.ok && !data?.success) {
        toast.error("Delete failed");
        return;
      }
      setListForEntity(entity, (previous) => previous.filter((item) => item._id !== id));
      setConfirmVisible(false);
      setConfirmPayload(null);
    } finally {
      setLoading(false);
    }
  };
  const currentList = lists[currentEntity] || [];
  return (
    <ManagerPageShell
      eyebrow="User Management"
      title="Manage residents, gate staff, and operations teams from one place."
      description="Keep community people records aligned with the same manager dashboard language, instead of separate page-specific card styles."
      chips={[`${stats.total} people records`, `${codesList.length} resident codes`, `${activeTab === "residentCodes" ? "Resident Codes" : config.label} in view`]}
    >
      <div className="ue-stat-grid">
        <StatCard label="Residents" value={stats.residents} icon={<Users size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
        <StatCard label="Resident Codes" value={stats.residentCodes} icon={<Key size={22} />} iconColor="var(--warning-500, #f59e0b)" iconBg="var(--warning-soft, rgba(245, 158, 11, 0.1))" />
        <StatCard label="Security" value={stats.security} icon={<Shield size={22} />} iconColor="var(--info-600)" iconBg="var(--surface-2)" />
        <StatCard label="Workers" value={stats.workers} icon={<Briefcase size={22} />} iconColor="var(--text-subtle)" iconBg="var(--surface-2)" />
      </div>
      <ManagerSection
        eyebrow="Directory"
        title="Community people records"
        description="Switch roles, add new entries, and view registration codes for resident onboarding."
        actions={
          activeTab === "residentCodes" ? (
            <ManagerActionButton variant="secondary" onClick={() => navigate("/manager/setup")}>
              Setup Flats
            </ManagerActionButton>
          ) : (
            <>
              <ManagerActionButton variant="secondary" onClick={openAdd}>
                Add {config.label}
              </ManagerActionButton>
              {activeTab === "residents" ? (
                <ManagerActionButton variant="primary" onClick={() => setActiveTab("residentCodes")}>
                  <Key size={16} />
                  View Codes ({codesList.length})
                </ManagerActionButton>
              ) : null}
            </>
          )
        }
      >
        <ManagerToolbar>
          <Tabs
            variant="underline"
            tabs={[
              { label: "Residents", value: "residents", count: lists.resident.length },
              { label: "Resident Codes", value: "residentCodes", count: codesList.length },
              { label: "Security", value: "security", count: lists.security.length },
              { label: "Workers", value: "workers", count: lists.worker.length },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </ManagerToolbar>
        {activeTab === "residentCodes" ? (
          <div style={{ marginTop: 16 }}>
            <RegistrationCodesView
              communityName={communityNameForCodes}
              codesList={codesList}
              codesLoading={codesLoading}
              codesSearch={codesSearch}
              setCodesSearch={setCodesSearch}
              selectedFlats={selectedFlats}
              toggleSelectFlat={toggleSelectFlat}
              toggleSelectAll={toggleSelectAll}
              regenerateCode={regenerateCode}
              isRegenerating={isRegenerating}
              copyToClipboard={copyToClipboard}
              onNavigateSetup={() => navigate("/manager/setup")}
            />
          </div>
        ) : currentList.length > 0 ? (
          <ManagerRecordGrid>
            {currentList.map((item) => (
              <ManagerRecordCard
                key={item._id}
                title={config.cardTitle(item)}
                subtitle={config.cardSubtitle(item)}
                meta={config.cardMeta(item)}
                actions={
                  <>
                    <ManagerActionButton variant="secondary" onClick={() => openEdit(item._id)}>
                      <Pencil size={16} />
                      Edit
                    </ManagerActionButton>
                    <ManagerActionButton variant="danger" onClick={() => askDelete(item._id)}>
                      <Trash2 size={16} />
                      Delete
                    </ManagerActionButton>
                  </>
                }
              />
            ))}
          </ManagerRecordGrid>
        ) : (
          <div className="manager-ui-empty">No {activeTab} records have been created yet.</div>
        )}
      </ManagerSection>
      <Modal
        isOpen={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setModalConfig(null);
        }}
        title={modalConfig ? (modalConfig.mode === "edit" ? `Edit ${config.label}` : `Add ${config.label}`) : ""}
        size="md"
      >
        {modalConfig ? (
          <DynamicForm
            fields={modalConfig.fields}
            initial={modalConfig.initial}
            submitLabel={modalConfig.mode === "edit" ? "Update" : "Create"}
            onSubmit={(values) => saveEntity(values, modalConfig.mode === "edit" ? modalConfig.id : null)}
          />
        ) : null}
      </Modal>
      <ConfirmModal
        isOpen={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={doDelete}
        loading={loading}
        title="Delete this record?"
        message="This action cannot be undone. The record will be permanently removed."
        confirmText="Delete"
        variant="danger"
      />
      <RegistrationCodesModal
        visible={codesVisible}
        onClose={() => setCodesVisible(false)}
        communityName={communityNameForCodes}
        codesList={codesList}
        codesLoading={codesLoading}
        codesSearch={codesSearch}
        setCodesSearch={setCodesSearch}
        selectedFlats={selectedFlats}
        toggleSelectFlat={toggleSelectFlat}
        toggleSelectAll={toggleSelectAll}
        regenerateCode={regenerateCode}
        isRegenerating={isRegenerating}
        copyToClipboard={copyToClipboard}
      />
      {loading ? (
        <div className="um-loading-overlay">
          <div className="um-loading">
            <Loader label="Loading records..." />
          </div>
        </div>
      ) : null}
    </ManagerPageShell>
  );
}
