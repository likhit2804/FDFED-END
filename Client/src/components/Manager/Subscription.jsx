import React, { useEffect, useState } from "react";
import { BadgeIndianRupee, Building2, CheckCircle2, Crown, Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import { setUser } from "../../slices/authSlice";
import { openRazorpayCheckout } from "../../services/razorpay";
import { Loader } from "../Loader";
import { StatCard } from "../shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
} from "./ui";

export const Subscription = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("standard");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, plansRes] = await Promise.all([
          axios.get("/manager/subscription-status"),
          axios.get("/manager/subscription-plans"),
        ]);

        if (statusRes.data?.community) setStatus(statusRes.data.community);
        if (plansRes.data?.plans) setPlans(plansRes.data.plans);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load subscription info");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const effectiveStatus = status?.subscriptionStatus || user?.subscriptionStatus;
    if (effectiveStatus === "active") {
      navigate("/manager/dashboard", { replace: true });
    }
  }, [navigate, status, user]);

  const handlePay = async () => {
    if (!plans) return;
    const planKey = selectedPlan || "standard";
    const plan = plans[planKey];
    if (!plan) return;

    try {
      setPaying(true);

      const orderRes = await axios.post("/manager/subscription-payment/order", { subscriptionPlan: planKey });

      const paymentResponse = await openRazorpayCheckout({
        key: orderRes.data.data.key,
        orderId: orderRes.data.data.orderId,
        amount: orderRes.data.data.amount,
        currency: orderRes.data.data.currency,
        name: "UrbanEase",
        description: `${plan.name} community subscription`,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.contact || "",
        },
        notes: {
          flow: "subscription",
          plan: planKey,
        },
      });

      const response = await axios.post("/manager/subscription-payment", {
        subscriptionPlan: planKey,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      toast.success("Subscription activated successfully");
      dispatch(
        setUser({
          ...user,
          subscriptionStatus: response.data.subscriptionStatus || "active",
        })
      );
      navigate("/manager/dashboard", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to process subscription");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <ManagerPageShell
        eyebrow="Subscription"
        title="Preparing your community plan options."
        description="Fetching your current status and available plans."
      >
        <div className="manager-ui-empty">
          <Loader />
        </div>
      </ManagerPageShell>
    );
  }

  const currentStatus = status?.subscriptionStatus || user?.subscriptionStatus || "pending";
  const totalResidents = status?.totalMembers ?? 0;

  return (
    <ManagerPageShell
      eyebrow="Subscription"
      title="Activate the right UrbanEase plan for your community."
      description="Choose the plan that matches resident volume, then complete the Razorpay payment flow without leaving the manager workspace."
      chips={[`Status: ${currentStatus}`, `${totalResidents} residents in the current setup`]}
      actions={
        <ManagerActionButton variant="primary" onClick={handlePay} disabled={paying || !plans}>
          {paying ? "Opening Razorpay..." : "Pay with Razorpay"}
        </ManagerActionButton>
      }
    >
      <div className="ue-stat-grid">
        <StatCard label="Current Plan" value={status?.subscriptionPlan || "Not subscribed"} icon={<Crown size={22} />} iconColor="var(--brand-500)" iconBg="var(--info-soft)" />
        <StatCard label="Community Status" value={currentStatus} icon={<CheckCircle2 size={22} />} iconColor="var(--info-600)" iconBg="var(--surface-2)" />
        <StatCard label="Residents" value={totalResidents} icon={<Users size={22} />} iconColor="var(--text-subtle)" iconBg="var(--surface-2)" />
        <StatCard label="Billing" value={status?.planPrice ? `₹${status.planPrice}` : "Pending"} icon={<BadgeIndianRupee size={22} />} iconColor="var(--danger-500)" iconBg="var(--danger-soft)" />
      </div>

      <ManagerSection
        eyebrow="Plans"
        title="Choose a community subscription"
        description="Select the plan that fits your current resident count and the level of operations support you need."
      >
        {plans ? (
          <ManagerRecordGrid>
            {Object.entries(plans).map(([key, plan]) => {
              const maxResidents = plan.maxResidents;
              const blocked =
                maxResidents &&
                typeof maxResidents === "number" &&
                typeof totalResidents === "number" &&
                totalResidents > maxResidents;

              return (
                <ManagerRecordCard
                  key={key}
                  className={selectedPlan === key ? "manager-ui-record-card--selected" : ""}
                  title={plan.name}
                  subtitle={`${plan.duration} billing cycle`}
                  status={
                    <span className="manager-ui-status-pill">
                      {selectedPlan === key ? "Selected" : "Available"}
                    </span>
                  }
                  meta={[
                    { label: "Price", value: `₹${plan.price}` },
                    { label: "Resident cap", value: maxResidents || "Unlimited" },
                    { label: "Modules", value: plan.features?.length || 0 },
                  ]}
                  footer={
                    <div className="manager-ui-stack">
                      {plan.features?.map((feature) => (
                        <p key={feature} className="manager-ui-note">
                          {feature}
                        </p>
                      ))}
                      {blocked ? (
                        <p className="manager-ui-note text-danger">
                          This plan supports up to {maxResidents} residents, but the community currently has {totalResidents}.
                        </p>
                      ) : null}
                    </div>
                  }
                  actions={
                    <ManagerActionButton
                      variant={selectedPlan === key ? "primary" : "secondary"}
                      disabled={blocked}
                      onClick={() => {
                        if (blocked) return;
                        setSelectedPlan(key);
                      }}
                    >
                      {selectedPlan === key ? "Plan selected" : "Select plan"}
                    </ManagerActionButton>
                  }
                />
              );
            })}
          </ManagerRecordGrid>
        ) : (
          <div className="manager-ui-empty">No plans are available right now.</div>
        )}
      </ManagerSection>

      <ManagerSection eyebrow="Community" title="Current subscription snapshot" description="Use this summary to confirm the present plan before collecting the next payment.">
        <div className="manager-ui-two-column">
          <div className="manager-ui-split-metrics">
            <div className="manager-ui-metric">
              <span>Plan</span>
              <strong>{status?.subscriptionPlan || "Not subscribed"}</strong>
            </div>
            <div className="manager-ui-metric">
              <span>Status</span>
              <strong>{currentStatus}</strong>
            </div>
            <div className="manager-ui-metric">
              <span>Residents</span>
              <strong>{totalResidents}</strong>
            </div>
            <div className="manager-ui-metric">
              <span>Community</span>
              <strong>{status?.name || "UrbanEase community"}</strong>
            </div>
          </div>

          <ManagerRecordCard
            title="Payment handoff"
            subtitle="External API integration"
            status={<span className="manager-ui-status-pill">Razorpay</span>}
            meta={[
              { label: "Gateway", value: "Razorpay order + verification" },
              { label: "Flow", value: "Manager subscription payment" },
              { label: "Target", value: "Activate community access" },
            ]}
            footer={<p className="manager-ui-note">Once the order is created, the checkout opens in-place and returns signed payment details back to the manager service.</p>}
          />
        </div>
      </ManagerSection>
    </ManagerPageShell>
  );
};

export default Subscription;

