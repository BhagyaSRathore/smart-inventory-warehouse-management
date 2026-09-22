import { useEffect, useState } from 'react';
import { fetchCurrentUser, updateCurrentUser } from '../services/api';

export default function Profile() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = await fetchCurrentUser();
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          role: user?.role || '',
        });
      } catch (requestError) {
        setError(requestError.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError('');
      await updateCurrentUser(formData);
      setMessage('Profile updated successfully.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to update profile.');
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading profile…</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account details</p>
      </div>

      <div className="card" style={{ maxWidth: '680px' }}>
        <div className="card-header">
          <h3 className="card-title">Account</h3>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} />
            </label>
            <label>
              <span>Phone</span>
              <input value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} />
            </label>
            <label>
              <span>Role</span>
              <input value={formData.role} onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))} />
            </label>
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
