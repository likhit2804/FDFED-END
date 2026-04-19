import React, { useEffect, useState } from "react";
import axios from "axios";

import { openRazorpayCheckout } from "../../services/razorpay";
import { Loader } from "../Loader";
import { PasswordChangeForm, ProfileHeader } from "../shared";
import { getInitials } from "../shared/nonAdmin/profileUtils";
import { PlanChangeForm } from "./Profile/PlanChangeForm";
import { ProfileEditSection } from "./Profile/ProfileEditSection";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerSection,
} from "./ui";

export const ManagerProfile = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    address: "",
    department: "Community Manager",
    roleTitle: "Community Manager",
    communityName: "",
    workEmail: "",
  });
  const [isPassword, setIsPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [plans, setPlans] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [planLoading, setPlanLoading] = useState(false);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    axios.get("/manager/profile/api")
      .then((response) => response.data)
      .then((data) => {
        if (data.success) {
          setFormData({
            name: data.manager?.name || "",
            email: data.manager?.email || "",
            phone: data.manager?.contact || "",
            location: data.manager?.location || "",
            address: data.manager?.address || "",
            department: "Community Manager",
            roleTitle: "Community Manager",
            communityName: data.community?.name || "",
            workEmail: data.manager?.email || "",
          });
        } else {
          setError(data.message || "Failed to load profile");
        }
      })
      .catch((error) => setError(error.response?.data?.message || "Failed to load profile data"))
      .finally(() => setLoading(false));

    axios.get("/manager/subscription-status")
      .then((response) => response.data)
      .then((sub) => {
        if (sub.success && sub.community) {
          setSubscriptionInfo(sub.community);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleSubmit = () => {
    const form = new FormData();
    form.append("name", formData.name);
    form.append("email", formData.email);
    form.append("contact", formData.phone);
    form.append("location", formData.location);
    form.append("address", formData.address);

    axios.post("/manager/profile", form)
      .then((response) => response.data)
      .then((data) => {
        if (!data.success) {
          setError(data.message || "Failed to update profile");
        }
      })
      .catch((error) => setError(error.response?.data?.message || "Failed to update profile"));
  };

  const handlePasswordSubmit = async ({ cp, np, cnp }) => {
    setPasswordMessage("");
    if (np !== cnp) {
      setPasswordMessage("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("/manager/profile/changePassword", { cp, np, cnp });
      const data = response.data;
      if (data.success) {
        setPasswordMessage("Password changed successfully!");
        setTimeout(() => {
          setIsPassword(false);
          setPasswordMessage("");
        }, 1500);
      } else {
        setPasswordMessage(data.message || "Failed to change password");
      }
    } catch (requestError) {
      setPasswordMessage(requestError.response?.data?.message || "Failed to change password");
    }
  };

  const openPlanForm = () => {
    setShowPlanForm(true);
    setPlanError("");
    if (plans) return;

    setPlanLoading(true);
    axios.get("/manager/subscription-plans")
      .then((response) => response.data)
      .then((data) => {
        if (data.success && data.plans) {
          setPlans(data.plans);
        } else {
          setPlanError(data.message || "Failed to load plans");
        }
      })
      .catch((error) => setPlanError(error.response?.data?.message || "Failed to load plans"))
      .finally(() => setPlanLoading(false));
  };

  const submitPlanChange = (event) => {
    event.preventDefault();
    setPlanError("");

    if (!subscriptionInfo?._id) {
      setPlanError("Community information not available");
      return;
    }

    if (!plans?.[selectedPlan]) {
      setPlanError("Please select a valid plan");
      return;
    }

    const plan = plans[selectedPlan];
    setPlanSubmitting(true);

    axios.post("/manager/subscription-payment/order", { subscriptionPlan: selectedPlan })
      .then((response) => response.data)
      .then(async (orderData) => {
        if (!orderData.success) {
          throw new Error(orderData.message || "Failed to create payment order");
        }

        const paymentResponse = await openRazorpayCheckout({
          key: orderData.data.key,
          orderId: orderData.data.orderId,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: "UrbanEase",
          description: `${plan.name} community subscription`,
          prefill: {
            name: formData.name || "",
            email: formData.email || "",
            contact: formData.phone || "",
          },
          notes: {
            flow: "subscription",
            plan: selectedPlan,
          },
        });

        return axios.post("/manager/subscription-payment", {
          subscriptionPlan: selectedPlan,
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
        });
      })
      .then((response) => response.data)
      .then((data) => {
        if (data.success) {
          setSubscriptionInfo((previous) =>
            previous
              ? {
                  ...previous,
                  subscriptionPlan: selectedPlan,
                  subscriptionStatus: data.subscriptionStatus || previous.subscriptionStatus,
                  planEndDate: data.planEndDate || previous.planEndDate,
                }
              : previous
          );
          setShowPlanForm(false);
        } else {
          setPlanError(data.message || "Failed to update plan");
        }
      })
      .catch((requestError) => setPlanError(requestError.response?.data?.message || requestError.message || "Failed to update plan"))
      .finally(() => setPlanSubmitting(false));
  };

  const initials = getInitials(formData.name);

  if (loading) {
    return (
      <ManagerPageShell
        eyebrow="Profile"
        title="Preparing manager profile."
        description="Loading manager identity, community, and subscription details."
      >
        <div className="manager-ui-empty">
          <Loader />
        </div>
      </ManagerPageShell>
    );
  }

  if (error && !isPassword) {
    return (
      <ManagerPageShell eyebrow="Profile" title="Manager profile" description="The profile could not be loaded.">
        <div className="manager-ui-empty text-danger">{error}</div>
      </ManagerPageShell>
    );
  }

  return (
    <ManagerPageShell
      eyebrow="Profile"
      title="Keep manager identity, subscription, and community setup aligned."
      description="This page now follows the same manager shell as payments, issues, and users, while keeping profile actions grouped into consistent operation panels."
    >
      <div className="manager-profile-stack">
        <div className="manager-ui-two-column manager-profile-two-column">
          <ManagerSection eyebrow="Identity" title="Manager account" description="Review profile details and community assignment.">
            <ProfileHeader
              initials={initials}
              name={formData.name}
              role="Community Manager"
              subtitle={formData.location}
              onImageChange={(file) => {
                const reader = new FileReader();
                reader.onload = () => setFormData((previous) => ({ ...previous, image: reader.result }));
                reader.readAsDataURL(file);
              }}
              actionLabel={isPassword ? "Edit Profile" : "Change Password"}
              onAction={() => setIsPassword((previous) => !previous)}
            />
          </ManagerSection>

          <ManagerSection
            eyebrow="Community Controls"
            title="Subscription"
            description="Review and manage community subscription details."
          >
            <ManagerRecordCard
              className="manager-profile-subscription-card"
              title="Subscription"
              subtitle={subscriptionInfo?.planName || subscriptionInfo?.subscriptionPlan || "Not subscribed"}
              status={<span className="manager-ui-status-pill">{subscriptionInfo?.subscriptionStatus || "pending"}</span>}
              meta={[
                {
                  label: "Price",
                  value: subscriptionInfo?.planPrice
                    ? `Rs ${subscriptionInfo.planPrice}/${subscriptionInfo.planDuration || "monthly"}`
                    : "-",
                },
                { label: "Resident cap", value: subscriptionInfo?.planMaxResidents ?? "Unlimited" },
                { label: "Current residents", value: subscriptionInfo?.totalMembers ?? 0 },
              ]}
              actions={<ManagerActionButton variant="primary" onClick={openPlanForm}>Update / Next Plan</ManagerActionButton>}
            />
          </ManagerSection>
        </div>

        {showPlanForm ? (
          <PlanChangeForm
            plans={plans}
            planLoading={planLoading}
            planError={planError}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            planSubmitting={planSubmitting}
            onSubmit={submitPlanChange}
            onCancel={() => setShowPlanForm(false)}
          />
        ) : null}

        <ManagerSection
          eyebrow={isPassword ? "Security" : "Profile Form"}
          title={isPassword ? "Change password" : "Edit manager profile"}
          description={
            isPassword
              ? "Update access credentials for this manager account."
              : "Edit the community manager details used across the platform."
          }
        >
          {isPassword ? (
            <PasswordChangeForm onSubmit={handlePasswordSubmit} message={passwordMessage} />
          ) : (
            <ProfileEditSection formData={formData} onChange={handleChange} onSave={handleSubmit} />
          )}
        </ManagerSection>
      </div>
    </ManagerPageShell>
  );
};
