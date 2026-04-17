import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { Loader } from "../Loader";
import { Modal, Tabs, StatusBadge, EmptyState } from "../shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
} from "../Manager/ui";

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
      const res = await fetch("/security/verify-qr", {
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
      const res = await fetch("/security/preApproval", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!data.success) return;
      setList(data.preApprovalList || []);
    } catch (err) { console.error("Error loading pre-approvals:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, status) => {
    try {
      const res = await fetch("/security/preApproval/action", {
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
    <>
      <ManagerPageShell
        eyebrow="Security Desk"
        title="Process pre-approval requests quickly and safely."
        description="Review resident submissions, approve or reject entries, and verify gate QR codes in one queue."
      >
        <ManagerSection
          eyebrow="Queue"
          title="Pre-approval requests"
          description="Filter by status and handle pending requests from residents."
          actions={
            <ManagerActionButton variant="primary" onClick={openScanner}>
              <i className="bi bi-qr-code-scan" /> Scan QR
            </ManagerActionButton>
          }
        >
          <Tabs tabs={tabItems} active={tab} onChange={setTab} />

          {loading ? (
            <div className="manager-ui-empty"><Loader label="Loading requests..." /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title={`No ${tab} requests`} />
          ) : (
            <ManagerRecordGrid>
              {filtered.map((visitor) => {
                const visitDate = visitor.scheduledAt
                  ? `${new Date(visitor.scheduledAt).toLocaleDateString("en-GB")} ${new Date(visitor.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "-";

                return (
                  <ManagerRecordCard
                    key={visitor._id}
                    title={visitor.name || "Unknown visitor"}
                    subtitle={`Requested by: ${visitor?.approvedBy?.name || "N/A"}`}
                    status={<StatusBadge status={visitor.status} />}
                    meta={[
                      { label: "Purpose", value: visitor.purpose || "-" },
                      { label: "Visit date", value: visitDate, wide: true },
                      { label: "Contact", value: visitor.contactNumber || "-" },
                    ]}
                    actions={
                      tab === "Pending" ? (
                        <>
                          <ManagerActionButton variant="primary" onClick={() => handleAction(visitor._id, "Approved")}>
                            <i className="bi bi-check-circle" /> Approve
                          </ManagerActionButton>
                          <ManagerActionButton variant="danger" onClick={() => handleAction(visitor._id, "Rejected")}>
                            <i className="bi bi-x-circle" /> Reject
                          </ManagerActionButton>
                        </>
                      ) : null
                    }
                  />
                );
              })}
            </ManagerRecordGrid>
          )}
        </ManagerSection>
      </ManagerPageShell>

      <Modal isOpen={showScanner} onClose={closeScanner} title="Scan QR Code" size="sm">
        <div id="qr-reader" style={{ width: "350px" }} />
      </Modal>
    </>
  );
}
