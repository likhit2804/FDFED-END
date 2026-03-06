import React, { useState, useEffect } from "react";
import {
    DollarSign,
    Clock,
    AlertCircle,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Loader } from '../Loader.jsx';
import { StatCard, SearchBar, Dropdown, StatusBadge, EmptyState, Select } from '../shared';


/* -------------------------------
   Payments Overview Cards
-------------------------------- */
const PaymentsOverview = ({ stats }) => (
    <div className="ue-stat-grid" style={{ marginBottom: 4 }}>
        <StatCard label="Total Transactions" value={stats?.totalTransactions ?? "-"} icon={<DollarSign size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
        <StatCard label="Pending Payments" value={stats?.pendingAmount ? `\u20B9${stats.pendingAmount}` : "-"} icon={<Clock size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
        <StatCard label="Overdue Payments" value={stats?.overdueAmount ? `\u20B9${stats.overdueAmount}` : "-"} icon={<AlertCircle size={22} />} iconColor="#dc2626" iconBg="#fee2e2" />
        <StatCard label="Total Amount Paid" value={stats?.paidAmount ? `\u20B9${stats.paidAmount}` : "-"} icon={<BarChart3 size={22} />} iconColor="#2563eb" iconBg="#dbeafe" />
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
        <Modal isOpen={show} onClose={close} title="Payment Receipt" size="sm">
            <p><strong>Title:</strong> {details.title || "-"}</p>
            <p><strong>Payment ID:</strong> {txnId}</p>
            <p><strong>Amount:</strong> {amount !== "-" ? `₹${amount}` : "-"}</p>
            <p><strong>Payment Date:</strong> {formatDate(details.paymentDate)}</p>
            <p><strong>Deadline:</strong> {formatDate(details.paymentDeadline)}</p>
            <p><strong>Payment Method:</strong> {details.paymentMethod || "-"}</p>
            <p><strong>Status:</strong> {details.status || "-"}</p>
            <p><strong>Penalty:</strong> {penalty.p ?? 0} {penalty.changedOn ? `(changed: ${formatDate(penalty.changedOn)})` : ""}</p>
            <p><strong>Payment Type:</strong> {details.paymentType || details.type || "-"}</p>
            <p><strong>Remarks:</strong> {details.remarks || "-"}</p>
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
    const [showPayModal, setShowPayModal] = useState(false);
    const [paying, setPaying] = useState(false);
    const [payMethod, setPayMethod] = useState("UPI");

    const computeStats = (list) => {
        const overduePayments = list.filter(p => (p.status || "").toLowerCase() === "overdue");
        const pendingPayments = list.filter(p => (p.status || "").toLowerCase() === "pending");
        const completedPayments = list.filter(p => (p.status || "").toLowerCase() === "completed");

        return {
            overdueCount: overduePayments.length,
            pendingCount: pendingPayments.length,
            completedCount: completedPayments.length,
            totalBills: list.length,
            overdueAmount: overduePayments.reduce((s, p) => s + (p.amount || 0), 0),
            pendingAmount: pendingPayments.reduce((s, p) => s + (p.amount || 0), 0),
            paidAmount: completedPayments.reduce((s, p) => s + (p.amount || 0), 0),
            totalTransactions: list.length,
        };
    };

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch("/resident/payments", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                console.log("Resident payments data received:", data);
                const list = data.payments || [];
                setPayments(list);
                if (onStats) onStats(data.stats || computeStats(list));
            })
            .catch((err) => {
                console.error("Failed to load resident payments", err);
                setError("Failed to load payments.");
                setPayments([]);
            })
            .finally(() => setLoading(false));
    }, [onStats]);

    const openPayModal = (payment) => {
        setSelected(payment);
        setPayMethod(payment?.paymentMethod || "UPI");
        setShowPayModal(true);
    };

    const closePayModal = () => {
        setShowPayModal(false);
        setSelected(null);
    };

    const handlePayNow = async () => {
        if (!selected?._id) return;
        setPaying(true);
        try {
            const res = await fetch(`/resident/payment/${selected._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: "Completed", paymentMethod: payMethod })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Payment failed");

            const updated = payments.map((p) =>
                p._id === selected._id
                    ? { ...p, status: "Completed", paymentMethod: payMethod, paymentDate: new Date().toISOString() }
                    : p
            );
            setPayments(updated);
            if (onStats) onStats(computeStats(updated));
            setShowPayModal(false);
        } catch (err) {
            console.error("Payment update failed", err);
            setError(err.message || "Payment update failed");
        } finally {
            setPaying(false);
        }
    };

    // apply client-side filters
    const { search = "", status = "all", type = "all" } = filters;

    const filteredPayments = payments.filter((p) => {
        // Search text match against common fields
        const s = search.trim().toLowerCase();
        if (s) {
            const matchesSearch = [
                p.title,
                p.paymentType,
                p.type,
                p.transactionId,
                p.ID,
                p._id,
                p.paymentMethod,
            ]
                .filter(Boolean)
                .some((val) => String(val).toLowerCase().includes(s));
            if (!matchesSearch) return false;
        }

        // Status filter
        if (status && status !== "all") {
            const st = (p.status || "").toString().toLowerCase();
            if (st !== status.toLowerCase()) return false;
        }

        // Type filter
        if (type && type !== "all") {
            const tp = (p.paymentType || p.type || "").toString().toLowerCase();
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
                <div className="shadow-sm text-center text-muted p-4">
                    <i className="bi bi-wallet2 me-1"></i>  No payments found.
                </div>
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
                                        <h6 className="fw-semibold">{p.title || p.paymentType || "Payment"}</h6>
                                        <small className="text-muted">{p.paymentMethod || "Online"}</small>
                                    </div>
                                    <StatusBadge status={p.status || 'Unknown'} />

                                </div>

                                <hr />

                                <p><strong>Amount:</strong> ₹{p.amount || 0}</p>
                                <p><strong>Date:</strong> {formatDate(p.paymentDate)}</p>
                                <p><strong>Type:</strong> {p.paymentType || p.type || "-"}</p>
                                <p><strong>Payment ID:</strong> {p.ID || p.transactionId || p._id || "-"}</p>

                                <div className="d-flex gap-2 mt-2">
                                    {['pending', 'overdue'].includes((p.status || '').toLowerCase()) && (
                                        <button
                                            className="btn btn-success w-100"
                                            onClick={() => openPayModal(p)}
                                        >
                                            Pay Now
                                        </button>
                                    )}
                                    <button
                                        className="reciept-btn w-100"
                                        onClick={() => {
                                            setSelected(p);
                                            setShowPopup(true);
                                        }}
                                    >
                                        View Receipt
                                    </button>
                                </div>
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

            <Modal
                isOpen={showPayModal && !!selected}
                onClose={closePayModal}
                title="Complete Payment"
                size="sm"
                footer={
                    <>
                        <button className="btn btn-secondary w-50" onClick={closePayModal} disabled={paying}>Cancel</button>
                        <button className="btn btn-success w-50" onClick={handlePayNow} disabled={paying}>{paying ? "Processing..." : "Pay Now"}</button>
                    </>
                }
            >
                <p className="mb-2"><strong>Title:</strong> {selected?.title || "Payment"}</p>
                <p className="mb-2"><strong>Amount:</strong> ₹{selected?.amount || 0}</p>
                <Select
                    label="Payment Method"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    options={[
                        { label: 'UPI', value: 'UPI' },
                        { label: 'Debit Card', value: 'Debit' },
                        { label: 'Credit Card', value: 'Credit' },
                        { label: 'Net Banking', value: 'Netbanking' },
                        { label: 'Cash', value: 'Cash' },
                    ]}
                />
            </Modal>

        </div>
    );
};

/* -------------------------------
   Main Component
-------------------------------- */
export const ResidentPayments = () => {
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [type, setType] = useState("all");

    return (
        <div>
            <PaymentsOverview stats={stats} />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <SearchBar placeholder="Search by title or payment ID..." value={search} onChange={setSearch} />
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
