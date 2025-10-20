import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import '../assets/css/LandingPage.css'
import { NavLink } from "react-router-dom";
import logo from '../imgs/URBAN_EASE.png'

export const Landingpage = () => {
  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top w-100 p-0">
        <div className="container-fluid d-flex align-items-between mx-2 px-0">
          <NavLink className="navbar-brand mx-2" href="#">
            <img src={logo} alt="xxxx" />
          </NavLink>

          <button
            className="navbar-toggler ms-auto text-white border-white my-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="collapse navbar-collapse w-100 justify-content-end"
            id="navbarNav"
          >
            <ul className="navbar-nav d-flex align-items-lg-center align-items-start flex-lg-row flex-column">
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#home">
                  Home
                </a>
              </li>
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#benefits">
                  Benefits
                </a>
              </li>
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#services">
                  Services
                </a>
              </li>
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#testimonials">
                  Testimonials
                </a>
              </li>
              <li className="nav-item px-3 py-2">
                <a className="nav-link" href="#contact">
                  Contact
                </a>
              </li>
              <li className="nav-item px-3 py-2">
                <NavLink className="btn btn-primary" to="/SignIn">
                  Login
                </NavLink>
              </li>
              <li className="nav-item px-3 py-2">
                <NavLink className="btn btn-secondary" to="/interestForm">
                  Register
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="gap"></div>

      <section id="home" className="hero text-center">
        <div className="overlay"></div>
        <div className="container text-center">
          <div className="hero-content">
            <h1 className="display-4 fw-bold mb-4">
              Find the Perfect Gated Community for You
            </h1>
            <p className="lead mb-5">
              Experience premium living with enhanced security, exclusive
              amenities, and a vibrant community lifestyle.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <a
                href="#Registered_Commmunities"
                className="btn btn-primary btn-lg"
              >
                Explore Communities
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">
              Why Choose a Gated Community?
            </h2>
            <p className="lead text-muted">
              Discover the advantages of exclusive community living
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                icon: "fas fa-shield-alt",
                title: "Enhanced Security",
                text: "24/7 security personnel, surveillance systems, and controlled access points ensure your family's safety.",
              },
              {
                icon: "fas fa-swimming-pool",
                title: "Premium Amenities",
                text: "Enjoy access to swimming pools, fitness centers, parks, and recreational facilities.",
              },
              {
                icon: "fas fa-users",
                title: "Community Living",
                text: "Build meaningful connections with neighbors who share similar values and lifestyles.",
              },
              {
                icon: "fas fa-bolt",
                title: "Seamless Utilities",
                text: "Uninterrupted power, reliable water, and well-maintained infrastructure.",
              },
            ].map((item, index) => (
              <div className="col-12 col-sm-6 col-lg-3" key={index}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div className="feature-icon mb-3">
                      <i className={`${item.icon} fa-3x text-primary`}></i>
                    </div>
                    <h3 className="h4 mb-3">{item.title}</h3>
                    <p className="text-muted">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <h5 className="mb-3">URBAN EASE</h5>
              <p className="mb-3">
                The premier platform for gated community management and
                discovery.
              </p>
            </div>

            <div className="col-md-2">
              <h5 className="mb-3">Resources</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    FAQ
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Privacy Policy
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-white text-decoration-none">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <hr className="my-4" />
          <div className="row g-4">
            <div className="col-md-6">
              <p className="mb-md-0">
                © 2025 URBAN EASE. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
