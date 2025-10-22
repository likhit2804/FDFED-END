import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import "../../assets/css/Resident/PaymentPopUp.css";
import { ProceedPayment, optimisticProceedPayment } from "../../Slices/CommonSpaceSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const PaymentPopUp = ({ setonClose, paymentDetails  }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      paymentId: paymentDetails?._id || "",
      bill: paymentDetails?.belongTo || "",
      amount: paymentDetails?.amount || "",
      paymentMethod: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (paymentDetails && Object.keys(paymentDetails).length > 0) {
      reset({
        paymentId: paymentDetails._id || "",
        bill: paymentDetails.belongTo || "",
        amount: paymentDetails.amount || "",
        paymentMethod: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
      });
    }
  }, [paymentDetails, reset]);

  const onSubmit = async (data) => {
    try {
        console.log(data);
        
      setIsSubmitting(true);
      dispatch(optimisticProceedPayment(data.paymentId));
      toast.success("Payment successful!");
      localStorage.removeItem(`booking_timer_${data.paymentId}`);
      setonClose(false);
      await dispatch(ProceedPayment({ paymentData: data, bookingId: data.paymentId })).unwrap();
    } catch (error) {
      toast.error(error.message || "Payment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="paymentFormPopup" className="popup">
      <div className="popup-content">
        <span className="close-btn" style={{ zIndex: "20" }} onClick={() => setonClose(false)}>
          &times;
        </span>
        <h3 className="form-title">Make Payment</h3>
        <form id="paymentForm" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("paymentId")} />

          <div className="form-group">
            <label htmlFor="bill">Bill:</label>
            <input type="text" id="bill" {...register("bill")} readOnly />
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method:</label>
            <select id="paymentMethod" {...register("paymentMethod", { required: true })}>
              <option value="">Select payment method</option>
              <option value="Credit">Credit Card (+2%)</option>
              <option value="Debit">Debit Card</option>
              <option value="UPI">UPI</option>
              <option value="Netbanking">Net Banking</option>
            </select>
          </div>

          {(paymentMethod === "Credit" || paymentMethod === "Debit") && (
            <div id="cardFields">
              <div className="form-group">
                <label htmlFor="cardNumber">Card Number:</label>
                <input
                  type="text"
                  id="cardNumber"
                  placeholder="XXXX XXXX XXXX XXXX"
                  maxLength="19"
                  {...register("cardNumber", {
                    required: true,
                    pattern: /^[0-9\s]{16,19}$/,
                  })}
                />
              </div>

              <div className="row">
                <div className="col form-group">
                  <label htmlFor="expiryDate">Expiry Date:</label>
                  <input
                    type="text"
                    id="expiryDate"
                    placeholder="MM/YY"
                    maxLength="5"
                    {...register("expiryDate", {
                      required: true,
                      pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
                    })}
                  />
                </div>
                <div className="col form-group">
                  <label htmlFor="cvv">CVV:</label>
                  <input
                    type="password"
                    id="cvv"
                    placeholder="XXX"
                    maxLength="3"
                    {...register("cvv", { required: true, pattern: /^[0-9]{3}$/ })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input type="text" id="amount" {...register("amount")} readOnly />
          </div>

          <p className="text-success mb-1">
            <i className="bi bi-check-circle-fill"></i> Secure payment processing
          </p>

          <button type="submit" className="btn btn-success" disabled={isSubmitting}>
            <i className="bi bi-credit-card me-2"></i> {isSubmitting ? "Processing..." : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentPopUp;
