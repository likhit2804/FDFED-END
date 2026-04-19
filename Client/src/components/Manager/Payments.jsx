import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Clock, DollarSign, ReceiptText } from "lucide-react";
import axios from "axios";

import { Loader } from "../Loader.jsx";
import { Dropdown, EmptyState, GraphBar, GraphPie, Modal, SearchBar, StatCard, StatusBadge } from "../shared";
import { UE_CHART_COLORS, UE_CHART_PALETTE } from "../shared/chartPalette";
import {
  buildPaymentStatusAmountData,
  buildPaymentTypeSplitData,
  filterPaymentsByFilters,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
} from "../shared/nonAdmin/paymentInsights";
import {
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar,
  ManagerToolbarGrow,
} from "./ui";

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") return "-";
  return `₹${amount}`;
};

const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch (error) {
    return iso;
  }
};

const PaymentsOverview = ({ stats }) => (
  <div className="ue-stat-grid">
    <StatCard
      label="Total Transactions"
      value={stats?.totalTransactions ?? "-"}
      icon={<DollarSign size={22} />}
      iconColor="var(--brand-500)"
      iconBg="var(--info-soft)"
    />
    <StatCard
      label="Pending Payments"
      value={stats?.pendingAmount ? `₹${stats.pendingAmount}` : "-"}
      icon={<Clock size={22} />}
      iconColor="var(--info-600)"
      iconBg="var(--surface-2)"
    />
    <StatCard
      label="Overdue Payments"
      value={stats?.overdueAmount ? `₹${stats.overdueAmount}` : "-"}
      icon={<AlertCircle size={22} />}
      iconColor="var(--danger-500)"
      iconBg="var(--danger-soft)"
    />
    <StatCard
      label="Total Revenue"
      value={stats?.paidAmount ? `₹${stats.paidAmount}` : "-"}
      icon={<BarChart3 size={22} />}
      iconColor="var(--text-subtle)"
      iconBg="var(--surface-2)"
    />
  </div>
);

