import React from 'react';
import '../../../assets/css/Loader.css'

export const Loader = () => {
    return (
        <div className="spinner-container">
            <div className="loading-spinner">
            </div>
        </div>
    );
}

export const Spinner = ({ size = 16, color = "#fff" }) => (
    <div
        style={{
            width: size,
            height: size,
            border: `2px solid ${color}30`,
            borderTop: `2px solid ${color}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            display: "inline-block",
        }}
    />
);

export const LoadingOverlay = ({ message = "Loading..." }) => (
    <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    }}>
        <Spinner size={32} color="#3b82f6" />
        <p style={{ marginTop: '12px', color: '#475569', fontWeight: 500 }}>{message}</p>
    </div>
);