/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { AppColorTheme, ComputedAQI, WeatherTelemetry } from '../types/aqi';

interface AtmosphericAmbientBackgroundProps {
  computedAQI: ComputedAQI | null;
  weather: WeatherTelemetry | null;
  theme: AppColorTheme;
  isDaytime?: boolean;
}

interface AerosolParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  color: string;
}

interface WindStreamline {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  curve: number;
}

interface CelestialStar {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export const AtmosphericAmbientBackground: React.FC<AtmosphericAmbientBackgroundProps> = ({
  computedAQI,
  weather,
  theme,
  isDaytime = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const aqiVal = computedAQI?.aqi ?? 45;
  const windSpeed = weather?.windSpeed ?? 12;
  const windDirection = weather?.windDirection ?? 240;
  const humidity = weather?.humidity ?? 50;

  // Determine atmospheric color scheme & styling properties based on active theme
  const atmosphereConfig = useMemo(() => {
    if (theme === 'navy') {
      return {
        bgTop: '#0a0f1d',
        bgMid: '#0e172a',
        bgBottom: '#111e38',
        ambientGlow: 'rgba(37, 99, 235, 0.12)',
        particleColor: '147, 197, 253',
        particleCount: 40,
        smogHaze: 0.05,
      };
    }
    if (theme === 'emerald') {
      return {
        bgTop: '#051210',
        bgMid: '#0a1e19',
        bgBottom: '#0e2b23',
        ambientGlow: 'rgba(22, 163, 74, 0.14)',
        particleColor: '134, 239, 172',
        particleCount: 45,
        smogHaze: 0.04,
      };
    }
    if (theme === 'obsidian') {
      return {
        bgTop: '#08090d',
        bgMid: '#0f1117',
        bgBottom: '#151720',
        ambientGlow: 'rgba(148, 163, 184, 0.08)',
        particleColor: '203, 213, 225',
        particleCount: 35,
        smogHaze: 0.03,
      };
    }
    if (theme === 'amber') {
      return {
        bgTop: '#130d1c',
        bgMid: '#1e1329',
        bgBottom: '#2d1829',
        ambientGlow: 'rgba(217, 119, 6, 0.14)',
        particleColor: '253, 230, 138',
        particleCount: 50,
        smogHaze: 0.08,
      };
    }

    // Dynamic AQI + Weather adaptive mode:
    if (aqiVal <= 50) {
      // Good / Pristine Clean Air
      if (isDaytime) {
        return {
          bgTop: '#08172c',
          bgMid: '#0c2646',
          bgBottom: '#09365c',
          ambientGlow: 'rgba(34, 197, 94, 0.14)',
          particleColor: '134, 239, 172',
          particleCount: 30,
          smogHaze: 0.02,
        };
      } else {
        return {
          bgTop: '#040914',
          bgMid: '#071224',
          bgBottom: '#0b1c38',
          ambientGlow: 'rgba(56, 189, 248, 0.12)',
          particleColor: '186, 230, 253',
          particleCount: 25,
          smogHaze: 0.01,
        };
      }
    } else if (aqiVal <= 100) {
      // Satisfactory Air
      return {
        bgTop: '#07151e',
        bgMid: '#0c222b',
        bgBottom: '#102e32',
        ambientGlow: 'rgba(101, 163, 13, 0.13)',
        particleColor: '190, 242, 100',
        particleCount: 45,
        smogHaze: 0.05,
      };
    } else if (aqiVal <= 200) {
      // Moderate / Hazy Atmosphere
      return {
        bgTop: '#0e121e',
        bgMid: '#181822',
        bgBottom: '#221915',
        ambientGlow: 'rgba(217, 119, 6, 0.15)',
        particleColor: '253, 230, 138',
        particleCount: 75,
        smogHaze: 0.12,
      };
    } else if (aqiVal <= 300) {
      // Poor / Dense Urban Aerosols
      return {
        bgTop: '#130e17',
        bgMid: '#211516',
        bgBottom: '#2e1913',
        ambientGlow: 'rgba(234, 88, 12, 0.18)',
        particleColor: '254, 215, 170',
        particleCount: 110,
        smogHaze: 0.22,
      };
    } else {
      // Very Poor / Severe / Hazardous Atmosphere
      return {
        bgTop: '#160810',
        bgMid: '#260c18',
        bgBottom: '#340f1c',
        ambientGlow: 'rgba(220, 38, 38, 0.22)',
        particleColor: '254, 202, 202',
        particleCount: 150,
        smogHaze: 0.32,
      };
    }
  }, [theme, aqiVal, isDaytime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    };

    window.addEventListener('resize', handleResize);

    // Meteorological wind calculation: angle wind blows toward
    const windAngleRad = ((windDirection + 180) % 360) * (Math.PI / 180);
    const speedRatio = Math.max(0.6, Math.min(4.5, (windSpeed / 10) * 1.6));
    const baseVx = Math.sin(windAngleRad) * speedRatio;
    const baseVy = -Math.cos(windAngleRad) * speedRatio;

    let particles: AerosolParticle[] = [];
    let streamlines: WindStreamline[] = [];
    let stars: CelestialStar[] = [];

    const initElements = () => {
      // 1. Aerosol Particles
      particles = [];
      const count = Math.min(160, Math.max(25, Math.floor((width * height) / 14000) * (atmosphereConfig.particleCount / 50)));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: baseVx + (Math.random() - 0.5) * 0.4,
          vy: baseVy + (Math.random() - 0.5) * 0.4,
          radius: 0.8 + Math.random() * (aqiVal > 200 ? 2.5 : 1.4),
          alpha: Math.random() * 0.5,
          maxAlpha: 0.25 + Math.random() * 0.45,
          pulseSpeed: 0.01 + Math.random() * 0.02,
          pulsePhase: Math.random() * Math.PI * 2,
          color: atmosphereConfig.particleColor,
        });
      }

      // 2. Wind Flow Streamlines (when wind speed is perceptible)
      streamlines = [];
      const streamCount = Math.floor(windSpeed / 3.5);
      for (let i = 0; i < streamCount; i++) {
        streamlines.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 60 + Math.random() * 140,
          speed: speedRatio * (1.2 + Math.random() * 0.6),
          alpha: 0.08 + Math.random() * 0.14,
          curve: (Math.random() - 0.5) * 15,
        });
      }

      // 3. Nighttime Stars (only if night)
      stars = [];
      if (!isDaytime) {
        const starCount = Math.floor((width * height) / 16000);
        for (let i = 0; i < starCount; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.65), // Upper troposphere
            radius: 0.6 + Math.random() * 1.2,
            alpha: 0.2 + Math.random() * 0.6,
            twinkleSpeed: 0.015 + Math.random() * 0.03,
            twinklePhase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initElements();

    let frame = 0;

    const render = () => {
      frame++;

      // 1. Clear & Draw Sky Backdrop Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, atmosphereConfig.bgTop);
      skyGrad.addColorStop(0.55, atmosphereConfig.bgMid);
      skyGrad.addColorStop(1, atmosphereConfig.bgBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Ambient Sunlight or Moon Zenith Radiance
      const zenithX = width * 0.75;
      const zenithY = height * 0.15;
      const zenithRadius = Math.max(width, height) * 0.55;
      const zenithGlow = ctx.createRadialGradient(zenithX, zenithY, 10, zenithX, zenithY, zenithRadius);

      if (isDaytime) {
        // Soft daytime solar atmosphere aura
        zenithGlow.addColorStop(0, atmosphereConfig.ambientGlow);
        zenithGlow.addColorStop(0.4, 'rgba(255, 255, 255, 0.02)');
        zenithGlow.addColorStop(1, 'transparent');
      } else {
        // Soft lunar indigo aura
        zenithGlow.addColorStop(0, 'rgba(147, 197, 253, 0.08)');
        zenithGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.02)');
        zenithGlow.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = zenithGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Atmospheric Smog / Inversion Layer at Horizon
      if (atmosphereConfig.smogHaze > 0.03) {
        const hazeGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
        const hazeColor = aqiVal > 200 ? '220, 38, 38' : aqiVal > 100 ? '217, 119, 6' : '101, 163, 13';
        hazeGrad.addColorStop(0, `rgba(${hazeColor}, 0)`);
        hazeGrad.addColorStop(1, `rgba(${hazeColor}, ${atmosphereConfig.smogHaze})`);
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, height * 0.45, width, height * 0.55);
      }

      // 4. Draw Stars (Nighttime only)
      if (!isDaytime && stars.length > 0) {
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.twinklePhase += s.twinkleSpeed;
          const currentAlpha = Math.max(0.1, s.alpha * (0.6 + 0.4 * Math.sin(s.twinklePhase)));

          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Draw Wind Flow Streamlines
      if (windSpeed > 8 && streamlines.length > 0) {
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';

        for (let i = 0; i < streamlines.length; i++) {
          const st = streamlines[i];
          st.x += baseVx * st.speed;
          st.y += baseVy * st.speed;

          // Wrap around edges
          if (st.x < -100) st.x = width + 50;
          if (st.x > width + 100) st.x = -50;
          if (st.y < -100) st.y = height + 50;
          if (st.y > height + 100) st.y = -50;

          const endX = st.x + Math.sin(windAngleRad) * st.length;
          const endY = st.y - Math.cos(windAngleRad) * st.length;

          const streamGrad = ctx.createLinearGradient(st.x, st.y, endX, endY);
          streamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          streamGrad.addColorStop(0.5, `rgba(${atmosphereConfig.particleColor}, ${st.alpha})`);
          streamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.strokeStyle = streamGrad;
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.quadraticCurveTo(
            (st.x + endX) / 2 + st.curve,
            (st.y + endY) / 2 + st.curve,
            endX,
            endY
          );
          ctx.stroke();
        }
      }

      // 6. Draw Floating Atmospheric Aerosol Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulsePhase += p.pulseSpeed;

        // Wrap around bounds
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;
        if (p.y < -20) p.y = height + 10;
        if (p.y > height + 20) p.y = -10;

        const currentAlpha = Math.max(0.05, p.maxAlpha * (0.6 + 0.4 * Math.sin(p.pulsePhase)));

        ctx.fillStyle = `rgba(${p.color}, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow halo for larger particulate aerosols
        if (p.radius > 1.8) {
          ctx.fillStyle = `rgba(${p.color}, ${currentAlpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. High Humidity Moisture Mist Breathing Layer
      if (humidity > 60) {
        const mistAlpha = Math.min(0.08, ((humidity - 60) / 40) * 0.08);
        const breath = Math.sin(frame * 0.015) * 0.015;
        const mistGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
        mistGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        mistGrad.addColorStop(1, `rgba(200, 220, 240, ${Math.max(0, mistAlpha + breath)})`);
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [atmosphereConfig, windSpeed, windDirection, humidity, aqiVal, isDaytime]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-colors duration-1000">
      {/* Dynamic Atmospheric Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle Coordinate Grid Texture for Scientific Authority */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Subtle Top Hairline Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-slate-800/80" />
    </div>
  );
};
