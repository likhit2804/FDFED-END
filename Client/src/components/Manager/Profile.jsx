import React from "react";
import {useState} from "react";
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
        name: "Rajesh Kumar",
        email: "rajesh.kumar@urbanease.com",
        phone: "+91 98765 43210",
        location: "Sunshine Residency",
        department: "Community Manager"
    });
    const [isPassword, setIspassword] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({minLength: false, caseMix: false, numberSpecial: false});

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
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
        if (! file) 
            return;
        
        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                image: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleToggle = () => {
        setFormData((prev) => ({
            ...prev,
            status: !prev.status
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Profile Updated:", formData);
    };
    return (
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
                            RK
                        </div>

                        <button className="btn btn-light position-absolute p-1 d-flex align-items-center justify-content-center border rounded-circle"
                            style={
                                {
                                    bottom: "0px",
                                    right: "0px",
                                    width: "26px",
                                    height: "26px"
                                }
                        }>
                            <Camera size={14}/>
                        </button>
                    </div>

                    <div>
                        <h5 className="mb-1 fw-semibold">Rajesh Kumar</h5>
                        <p className="mb-0 text-secondary">Community Manager</p>
                        <p className="mb-2 text-secondary">Sunshine Residency</p>

                    </div>
                </div>
                <button className="btn btn-light border rounded-3 d-flex align-items-center gap-2"
                    onClick={
                        () => setIspassword(prev => !prev)
                }>
                    <Edit3 size={16}/> {
                    isPassword ? "Edit Profile" : "Change Password"
                } </button>
            </div>
            {
            isPassword ? (
                <div id="passwordSection" className="form-section p-3">
                    <form id="passwordForm" type="worker">
                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input type="password" className="form-control" id="currentPassword"/>
                        </div>

                        <div className="d-flex gap-3">
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input type="password" className="form-control" id="newPassword"
                                    onChange={handlePasswordChange}/>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input type="password" className="form-control" id="confirmPassword"/>
                            </div>
                        </div>

                        <div className="rule-box">
                            <h5 className="mb-3">
                                <i className="bi bi-shield-check me-2"></i>Password Requirements
                            </h5>
                            <ul className="password-requirements px-2">
                                <li>
                                    <i className={
                                        `bi ${
                                            passwordValidation.minLength ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'
                                        }`
                                    }></i>
                                    <label>Minimum 8 characters long</label>
                                </li>
                                <li>
                                    <i className={
                                        `bi  ${
                                            passwordValidation.caseMix ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'
                                        }`
                                    }></i>
                                    <label>At least one uppercase and one lowercase letter</label>
                                </li>
                                <li>
                                    <i className={
                                        `bi ${
                                            passwordValidation.numberSpecial ? 'bi-check-circle-fill text-success' : 'bi-circle-fill text-secondary'
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
                                        className="text-primary"/>
                                    <h6 className="mb-0 fw-semibold">Personal Information</h6>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="d-flex flex-column gap-2 text-secondary">
                                <div>
                                    <small className="d-block fw-semibold text-dark mb-1">
                                        <User size={14}
                                            className="me-2 text-muted"/>
                                        Full Name
                                    </small>
                                    <input type="text" className="form-control ms-2  mb-0" id="name"
                                        value={
                                            formData.name
                                        }
                                        onChange={handleChange}/>

                                </div>

                                <div>
                                    <small className="d-block fw-semibold text-dark mb-1">
                                        <Mail size={14}
                                            className="me-2 text-muted"/>
                                        Email
                                    </small>
                                    <input type="email" className="form-control ms-2  mb-0" id="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={handleChange}/>

                                </div>

                                <div>
                                    <small className="d-block fw-semibold text-dark mb-1">
                                        <Phone size={14}
                                            className="me-2 text-muted"/>
                                        Phone Number
                                    </small>
                                    <input type="phone" className="form-control ms-2  mb-0" id="phone"
                                        value={
                                            formData.phone
                                        }
                                        onChange={handleChange}/>

                                </div>

                                <div>
                                    <small className="d-block fw-semibold text-dark mb-1">
                                        <MapPin size={14}
                                            className="me-2 text-muted"/>
                                        Address
                                    </small>
                                    <input type="text" className="form-control ms-2  mb-0" id="address"
                                        value={
                                            formData.address
                                        }
                                        onChange={handleChange}/>
                                </div>

                                <div className="d-flex py-2 justify-content-end">
                                    <button className="btn w-50 btn-primary"
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
                                        className="text-success"/>
                                    <h6 className="mb-0 fw-semibold">Professional Details</h6>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="d-flex flex-column gap-2 text-secondary">
                                <div>
                                    <small className="d-block fw-semibold mb-1 text-dark">
                                        <Briefcase size={14}
                                            className="me-2 text-muted"/>
                                        Role Title
                                    </small>
                                    <input type="text" className="form-control ms-2  mb-0" id="roleTitle"
                                        value={
                                            formData.roleTitle
                                        }
                                        readOnly
                                        onChange={handleChange}/>
                                </div>

                                <div>
                                    <small className="d-block fw-semibold mb-1 text-dark">
                                        <Building2 size={14}
                                            className="me-2 text-muted"/>
                                        Community Name
                                    </small>
                                    <input type="text" className="form-control ms-2  mb-0" id="communityName"
                                        value={
                                            formData.communityName
                                        }
                                        readOnly
                                        onChange={handleChange}/>
                                </div>

                                <div>
                                    <small className="d-block fw-semibold mb-1 text-dark">
                                        <Layers size={14}
                                            className="me-2 text-muted"/>
                                        Assigned Blocks
                                    </small>
                                    <input type="text" className="form-control ms-2  mb-0" id="assignedBlocks"
                                        value={
                                            formData.assignedBlocks
                                        }
                                        readOnly
                                        onChange={handleChange}/>
                                </div>

                                <div>
                                    <small className="d-block fw-semibold mb-1 text-dark">
                                        <Calendar size={14}
                                            className="me-2 text-muted"/>
                                        Years of Experience
                                    </small>
                                    <input type="number" className="form-control ms-2 mb-0" id="yearsOfExperience"
                                        value={
                                            formData.yearsOfExperience
                                        }
                                        readOnly
                                        onChange={handleChange}/>
                                </div>

                                <div>
                                    <small className="d-block fw-semibold mb-1 text-dark">
                                        <Mail size={14}
                                            className="me-2 text-muted"/>
                                        Work Email
                                    </small>
                                    <input type="email" className="form-control ms-2 mb-0" id="workEmail"
                                        value={
                                            formData.workEmail
                                        }
                                        readOnly
                                        onChange={handleChange}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        } </>
    );
};
