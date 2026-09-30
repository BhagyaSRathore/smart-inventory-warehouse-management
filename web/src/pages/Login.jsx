import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, PackageCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: 'admin@inventory.com', password: 'admin123' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/dashboard';
    navigate(redirectTo, { replace: true });
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await login({ email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      const message = requestError?.data?.message || requestError?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #eef2ff 0%, #f9fafb 40%, #ecfeff 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '24px',
        boxShadow: '0 20px 55px rgba(17, 24, 39, 0.12)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '32px 32px 20px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #1d4ed8 100%)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PackageCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.8 }}>Warehouse OS</div>
              <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 700 }}>SmartInventory</h1>
            </div>
          </div>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6 }}>Secure inventory, warehouse, and order management for your operations team.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '28px', color: '#111827' }}>Welcome back</h2>
            <p style={{ margin: 0, color: '#6b7280' }}>Sign in to continue managing inventory</p>
          </div>

          {error && (
            <div role="alert" style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '18px' }}>
            <label style={{ display: 'grid', gap: '8px', color: '#374151', fontWeight: 600 }}>
              <span>Email</span>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="you@company.com"
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
                />
              </div>
            </label>

            <label style={{ display: 'grid', gap: '8px', color: '#374151', fontWeight: 600 }}>
              <span>Password</span>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={{ width: '100%', padding: '14px 52px 14px 44px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '24px',
              width: '100%',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: '0 10px 18px rgba(79, 70, 229, 0.25)'
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{ marginTop: '18px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
            Demo access: admin@inventory.com / admin123
          </div>
        </form>
      </div>
    </div>
  );
}
