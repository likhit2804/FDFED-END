import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

import { ConfirmBooking, optimisticAddBooking } from "../../slices/CommonSpaceSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Modal, Input, Select } from "../shared";


const PAYMENT_POLICY_CONTENT = `
1. All payments are processed through a secure third-party gateway.
3. By submitting payment, you authorize the charge to your selected method.
4. Payment status update may take up to 30 minutes to reflect in the app.
`;

const CANCELLATION_POLICY_CONTENT = `
1. Slot-Based Amenities: Refunds are based on cancellation time and credited to your Flat Advance Account, not your bank.
   - 48+ Hours before Start: 100% Refund.
   - 24–48 Hours before Start: 75% Refund (25% Penalty).
   - 4–24 Hours before Start: 50% Refund (50% Penalty).
   - Less than 4 Hours before Start: 0% Refund (100% Penalty).
2. Subscription-Based Amenities (Gym/Pool): Subscriptions are non-refundable after activation. Cancellation only stops auto-renewal.
3. Security deposits are 100% refundable upon cancellation/completion, provided no damage is incurred.
`;

const PaymentPopUp = ({ setonClose, paymentDetails, newBooking, clearBookingFormState }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      bill: paymentDetails?.belongTo || "",
      amount: paymentDetails?.amount || "",
      paymentMethod: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      agree: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [next, setNext] = useState(false);
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (paymentDetails && Object.keys(paymentDetails).length > 0) {
      reset({
        bill: paymentDetails.belongTo || "",
        amount: paymentDetails.amount || "",
        paymentMethod: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        agree: false,
      });
    }
  }, [paymentDetails, reset]);

  const closepopUp = () => {
    if (window.confirm("Do you want to abort your booking?")) {
      setonClose(false);
      reset();
      clearBookingFormState();
    }
  };

  const onSubmit = async (data) => {
    if (!data.agree) {
      toast.error("Please agree to the payment and cancellation policy.");
      return;
    }

    try {
      setIsSubmitting(true);

      const requestId = new Date().getTime();
      dispatch(optimisticAddBooking({ bookingData: newBooking, requestId }));
      await dispatch(ConfirmBooking({ data, newBooking, requestId })).unwrap();
      toast.success("Booking submitted successfully.");

      setonClose(false);
      clearBookingFormState();
    } catch (error) {
      const message =
        error?.error?.message ||
        error?.message ||
        error?.error ||
        "Payment failed.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={closepopUp}
      title="Make Payment"
      size="md"
      footer={
        <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success" disabled={isSubmitting}>
          <i className="bi bi-credit-card me-2"></i>{isSubmitting ? "Processing..." : "Pay Now"}
        </button>
      }
    >
      {next ? (
        <div className="px-3 py-2">
          <div className="fw-4"><i onClick={() => setNext(false)} className="bi bi-arrow-left" style={{ cursor: "pointer" }}></i></div>
          <div className="policy-box px-4 mt-2">
            <div className="policy-content">
              <h3 className="m-0">Payment Policy</h3>
              <pre className="policy-text">{PAYMENT_POLICY_CONTENT}</pre>
              <h3 className="m-0">Cancellation Policy</h3>
              <pre className="policy-text">{CANCELLATION_POLICY_CONTENT}</pre>
            </div>
          </div>
          <div className="form-group-checkbox mt-3">
            <input className="m-0" type="checkbox" id="termsAccepted" {...register("agree", { required: true })} />
            <label htmlFor="termsAccepted">I have read and agree to the Payment &amp; Cancellation Policy.</label>
            {errors.agree && <p className="error">You must agree before making payment.</p>}
          </div>
        </div>
      ) : (
        <>
          <Input label="Bill" id="bill" readOnly {...register("bill")} />
          <Select
            label="Payment Method"
            id="paymentMethod"
            placeholder="Select payment method"
            options={[
              { label: 'Credit Card (+2%)', value: 'Credit' },
              { label: 'Debit Card', value: 'Debit' },
              { label: 'UPI', value: 'UPI' },
              { label: 'Net Banking', value: 'Netbanking' },
            ]}
            error={errors.paymentMethod ? 'Select a payment method' : ''}
            {...register("paymentMethod", { required: true })}
          />
          {(paymentMethod === "Credit" || paymentMethod === "Debit") && (
            <div id="cardFields">
              <Input label="Card Number" id="cardNumber" placeholder="XXXX XXXX XXXX XXXX" maxLength={19} error={errors.cardNumber ? 'Enter a valid card number' : ''} {...register("cardNumber", { required: true, pattern: /^[0-9\s]{16,19}$/ })} />
              <div className="row">
                <div className="col">
                  <Input label="Expiry Date" id="expiryDate" placeholder="MM/YY" maxLength={5} error={errors.expiryDate ? 'Enter valid expiry (MM/YY)' : ''} {...register("expiryDate", { required: true, pattern: /^(0[1-9]|1[0-2])\/\d{2}$/ })} />
                </div>
                <div className="col">
                  <Input type="password" label="CVV" id="cvv" placeholder="XXX" maxLength={3} error={errors.cvv ? 'Enter valid CVV' : ''} {...register("cvv", { required: true, pattern: /^[0-9]{3}$/ })} />
                </div>
              </div>
            </div>
          )}
          <Input label="Amount" id="amount" readOnly {...register("amount")} />
          <div className="form-group-checkbox mb-2">
            <input className="m-0" type="checkbox" id="termsAccepted" onClick={() => setNext(true)} />
            <label htmlFor="termsAccepted">I have read and agree to the Payment &amp; Cancellation Policy.</label>
          </div>
        </>
      )}
    </Modal>
  );
};

export default PaymentPopUp;

