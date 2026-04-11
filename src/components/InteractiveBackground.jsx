import React, { useEffect, useRef } from 'react';

export default function InteractiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Config ---
    const PARTICLE_COUNT = 100;
    const CONNECTION_DIST = 150;
    const MOUSE_RADIUS = 220;

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 1.8 + 0.5;
        this.opacity = Math.random() * 0.4 + 0.15;
        this.pulseSpeed = Math.random() * 0.015 + 0.005;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }
      update(time) {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;

        // Gentle attraction toward cursor
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 1) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          this.x += (dx / dist) * force * 0.8;
          this.y += (dy / dist) * force * 0.8;
        }

        this.currentOpacity = this.opacity + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.12;
      }
    }

    const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

    function getThemeColor() {
      const style = getComputedStyle(document.documentElement);
      const rgb = style.getPropertyValue('--particle-color').trim() || '139, 92, 246';
      return rgb;
    }

    function drawAurora(time, rgb) {
      // Slow breathing radial gradients 
      const cx1 = canvas.width * 0.35 + Math.sin(time * 0.0003) * canvas.width * 0.2;
      const cy1 = canvas.height * 0.4 + Math.cos(time * 0.0004) * canvas.height * 0.15;
      const grad1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, canvas.width * 0.6);
      grad1.addColorStop(0, `rgba(${rgb}, 0.07)`);
      grad1.addColorStop(0.5, `rgba(${rgb}, 0.025)`);
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx2 = canvas.width * 0.65 + Math.cos(time * 0.0005) * canvas.width * 0.15;
      const cy2 = canvas.height * 0.6 + Math.sin(time * 0.00035) * canvas.height * 0.2;
      const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, canvas.width * 0.5);
      grad2.addColorStop(0, `rgba(80, 60, 220, 0.05)`);
      grad2.addColorStop(0.6, `rgba(60, 100, 200, 0.02)`);
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cursor glow
      if (mouse.x > 0 && mouse.y > 0) {
        const mGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 250);
        mGrad.addColorStop(0, `rgba(${rgb}, 0.06)`);
        mGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = mGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    function drawConnections(rgb) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Mouse web lines
      for (let i = 0; i < particles.length; i++) {
        const dx = mouse.x - particles[i].x;
        const dy = mouse.y - particles[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const opacity = (1 - dist / MOUSE_RADIUS) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    function animate(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rgb = getThemeColor();

      drawAurora(time, rgb);

      particles.forEach(p => {
        p.update(time);
        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.currentOpacity})`;
        ctx.fill();
        // Soft halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.currentOpacity * 0.05})`;
        ctx.fill();
      });

      drawConnections(rgb);

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
}