const PaymentsDetailsPopUp = ({ show, close, details }) => {
  if (!details) return null;
  const transactionId = details.ID || details.transactionId || details._id || "-";
  const penalty = details.penalty || {};

  return (
    <Modal isOpen={show} onClose={close} title="Payment Details" size="sm">
      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-label">Title</span>
          <span className="detail-value">{details.title || "-"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Payment ID</span>
          <span className="detail-value">{transactionId}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Belongs To</span>
          <span className="detail-value">{details.belongTo || "-"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Amount</span>
          <span className="detail-value">{formatCurrency(details.amount ?? details.amt)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Payment Date</span>
          <span className="detail-value">{formatDate(details.paymentDate)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Deadline</span>
          <span className="detail-value">{formatDate(details.paymentDeadline)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Method</span>
          <span className="detail-value">{details.paymentMethod || "-"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Penalty</span>
          <span className="detail-value">
            {penalty.p ?? 0}
            {penalty.changedOn ? ` (changed ${formatDate(penalty.changedOn)})` : ""}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Receiver</span>
          <span className="detail-value">{details.receiver?.email || details.reciever?.email || "-"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Sender</span>
          <span className="detail-value">{details.sender?.email || details.from?.email || "-"}</span>
        </div>
        <div className="detail-item full">
          <span className="detail-label">Remarks</span>
          <span className="detail-value">{details.remarks || "-"}</span>
        </div>
      </div>
    </Modal>
  );
};

const PaymentsHistory = ({ onStats, onRecords, filters = {} }) => {
  const [payments, setPayments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get("/manager/api/payments");
        const data = response.data;
        if (!mounted) return;

        const records = data.payments || [];
        setPayments(records);
        onStats?.(data.stats || {});
        onRecords?.(records);
      } catch (requestError) {
        if (!mounted) return;
        setError(requestError.response?.data?.message || "Failed to load payments.");
        setPayments([]);
        onRecords?.([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPayments();
    return () => {
      mounted = false;
    };
  }, [onStats]);

  const { search = "", status = "all", type = "all" } = filters;
  const normalizedSearch = search.trim().toLowerCase();

  const filteredPayments = filterPaymentsByFilters(
    payments,
    { search: normalizedSearch, status, type },
    {
      searchFields: [
        "name",
        "flat",
        "email",
        "transactionId",
        "txn",
        "planName",
        "type",
        "paymentType",
        "ID",
        "_id",
        "receiver",
        "reciever",
        "sender",
        "title",
      ],
    },
  );

  if (loading) {
    return (
      <div className="manager-ui-empty">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="manager-ui-empty text-danger">{error}</div>;
  }

  if (payments.length === 0 || filteredPayments.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText size={48} />}
        title="No payments found"
        sub="No payment records match the current filters."
      />
    );
  }

  return (
    <>
      <ManagerRecordGrid>
        {filteredPayments.map((payment) => (
          <ManagerRecordCard
            key={payment.ID || payment.transactionId || payment._id}
            title={payment.title || "Community charge"}
            subtitle={payment.sender?.email || payment.receiver?.email || "Resident record"}
            status={<StatusBadge status={payment.status || "Pending"} />}
            meta={[
              { label: "Amount", value: formatCurrency(payment.amount) },
              { label: "Date", value: formatDate(payment.paymentDate) },
              { label: "Method", value: payment.paymentMethod || "-" },
              { label: "Payment ID", value: payment.ID || payment.transactionId || payment._id || "-" },
            ]}
            actions={
              <button
                type="button"
                className="manager-ui-button manager-ui-button--secondary"
                onClick={() => {
                  setSelected(payment);
                  setShowPopup(true);
                }}
              >
                View receipt
              </button>
            }
          />
        ))}
      </ManagerRecordGrid>

      <PaymentsDetailsPopUp show={showPopup} close={() => setShowPopup(false)} details={selected} />
    </>
  );
};

export const Payments = () => {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const statusAmountData = useMemo(() => buildPaymentStatusAmountData(records), [records]);
  const typeSplitData = useMemo(() => buildPaymentTypeSplitData(records), [records]);

  return (
    <ManagerPageShell
      eyebrow="Payments"
      title="Keep collections, dues, and receipts in one operational view."
      description="Track completed transactions, scan overdue records, and open receipt details without jumping between disconnected cards."
      chips={[
        `${stats?.totalTransactions ?? 0} transactions tracked`,
        `${status === "all" ? "All statuses" : status} in focus`,
      ]}
    >
      <PaymentsOverview stats={stats} />

      <ManagerSection
        eyebrow="Insights"
        title="Collection intelligence"
        description="Compare status-wise amounts, monthly flow, and payment-type distribution."
      >
        <div className="manager-ui-two-column">
          <GraphBar
            title="Amount by status"
            subtitle="Total value grouped by payment status"
            xKey="name"
            data={statusAmountData}
            bars={[{ key: "amount", label: "Amount", color: UE_CHART_COLORS.emerald }]}
          />
          <GraphPie
            title="Payment type mix"
            subtitle="Count by charge category"
            data={typeSplitData}
            colors={[...UE_CHART_PALETTE, UE_CHART_COLORS.danger]}
          />
        </div>
      </ManagerSection>

      <ManagerSection
        eyebrow="Transactions"
        title="Collections desk"
        description="Filter the live payment history by resident, status, and charge type."
      >
        <ManagerToolbar>
          <ManagerToolbarGrow>
            <SearchBar placeholder="Search by resident, title, or transaction ID..." value={search} onChange={setSearch} />
          </ManagerToolbarGrow>
          <Dropdown options={PAYMENT_STATUS_OPTIONS} selected={status} onChange={setStatus} width="180px" />
          <Dropdown options={PAYMENT_TYPE_OPTIONS} selected={type} onChange={setType} width="180px" />
        </ManagerToolbar>

        <PaymentsHistory onStats={setStats} onRecords={setRecords} filters={{ search, status, type }} />
      </ManagerSection>
    </ManagerPageShell>
  );
};

