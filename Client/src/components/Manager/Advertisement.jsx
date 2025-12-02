import {
  Megaphone,
  Eye,
  Clock,
  Timer,
  BarChart3,
  DollarSign,
  Trash2,
  Edit,
  Plus,
  UploadCloud,
} from "lucide-react";
import "../../assets/css/Manager/Ad.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

const adsData = [
  { _id: 1, title: "Gym Membership Offer", type: "Sponsored", startDate: "2025-11-01", endDate: "2025-12-01", createdBy: "Admin Manager", engagements: 125, status: "Active" },
  { _id: 2, title: "Yoga Classes Starting Soon", type: "Community", startDate: "2025-11-05", endDate: "2025-11-30", createdBy: "John Smith", engagements: 87, status: "Active" },
  { _id: 3, title: "Building Maintenance Notice", type: "Announcement", startDate: "2025-11-03", endDate: "2025-11-10", createdBy: "Admin Manager", engagements: 203, status: "Active" },
  { _id: 4, title: "Food Festival This Weekend", type: "Community", startDate: "2025-11-10", endDate: "2025-11-15", createdBy: "Sarah Johnson", engagements: 0, status: "Pending" },
  { _id: 5, title: "Swimming Pool Renovation", type: "Announcement", startDate: "2025-10-15", endDate: "2025-11-01", createdBy: "Admin Manager", engagements: 156, status: "Expired" },
];

const statusBadge = (status) => {
  switch (status) {
    case "Active":
      return <span className="badge bg-success">{status}</span>;
    case "Pending":
      return <span className="badge bg-warning text-dark">{status}</span>;
    case "Expired":
      return <span className="badge bg-secondary">{status}</span>;
    case "Rejected":
      return <span className="badge bg-danger">{status}</span>;
    default:
      return <span className="badge bg-light text-dark">{status}</span>;
  }
};

