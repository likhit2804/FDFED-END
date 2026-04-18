import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { DollarSign, Eye, Megaphone, Plus, Timer, Trash2, UploadCloud } from "lucide-react";
import { useForm } from "react-hook-form";
import axios from "axios";

import { Loader } from "../Loader";
import {
  Dropdown,
  EmptyState,
  FormSection,
  GraphBar,
  GraphLine,
  GraphPie,
  Input,
  Modal,
  SearchBar,
  Select,
  StatCard,
  StatusBadge,
} from "../shared";
import {
  ManagerActionButton,
  ManagerPageShell,
  ManagerRecordCard,
  ManagerRecordGrid,
  ManagerSection,
  ManagerToolbar,
  ManagerToolbarGrow,
} from "./ui";
import { UE_CHART_COLORS } from "../shared/chartPalette";
import "../../assets/css/Manager/Advertisement.css";

const getAdImageUrl = (imagePath) => {
  if (!imagePath) return null;

  const normalizedPath = imagePath.replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

  const baseUrl = process.env.NODE_ENV === "production" ? window.location.origin : "";
  return `${baseUrl}/${normalizedPath.replace(/^\/+/, "")}`;
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const formatDateLabel = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AdvertisementPopup = ({ setShowPopup, ad, setAds, setEditingAd, onAdCreated }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ mode: "onChange" });
  const [imagePreview, setImagePreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const isEditing = Boolean(ad);

  useEffect(() => {
    if (isEditing && ad) {
      reset({
        title: ad.title || "",
        startDate: toDateInput(ad.startDate),
        endDate: toDateInput(ad.endDate),
        adType: ad.adType || "",
        targetAudience: ad.targetAudience || "",
        link: ad.link || "",
        status: ad.status || "",
      });
      setImagePreview(getAdImageUrl(ad.imagePath || ad.image || ""));
    } else {
      reset();
      setImagePreview(null);
      setFileToUpload(null);
    }
  }, [ad, isEditing, reset]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB.");
      return;
    }
    setFileToUpload(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submitHandler = async (data) => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      if (!isEditing && !fileToUpload) {
        throw new Error("Advertisement image is required for new ads.");
      }

      const formData = new FormData();
      formData.append("title", data.title || "");
      formData.append("startDate", data.startDate || "");
      formData.append("endDate", data.endDate || "");
      formData.append("adType", data.adType || "");
      formData.append("targetAudience", data.targetAudience || "");
      if (data.link) formData.append("link", data.link);
      if (fileToUpload) formData.append("image", fileToUpload);

      const response = isEditing
        ? await axios.put(`/manager/api/ad/${ad._id}`, formData)
        : await axios.post("/manager/api/ad", formData);
      const json = response.data;
      if (!json.success || !json.ad) throw new Error(json.message || "Failed to save advertisement");

      if (isEditing) {
        setAds((previous) => previous.map((item) => (item._id === json.ad._id ? json.ad : item)));
      } else {
        setAds((previous) => [json.ad, ...previous]);
      }

      reset();
      setImagePreview(null);
      setFileToUpload(null);
      setShowPopup(false);
      setEditingAd(null);
      onAdCreated?.();
    } catch (error) {
      setSubmitError(error.response?.data?.message || error.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        setShowPopup(false);
        setEditingAd(null);
      }}
      title={isEditing ? "Edit Advertisement" : "Create Advertisement"}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              setShowPopup(false);
              setEditingAd(null);
            }}
            disabled={submitting}
            className="manager-ui-button manager-ui-button--secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(submitHandler)}
            disabled={submitting}
            className="manager-ui-button manager-ui-button--primary"
          >
            {submitting ? "Saving..." : isEditing ? "Update Ad" : "Create Ad"}
          </button>
        </>
      }
    >
      {submitError ? <div className="manager-ui-empty text-danger mb-3">{submitError}</div> : null}

      <FormSection title="Basic Info" columns={1}>
        <Input
          label="Advertisement Title"
          required
          placeholder="Enter ad title"
          maxLength={60}
          error={errors.title ? "Title is required" : undefined}
          {...register("title", { required: true })}
        />
      </FormSection>

      <FormSection title="Image / Banner" columns={1}>
        <div
          onClick={() => document.getElementById("manager-ad-file")?.click()}
          className="manager-ad-upload"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Ad preview" className="manager-ad-upload__preview" />
          ) : (
            <div className="manager-ad-upload__placeholder">
              <UploadCloud size={36} />
              <p>Click to upload a banner image</p>
              <small>JPEG or PNG, up to 5MB</small>
            </div>
          )}
          <input
            type="file"
            id="manager-ad-file"
            accept="image/png, image/jpeg"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
        </div>
        {fileToUpload ? <p className="manager-ad-upload__filename">{fileToUpload.name}</p> : null}
      </FormSection>

      <FormSection title="Scheduling" columns={2}>
        <Input type="date" label="Start Date" required error={errors.startDate ? "Start date required" : undefined} {...register("startDate", { required: true })} />
        <Input type="date" label="End Date" required error={errors.endDate ? "End date required" : undefined} {...register("endDate", { required: true })} />
      </FormSection>

      <FormSection title="Targeting" columns={2}>
        <Select
          label="Ad Type"
          required
          placeholder="Select type"
          options={[
            { label: "Sponsored", value: "Sponsored" },
            { label: "Announcement", value: "Announcement" },
          ]}
          error={errors.adType ? "Ad type required" : undefined}
          {...register("adType", { required: true })}
        />
        <Select
          label="Target Audience"
          required
          placeholder="Select audience"
          options={[
            { label: "All Residents", value: "All" },
            { label: "Block A", value: "Block A" },
            { label: "Block B", value: "Block B" },
          ]}
          error={errors.targetAudience ? "Target audience required" : undefined}
          {...register("targetAudience", { required: true })}
        />
      </FormSection>

      <FormSection title="Optional" columns={1}>
        <Input type="url" label="Link" placeholder="https://example.com" {...register("link")} />
      </FormSection>
    </Modal>
  );
};

