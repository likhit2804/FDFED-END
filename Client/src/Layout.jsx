import { Navbar } from "./components/Navbar"
import { Outlet, useParams } from "react-router-dom"
import './assets/css/Layout.css'

export const Layout = ({ userType , ads }) => {
    return (
        <>
            <Navbar userType={userType} />
            <div className="bodyContainer">
                <div className="adCon d-flex justify-content-center align-items-center">
                    <div className="advertisement" id="ad-slider">
                        {
                            ads ? (
                                ads?.map((ad, index) => (
                                    <img
                                        key={index}
                                        src={`http://localhost:3000/${ad.imagePath.replace(/\\/g, '/')}`}
                                        className="ad-slide"
                                        alt="Ad"
                                        height="100px"
                                        width="200px"
                                    />
                                ))
                            ) : (
                                <div
                                    className="d-flex justify-content-center align-items-center"
                                    style={{
                                        backgroundColor: "rgba(158, 207, 250, 0.539)",
                                        borderRadius: "8px",
                                        color: "rgb(0, 80, 193)",
                                        border: "3px dotted blue",
                                        height: "100%",
                                        width: "100%"
                                    }}
                                >
                                    <p className="ad-text fs-4" style={{ fontWeight: 600 }}>Advertisement</p>
                                </div>
                            )
                        }

                    </div>
                </div>

                <div className="contentCon">
                    <Outlet />
                </div>
            </div>

        </>
    )
}