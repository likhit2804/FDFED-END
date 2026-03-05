import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Megaphone,
    Eye,
    Timer,
    DollarSign,
    Trash2,
    Edit,
    Plus,
    UploadCloud,
    Loader2
} from "lucide-react";

import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { StatCard, SearchBar as SharedSearchBar, Dropdown, StatusBadge, EmptyState, Modal, Input, Select, Textarea, FormSection } from '../shared';



const API_BASE_URL = process.env.NODE_ENV === "production" ? `${window.location.origin
    }/manager/api` : "http://localhost:3000/manager/api";

// Base URL for non-API manager routes (e.g. file uploads / images)
const MANAGER_BASE_URL = process.env.NODE_ENV === "production" ? `${window.location.origin
    }/manager` : "http://localhost:3000/manager";



const getAdImageUrl = (imagePath) => {
    if (!imagePath)
        return null;



    const normalizedPath = imagePath.replace(/\\/g, "/");
    // If imagePath is already absolute (starts with http), return it.
    if (/^https?:\/\//i.test(normalizedPath))
        return normalizedPath;



    // Otherwise construct full URL
    const baseUrl = process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:3000";
    return `${baseUrl}/${normalizedPath.replace(/^\/+/, "")
        }`;
};

/* ==============================
   Advertisement Popup Component
   ============================== */
const AdvertisementPopup = ({
    setShowPopup,
    ad,
    setAds,
    ads = [],
    setEditingAd,
    onAdCreated
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm({ mode: "onChange", shouldUnregister: false });

    const [imagePreview, setImagePreview] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const isEditing = !!ad;

    useEffect(() => {
        if (isEditing && ad) {
            reset({
                title: ad.title || "",
                startDate: ad.startDate || "",
                endDate: ad.endDate || "",
                adType: ad.adType || "",
                targetAudience: ad.targetAudience || "",
                link: ad.link || "",
                status: ad.status || ""
            });
            setImagePreview(getAdImageUrl(ad.imagePath || ad.image || ""));
        } else {
            reset();
            setImagePreview(null);
            setFileToUpload(null);
        }
    }, [ad, isEditing]);

    const handleImageUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("File size should be less than 5MB."); return; }
        setFileToUpload(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const submitHandler = async (data) => {
        try {
            setSubmitting(true);
            setSubmitError(null);
            if (!isEditing && !fileToUpload) throw new Error("Advertisement image is required for new ads.");

            const formData = new FormData();
            formData.append("title", data.title || "");
            formData.append("startDate", data.startDate || "");
            formData.append("endDate", data.endDate || "");
            formData.append("adType", data.adType || "");
            formData.append("targetAudience", data.targetAudience || "");
            if (data.link) formData.append("link", data.link);
            if (fileToUpload) formData.append("image", fileToUpload);

            const url = isEditing ? `${API_BASE_URL}/ad/${ad._id}` : `${API_BASE_URL}/ad`;
            const method = isEditing ? "PUT" : "POST";
            const response = await fetch(url, { method, credentials: "include", body: formData });

            if (response.status === 401) throw new Error("Unauthorized access. Please log in again.");
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to ${isEditing ? "update" : "create"} advertisement: ${response.status} ${text}`);
            }

            const json = await response.json();
            if (!json.success || !json.ad) throw new Error(json.message || "Failed to save advertisement");

            if (isEditing) {
                setAds(prev => (Array.isArray(prev) ? prev : []).map(a => a._id === json.ad._id ? json.ad : a));
            } else {
                setAds(prev => [json.ad, ...(Array.isArray(prev) ? prev : [])]);
            }

            reset(); setImagePreview(null); setFileToUpload(null);
            setShowPopup(false); setEditingAd(null);
            if (onAdCreated && typeof onAdCreated === 'function') onAdCreated();
        } catch (err) {
            console.error("Error submitting advertisement:", err);
            setSubmitError(err.message || "An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={() => { setShowPopup(false); setEditingAd(null); }}
            title={isEditing ? "Edit Advertisement" : "Create Advertisement"}
            size="lg"
            footer={
                <>
                    <button
                        type="button"
                        onClick={() => { setShowPopup(false); setEditingAd(null); }}
                        disabled={submitting}
                        style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit(submitHandler)}
                        disabled={submitting}
                        style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                    >
                        {submitting ? "Saving..." : isEditing ? "Update Ad" : "Create Ad"}
                    </button>
                </>
            }
        >
            {submitError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {submitError}
                </div>
            )}

            <FormSection title="Basic Info" columns={1}>
                <Input
                    label="Advertisement Title"
                    required
                    placeholder="Enter ad title (max 60 characters)"
                    maxLength={60}
                    error={errors.title ? "Title is required" : undefined}
                    {...register("title", { required: true })}
                />
            </FormSection>

            <FormSection title="Image / Banner" columns={1}>
                <div
                    onClick={() => document.getElementById("fileInput")?.click()}
                    style={{
                        border: '2px dashed #d1d5db', borderRadius: 10, padding: 24,
                        textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: 8,
                    }}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Ad Preview" style={{ maxHeight: 160, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                        <>
                            <UploadCloud size={36} style={{ color: '#9ca3af', marginBottom: 8 }} />
                            <p style={{ color: '#6b7280', margin: 0 }}>Click to upload or drag and drop</p>
                            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>JPEG or PNG (max 5MB)</p>
                        </>
                    )}
                    <input type="file" id="fileInput" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleImageUpload} />
                </div>
            </FormSection>

            <FormSection title="Scheduling" columns={2}>
                <Input
                    type="date"
                    label="Start Date"
                    required
                    error={errors.startDate ? "Start date required" : undefined}
                    {...register("startDate", { required: true })}
                />
                <Input
                    type="date"
                    label="End Date"
                    required
                    error={errors.endDate ? "End date required" : undefined}
                    {...register("endDate", { required: true })}
                />
            </FormSection>

            <FormSection title="Targeting" columns={2}>
                <Select
                    label="Ad Type"
                    required
                    placeholder="Select type"
                    options={[
                        { label: 'Sponsored', value: 'Sponsored' },
                        { label: 'Announcement', value: 'Announcement' },
                    ]}
                    error={errors.adType ? "Ad type required" : undefined}
                    {...register("adType", { required: true })}
                />
                <Select
                    label="Target Audience"
                    required
                    placeholder="Select audience"
                    options={[
                        { label: 'All Residents', value: 'All' },
                        { label: 'Block A', value: 'Block A' },
                        { label: 'Block B', value: 'Block B' },
                    ]}
                    error={errors.targetAudience ? "Target audience required" : undefined}
                    {...register("targetAudience", { required: true })}
                />
            </FormSection>

            <FormSection title="Optional" columns={1}>
                <Input
                    type="url"
                    label="Link"
                    placeholder="https://example.com"
                    hint="Optional — link visitors will open when they tap the ad"
                    {...register("link")}
                />
            </FormSection>
        </Modal>
    );
};


/* ==============================
   ManagerAdvertisementContainer
   ============================== */
const ManagerAdvertisementContainer = ({ ads, setShowPopup, setEditingAd, handleDelete }) => {
    if (!ads || !Array.isArray(ads) || ads.length === 0) {
        return (
            <div className="container-fluid px-0 py-3">
                <div className="text-center py-5">
                    <p className="text-muted">No advertisements found. Create your first ad to get started!</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div className="container-fluid px-0 py-3"
            initial={
                { opacity: 0 }
            }
            animate={
                { opacity: 1 }
            }>
            <div className="row g-4">
                {
                    ads.map((ad, i) => (
                        <motion.div key={
                            ad._id || `ad-${i}`
                        }
                            className="col-md-4"
                            initial={
                                {
                                    opacity: 0,
                                    y: 30
                                }
                            }
                            animate={
                                {
                                    opacity: 1,
                                    y: 0
                                }
                            }
                            transition={
                                {
                                    delay: i * 0.1
                                }
                            }>
                            <div className="card shadow-sm border-1 h-100 rounded-3">
                                <div className="card-body p-3">
                                    {
                                        getAdImageUrl(ad.imagePath || ad.image) && (
                                            <div className="mb-2">
                                                <img src={
                                                    getAdImageUrl(ad.imagePath || ad.image)
                                                }
                                                    alt={
                                                        ad.title || "Advertisement"
                                                    }
                                                    className="img-fluid rounded"
                                                    style={
                                                        {
                                                            maxHeight: "160px",
                                                            width: "100%",
                                                            objectFit: "cover"
                                                        }
                                                    } />
                                            </div>
                                        )
                                    }

                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="card-title mb-0 fw-semibold">
                                            {
                                                ad.title || "Untitled Ad"
                                            }</h5>
                                        <StatusBadge status={ad.status || "Pending"} />
                                    </div>

                                    {
                                        ad.link && (
                                            <p className="text-muted mb-1 small">
                                                <a href={
                                                    ad.link
                                                }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-decoration-none">
                                                    View Link
                                                </a>
                                            </p>
                                        )
                                    }

                                    <div className="small text-secondary mb-2">
                                        <div>Start: {
                                            ad.startDate || "N/A"
                                        }</div>
                                        <div>End: {
                                            ad.endDate || "N/A"
                                        }</div>
                                    </div>

                                    <div className="d-flex justify-content-start gap-3 mt-3">
                                        <button className="AdActionEditBtn btn"
                                            onClick={() => { setEditingAd(ad); setShowPopup(true); }}
                                        >
                                            <Edit size={18} title="Edit" /> Edit
                                        </button>
                                        <button className="btn btn-outline-danger"
                                            onClick={() => handleDelete(ad._id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} title="Delete" /> Delete
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    ))
                } </div>
        </motion.div>
    );
};

/* ==============================
   AdOverview Component
   ============================== */
const AdOverview = ({ statistics }) => {
    const s = statistics || { total: 0, active: 0, expired: 0, pending: 0 };
    return (
        <div className="ue-stat-grid" style={{ marginBottom: 4 }}>
            <StatCard label="Total Ads" value={s.total || 0} icon={<Megaphone size={22} />} iconColor="#16a34a" iconBg="#dcfce7" />
            <StatCard label="Active Ads" value={s.active || 0} icon={<Eye size={22} />} iconColor="#d97706" iconBg="#fef3c7" />
            <StatCard label="Expired Ads" value={s.expired || 0} icon={<Timer size={22} />} iconColor="#dc2626" iconBg="#fee2e2" />
            <StatCard label="Pending Ads" value={s.pending || 0} icon={<DollarSign size={22} />} iconColor="#0891b2" iconBg="#e0f2fe" />
        </div>
    );
};


/* ==============================
   SearchBar (uses shared components)
   ============================== */
const SearchBar = ({ setShowPopup, setEditingAd, searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
            <SharedSearchBar
                placeholder="Search by ad title..."
                value={searchTerm}
                onChange={setSearchTerm}
            />
        </div>
        <Dropdown
            options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Expired', value: 'Expired' },
            ]}
            selected={statusFilter}
            onChange={setStatusFilter}
            width="150px"
        />
        <button
            style={{ padding: '9px 16px', background: 'orangeRed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => { setEditingAd(null); setShowPopup(true); }}
        >
            <Plus size={18} /> Add new ad
        </button>
    </div>
);


/* ==============================
   Main Advertisement Component
   ============================== */
export const Advertisement = () => {
    const { onAdCreated } = useOutletContext() || {};
    const [ads, setAds] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Filter ads based on search term and status
    const filteredAds = ads.filter((ad) => {
        const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesStatus = !statusFilter || ad.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (adId) => {
        if (!window.confirm("Are you sure you want to delete this advertisement?"))
            return;



        const originalAds = [...ads];
        setAds(ads.filter((ad) => ad._id !== adId)); // Optimistic update

        try {
            const response = await fetch(`${MANAGER_BASE_URL}/ad/${adId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (!response.ok) {
                const text = await response.text();
                console.log("Failed to delete ad:", response.status, text);
                throw new Error("Failed to delete ad.");
            }

        } catch (err) {
            console.error("Error deleting ad:", err);
            setAds(originalAds); // Revert on error
            alert("Could not delete the advertisement. Please try again.");
        }
    };

    useEffect(() => {
        const fetchAds = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_BASE_URL}/ad`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (response.status === 401) {
                    setError("Unauthorized access. Please log in again.");
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch ads: ${response.status
                        } ${errorText}`);
                }

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Invalid response format. Expected JSON.");
                }

                const data = await response.json();
                console.log(data);


                if (data.success) {
                    setAds(Array.isArray(data.ads) ? data.ads : []);
                    setStatistics(data.statistics || null);
                } else {
                    throw new Error(data.message || "Failed to fetch advertisements");
                }
            } catch (err) {
                console.error("Error fetching ads:", err);
                setError(err.message || "An error occurred while fetching advertisements. Please try again later.");
                setAds([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <Loader2 size={48}
                    className="text-primary mb-3"
                    style={
                        { animation: "spin 1s linear infinite" }
                    } />
                <p className="text-muted">Loading advertisements...</p>
                <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <AlertCircle size={48}
                    className="text-danger mb-3" />
                <h5 className="text-danger mb-2">Error Loading Advertisements</h5>
                <p className="text-muted text-center">
                    {error}</p>
                <button className="btn btn-primary mt-3"
                    onClick={
                        () => {
                            setError(null);
                            setLoading(true);
                            window.location.reload();
                        }
                    }>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column">
            <AdOverview statistics={statistics} />
            <SearchBar
                setShowPopup={setShowPopup}
                setEditingAd={setEditingAd}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />
            <ManagerAdvertisementContainer ads={filteredAds}
                setShowPopup={setShowPopup}
                setEditingAd={setEditingAd}
                handleDelete={handleDelete}
            /> {
                showPopup && (
                    <AdvertisementPopup setShowPopup={setShowPopup}
                        ad={editingAd}
                        setAds={setAds}
                        ads={ads}
                        setEditingAd={setEditingAd}
                        onAdCreated={onAdCreated} />
                )
            } </div>
    );
};
