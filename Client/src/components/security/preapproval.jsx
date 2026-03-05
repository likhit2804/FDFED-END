import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { Modal, Tabs, StatusBadge, EmptyState } from "../shared";

export function SecurityPreApproval() {
  const [tab, setTab] = useState("Pending");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  let scannerRef = null;

  const openScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
      scannerRef = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
      scannerRef.render(onScanSuccess, onScanError);
    }, 100);
  };

  const closeScanner = () => {
    setShowScanner(false);
    try { scannerRef?.clear(); } catch (err) { console.warn("Scanner clear failed:", err); }
  };

  const onScanSuccess = async (decodedText) => {
    try {
      const res = await fetch("http://localhost:3000/security/verify-qr", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decodedText }),
      });
      const data = await res.json();
      if (!data.success) { alert("QR verification failed!"); return; }
      alert(`Visitor ${data.visitor.name} successfully ${data.visitor.status === "Active" ? "Checked In" : "Checked Out"}`);
      closeScanner();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const onScanError = (err) => { console.warn("QR Scan Error:", err); };

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:3000/security/preApproval", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!data.success) return;
      setList(data.preApprovalList || []);
      setLoading(false);
    } catch (err) { console.error("Error loading pre-approvals:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, status) => {
    try {
      const res = await fetch("http://localhost:3000/security/preApproval/action", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: id, status }),
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) { console.error("Action error:", err); }
  };

  const filtered = list.filter((v) => v.status === tab);

  const tabItems = ["Pending", "Approved", "Rejected"].map(t => ({ label: t, value: t }));

  return (
    <div className="pre-container">
      <div className="pre-header">
        <h2 className="page-title">Pre Approval Requests</h2>
        <button className="scan-btn" onClick={openScanner}>
          <i className="bi bi-qr-code-scan"></i> Scan QR
        </button>
      </div>

      <Tabs
        tabs={tabItems}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="pre-list">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <EmptyState message={`No ${tab} requests`} />
        ) : (
          filtered.map((v) => (
            <div key={v._id} className="pre-card">
              <div className={`card-header ${v.status.toLowerCase()}`}>
                <span className="visitor-name"><i className="bi bi-person-fill"></i> {v.name}</span>
                <StatusBadge status={v.status} />
              </div>

              <div className="card-body">
                <div className="row-item"><div className="label">Requested By:</div><div className="value">{v?.approvedBy?.name || "N/A"}</div></div>
                <div className="row-item"><div className="label">Purpose:</div><div className="value">{v.purpose}</div></div>
                <div className="row-item">
                  <div className="label">Visit Date:</div>
                  <div className="value">{new Date(v.scheduledAt).toLocaleDateString("en-GB")} , {new Date(v.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="row-item"><div className="label">Contact:</div><div className="value">{v.contactNumber}</div></div>
              </div>

              {tab === "Pending" && (
                <div className="card-footer">
                  <button className="btn-approve" onClick={() => handleAction(v._id, "Approved")}><i className="bi bi-check-circle"></i> Approve</button>
                  <button className="btn-reject" onClick={() => handleAction(v._id, "Rejected")}><i className="bi bi-x-circle"></i> Reject</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={closeScanner}
        title="Scan QR Code"
        size="sm"
      >
        <div id="qr-reader" style={{ width: "350px" }}></div>
      </Modal>
    </div>
  );
}
