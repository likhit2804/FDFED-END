// UserManagement.jsx
import React, { useEffect, useState } from "react";
import { Search, Key, RefreshCw, Check, Home, Layers, Copy, X, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../../assets/css/Manager/userManagement.css";

const makeBase = () =>
    process.env.NODE_ENV === "production"
        ? `${window.location.origin}/manager`
        : "http://localhost:3000/manager";

/* -------------------------
   Small Helpers & Subcomponents
--------------------------*/

const IconButton = ({ children, className = "", ...props }) => (
    <button className={`um-icon-btn ${className}`} {...props}>
        {children}
    </button>
);

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

    console.log("formData:", form);
    console.log("fields: ", fields);
    console.log("initial: ", initial);



    return (
        <form
            className="um-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(form);
            }}
        >
            {fields.map((f) => (
                <div className="um-form-row" key={f.key}>
                    <label>{f.label}</label>
                    {f.type === "textarea" ? (
                        <textarea value={form[f.key]} onChange={(e) => handle(f.key, e.target.value)} />
                    ) : (
                        <input
                            type={f.type || "text"}
                            value={form[f.key]}
                            onChange={(e) => handle(f.key, e.target.value)}
                            placeholder={f.placeholder || ""}
                        />
                    )}
                </div>
            ))}
            <div className="um-form-actions">
                <button type="submit" className="um-btn um-btn-primary">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
};

