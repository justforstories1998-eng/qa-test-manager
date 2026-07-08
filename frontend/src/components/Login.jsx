import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as THREE from 'three';
import api from '../api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setFormVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Three.js particle animation — ENHANCED
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#05050f';

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05050f, 1);

    // ── Enhanced particles ──
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorPalette = [
      new THREE.Color('#818cf8'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#6366f1'),
      new THREE.Color('#c4b5fd'),
      new THREE.Color('#4f46e5'),
      new THREE.Color('#7c3aed'),
      new THREE.Color('#5b21b6'),
    ];

    for (let i = 0; i < particleCount; i++) {
      // Distribute in a sphere-ish volume for depth
      const radius = 15 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi) - 10;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.15 + 0.03;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Connection lines (subtle constellation effect) ──
    const linePositions = [];
    const lineColors = [];
    const posArr = geometry.attributes.position.array;

    for (let i = 0; i < Math.min(particleCount, 400); i++) {
      for (let j = i + 1; j < Math.min(particleCount, 400); j++) {
        const dx = posArr[i * 3] - posArr[j * 3];
        const dy = posArr[i * 3 + 1] - posArr[j * 3 + 1];
        const dz = posArr[i * 3 + 2] - posArr[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 3.5 && linePositions.length < 600 * 6) {
          linePositions.push(posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]);
          linePositions.push(posArr[j * 3], posArr[j * 3 + 1], posArr[j * 3 + 2]);

          const alpha = 1 - dist / 3.5;
          lineColors.push(0.38, 0.39, 0.95, alpha * 0.08);
          lineColors.push(0.38, 0.39, 0.95, alpha * 0.08);
        }
      }
    }

    if (linePositions.length > 0) {
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lines);
    }

    // ── Enhanced glow orbs ──
    const orbs = [];
    const orbConfigs = [
      { color: 0x6366f1, opacity: 0.06, scale: 6, pos: [-8, 5, -8] },
      { color: 0x8b5cf6, opacity: 0.04, scale: 8, pos: [6, -4, -10] },
      { color: 0x4f46e5, opacity: 0.035, scale: 5, pos: [0, 7, -7] },
      { color: 0x7c3aed, opacity: 0.03, scale: 10, pos: [-3, -6, -12] },
      { color: 0xa78bfa, opacity: 0.025, scale: 7, pos: [8, 3, -9] },
    ];

    orbConfigs.forEach(cfg => {
      const geo = new THREE.SphereGeometry(0.5, 20, 20);
      const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(cfg.scale, cfg.scale, cfg.scale);
      mesh.position.set(...cfg.pos);
      scene.add(mesh);
      orbs.push(mesh);
    });

    camera.position.z = 10;

    // ── Event handlers ──
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // ── Animation loop ──
    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const pos = particles.geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3 + 1] += Math.sin(elapsed * 0.25 + pos[i3] * 0.08) * 0.003;
        pos[i3] += Math.cos(elapsed * 0.18 + pos[i3 + 1] * 0.06) * 0.002;
        pos[i3 + 2] += Math.sin(elapsed * 0.12 + pos[i3] * 0.04) * 0.001;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Smooth rotation with mouse influence
      const targetRotY = elapsed * 0.02 + mouseRef.current.x * 0.15;
      const targetRotX = Math.sin(elapsed * 0.08) * 0.08 + mouseRef.current.y * 0.08;
      particles.rotation.y += (targetRotY - particles.rotation.y) * 0.02;
      particles.rotation.x += (targetRotX - particles.rotation.x) * 0.02;

      // Animate orbs with varied speeds
      orbs.forEach((orb, i) => {
        const speed = 0.15 + i * 0.03;
        const range = 1.5 + i * 0.3;
        orb.position.x = orbConfigs[i].pos[0] + Math.sin(elapsed * speed + i) * range;
        orb.position.y = orbConfigs[i].pos[1] + Math.cos(elapsed * (speed * 0.8) + i * 0.5) * range;
        // Subtle pulse
        const pulse = 1 + Math.sin(elapsed * 0.5 + i * 1.2) * 0.08;
        const s = orbConfigs[i].scale * pulse;
        orb.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      document.body.style.backgroundColor = prevBg;
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
        navigate('/');
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

      {/* Gradient overlays for depth */}
      <div className="login-gradient-top" />
      <div className="login-gradient-bottom" />

      <div className={`login-container ${formVisible ? 'login-visible' : ''}`}>
        {/* Left branding panel */}
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-brand-logo">
              <img src="/logo.jpg" alt="QALogs" />
            </div>
            <h2 className="login-brand-title">QALogs</h2>
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
            {/* Mobile-only logo */}
            <div className="login-mobile-logo">
              <img src="/logo.jpg" alt="QALogs" />
              <span>QALogs</span>
            </div>

            <div className="login-form-header">
              <h1>Welcome back</h1>
              <p>Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
              {/* Email */}
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

              {/* Password */}
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

              {/* Submit */}
              <button type="submit" className="login-submit" disabled={isLoading}>
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
              </button>
            </form>

            <div className="login-form-footer">
              <div className="login-footer-divider"><span>Need help?</span></div>
              <p>Contact your administrator for account access or password reset.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ═══════ RESET & LAYOUT ═══════ */
        .login-page {
          position: fixed; inset: 0; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: #05050f;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .login-canvas {
          position: absolute; inset: 0; z-index: 0;
        }

        /* ── Gradient overlays ── */
        .login-gradient-top {
          position: absolute; top: 0; left: 0; right: 0; height: 40%;
          background: linear-gradient(180deg, rgba(5,5,15,0.6) 0%, transparent 100%);
          z-index: 1; pointer-events: none;
        }
        .login-gradient-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; height: 30%;
          background: linear-gradient(0deg, rgba(5,5,15,0.8) 0%, transparent 100%);
          z-index: 1; pointer-events: none;
        }

        /* ═══════ CONTAINER ═══════ */
        .login-container {
          position: relative; z-index: 10;
          display: flex; width: 880px; max-width: 95vw;
          min-height: 520px; max-height: 90vh;
          border-radius: 20px; overflow: hidden;
          background: rgba(10,10,26,0.6);
          backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.05),
            0 25px 80px -12px rgba(0,0,0,0.6),
            0 0 120px -20px rgba(99,102,241,0.08);
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
          padding: 40px 32px 24px;
          background: linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%);
          border-right: 1px solid rgba(255,255,255,0.04);
          position: relative; overflow: hidden;
        }
        .login-branding::before {
          content: ''; position: absolute; top: -50%; right: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle at 70% 30%, rgba(99,102,241,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .login-branding-content { position: relative; z-index: 1; }

        .login-brand-logo {
          width: 56px; height: 56px; border-radius: 14px;
          overflow: hidden; margin-bottom: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 4px 20px rgba(99,102,241,0.15);
        }
        .login-brand-logo img { width: 100%; height: 100%; object-fit: cover; }

        .login-brand-title {
          font-size: 28px; font-weight: 800; margin: 0;
          background: linear-gradient(135deg, #fff 0%, #c7d2fe 60%, #a5b4fc 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px; line-height: 1.1;
        }
        .login-brand-tagline {
          margin: 6px 0 0; font-size: 13px; font-weight: 400;
          color: rgba(148,163,184,0.6); letter-spacing: 0.2px;
        }

        .login-features { margin-top: 36px; display: flex; flex-direction: column; gap: 12px; }
        .login-feature {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.04);
          color: rgba(203,213,225,0.7); font-size: 13px; font-weight: 400;
          opacity: 0; animation: loginFeatureFade 0.5s ease forwards;
        }
        .login-feature svg { color: rgba(129,140,248,0.6); flex-shrink: 0; }
        @keyframes loginFeatureFade {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .login-branding-footer {
          position: relative; z-index: 1;
          font-size: 11px; color: rgba(148,163,184,0.3);
        }

        /* ═══════ RIGHT FORM ═══════ */
        .login-form-panel {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px;
        }
        .login-form-wrapper { width: 100%; max-width: 340px; }

        .login-mobile-logo {
          display: none; align-items: center; gap: 10px;
          margin-bottom: 28px;
        }
        .login-mobile-logo img {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .login-mobile-logo span {
          font-size: 20px; font-weight: 800;
          background: linear-gradient(135deg, #fff, #c7d2fe);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .login-form-header { margin-bottom: 32px; }
        .login-form-header h1 {
          margin: 0; font-size: 26px; font-weight: 700;
          color: #f1f5f9; letter-spacing: -0.5px; line-height: 1.2;
        }
        .login-form-header p {
          margin: 6px 0 0; font-size: 14px; color: rgba(148,163,184,0.5);
        }

        /* ── Form fields ── */
        .login-form { display: flex; flex-direction: column; gap: 20px; }
        .login-field {}
        .login-field label {
          display: block; margin-bottom: 7px;
          font-size: 12px; font-weight: 600; color: rgba(203,213,225,0.6);
          letter-spacing: 0.3px; text-transform: uppercase;
          transition: color 0.2s;
        }
        .login-field-focused label { color: rgba(129,140,248,0.8); }

        .login-input-wrapper {
          position: relative; display: flex; align-items: center;
          border-radius: 12px; overflow: hidden;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-field-focused .login-input-wrapper {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08), 0 0 20px rgba(99,102,241,0.05);
          background: rgba(255,255,255,0.04);
        }
        .login-field-filled .login-input-wrapper {
          border-color: rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
        }

        .login-input-icon {
          display: flex; align-items: center; justify-content: center;
          width: 44px; flex-shrink: 0;
          color: rgba(148,163,184,0.35);
          transition: color 0.2s;
        }
        .login-field-focused .login-input-icon { color: rgba(129,140,248,0.7); }

        .login-field input {
          flex: 1; padding: 13px 14px 13px 0;
          background: none; border: none; outline: none;
          color: #f1f5f9; font-size: 14px;
          font-family: inherit;
        }
        .login-field input::placeholder { color: rgba(148,163,184,0.3); }
        .login-field input:-webkit-autofill,
        .login-field input:-webkit-autofill:hover,
        .login-field input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f1f5f9;
          -webkit-box-shadow: 0 0 0px 1000px rgba(10,10,26,0.99) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .login-password-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 44px; height: 100%; flex-shrink: 0;
          background: none; border: none; cursor: pointer;
          color: rgba(148,163,184,0.3); transition: color 0.15s;
        }
        .login-password-toggle:hover { color: rgba(203,213,225,0.6); }

        /* ── Submit button ── */
        .login-submit {
          margin-top: 8px; width: 100%; padding: 14px 20px;
          border: none; border-radius: 12px; cursor: pointer;
          font-family: inherit; font-size: 15px; font-weight: 600;
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
          color: #fff; position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3), 0 0 40px rgba(99,102,241,0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-submit:hover:not(:disabled) {
          box-shadow: 0 6px 28px rgba(99,102,241,0.45), 0 0 60px rgba(99,102,241,0.12);
          transform: translateY(-1px);
        }
        .login-submit:active:not(:disabled) { transform: translateY(0); }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }

        .login-submit-content, .login-submit-loading {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; z-index: 1;
        }
        .login-submit-content svg {
          transition: transform 0.2s;
        }
        .login-submit:hover .login-submit-content svg {
          transform: translateX(3px);
        }

        .login-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
        }
        @keyframes loginSpin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .login-form-footer { margin-top: 28px; text-align: center; }
        .login-footer-divider {
          position: relative; margin-bottom: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-footer-divider::before, .login-footer-divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .login-footer-divider span {
          padding: 0 14px; font-size: 11px; font-weight: 500;
          color: rgba(148,163,184,0.3); text-transform: uppercase; letter-spacing: 0.5px;
        }
        .login-form-footer p {
          margin: 0; font-size: 12px; color: rgba(148,163,184,0.3); line-height: 1.6;
        }

        /* ═══════ RESPONSIVE ═══════ */
        @media (max-width: 768px) {
          .login-branding { display: none; }
          .login-container { max-width: 420px; min-height: auto; }
          .login-form-panel { padding: 32px 28px; }
          .login-mobile-logo { display: flex; }
          .login-form-header h1 { font-size: 22px; }
        }

        @media (max-width: 400px) {
          .login-container {
            border-radius: 16px;
            max-width: 100vw; margin: 0 12px;
          }
          .login-form-panel { padding: 28px 22px; }
        }

        @media (max-height: 600px) {
          .login-container { min-height: auto; max-height: 95vh; }
          .login-form-panel { padding: 24px 28px; }
          .login-form-header { margin-bottom: 20px; }
          .login-form { gap: 16px; }
          .login-features { display: none; }
        }
      `}</style>
    </div>
  );
}

export default Login;
