import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as THREE from 'three';
import api from '../api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Three.js particle animation
  useEffect(() => {
    // Override body background for login page
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0a0a1a';

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a1a, 1);
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Create particles
    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color('#818cf8'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#6366f1'),
      new THREE.Color('#c4b5fd'),
      new THREE.Color('#4f46e5'),
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);

    // Add ambient glow orbs
    const orbGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const orbMaterial1 = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.08 });
    const orbMaterial2 = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.06 });
    const orbMaterial3 = new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.05 });

    const orb1 = new THREE.Mesh(orbGeometry, orbMaterial1);
    const orb2 = new THREE.Mesh(orbGeometry, orbMaterial2);
    const orb3 = new THREE.Mesh(orbGeometry, orbMaterial3);

    orb1.scale.set(5, 5, 5);
    orb1.position.set(-6, 4, -5);
    orb2.scale.set(7, 7, 7);
    orb2.position.set(5, -3, -8);
    orb3.scale.set(4, 4, 4);
    orb3.position.set(0, 6, -6);

    scene.add(orb1);
    scene.add(orb2);
    scene.add(orb3);

    camera.position.z = 8;

    // Mouse tracking
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationId;
    const clock = new THREE.Clock();
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      const pos = particles.geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3 + 1] += Math.sin(elapsed * 0.3 + pos[i3] * 0.1) * 0.003;
        pos[i3] += Math.cos(elapsed * 0.2 + pos[i3 + 1] * 0.1) * 0.002;
      }

      particles.geometry.attributes.position.needsUpdate = true;

      // Slow rotation
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = Math.sin(elapsed * 0.1) * 0.1;

      // Mouse influence
      particles.rotation.y += (mouseRef.current.x * 0.1 - particles.rotation.y) * 0.01;
      particles.rotation.x += (mouseRef.current.y * 0.05 - particles.rotation.x) * 0.01;

      // Animate glow orbs
      orb1.position.x = -6 + Math.sin(elapsed * 0.2) * 2;
      orb1.position.y = 4 + Math.cos(elapsed * 0.15) * 1.5;
      orb2.position.x = 5 + Math.cos(elapsed * 0.18) * 2;
      orb2.position.y = -3 + Math.sin(elapsed * 0.22) * 1.5;
      orb3.position.x = Math.sin(elapsed * 0.25) * 3;
      orb3.position.y = 6 + Math.cos(elapsed * 0.2) * 1;

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
        toast.error(res?.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      const message = err?.error || err?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <canvas ref={canvasRef} className="login-canvas" />
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <img src="/logo.jpg" alt="QALogs" className="login-logo-img" />
            </div>
            <h1>QALogs</h1>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <FiUser className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner-small"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Contact your administrator for account access</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
