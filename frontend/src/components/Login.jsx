import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api';
import { LiquidButton } from './ui/liquid-glass-button';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setFormVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Canvas particle animation (replaces THREE.js)
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevOverflow = document.body.style.overflow;
    document.body.style.backgroundColor = '#05050f';
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('login-active');

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const colorPalette = ['#818cf8', '#a78bfa', '#6366f1', '#c4b5fd', '#4f46e5', '#7c3aed', '#5b21b6'];
    const particleCount = 600;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 300;
      particles.push({
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius,
        baseX: 0, baseY: 0,
        size: 1 + Math.random() * 2,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        speed: 0.2 + Math.random() * 0.5,
        angle: angle,
        radius: radius,
        opacity: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      });
      particles[i].baseX = particles[i].x;
      particles[i].baseY = particles[i].y;
    }

    const orbs = [
      { x: w * 0.2, y: h * 0.3, r: 150, color: 'rgba(99,102,241,0.06)', speed: 0.15, rangeX: 80, rangeY: 60, phase: 0 },
      { x: w * 0.7, y: h * 0.6, r: 200, color: 'rgba(139,92,246,0.04)', speed: 0.1, rangeX: 100, rangeY: 80, phase: 1 },
      { x: w * 0.5, y: h * 0.2, r: 120, color: 'rgba(79,70,229,0.04)', speed: 0.12, rangeX: 60, rangeY: 50, phase: 2 },
      { x: w * 0.3, y: h * 0.7, r: 250, color: 'rgba(124,58,237,0.03)', speed: 0.08, rangeX: 120, rangeY: 100, phase: 3 },
    ];

    let mouseX = 0, mouseY = 0;
    let startTime = Date.now();
    let animationId;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / w) * 2 - 1;
      mouseY = -(e.clientY / h) * 2 + 1;
    };
    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = (Date.now() - startTime) / 1000;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, w, h);

      orbs.forEach((orb) => {
        const cx = orb.x + Math.sin(elapsed * orb.speed + orb.phase) * orb.rangeX;
        const cy = orb.y + Math.cos(elapsed * orb.speed * 0.8 + orb.phase) * orb.rangeY;
        const pulse = 1 + Math.sin(elapsed * 0.5 + orb.phase) * 0.08;
        const r = orb.r * pulse;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x = p.baseX + Math.sin(elapsed * p.speed * 0.3 + p.phase) * 15 + mouseX * 10;
        p.y = p.baseY + Math.cos(elapsed * p.speed * 0.25 + p.phase * 0.5) * 10 + mouseY * 8;

        ctx.globalAlpha = p.opacity * (0.6 + Math.sin(elapsed * p.speed + p.phase) * 0.4);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.body.style.backgroundColor = prevBg;
      document.body.style.overflow = prevOverflow;
      document.documentElement.classList.remove('login-active');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res?.success && res?.data?.token && res?.data?.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success(`Welcome back, ${res.data.user.firstName}!`);
        onLogin(res.data.user);
        navigate('/dashboard');
      } else {
        toast.error(res?.error || 'Login failed');
      }
    } catch (err) {
      toast.error(err?.error || err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <canvas ref={canvasRef} className="login-canvas" />
      <div className="login-gradient-top" />
      <div className="login-gradient-bottom" />

      <div className={`login-container ${formVisible ? 'login-visible' : ''}`}>
        {/* Left branding panel */}
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-brand-logo">
              <img src="/logo.jpg" alt="QALogs" />
            </div>
            <h2 className="login-brand-title" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '1.5px' }}>QALogs</h2>
            <p className="login-brand-tagline">Enterprise Test Management Platform</p>

            <div className="login-features">
              {[
                { icon: FiCheckCircle, text: 'Test case management & execution' },
                { icon: FiShield, text: 'Defect tracking & reporting' },
                { icon: FiArrowRight, text: 'Real-time analytics dashboard' },
              ].map((f, i) => (
                <div key={i} className="login-feature" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                  <f.icon size={14} />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="login-branding-footer">
            <span>© {new Date().getFullYear()} QALogs · Secure Login</span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-mobile-logo">
              <img src="/logo.jpg" alt="QALogs" />
              <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '1px' }}>QALogs</span>
            </div>

            <div className="login-form-header">
              <h1>Welcome back</h1>
              <p>Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
              <div className={`login-field ${focusedField === 'email' ? 'login-field-focused' : ''} ${email ? 'login-field-filled' : ''}`}>
                <label htmlFor="login-email">Email Address</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <FiUser size={16} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={`login-field ${focusedField === 'password' ? 'login-field-focused' : ''} ${password ? 'login-field-filled' : ''}`}>
                <label htmlFor="login-password">Password</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <FiLock size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <LiquidButton variant="default" size="lg" type="submit" className="login-submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="login-submit-loading">
                    <div className="login-spinner" />
                    <span>Signing in…</span>
                  </div>
                ) : (
                  <div className="login-submit-content">
                    <span>Sign In</span>
                    <FiArrowRight size={16} />
                  </div>
                )}
              </LiquidButton>
            </form>

            <div className="login-form-footer">
              <div className="login-footer-divider"><span>Need help?</span></div>
              <p>Contact your administrator for account access or password reset.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        /* ═══════ RESET AGGRESSIVELY - override any global styles ═══════ */
        .login-page,
        .login-page * {
          box-sizing: border-box;
        }
        .login-page p,
        .login-page label,
        .login-page span,
        .login-page h1,
        .login-page h2,
        .login-page div {
          background: none !important;
          background-color: transparent !important;
          border-radius: 0;
        }
        .login-page input,
        .login-page button {
          background: none;
          background-color: transparent;
          border: none;
          font-family: inherit;
        }

        /* ═══════ PAGE ═══════ */
        .login-page {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw; height: 100vh;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: #05050f !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 9999;
        }
        .login-canvas {
          position: absolute; top: 0; left: 0;
          width: 100% !important; height: 100% !important;
          z-index: 0;
        }

        .login-gradient-top {
          position: absolute; top: 0; left: 0; right: 0; height: 40%;
          background: linear-gradient(180deg, rgba(5,5,15,0.6) 0%, transparent 100%) !important;
          z-index: 1; pointer-events: none;
        }
        .login-gradient-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; height: 30%;
          background: linear-gradient(0deg, rgba(5,5,15,0.8) 0%, transparent 100%) !important;
          z-index: 1; pointer-events: none;
        }

        /* ═══════ CONTAINER ═══════ */
        .login-container {
          position: relative; z-index: 10;
          display: flex; width: 880px; max-width: 95vw;
          min-height: 540px;
          border-radius: 20px; overflow: hidden;
          background: rgba(10, 10, 26, 0.65) !important;
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 0 1px rgba(99, 102, 241, 0.05),
            0 25px 80px -12px rgba(0, 0, 0, 0.7),
            0 0 120px -20px rgba(99, 102, 241, 0.15);
          opacity: 0; transform: translateY(20px) scale(0.98);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-visible {
          opacity: 1; transform: translateY(0) scale(1);
        }

        /* ═══════ LEFT BRANDING ═══════ */
        .login-branding {
          width: 340px; flex-shrink: 0;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 44px 36px 28px;
          background: linear-gradient(160deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          position: relative; overflow: hidden;
        }
        .login-branding::before {
          content: ''; position: absolute;
          top: -50%; right: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 60%) !important;
          pointer-events: none;
        }
        .login-branding-content { position: relative; z-index: 1; }

        .login-brand-logo {
          width: 56px; height: 56px; border-radius: 14px !important;
          overflow: hidden; margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 6px 24px rgba(99, 102, 241, 0.2);
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .login-brand-logo img {
          width: 100%; height: 100%; object-fit: cover;
          display: block;
        }

        .login-brand-title {
          font-size: 32px !important;
          font-weight: 700 !important;
          margin: 0 !important;
          padding: 0 !important;
          background: none !important;
          -webkit-text-fill-color: #ffffff !important;
          color: #ffffff !important;
          letter-spacing: 1.5px;
          line-height: 1.1;
          font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif !important;
        }
        .login-brand-tagline {
          margin: 8px 0 0 !important;
          padding: 0 !important;
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #d1d5db !important;
          letter-spacing: 0.2px;
          line-height: 1.4;
          background: transparent !important;
        }

        .login-features {
          margin-top: 40px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .login-feature {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px !important;
          border-radius: 10px !important;
          background: rgba(255, 255, 255, 0.035) !important;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #e5e7eb !important;
          font-size: 12.5px;
          opacity: 0;
          animation: loginFeatureFade 0.5s ease forwards;
        }
        .login-feature svg {
          color: rgba(129, 140, 248, 0.7) !important;
          flex-shrink: 0;
        }
        .login-feature span {
          color: #e5e7eb !important;
          background: transparent !important;
        }
        @keyframes loginFeatureFade {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .login-branding-footer {
          position: relative; z-index: 1;
        }
        .login-branding-footer span {
          font-size: 11px !important;
          color: #9ca3af !important;
          background: transparent !important;
        }

        /* ═══════ RIGHT FORM ═══════ */
        .login-form-panel {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 44px;
        }
        .login-form-wrapper {
          width: 100%;
          max-width: 340px;
        }

        .login-mobile-logo {
          display: none;
          align-items: center; gap: 10px;
          margin-bottom: 28px;
        }
        .login-mobile-logo img {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .login-mobile-logo span {
          font-size: 20px !important;
          font-weight: 700 !important;
          background: none !important;
          -webkit-text-fill-color: #ffffff !important;
          color: #ffffff !important;
          letter-spacing: 1px;
          font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        }

        .login-form-header {
          margin-bottom: 28px;
        }
        .login-form-header h1 {
          margin: 0 !important;
          padding: 0 !important;
          font-size: 26px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          letter-spacing: -0.5px;
          line-height: 1.2;
          background: transparent !important;
        }
        .login-form-header p {
          margin: 8px 0 0 !important;
          padding: 0 !important;
          font-size: 14px !important;
          color: #d1d5db !important;
          font-weight: 400 !important;
          line-height: 1.5;
          background: transparent !important;
        }

        /* ── Form ── */
        .login-form {
          display: flex; flex-direction: column; gap: 18px;
        }
        .login-field {
          display: block;
        }
        .login-field label {
          display: block !important;
          margin: 0 0 8px 0 !important;
          padding: 0 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #e5e7eb !important;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: transparent !important;
          transition: color 0.2s;
        }
        .login-field-focused label {
          color: rgba(129, 140, 248, 0.9) !important;
        }

        .login-input-wrapper {
          position: relative;
          display: flex; align-items: center;
          border-radius: 12px !important;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.035) !important;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-field-focused .login-input-wrapper {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow:
            0 0 0 3px rgba(99, 102, 241, 0.1),
            0 0 20px rgba(99, 102, 241, 0.08);
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .login-field-filled .login-input-wrapper {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04) !important;
        }

        .login-input-icon {
          display: flex; align-items: center; justify-content: center;
          width: 44px; flex-shrink: 0;
          color: #9ca3af !important;
          transition: color 0.2s;
          background: transparent !important;
        }
        .login-field-focused .login-input-icon {
          color: rgba(129, 140, 248, 0.85) !important;
        }

        .login-field input {
          flex: 1;
          padding: 13px 14px 13px 0 !important;
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          outline: none !important;
          color: #ffffff !important;
          font-size: 14px !important;
          font-family: inherit !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          -webkit-appearance: none;
          appearance: none;
        }
        .login-field input::placeholder {
          color: #9ca3af !important;
        }
        .login-field input:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .login-field input:-webkit-autofill,
        .login-field input:-webkit-autofill:hover,
        .login-field input:-webkit-autofill:focus,
        .login-field input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0 1000px rgba(15, 15, 30, 0.99) inset !important;
          box-shadow: 0 0 0 1000px rgba(15, 15, 30, 0.99) inset !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .login-password-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 44px;
          background: transparent !important;
          border: none !important;
          cursor: pointer;
          color: #9ca3af !important;
          transition: color 0.15s;
          padding: 0 !important;
        }
        .login-password-toggle:hover {
          color: rgba(203, 213, 225, 0.7) !important;
        }

        /* ── Submit ── */
        .login-submit {
          margin-top: 10px;
          width: 100%;
          padding: 14px 20px !important;
          border: none !important;
          border-radius: 12px !important;
          cursor: pointer;
          font-family: inherit !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%) !important;
          color: #ffffff !important;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 4px 20px rgba(99, 102, 241, 0.35),
            0 0 40px rgba(99, 102, 241, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-submit:hover:not(:disabled) {
          box-shadow:
            0 6px 28px rgba(99, 102, 241, 0.5),
            0 0 60px rgba(99, 102, 241, 0.15);
          transform: translateY(-1px);
        }
        .login-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-submit::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%) !important;
          pointer-events: none;
        }

        .login-submit-content,
        .login-submit-loading {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; z-index: 1;
          background: transparent !important;
        }
        .login-submit-content span,
        .login-submit-loading span {
          color: #ffffff !important;
          background: transparent !important;
        }
        .login-submit-content svg {
          transition: transform 0.2s;
          color: #ffffff !important;
        }
        .login-submit:hover .login-submit-content svg {
          transform: translateX(3px);
        }

        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
        }
        @keyframes loginSpin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .login-form-footer {
          margin-top: 28px;
          text-align: center;
        }
        .login-footer-divider {
          position: relative;
          margin-bottom: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-footer-divider::before,
        .login-footer-divider::after {
          content: '';
          flex: 1; height: 1px;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .login-footer-divider span {
          padding: 0 14px !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          color: #9ca3af !important;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          background: transparent !important;
        }
        .login-form-footer p {
          margin: 0 !important;
          padding: 0 !important;
          font-size: 12px !important;
          color: #9ca3af !important;
          line-height: 1.6;
          background: transparent !important;
          font-weight: 400 !important;
        }

        /* ═══════ RESPONSIVE ═══════ */
        @media (max-width: 768px) {
          .login-branding { display: none; }
          .login-container {
            width: 100%;
            max-width: 420px;
            min-height: auto;
            margin: 20px;
          }
          .login-form-panel { padding: 36px 32px; }
          .login-mobile-logo { display: flex; }
          .login-form-header h1 { font-size: 22px !important; }
        }

        @media (max-height: 700px) {
          .login-container { min-height: auto; }
          .login-form-panel { padding: 32px 40px; }
          .login-form-header { margin-bottom: 22px; }
          .login-form { gap: 14px; }
          .login-features { display: none; }
          .login-form-footer { margin-top: 20px; }
        }
      `}</style>
    </div>
  );
}

export default Login;
