import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { useSimulationCanvas } from 'automatick/react/canvas';
import { StandardControls } from 'automatick/react/controls';
import { PerformanceOverlay } from 'automatick/react/performance';
import gravitySim from '../sims/gravitySim';

const WIDTH = 600;
const HEIGHT = 400;

// Generation color palette — cycles for generations beyond its length.
const GENERATION_PALETTE: Array<{ h: number; s: number; l: number }> = [
  { h: 220, s: 80, l: 60 }, // 0: blue
  { h: 190, s: 85, l: 60 }, // 1: cyan
  { h: 140, s: 70, l: 55 }, // 2: green
  { h: 60, s: 90, l: 60 }, // 3: yellow
  { h: 30, s: 95, l: 60 }, // 4: orange
  { h: 0, s: 85, l: 60 }, // 5: red
  { h: 320, s: 80, l: 65 }, // 6: magenta
  { h: 275, s: 75, l: 70 }, // 7: purple
];

function GravityCanvas() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssWidth = WIDTH;
  const cssHeight = HEIGHT;
  const initializedRef = React.useRef(false);

  const canvasRef = useSimulationCanvas<typeof gravitySim>(
    (ctx, { data }) => {
      const scale = (cssWidth * dpr) / WIDTH;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      // First frame: fill solid black
      if (!initializedRef.current) {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        initializedRef.current = true;
      }

      // Fade previous frame — semi-transparent overlay creates trails
      ctx.fillStyle = 'rgba(10, 10, 26, 0.15)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw particles — hue comes from generation (spawn count)
      data.particles.forEach((p) => {
        const c = GENERATION_PALETTE[p.generation % GENERATION_PALETTE.length];

        // Glow effect: larger faint circle behind
        ctx.fillStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.3)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  );

  return (
    <canvas
      ref={canvasRef}
      width={cssWidth * dpr}
      height={cssHeight * dpr}
      style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: 'auto' }}
    />
  );
}

export function GravityDemo() {
  const [showPerf, setShowPerf] = React.useState(true);

  return (
    <Simulation sim={gravitySim} delayMs={0} autoplay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StandardControls
          showStepButton
          controls={[
            {
              type: 'range',
              param: 'count',
              label: 'Particles',
              min: 50,
              max: 500,
              step: 10,
            },
            {
              type: 'range',
              param: 'G',
              label: 'Gravity (G)',
              min: 0.05,
              max: 2,
              step: 0.05,
            },
          ]}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.7 }}>
          <input type="checkbox" checked={showPerf} onChange={(e) => setShowPerf(e.target.checked)} />
          Show performance
        </label>
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <GravityCanvas />
          {showPerf && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <PerformanceOverlay />
            </div>
          )}
        </div>
      </div>
    </Simulation>
  );
}