/* -------------------------
   Main Component
--------------------------*/
export default function UserManagement() {
    const BASE = makeBase();

    const [activeTab, setActiveTab] = useState("residents");

    const [resList, setResList] = useState([]);
    const [secList, setSecList] = useState([]);
    const [wrkList, setWrkList] = useState([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalCfg, setModalCfg] = useState(null);

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState(null);

    const [loading, setLoading] = useState(false);

    // Registration codes modal
    const [codesVisible, setCodesVisible] = useState(false);
    const [codesList, setCodesList] = useState([]);
    const [codesLoading, setCodesLoading] = useState(false);
    const [communityNameForCodes, setCommunityNameForCodes] = useState("");
    const [codesSearch, setCodesSearch] = useState("");
    const [selectedFlats, setSelectedFlats] = useState(new Set());
    const [isRegenerating, setIsRegenerating] = useState(false);

    /* -------------------------
       GET LISTS
    --------------------------*/
    const fetchLists = async () => {
        try {
            setLoading(true);
            // residents
            try {
                const r = await fetch(`${BASE}/userManagement`, { credentials: "include" });
                if (r.ok) {
                    const jr = await r.json();
                    setResList(jr.R || []);
                    setSecList(jr.S || []);
                    setWrkList(jr.W || []);
                }
            } catch (err) {

            }

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLists();
    }, []);

    /* -------------------------
       Registration Codes
    --------------------------*/
    const fetchRegistrationCodes = async () => {
        setCodesLoading(true);
        try {
            const res = await fetch(`${BASE}/registration-codes`, { credentials: "include" });
            const json = await res.json();
            console.log("[RegCodes] response:", json); // debug
            if (json.success) {
                // sendSuccess merges data directly onto response (not nested under 'data')
                setCodesList(json.flats || []);
                setCommunityNameForCodes(json.communityName || "");
            } else {
                console.error("[RegCodes] error:", json.message);
            }
        } catch (err) {
            console.error("fetchRegistrationCodes error", err);
        } finally {
            setCodesLoading(false);
        }
    };

    const regenerateCode = async (flatNumber, flatNumbers = null) => {
        try {
            setIsRegenerating(true);
            const body = flatNumbers ? { flatNumbers } : { flatNumber: flatNumber ?? undefined };
            const res = await fetch(`${BASE}/registration-codes/regenerate`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const json = await res.json();

            if (flatNumber && !flatNumbers) {
                // Single flat — patch just that row in state
                if (json.success && json.newCode) {
                    setCodesList(prev =>
                        prev.map(f =>
                            f.flatNumber === flatNumber
                                ? { ...f, registrationCode: json.newCode }
                                : f
                        )
                    );
                }
            } else {
                // Batch or all vacant — refresh everything
                await fetchRegistrationCodes();
                setSelectedFlats(new Set());
            }
        } catch (err) {
            console.error("regenerateCode error", err);
        } finally {
            setIsRegenerating(false);
        }
    };

    const toggleSelectFlat = (fNum) => {
        setSelectedFlats(prev => {
            const next = new Set(prev);
            if (next.has(fNum)) next.delete(fNum);
            else next.add(fNum);
            return next;
        });
    };

    const toggleSelectAll = (filtered) => {
        if (selectedFlats.size >= filtered.length) {
            setSelectedFlats(new Set());
        } else {
            setSelectedFlats(new Set(filtered.map(f => f.flatNumber)));
        }
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

    /* -------------------------
      Config per entity
    --------------------------*/
    const configFor = (entity) => {
        if (entity === "resident") {
            return {
                label: "Resident",
                endpoint: "resident",
                listName: "residents",
                fields: [
                    { key: "residentFirstname", label: "First Name" },
                    { key: "residentLastname", label: "Last Name" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "uCode", label: "UCode / Flat" },
                    { key: "contact", label: "Contact" },
                ],
            };
        }
        if (entity === "security") {
            return {
                label: "Security",
                endpoint: "security",
                listName: "security",
                fields: [
                    { key: "securityName", label: "Name" },
                    { key: "securityEmail", label: "Email", type: "email" },
                    { key: "securityContact", label: "Contact" },
                    { key: "securityAddress", label: "Address" },
                    { key: "securityShift", label: "Shift" },
                ],
            };
        }
        // worker
        return {
            label: "Worker",
            endpoint: "worker",
            listName: "workers",
            fields: [
                { key: "workerName", label: "Name" },
                { key: "workerEmail", label: "Email", type: "email" },
                { key: "workerJobRole", label: "Job Role" },
                { key: "workerContact", label: "Contact" },
                { key: "workerAddress", label: "Address" },
                { key: "workerSalary", label: "Salary" },
            ],
        };
    };

    /* -------------------------
     Open Add Modal
    --------------------------*/
    const openAdd = (entity) => {
        const cfg = configFor(entity);
        setModalCfg({ entity, mode: "add", fields: cfg.fields, initial: {}, id: null });
        setModalVisible(true);
    };

    const openEdit = async (entity, id) => {
        setLoading(true);
        try {
            const cfg = configFor(entity);
            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}/${id}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();
            console.log("json :", json.r);

            const payload = json.r || json[entity] || json[cfg.listName?.slice(0, -1)] || json;
            // map server fields to form initial keys
            const initial = mapServerToForm(entity, payload);
            setModalCfg({ entity, mode: "edit", fields: cfg.fields, initial, id });
            setModalVisible(true);
        } catch (err) {
            console.error("openEdit error", err);
            alert("Failed to load data for edit");
        } finally {
            setLoading(false);
        }
    };

    const saveEntity = async (entity, values, idForUpdate) => {
        setLoading(true);
        try {
            const cfg = configFor(entity);
            // build payload; backend expects Rid/Sid/Wid for updates
            const payload = { ...values };
            if (idForUpdate) {
                const idKey = entity === "resident" ? "Rid" : entity === "security" ? "Sid" : "Wid";
                payload[idKey] = idForUpdate;
            }

            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!json || !json.success) {
                const msg = (json && json.message) || "Save failed";
                alert(msg);
                return;
            }

            if (entity === "resident") {
                if (json.isUpdate) {
                    setResList((p) => p.map((x) => (x._id === json.resident._id ? json.resident : x)));
                } else {
                    setResList((p) => [json.resident, ...p]);
                }
            } else if (entity === "security") {
                if (json.isUpdate) {
                    setSecList((p) => p.map((x) => (x._id === json.security._id ? json.security : x)));
                } else {
                    setSecList((p) => [json.security, ...p]);
                }
            } else {
                if (json.isUpdate) {
                    setWrkList((p) => p.map((x) => (x._id === json.worker._id ? json.worker : x)));
                } else {
                    setWrkList((p) => [json.worker, ...p]);
                }
            }

            setModalVisible(false);
            setModalCfg(null);
        } catch (err) {
            console.error("save error", err);
            alert("Save failed");
        } finally {
            setLoading(false);
        }
    };

    /* -------------------------
      Delete
    --------------------------*/
    const askDelete = (entity, id) => {
        setConfirmPayload({ entity, id });
        setConfirmVisible(true);
    };

    const doDelete = async () => {
        if (!confirmPayload) return;
        setLoading(true);
        try {
            const { entity, id } = confirmPayload;
            const cfg = configFor(entity);
            const res = await fetch(`${BASE}/userManagement/${cfg.endpoint}/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const json = await res.json();
            if (!json || !(json.ok || json.success)) {
                alert("Delete failed");
                return;
            }

            if (entity === "resident") setResList((p) => p.filter((x) => x._id !== id));
            if (entity === "security") setSecList((p) => p.filter((x) => x._id !== id));
            if (entity === "worker") setWrkList((p) => p.filter((x) => x._id !== id));
            setConfirmVisible(false);
            setConfirmPayload(null);
        } catch (err) {
            console.error("delete error", err);
            alert("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    /* -------------------------
      Helpers to map server <-> form keys
    --------------------------*/
    const mapServerToForm = (entity, item = {}) => {
        if (!item) return {};
        if (entity === "resident") {
            return {
                residentFirstname: item.residentFirstname || item.firstName || "",
                residentLastname: item.residentLastname || item.lastName || "",
                email: item.email || "",
                uCode: item.uCode || item.flat || "",
                contact: item.contact || "",
            };
        }
        if (entity === "security") {
            return {
                securityName: item.name || "",
                securityEmail: item.email || "",
                securityContact: item.contact || "",
                securityAddress: item.address || "",
                securityShift: item.Shift || "",
                gate: item.workplace || "",
            };
        }
        // worker
        return {
            workerName: item.name || "",
            workerEmail: item.email || "",
            workerJobRole: item.jobRole || "",
            workerContact: item.contact || "",
            workerAddress: item.address || "",
            workerSalary: item.salary || "",
        };
    };

    /* -------------------------
      Renderers
    --------------------------*/
    const renderResidents = () =>
        resList.map((r) => (
            <Card
                key={r._id}
                title={`${r.residentFirstname || ""} ${r.residentLastname || ""}`}
                subtitle={r.uCode || r.flat || ""}
                meta={[
                    { label: "Email", value: r.email },
                    { label: "Contact", value: r.contact },
                ]}
                onEdit={() => openEdit("resident", r._id)}
                onDelete={() => askDelete("resident", r._id)}
            />
        ));

    const renderSecurity = () =>
        secList.map((s) => (
            <Card
                key={s._id}
                title={s.name}
                subtitle={s.workplace || s.gate || ""}
                meta={[
                    { label: "Shift", value: s.Shift || s.securityShift },
                    { label: "Contact", value: s.contact },
                ]}
                onEdit={() => openEdit("security", s._id)}
                onDelete={() => askDelete("security", s._id)}
            />
        ));

    const renderWorkers = () =>
        wrkList.map((w) => (
            <Card
                key={w._id}
                title={w.name}
                subtitle={w.jobRole || w.workerJobRole || ""}
                meta={[
                    { label: "Contact", value: w.contact },
                    { label: "Salary", value: w.salary },
                ]}
                onEdit={() => openEdit("worker", w._id)}
                onDelete={() => askDelete("worker", w._id)}
            />
        ));

    return (
        <div className="um-page">
            <div className="um-header">
                <div>
                    <h2>User Management</h2>
                    <p className="um-subtle">Manage residents, security staff and workers</p>
                </div>

                {/* header actions intentionally removed — add buttons are shown inside the content area per active tab */}
            </div>

            <div className="um-tabs">
                <button className={`um-tab ${activeTab === "residents" ? "active" : ""}`} onClick={() => setActiveTab("residents")}>
                    Residents ({resList.length})
                </button>
                <button className={`um-tab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                    Security ({secList.length})
                </button>
                <button className={`um-tab ${activeTab === "workers" ? "active" : ""}`} onClick={() => setActiveTab("workers")}>
                    Workers ({wrkList.length})
                </button>
            </div>

            <div className="um-content">
                <div className="um-content-actions d-flex justify-content-end" style={{ marginBottom: 12 }}>
                    {activeTab === "residents" && (
                        <>
                            <button className="um-btn" onClick={() => openAdd("resident")}>
                                + Resident
                            </button>
                            <button
                                className="um-btn"
                                style={{ marginLeft: 8, background: "#f0a500", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}
                                onClick={openCodesModal}
                            >
                                <Key size={18} /> Registration Codes
                            </button>
                        </>
                    )}
                    {activeTab === "security" && (
                        <button className="um-btn" onClick={() => openAdd("security")}>
                            + Security
                        </button>
                    )}
                    {activeTab === "workers" && (
                        <button className="um-btn" onClick={() => openAdd("worker")}>
                            + Worker
                        </button>
                    )}
                </div>

                {activeTab === "residents" && <div className="um-grid">{renderResidents()}</div>}
                {activeTab === "security" && <div className="um-grid">{renderSecurity()}</div>}
                {activeTab === "workers" && <div className="um-grid">{renderWorkers()}</div>}
            </div>

            {/* Modal Add/Edit */}
            <Modal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setModalCfg(null);
                }}
                title={modalCfg ? (modalCfg.mode === "edit" ? `Edit ${configFor(modalCfg.entity).label}` : `Add ${configFor(modalCfg.entity).label}`) : ""}
            >
                {modalCfg && (
                    <DynamicForm
                        fields={modalCfg.fields}
                        initial={modalCfg.initial}
                        submitLabel={modalCfg.mode === "edit" ? "Update" : "Create"}
                        onSubmit={(values) => saveEntity(modalCfg.entity, values, modalCfg.mode === "edit" ? modalCfg.id : null)}
                    />
                )}
            </Modal>

            {/* Confirm delete */}
            <Modal visible={confirmVisible} onClose={() => setConfirmVisible(false)} title="Confirm delete">
                <div>
                    <p>Are you sure you want to delete this item?</p>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button className="um-btn" onClick={() => setConfirmVisible(false)}>
                            Cancel
                        </button>
                        <button className="um-btn um-btn-danger" onClick={doDelete}>
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                visible={codesVisible}
                onClose={() => setCodesVisible(false)}
                title={<div style={{ display: "flex", alignItems: "center", gap: 10 }}><Key size={20} color="#f0a500" /> Registration Codes — {communityNameForCodes}</div>}
            >
                <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                            <Search
                                size={16}
                                style={{
                                    position: "absolute",
                                    left: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#aaa",
                                    pointerEvents: "none"
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search by Flat or Block..."
                                value={codesSearch}
                                onChange={(e) => setCodesSearch(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "38px",
                                    padding: "0 12px 0 34px",
                                    borderRadius: 8,
                                    border: "1px solid #e0e0e0",
                                    fontSize: "0.9rem",
                                    background: "#f9f9f9",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = "#fff";
                                    e.target.style.borderColor = "#1a73e8";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(26,115,232,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = "#f9f9f9";
                                    e.target.style.borderColor = "#e0e0e0";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>
                        <button
                            className="um-btn"
                            disabled={selectedFlats.size === 0 || isRegenerating}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                height: "38px",
                                padding: "0 14px",
                                borderRadius: 8,
                                border: "none",
                                color: "#fff",
                                fontWeight: 500,
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                                background: selectedFlats.size > 0 ? "#1a73e8" : "#ccc",
                                cursor: (selectedFlats.size > 0 && !isRegenerating) ? "pointer" : "not-allowed",
                                opacity: isRegenerating ? 0.8 : 1,
                                flexShrink: 0,
                            }}
                            onClick={() => regenerateCode(null, Array.from(selectedFlats))}
                        >
                            {isRegenerating ? (
                                <><RefreshCw className="spinner" size={14} /><span>Refreshing...</span></>
                            ) : (
                                <><RefreshCw size={14} /><span>Regenerate ({selectedFlats.size})</span></>
                            )}
                        </button>
                    </div>

                    {codesLoading ? (
                        <div style={{ textAlign: "center", padding: "60px 0" }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p style={{ marginTop: 12, color: "#666" }}>Fetching your secure codes...</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: 420, overflowY: "auto", overflowX: "hidden", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", tableLayout: "fixed" }}>
                                <thead style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1, borderBottom: "2px solid #eee" }}>
                                    <tr>
                                        <th style={{ padding: "10px 10px", width: 40 }}>
                                            <div style={{ position: "relative", display: "inline-block", width: 18, height: 18 }}>
                                                <input
                                                    type="checkbox"
                                                    style={{ position: "absolute", opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 2 }}
                                                    checked={codesList.length > 0 && selectedFlats.size >= codesList.filter(f =>
                                                        f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                                                        f.block.toLowerCase().includes(codesSearch.toLowerCase())
                                                    ).length}
                                                    onChange={() => toggleSelectAll(codesList.filter(f =>
                                                        f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                                                        f.block.toLowerCase().includes(codesSearch.toLowerCase())
                                                    ))}
                                                />
                                                <div style={{
                                                    width: 18, height: 18, borderRadius: 4, border: "2px solid #ddd", background: (codesList.length > 0 && selectedFlats.size >= codesList.filter(f =>
                                                        f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                                                        f.block.toLowerCase().includes(codesSearch.toLowerCase())
                                                    ).length) ? "#1a73e8" : "#fff",
                                                    borderColor: (codesList.length > 0 && selectedFlats.size >= codesList.filter(f =>
                                                        f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                                                        f.block.toLowerCase().includes(codesSearch.toLowerCase())
                                                    ).length) ? "#1a73e8" : "#ddd", display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "all 0.2s"
                                                }}>
                                                    {(codesList.length > 0 && selectedFlats.size >= codesList.filter(f =>
                                                        f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                                                        f.block.toLowerCase().includes(codesSearch.toLowerCase())
                                                    ).length) && <Check size={12} color="#fff" strokeWidth={3} />}
                                                </div>
                                            </div>
                                        </th>
                                        <th style={{ padding: "14px 10px", textAlign: "left", color: "#555", fontWeight: 600 }}>Flat Info</th>
                                        <th style={{ padding: "14px 10px", textAlign: "left", color: "#555", fontWeight: 600 }}>Occupancy</th>
                                        <th style={{ padding: "14px 10px", textAlign: "left", color: "#555", fontWeight: 600 }}>Registration Access Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {codesList
                                            .filter(f =>
                                                f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                                                f.block.toLowerCase().includes(codesSearch.toLowerCase())
                                            )
                                            .map((flat, i) => (
                                                <motion.tr
                                                    key={flat.flatNumber}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.2, delay: i * 0.03 }}
                                                    style={{
                                                        borderBottom: "1px solid #f5f5f5",
                                                        background: selectedFlats.has(flat.flatNumber) ? "#e8f0fe" : "transparent",
                                                        transition: "background 0.1s ease"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!selectedFlats.has(flat.flatNumber)) {
                                                            e.currentTarget.style.background = "#fcfcfc";
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!selectedFlats.has(flat.flatNumber)) {
                                                            e.currentTarget.style.background = "transparent";
                                                        }
                                                    }}
                                                >
                                                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                                        <div style={{ position: "relative", display: "inline-block", width: 18, height: 18 }}>
                                                            <input
                                                                type="checkbox"
                                                                style={{ position: "absolute", opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 2 }}
                                                                checked={selectedFlats.has(flat.flatNumber)}
                                                                onChange={() => toggleSelectFlat(flat.flatNumber)}
                                                            />
                                                            <div style={{
                                                                width: 18, height: 18, borderRadius: 4, border: "2px solid #ddd", background: selectedFlats.has(flat.flatNumber) ? "#1a73e8" : "#fff",
                                                                borderColor: selectedFlats.has(flat.flatNumber) ? "#1a73e8" : "#ddd", display: "flex", alignItems: "center", justifyContent: "center",
                                                                transition: "all 0.2s"
                                                            }}>
                                                                {selectedFlats.has(flat.flatNumber) && <Check size={12} color="#fff" strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "8px 10px" }}>
                                                        <div style={{ fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: 6 }}>
                                                            <Home size={14} color="#666" /> {flat.flatNumber}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#888", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                                            <span>{flat.block}</span>
                                                            <span style={{ color: "#ccc" }}>•</span>
                                                            <Layers size={12} />
                                                            <span>Floor {flat.floor}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "8px 10px" }}>
                                                        <span style={{
                                                            padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 500,
                                                            background: flat.status === "Vacant" ? "#e6f4ea" : flat.status === "Occupied" ? "#fce8e6" : "#e8f0fe",
                                                            color: flat.status === "Vacant" ? "#1e7e34" : flat.status === "Occupied" ? "#d32f2f" : "#1967d2",
                                                            border: `1px solid ${flat.status === "Vacant" ? "#c3e6cb" : flat.status === "Occupied" ? "#f5c6cb" : "#b8daff"}`
                                                        }}>{flat.status}</span>
                                                    </td>
                                                    <td style={{ padding: "8px 10px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <div style={{
                                                                fontFamily: "'Courier New', Courier, monospace",
                                                                letterSpacing: 1.5,
                                                                background: "#f0f2f5",
                                                                display: "inline-block",
                                                                padding: "4px 10px",
                                                                borderRadius: 6,
                                                                fontWeight: 700,
                                                                color: flat.registrationCode ? "#1a73e8" : "#bbb",
                                                                border: "1px dashed #d0d7de"
                                                            }}>
                                                                {flat.registrationCode || "——"}
                                                            </div>
                                                            {flat.registrationCode && (
                                                                <button
                                                                    title="Copy to clipboard"
                                                                    onClick={() => copyToClipboard(flat.registrationCode)}
                                                                    style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", transition: "color 0.2s" }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.color = "#1a73e8"}
                                                                    onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                                                                >
                                                                    <Copy size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {codesList.filter(f =>
                                f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                                f.block.toLowerCase().includes(codesSearch.toLowerCase())
                            ).length === 0 && (
                                    <div style={{ textAlign: "center", padding: 30, color: "#999" }}>
                                        No results found matching your search.
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </Modal>

            {loading && (
                <div className="um-loading-overlay">
                    <div className="um-loading">Loading...</div>
                </div>
            )}
        </div>
    );
}
