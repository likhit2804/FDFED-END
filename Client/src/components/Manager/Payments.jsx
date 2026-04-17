import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Clock,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Loader } from '../Loader.jsx';
import { StatCard, StatusBadge, SearchBar, Dropdown, EmptyState, Modal } from '../shared';


/* -------------------------------
   Payments Overview Cards
-------------------------------- */
const PaymentsOverview = ({ stats }) => (
  <div className="ue-stat-grid" style={{ marginBottom: 4 }}>
    <StatCard label="Total Transactions" value={stats?.totalTransactions ?? "-"} icon={<DollarSign size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
    <StatCard label="Pending Payments" value={stats?.pendingAmount ? `\u20B9${stats.pendingAmount}` : "-"} icon={<Clock size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
    <StatCard label="Overdue Payments" value={stats?.overdueAmount ? `\u20B9${stats.overdueAmount}` : "-"} icon={<AlertCircle size={22} />} iconColor="#dc2626" iconBg="#fee2e2" />
    <StatCard label="Total Revenue" value={stats?.paidAmount ? `\u20B9${stats.paidAmount}` : "-"} icon={<BarChart3 size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
  </div>
);


/* -------------------------------
   Receipt Popup
-------------------------------- */
const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

const PaymentsDetailsPopUp = ({ show, close, details }) => {
  if (!details) return null;
  const txnId = details.ID || details.transactionId || details._id || "-";
  const amount = details.amount ?? details.amt ?? "-";
  const penalty = details.penalty || {};

  return (
    <Modal isOpen={show} onClose={close} title="Payment Details" size="sm">
      <p><strong>Title:</strong> {details.title || "-"}</p>
      <p><strong>Payment ID:</strong> {txnId}</p>
      <p><strong>Belongs To:</strong> {details.belongTo || "-"}</p>
      <p><strong>Amount:</strong> {amount !== "-" ? `₹${amount}` : "-"}</p>
      <p><strong>Payment Date:</strong> {formatDate(details.paymentDate)}</p>
      <p><strong>Deadline:</strong> {formatDate(details.paymentDeadline)}</p>
      <p><strong>Method:</strong> {details.paymentMethod || "-"}</p>
      <p><strong>Penalty:</strong> {penalty.p ?? 0} {penalty.changedOn ? `(changed: ${formatDate(penalty.changedOn)})` : ""}</p>
      <p><strong>Receiver:</strong> {details.receiver?.email || details.reciever?.email || "-"}</p>
      <p><strong>Sender:</strong> {details.sender?.email || details.from?.email || "-"}</p>
      <p><strong>Remarks:</strong> {details.remarks || "-"}</p>
      <p><strong>Status:</strong> {details.status || "-"}</p>
    </Modal>
  );
};


/* -------------------------------
   Payment Cards List
-------------------------------- */
const PaymentsHistory = ({ onStats, filters = {} }) => {
  const [payments, setPayments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("/manager/api/payments", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(async (res) => {
        return res.json();
      })
      .then((data) => {
        console.log("Payments data received:", data);
        setPayments(data.payments || []);
        if (onStats) onStats(data.stats || {});
      })
      .catch((err) => {
        console.error("Failed to load payments", err);
        setError("Failed to load payments.");
        setPayments([]);
      })
      .finally(() => setLoading(false));
  }, [onStats]);

  // apply client-side filters
  const { search = "", status = "all", type = "all" } = filters;

  const filteredPayments = payments.filter((p) => {
    // Search text match against common fields
    const s = search.trim().toLowerCase();
    if (s) {
      const matchesSearch = [
        p.name,
        p.flat,
        p.email,
        p.transactionId,
        p.txn,
        p.planName,
        p.type,
        p.paymentType,
        p.ID,
        p._id,
        p.receiver,
        p.reciever,
        p.sender,
        p.title,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(s));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (status && status !== "all") {
      const st = (p.status || p.paymentStatus || "").toString().toLowerCase();
      if (st !== status.toLowerCase()) return false;
    }

    // Type filter
    if (type && type !== "all") {
      const tp = (p.planType || p.type || p.paymentType || "").toString().toLowerCase();
      if (tp !== type.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <div className="p-0">

      {loading ? (
        <div className="text-center p-4"><Loader /></div>
      ) : error ? (
        <div className="text-center text-danger p-4">{error}</div>
      ) : payments.length === 0 ? (
        <EmptyState icon={<DollarSign size={48} />} title="No Payments Found" sub="No payment records match your current filters." />

      ) : (
        <div className="row g-4 payments-grid mt-2">


          {filteredPayments.map((p, i) => (
            <motion.div
              className="col-md-6 col-lg-4"
              key={p.ID || p.transactionId || p._id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="card p-3 rounded-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-semibold">{p.title}</h6>
                    <small className="text-muted">{p.sender.email || p.sender.email || "-"}</small>
                  </div>
                  <div className="badge-cell">
                    <StatusBadge status={p.status} />
                  </div>
                </div>

                <hr />

                <p><strong>Amount:</strong> ₹{p.amount}</p>
                <p><strong>Date:</strong> {formatDate(p.paymentDate)}</p>
                <p><strong>Method:</strong> {p.paymentMethod}</p>
                <p><strong>Payment ID:</strong> {p.ID || p.transactionId || p._id}</p>

                <button
                  className="reciept-btn w-100 mt-2"
                  onClick={() => {
                    setSelected(p);
                    setShowPopup(true);
                  }}
                >
                  View Receipt
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <PaymentsDetailsPopUp
        show={showPopup}
        close={() => setShowPopup(false)}
        details={selected}
      />
    </div>
  );
};

/* -------------------------------
   Main Component
-------------------------------- */
export const Payments = () => {
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  return (
    <div>
      <PaymentsOverview stats={stats} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchBar placeholder="Search by name, flat or txn..." value={search} onChange={setSearch} />
        </div>
        <Dropdown
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Completed', value: 'completed' },
            { label: 'Pending', value: 'pending' },
            { label: 'Overdue', value: 'overdue' },
          ]}
          selected={status}
          onChange={setStatus}
          width="180px"
        />
        <Dropdown
          options={[
            { label: 'All Types', value: 'all' },
            { label: 'Maintenance', value: 'maintenance' },
            { label: 'Subscription', value: 'subscription' },
            { label: 'Booking', value: 'booking' },
          ]}
          selected={type}
          onChange={setType}
          width="180px"
        />
      </div>


      <PaymentsHistory onStats={setStats} filters={{ search, status, type }} />
    </div>
  );
};
