import { useState, useMemo, useCallback } from "react";

const DEFAULT_FILTERS = { search: "", status: "All", priority: "All", dateFrom: "", dateTo: "" };

/**
 * Manages independent filter state for each tab and provides a filtered + sorted list.
 * @param {Object} issuesByTab  – e.g. { Resident: [...], Community: [...] }
 * @param {string} activeTab    – currently selected tab key
 */
export const useTabFilters = (issuesByTab, activeTab) => {
    // One filter‑state object per tab, created lazily
    const [filtersMap, setFiltersMap] = useState({});

    const filters = filtersMap[activeTab] || DEFAULT_FILTERS;

    const setFilter = useCallback(
        (key, value) =>
            setFiltersMap((prev) => ({
                ...prev,
                [activeTab]: { ...(prev[activeTab] || DEFAULT_FILTERS), [key]: value },
            })),
        [activeTab]
    );

    const filtered = useMemo(() => {
        const list = issuesByTab[activeTab] || [];
        const { search, status, priority, dateFrom, dateTo } = filters;

        return list
            .filter((issue) => {
                if (status !== "All" && issue.status !== status) return false;
                if (priority !== "All" && (issue.priority || "Normal") !== priority) return false;
                if (dateFrom && new Date(issue.createdAt) < new Date(dateFrom)) return false;
                if (dateTo && new Date(issue.createdAt) > new Date(dateTo)) return false;
                if (search.trim()) {
                    const s = search.toLowerCase();
                    return (
                        (issue.title || "").toLowerCase().includes(s) ||
                        (issue.category || "").toLowerCase().includes(s) ||
                        (issue.issueID || "").toLowerCase().includes(s) ||
                        (issue.location || "").toLowerCase().includes(s)
                    );
                }
                return true;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [issuesByTab, activeTab, filters]);

    return { filters, setFilter, filtered };
};
