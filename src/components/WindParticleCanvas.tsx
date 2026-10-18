import React, { useEffect, useRef } from 'react';

interface WindParticleCanvasProps {
  windSpeed: number;     // km/h
  windDirection: number; // degrees (meteorological: direction from which wind blows)
  isActive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  speed: number;
}

export const WindParticleCanvas: React.FC<WindParticleCanvasProps> = ({
  windSpeed,
  windDirection,
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 580);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Meteorological wind direction: angle wind blows *toward* is (direction + 180) deg
    const toRadians = ((windDirection + 180) % 360) * (Math.PI / 180);
    const speedMagnitude = Math.max(1.2, Math.min(8.0, (windSpeed / 10) * 2.2));

    const baseVx = Math.sin(toRadians) * speedMagnitude;
    const baseVy = -Math.cos(toRadians) * speedMagnitude;

    // Number of particles proportional to screen area
    const particleCount = Math.floor((width * height) / 3800);
    const particles: Particle[] = [];

    const resetParticle = (p: Partial<Particle> = {}): Particle => {
      const pSpeed = 0.8 + Math.random() * 0.4;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (baseVx + (Math.random() - 0.5) * 0.5) * pSpeed,
        vy: (baseVy + (Math.random() - 0.5) * 0.5) * pSpeed,
        age: Math.random() * 50,
        maxAge: 70 + Math.random() * 70,
        speed: pSpeed,
        ...p,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(resetParticle());
    }

    const render = () => {
      // Trail effect: clear with high transparency
      ctx.fillStyle = 'rgba(11, 15, 25, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age++;

        // Fade in and out
        const lifeFraction = p.age / p.maxAge;
        const alpha = Math.sin(lifeFraction * Math.PI) * 0.65;

        // Particle color based on velocity
        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.55})`; // clean technical streamline

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        p.x += p.vx;
        p.y += p.vy;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Respawn if aged out or out of bounds
        if (p.age >= p.maxAge || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles[i] = resetParticle();
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [windSpeed, windDirection, isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[400] w-full h-full mix-blend-screen opacity-90"
    />
  );
};
