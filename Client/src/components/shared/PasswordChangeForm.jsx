import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * PasswordField defined at module scope so React never remounts inputs on re-render.
 */
const PasswordField = ({ label, name, value, show, onToggleShow, onChange, disabled }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>{label}</label>
    <div className="input-group">
      <input
        type={show ? 'text' : 'password'}
        className="form-control"
        name={name}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={onToggleShow}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

/**
 * PasswordChangeForm – shared across Manager, Resident, Worker, Security
 *
 * Props:
 *   onSubmit  {function({ cp, np, cnp })} – called with password data
 *   message   {string}  – success / error message to display
 *   loading   {boolean}
 *   fieldMap  {object}  – field name overrides, defaults: { cp:'cp', np:'np', cnp:'cnp' }
 */
const PasswordChangeForm = ({ onSubmit, message = '', loading = false, fieldMap = {} }) => {
  const fields = { cp: 'cp', np: 'np', cnp: 'cnp', ...fieldMap };
  const [data, setData] = useState({ [fields.cp]: '', [fields.np]: '', [fields.cnp]: '' });
  const [validation, setValidation] = useState({ minLength: false, caseMix: false, numberSpecial: false });
  const [show, setShow] = useState({ cp: false, np: false, cnp: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (name === fields.np) {
      setValidation({
        minLength: value.length >= 8,
        caseMix: /(?=.*[a-z])(?=.*[A-Z])/.test(value),
        numberSpecial: /(?=.*[0-9!@#$%^&*])/.test(value),
      });
    }
  };

  const toggleShow = (key) => setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ ...data });
  };

  const isSuccess = message.toLowerCase().includes('success');

  return (
    <form className="ue-pwd-form" onSubmit={handleSubmit}>
      {message && (
        <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} py-2 mb-3`}>
          {message}
        </div>
      )}

      <PasswordField
        label="Current Password"
        name={fields.cp}
        value={data[fields.cp]}
        show={show.cp}
        onToggleShow={() => toggleShow('cp')}
        onChange={handleChange}
        disabled={loading}
      />

      <div className="d-flex gap-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 200 }}>
          <PasswordField
            label="New Password"
            name={fields.np}
            value={data[fields.np]}
            show={show.np}
            onToggleShow={() => toggleShow('np')}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <PasswordField
            label="Confirm Password"
            name={fields.cnp}
            value={data[fields.cnp]}
            show={show.cnp}
            onToggleShow={() => toggleShow('cnp')}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      {/* Live validation checklist */}
      <ul className="ue-pwd-requirements">
        <li className={validation.minLength ? 'valid' : 'invalid'}>
          <i className={`bi bi-${validation.minLength ? 'check-circle-fill' : 'x-circle-fill'}`} />
          Minimum 8 characters
        </li>
        <li className={validation.caseMix ? 'valid' : 'invalid'}>
          <i className={`bi bi-${validation.caseMix ? 'check-circle-fill' : 'x-circle-fill'}`} />
          One uppercase &amp; one lowercase letter
        </li>
        <li className={validation.numberSpecial ? 'valid' : 'invalid'}>
          <i className={`bi bi-${validation.numberSpecial ? 'check-circle-fill' : 'x-circle-fill'}`} />
          One number or special character
        </li>
      </ul>

      <div className="d-flex justify-content-end">
        <button type="submit" className="ue-btn ue-btn--primary" disabled={loading}>
          <i className="bi bi-key me-1" />
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  );
};

export default PasswordChangeForm;
