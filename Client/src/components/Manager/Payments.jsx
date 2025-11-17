import React, { useState } from "react";
import {
  DollarSign,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Manager/Payments.css";

const PaymentsOverview = () => {
  const cards = [
    { icon: <DollarSign size={24} className="text-success" />, title: "Total Collected", amount: "₹4,58,500", color: "text-success" },
    { icon: <Clock size={24} className="text-warning" />, title: "Pending Payments", amount: "₹1,24,000", color: "text-warning" },
    { icon: <AlertCircle size={24} className="text-danger" />, title: "Overdue Payments", amount: "₹45,800", color: "text-danger" },
    { icon: <BarChart3 size={24} className="text-primary" />, title: "Total Revenue", amount: "₹54,23,450", color: "text-primary" },
  ];

  return (
    <div className="p-0 py-4">
      <div className="row g-4">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            className="col-md-6 col-lg-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div className="payment-card shadow-sm p-3 rounded-4 bg-white">
              <div className="d-flex justify-content-between align-items-start">
                <div className="icon-box">{c.icon}</div>
              </div>
              <h6 className="mt-3 text-secondary">{c.title}</h6>
              <h4 className={`fw-semibold mt-1 ${c.color}`}>{c.amount}</h4>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const PaymentsDetailsPopUp = ({ showPopup, setShowPopup, selectedPayment }) => {
  return (
    <AnimatePresence>
      {showPopup && selectedPayment && (
        <motion.div
          className="popup"
          onClick={() => setShowPopup(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="popup-content shadow-lg bg-white rounded-4 p-4"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-semibold mb-0">Payment Details</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowPopup(false)}
              >
                ✕
              </button>
            </div>
            <hr />
            <div>
              <p className="m-0"><strong>Resident Name:</strong> {selectedPayment.name}</p>
              <p className="m-0"><strong>Flat Number:</strong> {selectedPayment.flat}</p>
              <p className="m-0"><strong>Payment Type:</strong> {selectedPayment.type}</p>
              <p className="m-0"><strong>Amount:</strong> {selectedPayment.amount}</p>
              <p className="m-0"><strong>Payment Date:</strong> {selectedPayment.date}</p>
              <p className="m-0"><strong>Due Date:</strong> {selectedPayment.due}</p>
              <p className="m-0"><strong>Mode:</strong> {selectedPayment.mode}</p>
              <p className="m-0"><strong>Transaction ID:</strong> {selectedPayment.txn}</p>
              <p className="m-0"><strong>Status:</strong> <span className="badge bg-success">{selectedPayment.status}</span></p>
            </div>
            <div className="text-end mt-3">
              <button className="btn btn-dark" onClick={() => setShowPopup(false)}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PaymentsHistory = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState({});
  const payments = [
    { name: "Rajesh Kumar", flat: "A-301", type: "Maintenance", amount: "₹3,500", date: "2025-11-01", due: "2025-11-05", mode: "UPI", txn: "TXN123456789", status: "Paid" },
    { name: "Priya Sharma", flat: "B-205", type: "Subscription", amount: "₹500", date: "2025-11-02", due: "2025-11-05", mode: "Card", txn: "TXN987654321", status: "Paid" },
    { name: "Vikram Singh", flat: "D-101", type: "Subscription", amount: "₹800", date: "2025-11-03", due: "2025-11-05", mode: "Bank Transfer", txn: "TXN456789123", status: "Paid" },
    { name: "Arjun Nair", flat: "C-207", type: "Booking", amount: "₹2,000", date: "2025-11-04", due: "2025-11-05", mode: "UPI", txn: "TXN789456123", status: "Paid" },
  ];

  return (
    <div className="p-0">
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          className="form-control"
          placeholder="Search by resident name or flat number..."
          style={{ maxWidth: "65%" }}
        />
        <select className="form-select" style={{ maxWidth: "120px" }}>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
        <select className="form-select" style={{ maxWidth: "120px" }}>
          <option>All Types</option>
          <option>Maintenance</option>
          <option>Subscription</option>
          <option>Booking</option>
        </select>
        <button className="filter-btn">Search</button>
      </div>

      <motion.div
        className="row g-4 payments-grid"
        style={{ overflowY: "auto", maxHeight: "80vh", paddingRight: "10px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {payments.map((p, i) => (
          <motion.div
            className="col-md-6 col-lg-4 payment-details-card"
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="card p-3 shadow-sm border-0 rounded-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="fw-semibold mb-0">{p.name}</h6>
                  <small className="text-muted">{p.flat}</small>
                </div>
                <span className="badge bg-success">{p.status}</span>
              </div>
              <hr />
              <div className="card-body">
                <p className="m-0"><strong>Payment Type:</strong> {p.type}</p>
                <p className="m-0"><strong>Amount:</strong> {p.amount}</p>
                <p className="m-0"><strong>Payment Date:</strong> {p.date}</p>
                <p className="m-0"><strong>Due Date:</strong> {p.due}</p>
                <p className="m-0"><strong>Mode:</strong> {p.mode}</p>
                <p className="m-0"><strong>Transaction ID:</strong> {p.txn}</p>
              </div>
              <button
                className="reciept-btn rounded-2 w-100 mt-2"
                onClick={() => { setSelectedPayment(p); setShowPopup(true); }}
              >
                <i className="bi bi-receipt"></i> View Receipt
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <PaymentsDetailsPopUp
        showPopup={showPopup}
        setShowPopup={setShowPopup}
        selectedPayment={selectedPayment}
      />
    </div>
  );
};

export const Payments = () => (
  <div>
    <PaymentsOverview />
    <PaymentsHistory />
  </div>
);

