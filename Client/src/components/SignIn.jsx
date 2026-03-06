import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import '../assets/css/SignIn.css';
import logo from '../imgs/Logo.png';
import google from '../imgs/google.ico';
import facebook from '../imgs/facebook.png';
import showPass from '../imgs/showPass.svg';
import hidePass from '../imgs/hidePass.svg';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { loginUser, verifyOtp } from '../Slices/authSlice.js';
import axios from 'axios';
import { Loader } from './Loader.jsx';
import { OtpInput } from './SignIn/OtpInput';
import { ForgotPasswordForm } from './SignIn/ForgotPasswordForm';

const ROLE_ROUTES = {
  communityManager: (user) => user?.subscriptionStatus && user.subscriptionStatus !== 'active' ? '/manager/subscription' : '/manager/dashboard',
  CommunityManager: (user) => user?.subscriptionStatus && user.subscriptionStatus !== 'active' ? '/manager/subscription' : '/manager/dashboard',
  Resident: () => '/resident/dashboard',
  Worker: () => '/worker/dashboard',
  Security: () => '/security/dashboard',
};

const navigateByRole = (navigate, role, user) => {
  const getRoute = ROLE_ROUTES[role];
  navigate(getRoute ? getRoute(user) : '/');
};

export const SignIn = () => {
  const dispatch = useDispatch();
  const { pending2fa, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '', userType: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordUserType, setForgotPasswordUserType] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // OTP timer
  const initialTimer = 300;
  const [secondsLeft, setSecondsLeft] = useState(initialTimer);
  const timerActive = useMemo(() => !!pending2fa && secondsLeft > 0, [pending2fa, secondsLeft]);
  const otp = otpDigits.join('');
  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  useEffect(() => {
    if (!pending2fa) { setSecondsLeft(initialTimer); return; }
    setOtpDigits(Array(6).fill(''));
    const id = setInterval(() => setSecondsLeft((s) => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(id);
  }, [pending2fa]);

  // Validation
  const validateForm = () => {
    const e = {};
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.password.trim()) e.password = 'Password is required';
    else if (formData.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!formData.userType) e.userType = 'Please select your role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (name === 'email') {
      let err = '';
      if (!value.trim()) err = 'Email is required';
      else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) err = 'Enter a valid email';
      setErrors((p) => ({ ...p, email: err }));
    }
  };

  // Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { setAlertMessage({ type: 'error', text: 'Please fix the errors above' }); return; }
    setIsSendingEmail(true);
    dispatch(loginUser(formData)).unwrap()
      .then((res) => {
        if (res?.requiresOtp) { toast.info("OTP sent to your email"); setSecondsLeft(initialTimer); return; }
        toast.success("Logged in successfully");
        navigateByRole(navigate, formData.userType, res?.user);
      })
      .catch((err) => toast.error(err || "Something went wrong"))
      .finally(() => setIsSendingEmail(false));
  };

  // OTP submit
  const submitOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    try {
      const result = await dispatch(verifyOtp({ otp, tempToken: pending2fa?.tempToken })).unwrap();
      toast.success('OTP verified');
      navigateByRole(navigate, result?.user?.userType || pending2fa?.userType, result?.user);
    } catch (err) { toast.error(err || 'Verification failed'); }
  };

  const resend = async () => {
    if (!pending2fa?.tempToken) return;
    try { setIsResending(true); await axios.post('/resend-otp', { tempToken: pending2fa.tempToken }, { withCredentials: true }); toast.success('OTP resent'); setSecondsLeft(initialTimer); }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed to resend OTP'); }
    finally { setIsResending(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) { toast.error('Please enter your email'); return; }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(forgotPasswordEmail)) { toast.error('Please enter a valid email'); return; }
    if (!forgotPasswordUserType) { toast.error('Please select your role'); return; }
    try {
      setIsSendingReset(true);
      const res = await axios.post('/forgot-password', { email: forgotPasswordEmail, userType: forgotPasswordUserType }, { withCredentials: true });
      if (res.data.success) { toast.success('Password reset email sent!'); setShowForgotPassword(false); setForgotPasswordEmail(''); setForgotPasswordUserType(''); }
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to send reset email'); }
    finally { setIsSendingReset(false); }
  };

  return (
    <div className='SignInCon'>
      {(isSendingEmail || isResending) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, flexDirection: 'column' }}>
          <Loader /><div style={{ marginTop: 12, color: '#333', fontWeight: 500 }}>{isResending ? 'Resending OTP…' : 'Sending OTP…'}</div>
        </div>
      )}
      <ToastContainer />
      {alertMessage && <div className={`alert ${alertMessage.type}`}>{alertMessage.text}</div>}

      <div className="signin-container">
        <div className="left-panel">
          <div className="logo"><img src={logo} alt="URBAN EASE" height="30px" width="130px" /></div>
          <p className="tagline">Community is built on care and trust. We're here to keep your community safe, clean, and thriving.</p>
        </div>
        <div className="div1" />
        <div className="right-panel">
          {!pending2fa ? (
            <>
              <h2>Login Now!</h2>
              <p className="subtitle">Enter your information to login</p>
              <div className="social-buttons">
                <button className="social-btn google"><img src={google} alt="Google Icon" /> Google</button>
                <button className="social-btn facebook"><img src={facebook} alt="Facebook Icon" /> Facebook</button>
              </div>
              <div className="divider">or</div>
              <form id="LoginForm" onSubmit={handleSubmit}>
                {errors.email && <p className="error-text">{errors.email}</p>}
                <input type="email" name="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="Email Address" value={formData.email} onChange={handleChange} />
                <div className="password-wrap">
                  <input type={showPassword ? "text" : "password"} className={`input ${errors.password ? 'input-error' : ''}`} name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
                  <img src={showPassword ? showPass : hidePass} alt="Toggle" height="20px" width="40px" onClick={() => setShowPassword((p) => !p)} style={{ cursor: 'pointer' }} />
                </div>
                {errors.password && <p className="error-text">{errors.password}</p>}
                <select name="userType" className={`input ${errors.userType ? 'input-error' : ''}`} value={formData.userType} onChange={handleChange}>
                  <option value="" disabled>Select your role</option>
                  <option value="Resident">Resident</option>
                  <option value="Security">Security</option>
                  <option value="Worker">Worker</option>
                  <option value="communityManager">Community Manager</option>
                </select>
                {errors.userType && <p className="error-text">{errors.userType}</p>}
                <button type="submit" className="continue-btn">Login</button>
              </form>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="login-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Forgot Password?</button>
                <NavLink to="/interestForm" className="login-link">New? Register here</NavLink>
              </div>
            </>
          ) : (
            <>
              <h2>Enter OTP</h2>
              <p className="subtitle">We sent a code to <strong>{pending2fa.email}</strong></p>
              <div className="divider">OTP Verification</div>
              <form onSubmit={submitOtp}>
                <OtpInput digits={otpDigits} setDigits={setOtpDigits} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ color: '#666' }}>Time left: <strong>{mmss}</strong></span>
                  <button type="button" className="login-link" onClick={resend} disabled={timerActive} style={{ background: 'transparent', border: 'none', color: timerActive ? '#aaa' : '#0d6efd', cursor: timerActive ? 'not-allowed' : 'pointer' }}>Resend OTP</button>
                </div>
                <button type="submit" className="continue-btn" disabled={!otp || otp.length !== 6 || secondsLeft === 0 || loading} style={{ marginTop: 12 }}>
                  {loading ? 'Verifying…' : secondsLeft === 0 ? 'OTP expired' : 'Verify'}
                </button>
              </form>
            </>
          )}
        </div>

        {showForgotPassword && (
          <ForgotPasswordForm email={forgotPasswordEmail} setEmail={setForgotPasswordEmail} userType={forgotPasswordUserType} setUserType={setForgotPasswordUserType} isSending={isSendingReset} onSubmit={handleForgotPassword} onCancel={() => setShowForgotPassword(false)} />
        )}
      </div>
    </div>
  );
};
