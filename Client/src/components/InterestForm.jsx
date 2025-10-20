import { NavLink } from 'react-router-dom';
import '../assets/css/InterestForm.css';


export const InterestForm = () => {
    return (
        <div className='interestFormCon'>
            <div id="alertBox" className="alert">
                <span id="alertMessage"></span>
                <button className="close-btn" onClick="hideAlert()">&times;</button>
            </div>

            <div className="container">
                <form id="combinedForm" method="POST" encType="multipart/form-data">
                    <div className="header">
                        <h2>Community & Manager Registration</h2>
                        <p className="subtitle">Tell us about yourself and the community you manage</p>
                    </div>

                    <div className="form-content">
                        <div className="form-panel">
                            <h3 className="form-section-title">Personal Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label for="firstName">First Name *</label>
                                    <input type="text" id="firstName" name="firstName" required />
                                </div>
                                <div className="form-group">
                                    <label for="lastName">Last Name *</label>
                                    <input type="text" id="lastName" name="lastName" required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label for="email">Email Address *</label>
                                    <input type="email" id="email" name="email" required />
                                </div>
                                <div className="form-group">
                                    <label for="phone">Phone Number *</label>
                                    <input type="tel" id="phone" name="phone" required />
                                </div>
                            </div>
                        </div>

                        <div className="form-panel">
                            <h3 className="form-section-title">Community Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label for="communityName">Community Name *</label>
                                    <input type="text" id="communityName" name="communityName" required />
                                </div>


                                <div className="form-group">
                                    <label for="location">City *</label>
                                    <select id="location" name="location" required >
                                        <option value="">-- Select a City --</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Kolkata">Kolkata</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                            </div>
                            <div className="form-group" id="otherCityGroup" style={{ display: 'none' }}>
                                <label for="otherCity">Enter Your City *</label>
                                <input type="text" id="otherCity" name="otherCity" placeholder="Type your city name" />
                            </div>

                            <div className="form-group">
                                <label for="description">Community Description *</label>
                                <textarea id="description" name="description" placeholder="A brief description of your community..." required></textarea>
                            </div>

                            <div className="form-group">
                                <label>Community Photos (Optional)</label>
                                <div className="photo-upload-area" onClick="document.getElementById('photoInput').click()">
                                    <div>📷</div>
                                    <p>Click to upload photos</p>
                                    <p style={{fontSize: '0.8em', color: '#666'}}>Upload up to 5 photos of your community</p>
                                </div>
                                <input type="file" id="photoInput" name="photos" multiple accept="image/*" style={{display: 'none'}} />
                                    <div id="photoPreviewGrid" className="photo-preview-grid" style={{display: 'none'}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="submit-btn">Submit Application</button>
                        <div className="login-link">
                            <NavLink to="/SignIn">Already have an account? Login here</NavLink>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}