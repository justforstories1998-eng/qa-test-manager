import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';

function ChangePassword({ user, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res?.success) {
        toast.success('Password changed successfully!');
        const updatedUser = { ...user, mustChangePassword: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onPasswordChanged(updatedUser);
        navigate('/dashboard');
      } else { toast.error(res?.error || 'Failed to change password'); }
    } catch (err) { toast.error(err?.error || err?.message || 'Failed to change password'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-card">
          <div className="auth-title">Change Password</div>
          <div className="auth-subtitle">You must change your password before continuing</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  required
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  required minLength={6}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{ paddingLeft: 36 }}
                  required minLength={6}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem' }} disabled={isLoading}>
              {isLoading ? <><span className="loading-spinner loading-spinner-sm" style={{ borderTopColor: 'white' }} /> Changing Password...</> : 'Change Password & Continue'}
            </button>
          </form>
        </div>
      </div>
      <div className="auth-right">
        <div style={{ color: 'white', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 'var(--space-3)', lineHeight: 1.2 }}>Secure Your Account</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, lineHeight: 1.6 }}>Choose a strong password to keep your account safe.</div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
