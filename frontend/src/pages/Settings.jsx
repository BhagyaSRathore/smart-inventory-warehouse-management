import { useState } from 'react';
import { changePassword } from '../services/api';

export default function Settings() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.currentPassword || !formData.newPassword) {
      setError('Current password and new password are required.');
      setMessage('');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password confirmation does not match.');
      setMessage('');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setMessage('Password updated successfully.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (requestError) {
      setError(requestError.message || 'Unable to change password.');
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Update account and security preferences</p>
      </div>

      <div className="card" style={{ maxWidth: '680px' }}>
        <div className="card-header">
          <h3 className="card-title">Security</h3>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="full-width">
              <span>Current Password</span>
              <input type="password" value={formData.currentPassword} onChange={(event) => setFormData((prev) => ({ ...prev, currentPassword: event.target.value }))} />
            </label>
            <label className="full-width">
              <span>New Password</span>
              <input type="password" value={formData.newPassword} onChange={(event) => setFormData((prev) => ({ ...prev, newPassword: event.target.value }))} />
            </label>
            <label className="full-width">
              <span>Confirm New Password</span>
              <input type="password" value={formData.confirmPassword} onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
            </label>
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
