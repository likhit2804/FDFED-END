// UserManagement.jsx
import React, { useEffect, useState } from "react";
import { Key, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import { Tabs, ConfirmModal } from '../shared';
import { RegistrationCodesModal } from "./UserManagement/RegistrationCodesModal";

const makeBase = () =>
    process.env.NODE_ENV === "production"
        ? `${window.location.origin}/manager`
        : "http://localhost:3000/manager";

/* -------------------------
   Small Helpers & Subcomponents
--------------------------*/
const Modal = ({ visible, onClose, title, children }) => {
    if (!visible) return null;
    return (
        <div className="um-backdrop" onClick={onClose}>
            <div className="um-modal" onClick={(e) => e.stopPropagation()}>
                <div className="um-modal-header">
                    <h4>{title}</h4>
                    <button className="um-close" onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={20} />
                    </button>
                </div>
                <div className="um-modal-body">{children}</div>
            </div>
        </div>
    );
};

const Card = ({ title, subtitle, meta = [], onEdit, onDelete }) => (
    <div className="um-card">
        <div className="um-card-header">
            <div>
                <div className="um-card-title">{title}</div>
                {subtitle && <div className="um-card-sub">{subtitle}</div>}
            </div>
            <div className="um-card-actions" style={{ display: "flex", gap: 8 }}>
                {onEdit && (
                    <button className="um-btn um-btn-edit" onClick={onEdit} title="Edit" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                        <Pencil size={14} /> Edit
                    </button>
                )}
                {onDelete && (
                    <button className="um-btn um-btn-delete" onClick={onDelete} title="Delete" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, background: "#dc3545", color: "#fff" }}>
                        <Trash2 size={14} /> Delete
                    </button>
                )}
            </div>
        </div>
        <div className="um-card-body">
            {meta.map((m, idx) => (
                <div key={idx} className="um-meta">
                    <strong>{m.label}: </strong>
                    <span>{m.value ?? "-"}</span>
                </div>
            ))}
        </div>
    </div>
);

const DynamicForm = ({ fields, initial = {}, onSubmit, submitLabel = "Save" }) => {
    const [form, setForm] = useState(() =>
        fields.reduce((acc, f) => ({ ...acc, [f.key]: initial[f.key] ?? "" }), {})
    );

    useEffect(() => {
        setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: initial[f.key] ?? "" }), {}));
    }, [fields, initial]);

    const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    return (
        <form className="um-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
            {fields.map((f) => (
                <div className="um-form-row" key={f.key}>
                    <label>{f.label}</label>
                    {f.type === "textarea" ? (
                        <textarea value={form[f.key]} onChange={(e) => handle(f.key, e.target.value)} />
                    ) : (
                        <input type={f.type || "text"} value={form[f.key]} onChange={(e) => handle(f.key, e.target.value)} placeholder={f.placeholder || ""} />
                    )}
                </div>
            ))}
            <div className="um-form-actions">
                <button type="submit" className="um-btn um-btn-primary">{submitLabel}</button>
            </div>
        </form>
    );
};

/* -------------------------
   Entity Configuration
--------------------------*/
const ENTITY_CONFIG = {
    resident: {
        label: "Resident", endpoint: "resident", listName: "residents",
        fields: [
            { key: "residentFirstname", label: "First Name" },
            { key: "residentLastname", label: "Last Name" },
            { key: "email", label: "Email", type: "email" },
            { key: "uCode", label: "UCode / Flat" },
            { key: "contact", label: "Contact" },
        ],
        cardTitle: (r) => `${r.residentFirstname || ""} ${r.residentLastname || ""}`,
        cardSubtitle: (r) => r.uCode || r.flat || "",
        cardMeta: (r) => [{ label: "Email", value: r.email }, { label: "Contact", value: r.contact }],
        idKey: "Rid",
        mapServerToForm: (item) => ({
            residentFirstname: item.residentFirstname || item.firstName || "",
            residentLastname: item.residentLastname || item.lastName || "",
            email: item.email || "", uCode: item.uCode || item.flat || "", contact: item.contact || "",
        }),
    },
    security: {
        label: "Security", endpoint: "security", listName: "security",
        fields: [
            { key: "securityName", label: "Name" },
            { key: "securityEmail", label: "Email", type: "email" },
            { key: "securityContact", label: "Contact" },
            { key: "securityAddress", label: "Address" },
            { key: "securityShift", label: "Shift" },
        ],
        cardTitle: (s) => s.name,
        cardSubtitle: (s) => s.workplace || s.gate || "",
        cardMeta: (s) => [{ label: "Shift", value: s.Shift || s.securityShift }, { label: "Contact", value: s.contact }],
        idKey: "Sid",
        mapServerToForm: (item) => ({
            securityName: item.name || "", securityEmail: item.email || "",
            securityContact: item.contact || "", securityAddress: item.address || "",
            securityShift: item.Shift || "", gate: item.workplace || "",
        }),
    },
    worker: {
        label: "Worker", endpoint: "worker", listName: "workers",
        fields: [
            { key: "workerName", label: "Name" },
            { key: "workerEmail", label: "Email", type: "email" },
            { key: "workerJobRole", label: "Job Role" },
            { key: "workerContact", label: "Contact" },
            { key: "workerAddress", label: "Address" },
            { key: "workerSalary", label: "Salary" },
        ],
        cardTitle: (w) => w.name,
        cardSubtitle: (w) => w.jobRole || w.workerJobRole || "",
        cardMeta: (w) => [{ label: "Contact", value: w.contact }, { label: "Salary", value: w.salary }],
        idKey: "Wid",
        mapServerToForm: (item) => ({
            workerName: item.name || "", workerEmail: item.email || "",
            workerJobRole: item.jobRole || "", workerContact: item.contact || "",
            workerAddress: item.address || "", workerSalary: item.salary || "",
        }),
    },
};

