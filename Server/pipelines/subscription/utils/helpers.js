/**
 * Calculates the end date of a subscription plan based on duration.
 * @param {Date|String} startDate - The starting date of the plan
 * @param {String} duration - "monthly" or "yearly"
 * @returns {Date} The calculated end date
 */
export const calculatePlanEndDate = (startDate, duration) => {
    const endDate = new Date(startDate);
    if (duration === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
    } else if (duration === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
    }
    return endDate;
};
