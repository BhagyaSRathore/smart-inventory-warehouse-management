import { useEffect, useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Building2,
  Boxes,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Info,
  Lock,
} from 'lucide-react';
import { changePassword } from '../services/api';

export default function Settings() {
  // =========================
  // PASSWORD STATE
  // =========================
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // =========================
  // WAREHOUSE STATE
  // =========================
  const [warehouseSettings, setWarehouseSettings] = useState({
    defaultWarehouse: '',
    defaultRack: '',
  });

  const [warehouseMessage, setWarehouseMessage] = useState('');
  const [warehouseError, setWarehouseError] = useState('');

  // =========================
  // INVENTORY STATE
  // =========================
  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: '10',
    defaultSafetyStock: '5',
    lowStockWarning: true,
  });

  const [inventoryMessage, setInventoryMessage] = useState('');
  const [inventoryError, setInventoryError] = useState('');

  // =========================
  // LOAD SAVED SETTINGS
  // =========================
  useEffect(() => {
    try {
      const savedWarehouse = localStorage.getItem('warehousePreferences');
      const savedInventory = localStorage.getItem('inventoryPreferences');

      if (savedWarehouse) {
        setWarehouseSettings(JSON.parse(savedWarehouse));
      }

      if (savedInventory) {
        setInventorySettings(JSON.parse(savedInventory));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // =========================
  // PASSWORD HANDLERS
  // =========================
  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordMessage('');
    setPasswordError('');
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', score: 0, color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { label: 'Weak', score, color: '#ef4444' };
    if (score <= 3) return { label: 'Medium', score, color: '#f59e0b' };
    return { label: 'Strong', score, color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setPasswordMessage(
        response?.message ||
          'Password updated successfully! Please use your new password next time you sign in.'
      );

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordError(
        error?.data?.message ||
          error?.message ||
          'Current password is incorrect or unable to update password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================
  // WAREHOUSE HANDLERS
  // =========================
  const handleWarehouseChange = (event) => {
    const { name, value } = event.target;
    setWarehouseSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
    setWarehouseMessage('');
    setWarehouseError('');
  };

  const handleWarehouseSubmit = (event) => {
    event.preventDefault();
    setWarehouseMessage('');
    setWarehouseError('');

    try {
      localStorage.setItem(
        'warehousePreferences',
        JSON.stringify(warehouseSettings)
      );
      setWarehouseMessage('Warehouse preferences saved successfully.');
    } catch (error) {
      console.error(error);
      setWarehouseError('Failed to save warehouse preferences.');
    }
  };

  // =========================
  // INVENTORY HANDLERS
  // =========================
  const handleInventoryChange = (event) => {
    const { name, value, checked, type } = event.target;
    setInventorySettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setInventoryMessage('');
    setInventoryError('');
  };

  const handleInventorySubmit = (event) => {
    event.preventDefault();
    setInventoryMessage('');
    setInventoryError('');

    try {
      localStorage.setItem(
        'inventoryPreferences',
        JSON.stringify(inventorySettings)
      );
      setInventoryMessage('Inventory preferences saved successfully.');
    } catch (error) {
      console.error(error);
      setInventoryError('Failed to save inventory preferences.');
    }
  };

  return (
    <div className="settings-page">
      {/* =========================
          PAGE HEADER
      ========================= */}
      <div className="settings-page-header">
        <div>
          <h1 className="settings-page-title">System Settings</h1>
          <p className="settings-page-subtitle">
            Configure your security credentials, default warehouse routing, and inventory threshold alerts
          </p>
        </div>
      </div>

      {/* =========================
          SECURITY CARD
      ========================= */}
      <section className="settings-card security-card">
        <div className="settings-card-header">
          <div className="settings-card-icon security-icon">
            <ShieldCheck size={20} color="#4f46e5" />
          </div>
          <div>
            <h2>Security & Password</h2>
            <p>Update your administrator access password to keep your warehouse account secure</p>
          </div>
        </div>

        <div className="settings-card-body">
          <form onSubmit={handlePasswordSubmit}>
            <div className="password-grid">
              {/* CURRENT PASSWORD */}
              <div className="settings-field">
                <label>Current Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter existing password"
                    autoComplete="current-password"
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* NEW PASSWORD */}
              <div className="settings-field">
                <label>New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new strong password"
                    autoComplete="new-password"
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordData.newPassword && (
                  <div style={{ marginTop: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#6b7280' }}>Strength:</span>
                    <span style={{ fontWeight: 600, color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                    <div style={{ flex: 1, height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          height: '100%',
                          background: passwordStrength.color,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
                {!passwordData.newPassword && (
                  <span className="field-hint">Minimum 6 characters</span>
                )}
              </div>

              {/* CONFIRM NEW PASSWORD */}
              <div className="settings-field">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {passwordMessage && (
              <div className="settings-alert success" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#047857" style={{ flexShrink: 0 }} />
                <span>{passwordMessage}</span>
              </div>
            )}

            {passwordError && (
              <div className="settings-alert error" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="settings-actions">
              <button
                type="submit"
                className="settings-primary-btn"
                disabled={passwordLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <KeyRound size={16} />
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* =========================
          PREFERENCES GRID
      ========================= */}
      <div className="settings-preferences-grid">
        {/* WAREHOUSE PREFERENCES */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon warehouse-icon">
              <Building2 size={20} color="#0284c7" />
            </div>
            <div>
              <h2>Warehouse Preferences</h2>
              <p>Configure default fulfillment warehouse and placement racks</p>
            </div>
          </div>

          <div className="settings-card-body">
            <form onSubmit={handleWarehouseSubmit}>
              <div className="settings-field">
                <label>Default Warehouse</label>
                <select
                  name="defaultWarehouse"
                  value={warehouseSettings.defaultWarehouse}
                  onChange={handleWarehouseChange}
                >
                  <option value="">Select warehouse</option>
                  <option value="main">Main Warehouse (Jodhpur)</option>
                  <option value="secondary">Secondary Warehouse (Jaipur)</option>
                </select>
              </div>

              <div className="settings-field">
                <label>Default Rack</label>
                <select
                  name="defaultRack"
                  value={warehouseSettings.defaultRack}
                  onChange={handleWarehouseChange}
                >
                  <option value="">Select rack</option>
                  <option value="rack-a">Rack A (High Velocity)</option>
                  <option value="rack-b">Rack B (Standard Items)</option>
                  <option value="rack-c">Rack C (Bulk / Overflow)</option>
                </select>
              </div>

              <div className="settings-info-box" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Info size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>
                  Your default warehouse and rack will automatically prefill when receiving or transferring inventory.
                </p>
              </div>

              {warehouseMessage && (
                <div className="settings-alert success" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#047857" style={{ flexShrink: 0 }} />
                  <span>{warehouseMessage}</span>
                </div>
              )}

              {warehouseError && (
                <div className="settings-alert error" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{warehouseError}</span>
                </div>
              )}

              <div className="settings-actions">
                <button
                  type="submit"
                  className="settings-primary-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* INVENTORY PREFERENCES */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon inventory-icon">
              <Boxes size={20} color="#059669" />
            </div>
            <div>
              <h2>Inventory & Stock Alerts</h2>
              <p>Configure low stock thresholds and automatic restock triggers</p>
            </div>
          </div>

          <div className="settings-card-body">
            <form onSubmit={handleInventorySubmit}>
              <div className="settings-field">
                <label>Low Stock Threshold (Units)</label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  min="0"
                  value={inventorySettings.lowStockThreshold}
                  onChange={handleInventoryChange}
                  placeholder="e.g. 10"
                />
                <span className="field-hint">
                  Triggers visual alerts when product stock drops below this count.
                </span>
              </div>

              <div className="settings-field">
                <label>Default Safety Stock Buffer</label>
                <input
                  type="number"
                  name="defaultSafetyStock"
                  min="0"
                  value={inventorySettings.defaultSafetyStock}
                  onChange={handleInventoryChange}
                  placeholder="e.g. 5"
                />
                <span className="field-hint">
                  Reserved units maintained to prevent unexpected stockouts.
                </span>
              </div>

              <div className="inventory-toggle">
                <div>
                  <strong>Low Stock Notification Warnings</strong>
                  <p>Display real-time alerts in dashboard topbar and notifications tab.</p>
                </div>

                <label className="settings-switch">
                  <input
                    type="checkbox"
                    name="lowStockWarning"
                    checked={inventorySettings.lowStockWarning}
                    onChange={handleInventoryChange}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              {inventoryMessage && (
                <div className="settings-alert success" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#047857" style={{ flexShrink: 0 }} />
                  <span>{inventoryMessage}</span>
                </div>
              )}

              {inventoryError && (
                <div className="settings-alert error" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{inventoryError}</span>
                </div>
              )}

              <div className="settings-actions">
                <button
                  type="submit"
                  className="settings-primary-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}