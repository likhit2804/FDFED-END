import React from "react";
import { Loader } from "../../Loader";

/**
 * Subscription plan change form — shown inline on the profile page.
 */
export const PlanChangeForm = ({
    plans,
    planLoading,
    planError,
    selectedPlan,
    setSelectedPlan,
    planSubmitting,
    onSubmit,
    onCancel,
}) => (
    <div className="card border-1 shadow-sm rounded-4 p-3 mt-3">
        <h6 className="mb-2 fw-semibold">Change Subscription Plan</h6>
        <p className="text-secondary mb-3">
            Select a new plan for your community. Changes will take effect immediately after payment.
        </p>

        {planError && (
            <div className="alert alert-danger" role="alert">{planError}</div>
        )}

        {planLoading ? (
            <div className="text-secondary d-flex justify-content-center py-2">
                <Loader label="Loading plans..." size={34} />
            </div>
        ) : plans ? (
            <form onSubmit={onSubmit}>
                <div className="row g-3 mb-3">
                    {Object.entries(plans).map(([key, plan]) => (
                        <div className="col-md-4" key={key}>
                            <label
                                className={`card h-100 p-3 shadow-sm ${selectedPlan === key ? "border-primary" : ""}`}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input" type="radio"
                                        name="planOption" value={key}
                                        checked={selectedPlan === key}
                                        onChange={() => setSelectedPlan(key)}
                                    />
                                    <span className="form-check-label fw-semibold ms-1">{plan.name}</span>
                                </div>
                                <p className="mb-1">₹{plan.price} / {plan.duration}</p>
                                <ul className="small mb-0">
                                    {plan.features?.map((f) => <li key={f}>{f}</li>)}
                                </ul>
                            </label>
                        </div>
                    ))}
                </div>
                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={planSubmitting}>
                        {planSubmitting ? "Processing..." : "Confirm Plan Change"}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancel</button>
                </div>
            </form>
        ) : (
            <div className="text-secondary">No plans available.</div>
        )}
    </div>
);