const AvertisementPopup = ({ setShowPopup, ads, setAds }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [imagePreview, setImagePreview] = useState(null);
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB.");
        return;
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const submitHandler = (data) => {
    const adData = { ...data, imagePreview };
    setShowPopup(false);
    reset();
  };
  return (
    <AnimatePresence>
      <motion.div className="popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="popup-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="modal-title fw-semibold">Create New Advertisement</h4>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => { setShowPopup(false); setAds(null); }}></button>
          </div>
          <form onSubmit={handleSubmit(submitHandler)} className="px-2">
            <div className="mb-3">
              <label className="form-label fw-medium">Advertisement Title *</label>
              <input type="text" className="form-control" placeholder="Enter ad title (max 60 characters)" maxLength={60} defaultValue={ads?.title} {...register("title", { required: true })} />
              {errors.title && <small className="text-danger">Title is required</small>}
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium">Description *</label>
              <textarea className="form-control" placeholder="Enter detailed description" maxLength={200} rows="3" {...register("description", { required: true })}></textarea>
              {errors.description && <small className="text-danger">Description is required</small>}
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium">Image/Banner Upload *</label>
              <div className="border border-2 rounded-3 p-4 text-center" style={{ borderStyle: "dashed", background: "#f9fafb", cursor: "pointer" }} onClick={() => document.getElementById("fileInput").click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Ad Preview" className="img-fluid rounded" style={{ maxHeight: "160px", objectFit: "cover" }} />
                ) : (
                  <>
                    <UploadCloud size={36} className="text-secondary mb-2" />
                    <p className="text-secondary mb-0">Click to upload or drag and drop</p>
                    <p className="small text-muted mb-0">JPEG or PNG (max 5MB)</p>
                  </>
                )}
                <input type="file" id="fileInput" accept="image/png, image/jpeg" style={{ display: "none" }} {...register("image", { required: true })} onChange={handleImageUpload} />
              </div>
              {errors.image && <small className="text-danger">Image is required</small>}
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Start Date *</label>
                <input type="date" className="form-control" {...register("startDate", { required: true })} />
                {errors.startDate && <small className="text-danger">Start date is required</small>}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">End Date *</label>
                <input type="date" className="form-control" {...register("endDate", { required: true })} />
                {errors.endDate && <small className="text-danger">End date is required</small>}
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Ad Type *</label>
                <select className="form-select" {...register("adType", { required: true })}>
                  <option value="">Select type</option>
                  <option value="Sponsored">Sponsored</option>
                  <option value="Announcement">Announcement</option>
                </select>
                {errors.adType && <small className="text-danger">Ad type is required</small>}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-medium">Target Audience *</label>
                <select className="form-select" {...register("targetAudience", { required: true })}>
                  <option value="">Select audience</option>
                  <option value="All">All Residents</option>
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                </select>
                {errors.targetAudience && <small className="text-danger">Target audience is required</small>}
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-medium">Amount (Optional)</label>
              <input type="number" className="form-control" placeholder="Enter amount for sponsored ads" {...register("amount")} />
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowPopup(false); setAds(null); }}>Cancel</button>
              <button type="submit" className="btn btn-success">Create Ad</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ManagerAdvertisementContainer = ({ ads, setAds, setShowPopup }) => (
  <motion.div className="container-fluid px-0 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="row g-4">
      {ads.map((ad, i) => (
        <motion.div key={ad._id} className="col-md-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <div className="card shadow-sm border-1 h-100 rounded-3">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-0 fw-semibold">{ad.title}</h5>
                {statusBadge(ad.status)}
              </div>
              <p className="text-muted mb-1">{ad.type}</p>
              <div className="small text-secondary mb-2">
                <div>Start: {ad.startDate}</div>
                <div>End: {ad.endDate}</div>
              </div>
              <div className="small mb-2">
                <span className="fw-medium">Created by:</span> {ad.createdBy}
              </div>
              <div className="small mb-3">
                <span className="fw-medium">Engagements:</span> {ad.engagements}
              </div>
              <div className="d-flex justify-content-start gap-3">
                <button className="AdActionEditBtn btn" onClick={() => { setAds(ad); setShowPopup(true); }}>
                  <Edit size={18} title="Edit" /> Edit
                </button>
                <button className="AdActionDeleteBtn btn">
                  <Trash2 size={18} title="Delete" /> Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const AdOverview = () => {
  const data = [
    { icon: <Megaphone size={24} className="text-success" />, title: "Total Ads", value: "53", color: "text-success" },
    { icon: <Eye size={24} className="text-warning" />, title: "Active ads", value: "10", color: "text-warning" },
    { icon: <Timer size={24} className="text-danger" />, title: "Expired ads", value: "43", color: "text-danger" },
    { icon: <DollarSign size={24} className="text-info" />, title: "Total Revenue", value: "₹54,450", color: "text-info" },
  ];
  return (
    <div className="p-0 py-4">
      <div className="row g-4">
        {data.map((item, i) => (
          <motion.div key={i} className="col-md-6 col-lg-3" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="payment-card shadow-sm p-3 rounded-4 bg-white">
              <div className="d-flex justify-content-between align-items-start">
                <div className="icon-box">{item.icon}</div>
              </div>
              <h6 className="mt-3 text-secondary">{item.title}</h6>
              <h4 className={`fw-semibold mt-1 ${item.color}`}>{item.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SearchBar = ({ ads, setAds, showPopup, setShowPopup }) => (
  <div className="d-flex gap-2 align-items-center mb-3 flex-wrap">
    <input type="text" className="form-control m-0" placeholder="Search by ad title..." style={{ maxWidth: "64%" }} />
    <select className="form-select m-0" style={{ maxWidth: "120px" }}>
      <option>Active</option>
      <option>Pending</option>
      <option>Expired</option>
    </select>
    <button className="filter-btn">Search</button>
    <button className="btn" style={{ backgroundColor: "blue", color: "white" }} onClick={() => setShowPopup(true)}>
      <Plus size={18} /> Add new ad
    </button>
    {showPopup && <AvertisementPopup setShowPopup={setShowPopup} ads={ads} setAds={setAds} />}
  </div>
);

export const Advertisement = () => {
  const [ads, setAds] = useState(adsData);
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className="d-flex flex-column">
      <AdOverview />
      <SearchBar ads={ads} setAds={setAds} showPopup={showPopup} setShowPopup={setShowPopup} />
      <ManagerAdvertisementContainer ads={ads} setAds={setAds} setShowPopup={setShowPopup} />
    </div>
  );
};
