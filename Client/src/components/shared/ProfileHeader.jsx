import React from 'react';
import { Camera } from 'lucide-react';

/**
 * ProfileHeader – shared across Manager, Resident, Worker, Security
 *
 * Props:
 *   initials      {string}   – e.g. "LG"
 *   imageSrc      {string}   – optional image URL
 *   name          {string}
 *   role          {string}   – e.g. "Community Manager"
 *   subtitle      {string}   – e.g. location / unit code (optional)
 *   onImageChange {function} – called with the File object
 *   actionLabel   {string}   – button label, e.g. "Change Password"
 *   onAction      {function}
 */
const ProfileHeader = ({
  initials = '?',
  imageSrc,
  name,
  role,
  subtitle,
  onImageChange,
  actionLabel,
  onAction,
}) => {
  const inputId = `ue-profile-img-${Math.random().toString(36).slice(2)}`;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onImageChange) onImageChange(file);
  };

  return (
    <div className="ue-card ue-profile-header">
      <div className="ue-profile-header__left">
        {/* Avatar */}
        <div className="ue-avatar">
          {imageSrc ? (
            <img src={imageSrc} alt={name} className="ue-avatar__img" />
          ) : (
            <span>{initials}</span>
          )}
          {onImageChange && (
            <>
              <label htmlFor={inputId} className="ue-avatar__cam-btn" title="Change photo">
                <Camera size={13} />
              </label>
              <input
                type="file"
                id={inputId}
                accept="image/*"
                onChange={handleFile}
                hidden
              />
            </>
          )}
        </div>

        {/* Text info */}
        <div>
          <p className="ue-profile-header__name">{name || 'Loading…'}</p>
          {role     && <p className="ue-profile-header__role">{role}</p>}
          {subtitle && <p className="ue-profile-header__role" style={{ marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>

      {/* Toggle action button */}
      {onAction && (
        <button className="ue-btn ue-btn--outline" onClick={onAction}>
          {actionLabel || 'Action'}
        </button>
      )}
    </div>
  );
};

export default ProfileHeader;
