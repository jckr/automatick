import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import { DemoControlPanel, type DemoControlGroup } from '../components/DemoControlPanel';
import { DemoSplit } from '../components/DemoSplit';
import worldSpinnerSim from '../sims/worldSpinnerSim';
import {
  WORLD_DOTS,
  PULSE_ANCHORS,
  latLonToXYZ,
} from '../sims/worldSpinnerData';

const STAGE_HEIGHT = 540;
const SPHERE_RADIUS = 1;

/** Dots geometry is built once from the static dataset. Never round-trips through Data. */
const DOTS_POSITIONS = (() => {
  const arr = new Float32Array(WORLD_DOTS.length * 3);
  for (let i = 0; i < WORLD_DOTS.length; i++) {
    const { lat, lon } = WORLD_DOTS[i];
    const [x, y, z] = latLonToXYZ(lat, lon, SPHERE_RADIUS * 1.005);
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  }
  return arr;
})();

const ANCHOR_POSITIONS: Array<[number, number, number]> = PULSE_ANCHORS.map(
  ({ lat, lon }) => latLonToXYZ(lat, lon, SPHERE_RADIUS * 1.01)
);

function Dots({ size }: { size: number }) {
  const geom = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(DOTS_POSITIONS, 3));
    return g;
  }, []);
  return (
    <points geometry={geom}>
      <pointsMaterial size={size} color='#D7451E' sizeAttenuation />
    </points>
  );
}

function Pulses() {
  const { data, tick, params } = useSimulation<typeof worldSpinnerSim>();
  return (
    <>
      {data.pulses.map((p, idx) => {
        const age = (tick - p.bornTick) / params.pulseLifetime; // 0..1
        if (age < 0 || age > 1) return null;
        const [x, y, z] = ANCHOR_POSITIONS[p.anchor];
        const scale = 0.04 + age * 0.18;
        const opacity = 1 - age;
        return (
          <mesh key={`${p.anchor}-${p.bornTick}-${idx}`} position={[x, y, z]}>
            <sphereGeometry args={[scale, 12, 12]} />
            <meshBasicMaterial color='#F2EEE4' transparent opacity={opacity} />
          </mesh>
        );
      })}
    </>
  );
}

function AnchorMarkers() {
  return (
    <>
      {ANCHOR_POSITIONS.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshBasicMaterial color='#F2EEE4' />
        </mesh>
      ))}
    </>
  );
}

function Globe() {
  const { data, params } = useSimulation<typeof worldSpinnerSim>();
  return (
    <group rotation={[0, data.angle, 0]}>
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 48, 48]} />
        <meshStandardMaterial color='#0E1116' roughness={0.85} metalness={0.1} />
      </mesh>
      <Dots size={params.dotSize} />
      <AnchorMarkers />
      <Pulses />
    </group>
  );
}

function WorldStage() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: STAGE_HEIGHT,
        lineHeight: 0,
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 2.6], fov: 45 }}
        style={{ display: 'block', background: 'var(--bg2, #efeadd)' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={0.9} />
        <Globe />
      </Canvas>
    </div>
  );
}

const SPINNER_GROUPS: DemoControlGroup[] = [
  {
    label: 'Rotation',
    controls: [
      {
        type: 'range',
        param: 'angularSpeed',
        label: 'Speed',
        min: 0,
        max: 0.05,
        step: 0.001,
        format: (v) => v.toFixed(3),
      },
    ],
  },
  {
    label: 'Pulses',
    controls: [
      {
        type: 'range',
        param: 'pulseRate',
        label: 'Rate',
        min: 0,
        max: 0.5,
        step: 0.01,
        format: (v) => v.toFixed(2),
      },
      {
        type: 'range',
        param: 'pulseLifetime',
        label: 'Lifetime',
        min: 10,
        max: 240,
        step: 5,
        format: (v) => `${v}t`,
      },
    ],
  },
  {
    label: 'Dots',
    controls: [
      {
        type: 'range',
        param: 'dotSize',
        label: 'Size',
        min: 0.005,
        max: 0.06,
        step: 0.001,
        format: (v) => v.toFixed(3),
      },
    ],
  },
];

export function WorldSpinnerDemo() {
  return (
    <Simulation sim={worldSpinnerSim} delayMs={16}>
      <DemoSplit
        preview={<WorldStage />}
        controls={<DemoControlPanel groups={SPINNER_GROUPS} />}
      />
    </Simulation>
  );
}
