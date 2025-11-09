import React, { useState } from 'react';
import '../assets/css/SignIn.css';
import logo from '../imgs/Logo.png'
import google from '../imgs/google.ico'
import facebook from '../imgs/facebook.png'
import showPass from '../imgs/showPass.svg'
import hidePass from '../imgs/hidePass.svg'
import { NavLink, useNavigate } from 'react-router-dom'; //  import useNavigate

export const SignIn = () => {
  const navigate = useNavigate(); //  hook for navigation
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: '',
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMessage({ type: 'info', text: 'Logging in...' });

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        credentials: 'include', // send cookies/session
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.text();
        setAlertMessage({
          type: 'error',
          text: error || 'Invalid credentials. Please try again.',
        });
        return;
      }

      //  On success — navigate within React app
      setAlertMessage({ type: 'success', text: 'Login successful!' });

      switch (formData.userType) {
        case 'Resident':
          navigate('/resident/dashboard');
          break;
        case 'Security':
          navigate('/security/dashboard');
          break;
        case 'Worker':
          navigate('/worker/dashboard');
          break;
        case 'communityManager':
          navigate('/manager/dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAlertMessage({
        type: 'error',
        text: 'Server not reachable. Please check your connection.',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

    return (
    <div className='SignInCon'>
      {alertMessage && (
        <div className={`alert ${alertMessage.type}`}>
          {alertMessage.text}
        </div>
      )}

      <div className="signin-container">
        <div className="left-panel">
          <div className="logo">
            <img src={logo} alt="URBAN EASE" height="30px" width="130px" />
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
              <img src={google} alt="Google Icon" />
              Google
            </button>
            <button className="social-btn facebook">
              <img src={facebook} alt="Facebook Icon" />
              Facebook
            </button>
          </div>

          <div className="divider">or</div>

          <form id="LoginForm" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              id="email"
              className="input"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className='input'
                name="password"
                id="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <img
                src={showPassword ? showPass : hidePass}
                id="img"
                alt="Toggle Password Visibility"
                height="20px"
                width="40px"
                onClick={togglePasswordVisibility}
                style={{ cursor: 'pointer' }}
              />
            </div>

            <select
              name="userType"
              id="userType"
              className="input"
              value={formData.userType}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select your role</option>
              <option value="Resident">Resident</option>
              <option value="Security">Security</option>
              <option value="Worker">Worker</option>
              <option value="communityManager">Community Manager</option>
            </select>

            <button type="submit" className="continue-btn">Login</button>
          </form>

          <div style={{ textAlign: 'right', marginTop: '5px' }}>
            <NavLink to="/interestForm" className="login-link">
              New? Register here
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     userType: '',
//   });
//   const [alertMessage, setAlertMessage] = useState(null);
//   const [showPassword, setShowPassword] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prevData => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setAlertMessage({ type: 'success', text: 'Logging in...' });
//     console.log('Login attempt with:', formData);
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(prev => !prev);
//   };

//   return (
//     <div className='SignInCon'>
//       {alertMessage && (
//         <div className={`alert ${alertMessage.type}`}>
//           {alertMessage.text}
//         </div>
//       )}

//       <div className="signin-container">
//         <div className="left-panel">
//           <div className="logo">
//             <img src={logo} alt="URBAN EASE" height="30px" width="130px" />
//           </div>
//           <p className="tagline">
//             Community is built on care and trust. We're here to keep your community safe, clean, and thriving.
//           </p>
//         </div>

//         <div className="div1"></div>

//         <div className="right-panel">
//           <h2>Login Now!</h2>
//           <p className="subtitle">Enter your information to login</p>

//           <div className="social-buttons">
//             <button className="social-btn google">
//               <img src={google} alt="Google Icon" />
//               Google
//             </button>
//             <button className="social-btn facebook">
//               <img src={facebook} alt="Facebook Icon" />
//               Facebook
//             </button>
//           </div>

//           <div className="divider">or</div>

//           <form id="LoginForm" onSubmit={handleSubmit}>
//             <input
//               type="email"
//               name="email"
//               id="email"
//               className="input"
//               placeholder="Email Address"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />

//             <div className="password-wrap">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 className='input'
//                 name="password"
//                 id="password"
//                 placeholder="Password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 required
//               />
//               <img
//                 src={showPassword ? showPass : hidePass}
//                 id="img"
//                 alt="Toggle Password Visibility"
//                 height="20px"
//                 width="40px"
//                 onClick={togglePasswordVisibility}
//                 style={{ cursor: 'pointer' }}
//               />
//             </div>

//             <select
//               name="userType"
//               id="userType"
//               className="input"
//               value={formData.userType}
//               onChange={handleChange}
//               required
//             >
//               <option value="" disabled>Select your role</option>
//               <option value="Resident">Resident</option>
//               <option value="Security">Security</option>
//               <option value="Worker">Worker</option>
//               <option value="communityManager">Community Manager</option>
//             </select>

//             <button type="submit" className="continue-btn">Login</button>
//           </form>

//           <div style={{ textAlign: 'right', marginTop: '5px' }}>
//             <NavLink to="/interestForm" className="login-link">
//               New? Register here
//             </NavLink>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
