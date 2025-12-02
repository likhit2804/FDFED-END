import React from "react";
import { useState, useEffect } from "react";
import {
    Mail,
    Phone,
    Camera,
    Edit3,
    User,
    Calendar,
    MapPin,
    Briefcase,
    Building2,
    Layers
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

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
        assignedBlocks: "",
        yearsOfExperience: "",
        workEmail: ""
    });
    const [isPassword, setIspassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [passwordData, setPasswordData] = useState({
        cp: "",
        np: "",
        cnp: ""
    });
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordValidation, setPasswordValidation] = useState({ minLength: false, caseMix: false, numberSpecial: false });

    // Fetch manager profile data on component mount
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch("http://localhost:3000/manager/profile/api", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFormData({
                        name: data.manager.name || "",
                        email: data.manager.email || "",
                        phone: data.manager.contact || "",
                        location: data.manager.location || "",
                        address: data.manager.address || "",
                        department: "Community Manager",
                        roleTitle: "Community Manager",
                        communityName: data.community?.name || "",
                        workEmail: data.manager.email || ""
                    });
                } else {
                    setError(data.message || "Failed to load profile");
                }
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setError("Failed to load profile data");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));

        if (name === "np") {
            setPasswordValidation({
                minLength: value.length >= 8,
                caseMix: /^(?=.*[a-z])(?=.*[A-Z])/.test(value),
                numberSpecial: /^(?=.*[0-9!@#$%^&*])/.test(value)
            });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                image: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formDataObj = new FormData();
        formDataObj.append("name", formData.name);
        formDataObj.append("email", formData.email);
        formDataObj.append("contact", formData.phone);
        formDataObj.append("location", formData.location);
        formDataObj.append("address", formData.address);

        fetch("http://localhost:3000/manager/profile", {
            method: "POST",
            body: formDataObj,
            credentials: "include"
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setError(null);
                    alert("Profile updated successfully!");
                } else {
                    setError(data.message || "Failed to update profile");
                }
            })
            .catch(err => {
                console.error("Update error:", err);
                setError("Failed to update profile");
            });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPasswordMessage("");

        if (passwordData.np !== passwordData.cnp) {
            setPasswordMessage("Passwords do not match!");
            return;
        }

        fetch("http://localhost:3000/manager/profile/changePassword", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                cp: passwordData.cp,
                np: passwordData.np,
                cnp: passwordData.cnp
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setPasswordMessage("Password changed successfully!");
                    setPasswordData({ cp: "", np: "", cnp: "" });
                    setTimeout(() => {
                        setIspassword(false);
                        setPasswordMessage("");
                    }, 1500);
                } else {
                    setPasswordMessage(data.message || "Failed to change password");
                }
            })
            .catch(err => {
                console.error("Password change error:", err);
                setPasswordMessage("Failed to change password");
            });
    };
    return (
        <>
            {loading ? (
                <div className="text-center p-4">Loading profile...</div>
            ) : error && !isPassword ? (
                <div className="text-center text-danger p-4">{error}</div>
            ) : (
                <>
                    <div className="card border-1 shadow-sm rounded-4 p-3 d-flex flex-row align-items-center justify-content-between">

                        <div className="d-flex align-items-center gap-3">

                            <div className="position-relative">
                                <div className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={
                                        {
                                            width: "80px",
                                            height: "80px",
                                            backgroundColor: "#2979ff",
                                            color: "white",
                                            fontSize: "28px",
                                            fontWeight: "600"
                                        }
                                    }>
                                    {formData.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                                </div>

                                <label htmlFor="profileImage" className="btn btn-light position-absolute p-1 d-flex align-items-center justify-content-center border rounded-circle"
                                    style={
                                        {
                                            bottom: "0px",
                                            right: "0px",
                                            width: "26px",
                                            height: "26px",
                                            cursor: "pointer"
                                        }
                                    }>
                                    <Camera size={14} />
                                </label>
                                <input
                                    type="file"
                                    id="profileImage"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    hidden
                                />
                            </div>

                            <div>
                                <h5 className="mb-1 fw-semibold">{formData.name}</h5>
                                <p className="mb-0 text-secondary">Community Manager</p>
                                <p className="mb-2 text-secondary">{formData.location}</p>

                            </div>
                        </div>
                        <button className="btn btn-light border rounded-3 d-flex align-items-center gap-2"
                            onClick={
                                () => setIspassword(prev => !prev)
                            }>
                            <Edit3 size={16} /> {
                                isPassword ? "Edit Profile" : "Change Password"
                            } </button>
                    </div>
                    {
                        isPassword ? (
                            <div id="passwordSection" className="form-section p-3">
                                <form id="passwordForm" onSubmit={handlePasswordSubmit}>
                                    {passwordMessage && (
                                        <div className={`alert ${passwordMessage.includes("successfully") ? "alert-success" : "alert-danger"}`} role="alert">
                                            {passwordMessage}
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label htmlFor="currentPassword">Current Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="currentPassword"
                                            name="cp"
                                            value={passwordData.cp}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>

                                    <div className="d-flex gap-3">
                                        <div className="form-group">
                                            <label htmlFor="newPassword">New Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="newPassword"
                                                name="np"
                                                value={passwordData.np}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Confirm Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="confirmPassword"
                                                name="cnp"
                                                value={passwordData.cnp}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="rule-box">
                                        <h5 className="mb-3">
                                            <i className="bi bi-shield-check me-2"></i>Password Requirements
                                        </h5>
                                        <ul className="password-requirements px-2">
                                            <li>
                                                <i className={
                                                    `bi ${passwordValidation.minLength ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'
                                                    }`
                                                }></i>
                                                <label>Minimum 8 characters long</label>
                                            </li>
                                            <li>
                                                <i className={
                                                    `bi  ${passwordValidation.caseMix ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'
                                                    }`
                                                }></i>
                                                <label>At least one uppercase and one lowercase letter</label>
                                            </li>
                                            <li>
                                                <i className={
                                                    `bi ${passwordValidation.numberSpecial ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'
                                                    }`
                                                }></i>
                                                <label>At least one number or special character</label>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="d-flex justify-content-end">
                                        <button type="submit" className="btn btn-primary">
                                            <i className="bi bi-key me-2"></i>Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>

                        ) : (
                            <div className="row g-4 mt-3">
                                {/* Personal Information Card */}
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <User size={20}
                                                    className="text-primary" />
                                                <h6 className="mb-0 fw-semibold">Personal Information</h6>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="d-flex flex-column gap-2 text-secondary">
                                            <div>
                                                <small className="d-block fw-semibold text-dark mb-1">
                                                    <User size={14}
                                                        className="me-2 text-muted" />
                                                    Full Name
                                                </small>
                                                <input
                                                    type="text"
                                                    className="form-control ms-2  mb-0"
                                                    name="name"
                                                    value={
                                                        formData.name
                                                    }
                                                    onChange={handleChange}
                                                />

                                            </div>

                                            <div>
                                                <small className="d-block fw-semibold text-dark mb-1">
                                                    <Mail size={14}
                                                        className="me-2 text-muted" />
                                                    Email
                                                </small>
                                                <input
                                                    type="email"
                                                    className="form-control ms-2  mb-0"
                                                    name="email"
                                                    value={
                                                        formData.email
                                                    }
                                                    onChange={handleChange}
                                                />

                                            </div>

                                            <div>
                                                <small className="d-block fw-semibold text-dark mb-1">
                                                    <Phone size={14}
                                                        className="me-2 text-muted" />
                                                    Phone Number
                                                </small>
                                                <input
                                                    type="tel"
                                                    className="form-control ms-2  mb-0"
                                                    name="phone"
                                                    value={
                                                        formData.phone
                                                    }
                                                    onChange={handleChange}
                                                />

                                            </div>

                                            <div>
                                                <small className="d-block fw-semibold text-dark mb-1">
                                                    <MapPin size={14}
                                                        className="me-2 text-muted" />
                                                    Address
                                                </small>
                                                <input
                                                    type="text"
                                                    className="form-control ms-2  mb-0"
                                                    name="address"
                                                    value={
                                                        formData.address
                                                    }
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="d-flex py-2 justify-content-end">
                                                <button className="btn w-50 btn-primary" type="button"
                                                    onClick={handleSubmit}>Save Changes</button>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                {/* Professional Details Card */}
                                <div className="col-md-6">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <Briefcase size={20}
                                                    className="text-success" />
                                                <h6 className="mb-0 fw-semibold">Professional Details</h6>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="d-flex flex-column gap-2 text-secondary">
                                            <div>
                                                <small className="d-block fw-semibold mb-1 text-dark">
                                                    <Briefcase size={14}
                                                        className="me-2 text-muted" />
                                                    Role Title
                                                </small>
                                                <input
                                                    type="text"
                                                    className="form-control ms-2  mb-0"
                                                    value={
                                                        formData.roleTitle
                                                    }
                                                    readOnly
                                                />
                                            </div>

                                            <div>
                                                <small className="d-block fw-semibold mb-1 text-dark">
                                                    <Building2 size={14}
                                                        className="me-2 text-muted" />
                                                    Community Name
                                                </small>
                                                <input
                                                    type="text"
                                                    className="form-control ms-2  mb-0"
                                                    value={
                                                        formData.communityName
                                                    }
                                                    readOnly
                                                />
                                            </div>


                                           

                                            <div>
                                                <small className="d-block fw-semibold mb-1 text-dark">
                                                    <Mail size={14}
                                                        className="me-2 text-muted" />
                                                    Work Email
                                                </small>
                                                <input
                                                    type="email"
                                                    className="form-control ms-2 mb-0"
                                                    value={
                                                        formData.workEmail
                                                    }
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    } </>
            )}
        </>
    );
};
