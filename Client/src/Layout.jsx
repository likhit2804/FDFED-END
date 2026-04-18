import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Navbar } from "./components/Navbar";
import "./assets/css/Layout.css";

export const Layout = ({ userType, ads }) => {
  const location = useLocation();
  const [adsState, setAdsState] = useState(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetchAds = () => {
    setRefreshTrigger((previous) => previous + 1);
  };

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch("/ads", { credentials: "include" });
        if (!response.ok) return;

        const json = await response.json();
        if (json && Array.isArray(json.ads)) {
          setAdsState(json.ads);
          setCurrent(0);
        }
      } catch (error) {
        console.error("Failed to fetch ads:", error);
      }
    };

    fetchAds();
  }, [ads, refreshTrigger]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    const slideList = adsState && adsState.length > 0 ? adsState : ads || [];
    if (slideList.length <= 1) return;

    const timer = setInterval(() => {
      if (paused) return;
      setCurrent((previous) => (previous + 1) % slideList.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [adsState, ads, paused]);

  const slides = adsState && adsState.length > 0 ? adsState : ads || [];
  const canNavigate = slides.length > 1;

  const prev = () => setCurrent((previous) => (previous - 1 + slides.length) % slides.length);
  const next = () => setCurrent((previous) => (previous + 1) % slides.length);

  return (
    <>
      <Navbar userType={userType} />

      <div className="bodyContainer">
        <div className="adCon d-flex justify-content-center align-items-center">
          <div className="advertisement" id="ad-slider">
            {!slides || slides.length === 0 ? (
              <div className="ad-empty-box">
                <p className="ad-empty-box__title">Advertisement</p>
                <p className="ad-empty-box__sub">Community banners will appear here.</p>
              </div>
            ) : (
              <div
                className="ad-slider-inner"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                {canNavigate ? (
                  <button className="ad-nav ad-prev" onClick={prev} aria-label="Previous">
                    <ChevronLeft size={18} />
                  </button>
                ) : null}

                {slides.map((ad, index) => {
                  const imagePath = (ad.imagePath || ad.path || ad.image || "").replace(/\\/g, "/");
                  return (
                    <img
                      key={ad._id || index}
                      src={`/${imagePath}`}
                      className={`ad-slide ${index === current ? "active" : ""}`}
                      alt={ad.title || "Ad"}
                      onClick={() => {
                        if (ad?.link) window.open(ad.link, "_blank");
                      }}
                    />
                  );
                })}

                {canNavigate ? (
                  <button className="ad-nav ad-next" onClick={next} aria-label="Next">
                    <ChevronRight size={18} />
                  </button>
                ) : null}

                {canNavigate ? (
                  <div className="ad-indicators">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        className={`ad-indicator ${index === current ? "active" : ""}`}
                        onClick={() => setCurrent(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="contentCon">
          <Outlet context={{ onAdCreated: refetchAds }} />
        </div>
      </div>
    </>
  );
};