const TAB_TO_ENTITY = { residents: "resident", security: "security", workers: "worker" };

/* -------------------------
   Main Component
--------------------------*/
export default function UserManagement() {
    const BASE = makeBase();

    const [activeTab, setActiveTab] = useState("residents");
    const [lists, setLists] = useState({ resident: [], security: [], worker: [] });
    const [modalVisible, setModalVisible] = useState(false);
    const [modalCfg, setModalCfg] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState(null);
    const [loading, setLoading] = useState(false);

    // Registration codes state
    const [codesVisible, setCodesVisible] = useState(false);
    const [codesList, setCodesList] = useState([]);
    const [codesLoading, setCodesLoading] = useState(false);
    const [communityNameForCodes, setCommunityNameForCodes] = useState("");
    const [codesSearch, setCodesSearch] = useState("");
    const [selectedFlats, setSelectedFlats] = useState(new Set());
    const [isRegenerating, setIsRegenerating] = useState(false);

    /* ---- Data Fetching ---- */
    const fetchLists = async () => {
        try {
            setLoading(true);
            const r = await fetch(`${BASE}/userManagement`, { credentials: "include" });
            if (r.ok) {
                const jr = await r.json();
                setLists({ resident: jr.R || [], security: jr.S || [], worker: jr.W || [] });
            }
        } catch { /* ignored */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchLists(); }, []);

    /* ---- Registration Codes ---- */
    const fetchRegistrationCodes = async () => {
        setCodesLoading(true);
        try {
            const res = await fetch(`${BASE}/registration-codes`, { credentials: "include" });
            const json = await res.json();
            if (json.success) { setCodesList(json.flats || []); setCommunityNameForCodes(json.communityName || ""); }
        } catch (err) { console.error("fetchRegistrationCodes error", err); }
        finally { setCodesLoading(false); }
    };

    const regenerateCode = async (flatNumber, flatNumbers = null) => {
        try {
            setIsRegenerating(true);
            const body = flatNumbers ? { flatNumbers } : { flatNumber: flatNumber ?? undefined };
            const res = await fetch(`${BASE}/registration-codes/regenerate`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const json = await res.json();
            if (flatNumber && !flatNumbers) {
                if (json.success && json.newCode) {
                    setCodesList((prev) => prev.map((f) => f.flatNumber === flatNumber ? { ...f, registrationCode: json.newCode } : f));
                }
            } else { await fetchRegistrationCodes(); setSelectedFlats(new Set()); }
        } catch (err) { console.error("regenerateCode error", err); }
        finally { setIsRegenerating(false); }
    };

    const toggleSelectFlat = (fNum) => setSelectedFlats((prev) => { const next = new Set(prev); next.has(fNum) ? next.delete(fNum) : next.add(fNum); return next; });
    const toggleSelectAll = (filtered) => setSelectedFlats(selectedFlats.size >= filtered.length ? new Set() : new Set(filtered.map((f) => f.flatNumber)));
    const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("Code copied to clipboard!"); };
    const openCodesModal = () => { setCodesVisible(true); setCodesSearch(""); setSelectedFlats(new Set()); fetchRegistrationCodes(); };

    /* ---- CRUD Operations ---- */
    const currentEntity = TAB_TO_ENTITY[activeTab];
    const cfg = ENTITY_CONFIG[currentEntity];

    const setListForEntity = (entity, updater) => setLists((prev) => ({ ...prev, [entity]: updater(prev[entity]) }));

    const openAdd = () => { setModalCfg({ entity: currentEntity, mode: "add", fields: cfg.fields, initial: {}, id: null }); setModalVisible(true); };

    const openEdit = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}/${id}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();
            const payload = json.r || json[currentEntity] || json[cfg.listName?.slice(0, -1)] || json;
            setModalCfg({ entity: currentEntity, mode: "edit", fields: cfg.fields, initial: cfg.mapServerToForm(payload || {}), id });
            setModalVisible(true);
        } catch { alert("Failed to load data for edit"); }
        finally { setLoading(false); }
    };

    const saveEntity = async (values, idForUpdate) => {
        setLoading(true);
        try {
            const payload = { ...values };
            if (idForUpdate) payload[cfg.idKey] = idForUpdate;
            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
            const json = await res.json();
            if (!json?.success) { alert(json?.message || "Save failed"); return; }

            const saved = json[currentEntity];
            setListForEntity(currentEntity, (prev) => json.isUpdate ? prev.map((x) => (x._id === saved._id ? saved : x)) : [saved, ...prev]);
            setModalVisible(false); setModalCfg(null);
        } catch { alert("Save failed"); }
        finally { setLoading(false); }
    };

    const askDelete = (id) => { setConfirmPayload({ entity: currentEntity, id }); setConfirmVisible(true); };

    const doDelete = async () => {
        if (!confirmPayload) return;
        setLoading(true);
        try {
            const { entity, id } = confirmPayload;
            const c = ENTITY_CONFIG[entity];
            const res = await fetch(`${BASE}/userManagement/${c.endpoint}/${id}`, { method: "DELETE", credentials: "include" });
            const json = await res.json();
            if (!json?.ok && !json?.success) { alert("Delete failed"); return; }
            setListForEntity(entity, (prev) => prev.filter((x) => x._id !== id));
            setConfirmVisible(false); setConfirmPayload(null);
        } catch { alert("Delete failed"); }
        finally { setLoading(false); }
    };

    /* ---- Unified Renderer ---- */
    const renderCards = () => {
        const list = lists[currentEntity] || [];
        return list.map((item) => (
            <Card
                key={item._id}
                title={cfg.cardTitle(item)}
                subtitle={cfg.cardSubtitle(item)}
                meta={cfg.cardMeta(item)}
                onEdit={() => openEdit(item._id)}
                onDelete={() => askDelete(item._id)}
            />
        ));
    };

    return (
        <div className="um-page">
            <div className="um-header">
                <div>
                    <h2>User Management</h2>
                    <p className="um-subtle">Manage residents, security staff and workers</p>
                </div>
            </div>

            <Tabs
                variant="underline"
                tabs={[
                    { label: "Residents", value: "residents", count: lists.resident.length },
                    { label: "Security", value: "security", count: lists.security.length },
                    { label: "Workers", value: "workers", count: lists.worker.length },
                ]}
                active={activeTab}
                onChange={setActiveTab}
            />

            <div className="um-content">
                <div className="um-content-actions d-flex justify-content-end" style={{ marginBottom: 12 }}>
                    <button className="um-btn" onClick={openAdd}>+ {cfg.label}</button>
                    {activeTab === "residents" && (
                        <button className="um-btn" style={{ marginLeft: 8, background: "#f0a500", color: "#fff", display: "flex", alignItems: "center", gap: 8 }} onClick={openCodesModal}>
                            <Key size={18} /> Registration Codes
                        </button>
                    )}
                </div>

                <div className="um-grid">{renderCards()}</div>
            </div>

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} onClose={() => { setModalVisible(false); setModalCfg(null); }} title={modalCfg ? (modalCfg.mode === "edit" ? `Edit ${cfg.label}` : `Add ${cfg.label}`) : ""}>
                {modalCfg && (
                    <DynamicForm fields={modalCfg.fields} initial={modalCfg.initial} submitLabel={modalCfg.mode === "edit" ? "Update" : "Create"} onSubmit={(values) => saveEntity(values, modalCfg.mode === "edit" ? modalCfg.id : null)} />
                )}
            </Modal>

            {/* Confirm Delete */}
            <ConfirmModal isOpen={confirmVisible} onClose={() => setConfirmVisible(false)} onConfirm={doDelete} loading={loading} title="Delete this item?" message="This action cannot be undone. The record will be permanently removed." confirmText="Delete" variant="danger" />

            {/* Registration Codes Modal */}
            <RegistrationCodesModal
                visible={codesVisible} onClose={() => setCodesVisible(false)}
                communityName={communityNameForCodes} codesList={codesList} codesLoading={codesLoading}
                codesSearch={codesSearch} setCodesSearch={setCodesSearch}
                selectedFlats={selectedFlats} toggleSelectFlat={toggleSelectFlat} toggleSelectAll={toggleSelectAll}
                regenerateCode={regenerateCode} isRegenerating={isRegenerating} copyToClipboard={copyToClipboard}
            />

            {loading && <div className="um-loading-overlay"><div className="um-loading">Loading...</div></div>}
        </div>
    );
}
