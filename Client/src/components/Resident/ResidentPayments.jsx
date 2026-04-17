import React, { useState, useEffect } from "react";
import {
    DollarSign,
    Clock,
    AlertCircle,
    BarChart3
} from "lucide-react";

import { Loader } from "../Loader.jsx";
import { EntityCard, EmptyState, StatCard, SearchBar, Dropdown, Modal } from "../shared";
import {
    ManagerPageShell,
    ManagerSection,
    ManagerToolbar,
    ManagerToolbarGrow,
} from "../Manager/ui";
import { openRazorpayCheckout } from "../../services/razorpay";

const PaymentsOverview = ({ stats }) => (
    <div className="ue-stat-grid" style={{ marginBottom: 4 }}>
        <StatCard label="Total Transactions" value={stats?.totalTransactions ?? "-"} icon={<DollarSign size={22} />} iconColor="#7c3aed" iconBg="#f3edff" />
        <StatCard label="Pending Payments" value={stats?.pendingAmount ? `\u20B9${stats.pendingAmount}` : "-"} icon={<Clock size={22} />} iconColor="#8b5cf6" iconBg="#f5f3ff" />
        <StatCard label="Overdue Payments" value={stats?.overdueAmount ? `\u20B9${stats.overdueAmount}` : "-"} icon={<AlertCircle size={22} />} iconColor="#d95d4f" iconBg="#feefed" />
        <StatCard label="Total Amount Paid" value={stats?.paidAmount ? `\u20B9${stats.paidAmount}` : "-"} icon={<BarChart3 size={22} />} iconColor="#5b6472" iconBg="#f2f4f8" />
    </div>
);

const formatDate = (iso) => {
    if (!iso) return "-";
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
        return iso;
    }
};

