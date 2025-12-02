import React, {useState} from 'react';
import {useNavigate, NavLink} from 'react-router-dom';
import '../assets/css/SignIn.css';
import logo from '../imgs/Logo.png';
import google from '../imgs/google.ico';
import facebook from '../imgs/facebook.png';
import showPass from '../imgs/showPass.svg';
import hidePass from '../imgs/hidePass.svg';
import {useSelector, useDispatch} from 'react-redux';
import {ToastContainer, toast} from 'react-toastify';
import {loginUser} from '../Slices/authSlice.js';
import 'react-toastify/dist/ReactToastify.css';

export const SignIn = () => {
    const dispatch = useDispatch();
    const {user, token} = useSelector((state) => state.auth);
    console.log(user, token);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({email: '', password: '', userType: ''});
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    const validateField = (name, value) => {
        let error = '';
        if (name === 'email') {
            if (!value.trim()) 
                error = 'Email is required';
             else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) 
                error = 'Enter a valid email';
            
            setErrors(prev => ({
                ...prev,
                email: error
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) 
            newErrors.email = 'Email is required';
         else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) 
            newErrors.email = 'Enter a valid email';
        
        if (!formData.password.trim()) 
            newErrors.password = 'Password is required';
         else if (formData.password.length < 6) 
            newErrors.password = 'Password must be at least 6 characters';
        
        if (!formData.userType) 
            newErrors.userType = 'Please select your role';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (name === 'email') 
            validateField(name, value);
        
    };

    const handleSubmit = (e) => {
        e.preventDefault();


        if (! validateForm()) {
            setAlertMessage({type: 'error', text: 'Please fix the errors above'});
            return;
        }
        dispatch(loginUser(formData)).unwrap().then((response) => {
            toast.success("Logged in successfully");

            if (formData.userType === 'communityManager') {
                navigate('/manager/dashboard')
            } else if (formData.userType === 'Resident') {
                navigate('/resident/dashboard')
            } else if (formData.userType === 'Worker') {
                navigate('/worker/dashboard')
            } else if (formData.userType === 'Security') {
                navigate('/security/dashboard')
            }


        }).catch((err) => {
            toast.error(err || "Something went wrong");
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className='SignInCon'>
            <ToastContainer/> {
            alertMessage && (
                <div className={
                    `alert ${
                        alertMessage.type
                    }`
                }>
                    {
                    alertMessage.text
                } </div>
            )
        }
            <div className="signin-container">
                <div className="left-panel">
                    <div className="logo">
                        <img src={logo}
                            alt="URBAN EASE"
                            height="30px"
                            width="130px"/>
                    </div>
                    <p className="tagline">
                        Community is built on care and trust. We're here to keep your community safe, clean, and thriving.
                    </p>
                </div>
                <div className="div1"></div>
                <div className="right-panel">
                    <h2>Login Now!</h2>
                    <p className="subtitle">Enter your information to login</p>
                    <div className="social-buttons">
                        <button className="social-btn google">
                            <img src={google}
                                alt="Google Icon"/>
                            Google
                        </button>
                        <button className="social-btn facebook">
                            <img src={facebook}
                                alt="Facebook Icon"/>
                            Facebook
                        </button>
                    </div>
                    <div className="divider">or</div>
                    <form id="LoginForm"
                        onSubmit={handleSubmit}>
                        {
                        errors.email && <p className="error-text">
                            {
                            errors.email
                        }</p>
                    }
                        <input type="email" name="email"
                            className={
                                `input ${
                                    errors.email ? 'input-error' : ''
                                }`
                            }
                            placeholder="Email Address"
                            value={
                                formData.email
                            }
                            onChange={handleChange}/>
                        <div className="password-wrap">
                            <input type={
                                    showPassword ? "text" : "password"
                                }
                                className={
                                    `input ${
                                        errors.password ? 'input-error' : ''
                                    }`
                                }
                                name="password"
                                placeholder="Password"
                                value={
                                    formData.password
                                }
                                onChange={handleChange}/>
                            <img src={
                                    showPassword ? showPass : hidePass
                                }
                                alt="Toggle Password Visibility"
                                height="20px"
                                width="40px"
                                onClick={togglePasswordVisibility}
                                style={
                                    {cursor: 'pointer'}
                                }/>
                        </div>
                        {
                        errors.password && <p className="error-text">
                            {
                            errors.password
                        }</p>
                    }
                        <select name="userType"
                            className={
                                `input ${
                                    errors.userType ? 'input-error' : ''
                                }`
                            }
                            value={
                                formData.userType
                            }
                            onChange={handleChange}>
                            <option value="" disabled>Select your role</option>
                            <option value="Resident">Resident</option>
                            <option value="Security">Security</option>
                            <option value="Worker">Worker</option>
                            <option value="communityManager">Community Manager</option>
                        </select>
                        {
                        errors.userType && <p className="error-text">
                            {
                            errors.userType
                        }</p>
                    }
                        <button type="submit" className="continue-btn">Login</button>
                    </form>
                    <div style={
                        {
                            textAlign: 'right',
                            marginTop: '5px'
                        }
                    }>
                        <NavLink to="/interestForm" className="login-link">
                            New? Register here
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
};
