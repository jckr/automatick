import React from 'react';
import { Link } from 'react-router-dom';
import { CodeBlock } from '../components/CodeBlock';
import { HeroBubbles } from '../components/HeroBubbles';
import { ArrowIcon, CopyIcon, GithubIcon } from '../layout/icons';

const MODEL_TS = `import { defineSim } from 'automatick/sim';

export default defineSim<{ count: number }, { increment: number }>({
  defaultParams: { increment: 1 },
  init: () => ({ count: 0 }),
  step: ({ data, params }) => ({
    count: data.count + params.increment,
  }),
});`;

const COMPONENT_TSX = `import { Simulation } from 'automatick/react/simulation';
import { useSimulation } from 'automatick/react/hooks';
import counterSim from './counterSim';

function CounterView() {
  const { data } = useSimulation<typeof counterSim>();
  return <pre>{data.count}</pre>;
}

export function Counter() {
  return (
    <Simulation sim={counterSim} delayMs={500}>
      <CounterView />
    </Simulation>
  );
}`;

const FEATURES: Array<{ n: string; title: string; body: React.ReactNode }> = [
  {
    n: '01 / sim',
    title: 'Define the sim, not the component',
    body: (
      <>
        State lives in plain data. You write <code>init</code> and{' '}
        <code>step</code>; the engine drives the loop.
      </>
    ),
  },
  {
    n: '02 / mount',
    title: '<Simulation> owns the clock',
    body: (
      <>
        One component manages play, pause, seek, and tick progression. Children
        read state through context.
      </>
    ),
  },
  {
    n: '03 / params',
    title: 'Typed params, free controls',
    body: (
      <>
        Declare your params; <code>StandardControls</code> wires sliders and
        toggles to them by name.
      </>
    ),
  },
  {
    n: '04 / render',
    title: 'React or canvas. Your call.',
    body: (
      <>
        Render with normal JSX, or use <code>useSimulationCanvas</code> to draw
        to a canvas. Same engine.
      </>
    ),
  },
  {
    n: '05 / workers',
    title: 'Off the main thread, transparently',
    body: (
      <>
        Swap the <code>sim</code> prop for <code>worker</code> and the same sim
        runs in a Web Worker. No code changes.
      </>
    ),
  },
  {
    n: '06 / nothing else',
    title: 'Zero runtime dependencies',
    body: (
      <>
        React is a peer. The engine ships pure TypeScript. Works with Vite,
        Next, Remix.
      </>
    ),
  },
];

export function HomePage() {
  return (
    <>
      <section
        style={{
          width: '100%',
          minHeight: '50vh',
          padding: 0,
          margin: 0,
          display: 'block',
        }}
      >
        <HeroBubbles />
      </section>

      <section
        className='hero'
        style={{
          gridTemplateColumns: '1fr',
          paddingTop: 48,
        }}
      >
        <div>
          <div className='eyebrow'>open source · MIT</div>
          <h1>
            Build tick-based simulations in React,
            <br />
            <span className='accent'>one tick at a time.</span>
          </h1>
          <p className='lede'>
            <span className='mono' style={{ fontSize: '0.9em', color: 'var(--fg1)' }}>
              automatick
            </span>{' '}
            is a simulation engine for React. It gives you a clock, a state
            machine, and controls — you write the rules.
          </p>
          <div className='cta-row'>
            <Link to='/guide/getting-started' className='btn primary'>
              Get started
              <span className='kbd-inline'>
                <ArrowIcon />
              </span>
            </Link>
            <Link to='/examples/automatick-hero' className='btn'>
              See it run
            </Link>
            <a
              className='btn ghost'
              href='https://github.com/jckr/automatick'
              target='_blank'
              rel='noreferrer'
            >
              <GithubIcon />
              Source
            </a>
          </div>
          <div className='install-row'>
            <span className='pfx'>$</span>
            <span className='cmd'>npm install automatick</span>
            <button
              type='button'
              title='Copy'
              onClick={() => navigator.clipboard?.writeText('npm install automatick')}
            >
              <CopyIcon />
            </button>
          </div>
        </div>
      </section>

      <section className='section'>
        <div className='eyebrow' style={{ color: 'var(--accent)', marginBottom: 16 }}>
          — what it is
        </div>
        <h2>A clock. A state machine. A place for your rules.</h2>
        <p className='section-lede'>
          Building a simulation from scratch means solving problems that have
          nothing to do with the simulation itself: animation loops, play/pause
          state, controls wiring, off-main-thread execution. automatick handles
          all of that. You write four things — <code>init</code>,{' '}
          <code>step</code>, <code>render</code>, and your params — and the
          library does the rest.
        </p>

        <div className='feature-grid'>
          {FEATURES.map((f) => (
            <div key={f.n} className='feature'>
              <div className='n'>{f.n}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='section'>
        <div style={{ maxWidth: 760 }}>
          <div
            className='eyebrow'
            style={{ color: 'var(--accent)', marginBottom: 16 }}
          >
            — what you'll write
          </div>
          <blockquote className='pullquote' style={{ margin: '0 0 32px' }}>
            You give automatick a sim and a render. It gives you back a running
            thing you can pause, scrub, and ship.
          </blockquote>
        </div>

        <div className='grid grid-2'>
          <CodeBlock code={MODEL_TS} file='counterSim.ts' lang='TS' />
          <CodeBlock code={COMPONENT_TSX} file='Counter.tsx' lang='TSX' />
        </div>
      </section>

      <section className='section' style={{ paddingBottom: 64 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 48,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 8px' }}>Start with a counter.</h2>
            <p style={{ margin: 0, color: 'var(--fg3)', fontSize: 15 }}>
              Install the package, define a sim, mount it. The rest is the
              simulation you wanted to build.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to='/guide/getting-started' className='btn primary'>
              Read the guide
            </Link>
            <Link to='/api/define-sim' className='btn'>
              API reference
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