const AdOverview = ({ statistics }) => {
  const stats = statistics || { total: 0, active: 0, expired: 0, pending: 0 };
  return (
    <div className="ue-stat-grid">
      <StatCard label="Total Ads" value={stats.total || 0} icon={<Megaphone size={22} />} iconColor="#7c3aed" iconBg="#f3edff" />
      <StatCard label="Active Ads" value={stats.active || 0} icon={<Eye size={22} />} iconColor="#8b5cf6" iconBg="#f5f3ff" />
      <StatCard label="Expired Ads" value={stats.expired || 0} icon={<Timer size={22} />} iconColor="#d95d4f" iconBg="#feefed" />
      <StatCard label="Pending Ads" value={stats.pending || 0} icon={<DollarSign size={22} />} iconColor="#5b6472" iconBg="#f2f4f8" />
    </div>
  );
};

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

  const statusChartData = useMemo(
    () => [
      { name: "Active", value: statistics?.active || 0 },
      { name: "Pending", value: statistics?.pending || 0 },
      { name: "Expired", value: statistics?.expired || 0 },
    ],
    [statistics]
  );

  const typeChartData = useMemo(() => {
    const counts = ads.reduce((accumulator, ad) => {
      const type = ad?.adType || "Other";
      accumulator[type] = (accumulator[type] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ads]);

  const monthlyScheduleData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        total: 0,
      };
    });

    const monthMap = months.reduce((accumulator, month) => {
      accumulator[month.key] = month;
      return accumulator;
    }, {});

    ads.forEach((ad) => {
      if (!ad?.startDate) return;
      const date = new Date(ad.startDate);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthMap[key]) {
        monthMap[key].total += 1;
      }
    });

    return months.map((month) => ({ name: month.label, total: month.total }));
  }, [ads]);


  const filteredAds = ads.filter((ad) => {
    const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = !statusFilter || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (adId) => {
    if (!window.confirm("Are you sure you want to delete this advertisement?")) return;

    const originalAds = [...ads];
    setAds((previous) => previous.filter((ad) => ad._id !== adId));

    try {
      await axios.delete(`/manager/ad/${adId}`);
    } catch (error) {
      setAds(originalAds);
      alert("Could not delete the advertisement. Please try again.");
    }
  };

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get("/manager/api/ad");
        const data = response.data;
        if (!data.success) throw new Error(data.message || "Failed to fetch advertisements");

        setAds(Array.isArray(data.ads) ? data.ads : []);
        setStatistics(data.statistics || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || "An error occurred while fetching advertisements.");
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  return (
    <ManagerPageShell
      eyebrow="Advertisements"
      title="Control community announcements and sponsored visibility."
      description="Create banners, watch active campaigns, and keep ad status aligned with the same operations layout as the rest of the manager suite."
      chips={[`${statistics?.total || ads.length || 0} ads tracked`, `${statistics?.active || 0} currently active`]}
      actions={
        <ManagerActionButton
          variant="primary"
          onClick={() => {
            setEditingAd(null);
            setShowPopup(true);
          }}
        >
          <Plus size={16} />
          Add new ad
        </ManagerActionButton>
      }
    >
      <AdOverview statistics={statistics} />

      <ManagerSection
        eyebrow="Insights"
        title="Campaign analytics"
        description="Track campaign status, type mix, and monthly launch volume."
      >
        <div className="manager-ui-two-column">
          <GraphPie
            title="Status mix"
            subtitle="Current campaign state"
            data={statusChartData}
            colors={[UE_CHART_COLORS.plum, UE_CHART_COLORS.emerald, UE_CHART_COLORS.slate, UE_CHART_COLORS.danger]}
          />
          <GraphBar
            title="Campaign type split"
            subtitle="Count by ad type"
            xKey="name"
            data={typeChartData}
            bars={[{ key: "value", label: "Campaigns", color: UE_CHART_COLORS.slate }]}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <GraphLine
            title="Monthly launches"
            subtitle="Campaigns started in the last six months"
            xKey="name"
            data={monthlyScheduleData}
            lines={[{ key: "total", label: "Campaigns", color: UE_CHART_COLORS.plum }]}
            showArea
          />
        </div>
      </ManagerSection>

      <ManagerSection
        eyebrow="Ad Library"
        title="Community campaigns"
        description="Filter by title and status, then edit or remove campaigns from the same record grid."
      >
        <ManagerToolbar>
          <ManagerToolbarGrow>
            <SearchBar placeholder="Search by ad title..." value={searchTerm} onChange={setSearchTerm} />
          </ManagerToolbarGrow>
          <Dropdown
            options={[
              { label: "All Status", value: "" },
              { label: "Active", value: "Active" },
              { label: "Pending", value: "Pending" },
              { label: "Expired", value: "Expired" },
            ]}
            selected={statusFilter}
            onChange={setStatusFilter}
            width="150px"
          />
        </ManagerToolbar>

        {loading ? (
          <div className="manager-ui-empty">
            <Loader />
          </div>
        ) : error ? (
          <div className="manager-ui-empty text-danger">{error}</div>
        ) : filteredAds.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={48} />}
            title="No advertisements found"
            sub="Create your first ad or adjust the current filters."
          />
        ) : (
          <ManagerRecordGrid className="manager-ad-grid">
            {filteredAds.map((ad) => (
              <ManagerRecordCard
                key={ad._id}
                className="manager-ad-card"
                title={ad.title || "Untitled Ad"}
                subtitle={ad.targetAudience || "Community audience"}
                status={<StatusBadge status={ad.status || "Pending"} />}
                media={
                  getAdImageUrl(ad.imagePath || ad.image) ? (
                    <img src={getAdImageUrl(ad.imagePath || ad.image)} alt={ad.title || "Advertisement"} />
                  ) : null
                }
                meta={[
                  { label: "Type", value: ad.adType || "-" },
                  { label: "Starts", value: formatDateLabel(ad.startDate) },
                  { label: "Ends", value: formatDateLabel(ad.endDate) },
                  { label: "Audience", value: ad.targetAudience || "All residents" },
                ]}
                footer={
                  ad.link ? (
                    <a
                      className="manager-ui-button manager-ui-button--ghost manager-ad-link"
                      href={ad.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open destination
                    </a>
                  ) : (
                    <p className="manager-ui-note">No destination link attached.</p>
                  )
                }
                actions={
                  <>
                    <ManagerActionButton
                      variant="secondary"
                      onClick={() => {
                        setEditingAd(ad);
                        setShowPopup(true);
                      }}
                    >
                      Edit
                    </ManagerActionButton>
                    <ManagerActionButton variant="danger" onClick={() => handleDelete(ad._id)}>
                      <Trash2 size={16} />
                      Delete
                    </ManagerActionButton>
                  </>
                }
              />
            ))}
          </ManagerRecordGrid>
        )}
      </ManagerSection>

      {showPopup ? (
        <AdvertisementPopup
          setShowPopup={setShowPopup}
          ad={editingAd}
          setAds={setAds}
          setEditingAd={setEditingAd}
          onAdCreated={onAdCreated}
        />
      ) : null}
    </ManagerPageShell>
  );
};
