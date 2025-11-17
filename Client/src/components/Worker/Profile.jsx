import React, { useState } from "react";
import "../../assets/css/Worker/Profile.css";
import image from "../../imgs/image.png"

export const WorkerProfile = () => {
    const [formData, setFormData] = useState({
        name: "Rahul Sharma",
        email: "rahul.sharma@urbanease.com",
        phone: "+1 (555) 123-467",
        location: "San Francisco, CA",
        department: "Plumber",
        status: true,
        image: image,
        shift: "9:00AM to 5:00PM"
    });
    const [isPassword, setIspassword] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        caseMix: false,
        numberSpecial: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;

        setPasswordValidation({
            minLength: password.length >= 8,
            caseMix: /^(?=.*[a-z])(?=.*[A-Z])/.test(password),
            numberSpecial: /^(?=.*[0-9!@#$%^&*])/.test(password)
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleToggle = () => {
        setFormData((prev) => ({ ...prev, status: !prev.status }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Profile Updated:", formData);
    };

    return (
        <div className="container worker-profile-container m-0">
            <div className="profile-header d-flex justify-content-end align-items-center">
                <div className="profile-image ">
                    <img src={formData.image} alt="Worker" className="rounded-circle shadow-sm" />
                </div>
                <div className="d-flex w-75 justify-content-between">
                    <div className="name d-flex flex-column" >
                        <h3>{formData.name}</h3>
                        <p className="role-text mb-2">Plumber</p>
                    </div>
                    <div className="profile-actions">
                        <label className="btn me-2 cam-btn" htmlFor="imgUpload" aria-label="Upload profile image">
                            <i className="bi bi-camera"></i>
                        </label>
                        <input
                            className=""
                            type="file"
                            id="imgUpload"
                            name="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            hidden
                        />
                        <button className="btn edit-btn " onClick={() => {
                            setIspassword(prev => !prev); console.log(isPassword);
                        }} >
                            <i className="bi bi-pencil me-1"></i>
                            {
                                isPassword ? <small> Edit Profile</small> : <small>Change password</small>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {
                isPassword ? (
                    <div id="passwordSection" className="form-section p-3">
                        <form id="passwordForm" type="worker">
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <input type="password" className="form-control" id="currentPassword" />
                            </div>

                            <div className="d-flex gap-3">
                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="newPassword"
                                        onChange={handlePasswordChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input type="password" className="form-control" id="confirmPassword" />
                                </div>
                            </div>

                            <div className="rule-box">
                                <h5 className="mb-3">
                                    <i className="bi bi-shield-check me-2"></i>Password Requirements
                                </h5>
                                <ul className="password-requirements px-2">
                                    <li>
                                        <i className={`bi ${passwordValidation.minLength ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'}`}></i>
                                        <label>Minimum 8 characters long</label>
                                    </li>
                                    <li>
                                        <i className={`bi  ${passwordValidation.caseMix ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'}`}></i>
                                        <label>At least one uppercase and one lowercase letter</label>
                                    </li>
                                    <li>
                                        <i className={`bi ${passwordValidation.numberSpecial ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'}`}></i>
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
                    <div className="row mt-4">


                        <div className="col-md-6">
                            <div className="card info-card">
                                <div className="card-body">
                                    <h5 className="mb-4">Profile Information</h5>
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label">Full Name</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="form-control"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                />

                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="form-control"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                />

                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Phone Number</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    className="form-control"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                />

                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                name="location"
                                                className="form-control"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="d-flex justify-content-end mt-3">
                                            <button className="btn btn-primary" type="submit">
                                                <i className="bi bi-save me-2"></i>Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card info-card mb-3">
                                <div className="card-body">
                                    <h5 className="mb-4">Work Information</h5>
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label">Department</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    className="form-control"
                                                    value={formData.department}
                                                    onChange={handleChange}
                                                />

                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Shift</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="form-control"
                                                    value={formData.shift}
                                                    onChange={handleChange}
                                                />

                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Average rating</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    className="form-control"
                                                    value="4.5"
                                                    onChange={handleChange}
                                                />

                                            </div>
                                        </div>


                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
