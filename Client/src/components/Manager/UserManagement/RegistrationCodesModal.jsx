import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Key, RefreshCw, Check, Home, Layers, Copy } from "lucide-react";
import { toast } from "react-toastify";

/**
 * Styled custom checkbox used in the registration codes table.
 */
const StyledCheckbox = ({ checked, onChange }) => (
    <div style={{ position: "relative", display: "inline-block", width: 18, height: 18 }}>
        <input
            type="checkbox"
            style={{ position: "absolute", opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 2 }}
            checked={checked}
            onChange={onChange}
        />
        <div style={{
            width: 18, height: 18, borderRadius: 4,
            border: `2px solid ${checked ? "#1a73e8" : "#ddd"}`,
            background: checked ? "#1a73e8" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
        }}>
            {checked && <Check size={12} color="#fff" strokeWidth={3} />}
        </div>
    </div>
);

/**
 * Registration codes modal — manages search, selection, and regeneration.
 */
export const RegistrationCodesModal = ({
    visible,
    onClose,
    communityName,
    codesList,
    codesLoading,
    codesSearch,
    setCodesSearch,
    selectedFlats,
    toggleSelectFlat,
    toggleSelectAll,
    regenerateCode,
    isRegenerating,
    copyToClipboard,
}) => {
    if (!visible) return null;

    const filtered = useMemo(
        () => codesList.filter(
            (f) =>
                f.flatNumber.toLowerCase().includes(codesSearch.toLowerCase()) ||
                f.block.toLowerCase().includes(codesSearch.toLowerCase())
        ),
        [codesList, codesSearch]
    );

    const allSelected = filtered.length > 0 && selectedFlats.size >= filtered.length;

    return (
        <div className="um-backdrop" onClick={onClose}>
            <div className="um-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
                <div className="um-modal-header">
                    <h4 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Key size={20} color="#f0a500" /> Registration Codes — {communityName}
                    </h4>
                    <button className="um-close" onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div className="um-modal-body">
                    {/* Search + batch regenerate */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }} />
                            <input
                                type="text" placeholder="Search by Flat or Block..."
                                value={codesSearch} onChange={(e) => setCodesSearch(e.target.value)}
                                className="um-search-input"
                                style={{ width: "100%", height: 38, padding: "0 12px 0 34px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: "0.9rem", background: "#f9f9f9", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>
                        <button
                            className="um-btn"
                            disabled={selectedFlats.size === 0 || isRegenerating}
                            style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", borderRadius: 8, border: "none", color: "#fff", fontWeight: 500, fontSize: "0.85rem", whiteSpace: "nowrap", background: selectedFlats.size > 0 ? "#1a73e8" : "#ccc", cursor: selectedFlats.size > 0 && !isRegenerating ? "pointer" : "not-allowed", opacity: isRegenerating ? 0.8 : 1, flexShrink: 0 }}
                            onClick={() => regenerateCode(null, Array.from(selectedFlats))}
                        >
                            <RefreshCw size={14} className={isRegenerating ? "spinner" : ""} />
                            <span>{isRegenerating ? "Refreshing..." : `Regenerate (${selectedFlats.size})`}</span>
                        </button>
                    </div>

                    {codesLoading ? (
                        <div style={{ textAlign: "center", padding: "60px 0" }}>
                            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                            <p style={{ marginTop: 12, color: "#666" }}>Fetching your secure codes...</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: 420, overflowY: "auto", overflowX: "hidden", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", tableLayout: "fixed" }}>
                                <thead style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1, borderBottom: "2px solid #eee" }}>
                                    <tr>
                                        <th style={{ padding: "10px 10px", width: 40 }}>
                                            <StyledCheckbox checked={allSelected} onChange={() => toggleSelectAll(filtered)} />
                                        </th>
                                        <th style={{ padding: "14px 10px", textAlign: "left", color: "#555", fontWeight: 600 }}>Flat Info</th>
                                        <th style={{ padding: "14px 10px", textAlign: "left", color: "#555", fontWeight: 600 }}>Occupancy</th>
                                        <th style={{ padding: "14px 10px", textAlign: "left", color: "#555", fontWeight: 600 }}>Registration Access Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filtered.map((flat, i) => (
                                            <motion.tr
                                                key={flat.flatNumber} layout
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2, delay: i * 0.03 }}
                                                style={{ borderBottom: "1px solid #f5f5f5", background: selectedFlats.has(flat.flatNumber) ? "#e8f0fe" : "transparent", transition: "background 0.1s ease" }}
                                                onMouseEnter={(e) => { if (!selectedFlats.has(flat.flatNumber)) e.currentTarget.style.background = "#fcfcfc"; }}
                                                onMouseLeave={(e) => { if (!selectedFlats.has(flat.flatNumber)) e.currentTarget.style.background = "transparent"; }}
                                            >
                                                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                                    <StyledCheckbox checked={selectedFlats.has(flat.flatNumber)} onChange={() => toggleSelectFlat(flat.flatNumber)} />
                                                </td>
                                                <td style={{ padding: "8px 10px" }}>
                                                    <div style={{ fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Home size={14} color="#666" /> {flat.flatNumber}
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "#888", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                                        <span>{flat.block}</span><span style={{ color: "#ccc" }}>•</span><Layers size={12} /><span>Floor {flat.floor}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "8px 10px" }}>
                                                    <span style={{
                                                        padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 500,
                                                        background: flat.status === "Vacant" ? "#e6f4ea" : flat.status === "Occupied" ? "#fce8e6" : "#e8f0fe",
                                                        color: flat.status === "Vacant" ? "#1e7e34" : flat.status === "Occupied" ? "#d32f2f" : "#1967d2",
                                                        border: `1px solid ${flat.status === "Vacant" ? "#c3e6cb" : flat.status === "Occupied" ? "#f5c6cb" : "#b8daff"}`,
                                                    }}>{flat.status}</span>
                                                </td>
                                                <td style={{ padding: "8px 10px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ fontFamily: "'Courier New', Courier, monospace", letterSpacing: 1.5, background: "#f0f2f5", display: "inline-block", padding: "4px 10px", borderRadius: 6, fontWeight: 700, color: flat.registrationCode ? "#1a73e8" : "#bbb", border: "1px dashed #d0d7de" }}>
                                                            {flat.registrationCode || "——"}
                                                        </div>
                                                        {flat.registrationCode && (
                                                            <button title="Copy to clipboard" onClick={() => copyToClipboard(flat.registrationCode)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
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
                            {filtered.length === 0 && (
                                <div style={{ textAlign: "center", padding: 30, color: "#999" }}>No results found matching your search.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
