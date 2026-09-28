import { useEffect, useState } from "react";
import { User, Mail, Phone, Shield, Save, CheckCircle } from "lucide-react";
import { fetchCurrentUser, updateCurrentUser } from "../services/api";

export default function Profile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = await fetchCurrentUser();

        setFormData({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          role: user?.role || "",
        });
      } catch (requestError) {
        setError(requestError.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage("");
      setError("");

      const updatedUser = await updateCurrentUser(formData);

      setFormData({
        name: updatedUser?.name || "",
        email: updatedUser?.email || "",
        phone: updatedUser?.phone || "",
        role: updatedUser?.role || "",
      });

      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* Header */}
      <div className="profile-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            Manage your personal information and account details
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="profile-card">

        {/* Profile Top */}
        <div className="profile-card-top">
          <div className="profile-avatar">
            {formData.name
              ? formData.name.charAt(0).toUpperCase()
              : "A"}
          </div>

          <div>
            <h2>
              {formData.name || "Admin User"}
            </h2>

            <p>
              {formData.role || "Administrator"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="profile-divider" />

        <form onSubmit={handleSubmit}>

          <div className="profile-section-title">
            <h3>Account Information</h3>
            <p>Update your account details below.</p>
          </div>

          <div className="profile-form-grid">

            {/* Name */}
            <div className="profile-field">
              <label htmlFor="name">
                <User size={16} />
                Full Name
              </label>

              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            {/* Email */}
            <div className="profile-field">
              <label htmlFor="email">
                <Mail size={16} />
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>

            {/* Phone */}
            <div className="profile-field">
              <label htmlFor="phone">
                <Phone size={16} />
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Role */}
            <div className="profile-field">
              <label htmlFor="role">
                <Shield size={16} />
                Role
              </label>

              <input
                id="role"
                name="role"
                value={formData.role}
                readOnly
              />

              <small>
                Your account role cannot be changed here.
              </small>
            </div>

          </div>

          {/* Messages */}
          {message && (
            <div className="profile-success">
              <CheckCircle size={18} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="profile-error">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="profile-actions">
            <button
              type="submit"
              className="profile-save-btn"
              disabled={isSubmitting}
            >
              <Save size={17} />

              {isSubmitting
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}