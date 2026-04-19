import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import { Loader } from "../Loader";
import { Modal, Tabs, StatusBadge, EmptyState } from "../shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
} from "../shared/roleUI";

export function SecurityPreApproval() {
  const [tab, setTab] = useState("Pending");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const scannerRef = useRef(null);

  const openScanner = async () => {
    setShowScanner(true);
    setScannerLoading(true);
    setTimeout(async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
        scannerRef.current.render(onScanSuccess, onScanError);
      } catch (error) {
        console.error("Failed to load scanner:", error);
      } finally {
        setScannerLoading(false);
      }
    }, 100);
  };

  const closeScanner = () => {
    setShowScanner(false);
    setScannerLoading(false);
    try {
      scannerRef.current?.clear();
    } catch (err) {
      console.warn("Scanner clear failed:", err);
    } finally {
      scannerRef.current = null;
    }
  };

  const onScanSuccess = async (decodedText) => {
    try {
      const res = await axios.post("/security/verify-qr", { token: decodedText });
      const data = res.data;
      if (!data.success) { alert("QR verification failed!"); return; }
      alert(`Visitor ${data.visitor.name} successfully ${data.visitor.status === "Active" ? "Checked In" : "Checked Out"}`);
      closeScanner();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const onScanError = (err) => { console.warn("QR Scan Error:", err); };

  const fetchData = async () => {
    try {
      const res = await axios.get("/security/preApproval");
      const data = res.data;
      if (!data.success) return;
      setList(data.preApprovalList || []);
    } catch (err) { console.error("Error loading pre-approvals:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, status) => {
    try {
      const res = await axios.post("/security/preApproval/action", { ID: id, status });
      const data = res.data;
      if (data.success) fetchData();
    } catch (err) { console.error("Action error:", err); }
  };

  const filtered = list.filter((v) => v.status === tab);

  const tabItems = ["Pending", "Approved", "Rejected"].map(t => ({ label: t, value: t }));

  useEffect(() => () => {
    try {
      scannerRef.current?.clear();
    } catch (error) {
      console.warn("Scanner cleanup failed:", error);
    } finally {
      scannerRef.current = null;
    }
  }, []);

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
        {scannerLoading ? (
          <div className="manager-ui-empty">
            <Loader label="Loading scanner..." />
          </div>
        ) : (
          <div id="qr-reader" style={{ width: "350px" }} />
        )}
      </Modal>
    </>
  );
}

