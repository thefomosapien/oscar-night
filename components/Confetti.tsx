'use client';

import { useEffect, useRef, useState } from 'react';

const GOLD = '#D4A843';

interface ConfettiProps {
  names: string[];
  category: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = ['#D4A843', '#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63'];

export default function Confetti({ names, category }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  // Build banner text
  let bannerText: string;
  if (names.length === 3) {
    bannerText = `🎉 Everyone got ${category} right!`;
  } else if (names.length === 2) {
    bannerText = `🎉 ${names[0]} & ${names[1]} got ${category}!`;
  } else {
    bannerText = `🎉 ${names[0]} nailed ${category}!`;
  }

  // Auto-hide banner
  useEffect(() => {
    const timer = setTimeout(() => setBannerVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Canvas confetti
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Particle[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 10 - 2,
        size: Math.random() * 8 + 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 4000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fadeStart = 2500;

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.25; // gravity
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > fadeStart) {
          p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / 1500);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          pointerEvents: 'none',
        }}
      />
      {bannerVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            animation: 'slideDown 0.4s ease-out',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #B8860B)`,
              color: '#000',
              padding: '14px 24px',
              borderRadius: '0 0 12px 12px',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              maxWidth: 480,
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(212, 168, 67, 0.4)',
            }}
          >
            {bannerText}
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