const PaymentsDetailsPopUp = ({ show, close, details }) => {
    if (!details) return null;
    const txnId = details.ID || details.transactionId || details.gatewayPaymentId || details._id || "-";
    const amount = details.amount ?? details.amt ?? "-";
    const penalty = details.penalty || {};

    return (
        <Modal isOpen={show} onClose={close} title="Payment Receipt" size="sm">
            <p><strong>Title:</strong> {details.title || "-"}</p>
            <p><strong>Payment ID:</strong> {txnId}</p>
            <p><strong>Amount:</strong> {amount !== "-" ? `\u20B9${amount}` : "-"}</p>
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

const PaymentsHistory = ({ onStats, filters = {} }) => {
    const [payments, setPayments] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(false);
    const [paying, setPaying] = useState(false);

    const computeStats = (list) => {
        const overduePayments = list.filter((p) => (p.status || "").toLowerCase() === "overdue");
        const pendingPayments = list.filter((p) => (p.status || "").toLowerCase() === "pending");
        const completedPayments = list.filter((p) => (p.status || "").toLowerCase() === "completed");

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
        setError(null);
        setNotice(null);
        setSelected(payment);
        setShowPayModal(true);
    };

    const closePayModal = () => {
        setShowPayModal(false);
        setSelected(null);
    };

    const handlePayNow = async () => {
        if (!selected?._id) return;
        setPaying(true);
        setError(null);
        setNotice(null);
        try {
            const orderRes = await fetch(`/resident/payment/${selected._id}/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData?.message || "Failed to create payment order");

            const paymentResponse = await openRazorpayCheckout({
                key: orderData.data.key,
                orderId: orderData.data.orderId,
                amount: orderData.data.amount,
                currency: orderData.data.currency,
                name: "UrbanEase",
                description: selected?.title || "Resident Payment",
                notes: {
                    flow: "resident_payment",
                    paymentId: selected._id,
                },
            });

            const verifyRes = await fetch(`/resident/payment/${selected._id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    razorpayOrderId: paymentResponse.razorpay_order_id,
                    razorpayPaymentId: paymentResponse.razorpay_payment_id,
                    razorpaySignature: paymentResponse.razorpay_signature,
                }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData?.message || "Payment failed");

            const updated = payments.map((p) =>
                p._id === selected._id
                    ? {
                        ...p,
                        ...verifyData.payment,
                        status: "Completed",
                        paymentMethod: verifyData.payment?.paymentMethod || "Razorpay",
                        paymentDate: verifyData.payment?.paymentDate || new Date().toISOString(),
                    }
                    : p
            );

            setPayments(updated);
            if (onStats) onStats(computeStats(updated));
            setShowPayModal(false);
        } catch (err) {
            console.error("Payment update failed", err);
            if (err?.message === "Payment was cancelled.") {
                setNotice("Payment was cancelled.");
                setShowPayModal(false);
            } else {
                setError(err.message || "Payment update failed");
            }
        } finally {
            setPaying(false);
        }
    };

    const { search = "", status = "all", type = "all" } = filters;

    const filteredPayments = payments.filter((p) => {
        const s = search.trim().toLowerCase();
        if (s) {
            const matchesSearch = [
                p.title,
                p.paymentType,
                p.type,
                p.transactionId,
                p.gatewayPaymentId,
                p.ID,
                p._id,
                p.paymentMethod,
            ]
                .filter(Boolean)
                .some((val) => String(val).toLowerCase().includes(s));
            if (!matchesSearch) return false;
        }

        if (status && status !== "all") {
            const st = (p.status || "").toString().toLowerCase();
            if (st !== status.toLowerCase()) return false;
        }

        if (type && type !== "all") {
            const tp = (p.paymentType || p.type || "").toString().toLowerCase();
            if (tp !== type.toLowerCase()) return false;
        }

        return true;
    });

    return (
        <div className="p-0">
            {notice && !loading && (
                <div className="text-center text-muted p-3">{notice}</div>
            )}
            {loading ? (
                <div className="text-center p-4"><Loader /></div>
            ) : error ? (
                <div className="text-center text-danger p-4">{error}</div>
            ) : payments.length === 0 ? (
                <EmptyState icon={<DollarSign size={48} />} title="No payments found" sub="You do not have any payment records yet." />
            ) : (
                <div className="ue-entity-grid mt-3">
                    {filteredPayments.map((p, i) => {
                        const paymentId = p.gatewayPaymentId || p.ID || p.transactionId || p._id || "-";
                        const status = p.status || "Unknown";

                        return (
                        <EntityCard
                            key={p.ID || p.transactionId || p._id || i}
                            id={`#${String(paymentId).slice(-10)}`}
                            status={status}
                            statusClass={`status-badge status-${status.toLowerCase().replace(/\s+/g, "-")}`}
                            title={p.title || p.paymentType || "Payment"}
                            index={i}
                            details={[
                                { label: "Amount", value: `\u20B9${p.amount || 0}` },
                                { label: "Date", value: formatDate(p.paymentDate) },
                                { label: "Type", value: p.paymentType || p.type || "-" },
                                { label: "Method", value: p.paymentMethod || "Online" },
                                { label: "Payment ID", value: paymentId },
                            ]}
                            badges={null}
                            actions={[
                                {
                                    label: "Pay Now",
                                    onClick: () => openPayModal(p),
                                    variant: "primary",
                                    show: ["pending", "overdue"].includes((p.status || "").toLowerCase()),
                                },
                                {
                                    label: "View Receipt",
                                    onClick: () => {
                                        setSelected(p);
                                        setShowPopup(true);
                                    },
                                    variant: "secondary",
                                },
                            ]}
                        />
                    )})}
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
                        <button className="manager-ui-button manager-ui-button--secondary" onClick={closePayModal} disabled={paying}>Cancel</button>
                        <button className="manager-ui-button manager-ui-button--primary" onClick={handlePayNow} disabled={paying}>
                            {paying ? "Opening Razorpay..." : "Pay with Razorpay"}
                        </button>
                    </>
                }
            >
                <p className="mb-2"><strong>Title:</strong> {selected?.title || "Payment"}</p>
                <p className="mb-2"><strong>Amount:</strong> {"\u20B9"}{selected?.amount || 0}</p>
                <p className="mb-0 text-muted small">
                    You&apos;ll finish this payment in Razorpay and we&apos;ll mark it completed only after the server verifies the payment signature.
                </p>
            </Modal>
        </div>
    );
};

export const ResidentPayments = () => {
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [type, setType] = useState("all");

    return (
        <ManagerPageShell
            eyebrow="Payments"
            title="Track dues, payments, and receipts in one clean desk."
            description="Search payment history, complete pending dues, and open receipts without switching between disconnected card styles."
            chips={[
                `${stats?.totalTransactions ?? 0} transactions tracked`,
                `${status === "all" ? "All statuses" : status} in focus`,
            ]}
            className="resident-ui-page resident-payments-page"
        >
            <PaymentsOverview stats={stats} />

            <ManagerSection
                eyebrow="Transactions"
                title="Payments desk"
                description="Filter live payment records by title, status, and charge type."
            >
                <ManagerToolbar>
                    <ManagerToolbarGrow>
                        <SearchBar placeholder="Search by title or payment ID..." value={search} onChange={setSearch} />
                    </ManagerToolbarGrow>
                    <Dropdown
                        options={[
                            { label: "All Status", value: "all" },
                            { label: "Completed", value: "completed" },
                            { label: "Pending", value: "pending" },
                            { label: "Overdue", value: "overdue" },
                        ]}
                        selected={status}
                        onChange={setStatus}
                        width="180px"
                    />
                    <Dropdown
                        options={[
                            { label: "All Types", value: "all" },
                            { label: "Maintenance", value: "maintenance" },
                            { label: "Subscription", value: "subscription" },
                            { label: "Booking", value: "booking" },
                        ]}
                        selected={type}
                        onChange={setType}
                        width="180px"
                    />
                </ManagerToolbar>

                <PaymentsHistory onStats={setStats} filters={{ search, status, type }} />
            </ManagerSection>
        </ManagerPageShell>
    );
};
