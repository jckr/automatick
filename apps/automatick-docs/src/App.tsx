import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DocsLayout } from './layout/DocsLayout';
import { ShellRoute } from './layout/ShellRoute';
import { HomePage } from './pages/HomePage';
import { ExamplesGalleryPage } from './pages/ExamplesGalleryPage';
import { GettingStartedPage } from './pages/GettingStartedPage';
import { WithoutReactPage } from './pages/WithoutReactPage';
import { WithReactPage } from './pages/WithReactPage';
import { WithCanvasPage } from './pages/WithCanvasPage';
import { WithWorkerPage } from './pages/WithWorkerPage';
import { TutorialPage } from './pages/TutorialPage';
import { DefiningASimPage } from './pages/DefiningASimPage';
import { SimulationComponentPage } from './pages/SimulationComponentPage';
import { UsingTheHookPage } from './pages/UsingTheHookPage';
import { ControlsGuidePage } from './pages/ControlsGuidePage';
import { CanvasRenderingPage } from './pages/CanvasRenderingPage';
import { VisualizationPatternsPage } from './pages/VisualizationPatternsPage';
import { DefineSimApiPage } from './pages/api/DefineSimApiPage';
import { SimulationApiPage } from './pages/api/SimulationApiPage';
import { UseSimulationApiPage } from './pages/api/UseSimulationApiPage';
import { ControlsApiPage } from './pages/api/ControlsApiPage';
import { CreateEngineApiPage } from './pages/api/CreateEngineApiPage';
// Example routes are lazy-loaded so each demo (and its sim modules) ships as
// its own chunk, kept out of the initial bundle. The pages use named exports,
// so each import is adapted to the default-export shape React.lazy expects.
const CounterPage = React.lazy(() =>
  import('./pages/examples/CounterPage').then((m) => ({ default: m.CounterPage }))
);
const InlineCounterPage = React.lazy(() =>
  import('./pages/examples/InlineCounterPage').then((m) => ({ default: m.InlineCounterPage }))
);
const WorkerCanvasPage = React.lazy(() =>
  import('./pages/examples/WorkerCanvasPage').then((m) => ({ default: m.WorkerCanvasPage }))
);
const SegregationPage = React.lazy(() =>
  import('./pages/examples/SegregationPage').then((m) => ({ default: m.SegregationPage }))
);
const SegregationLocalPage = React.lazy(() =>
  import('./pages/examples/SegregationLocalPage').then((m) => ({ default: m.SegregationLocalPage }))
);
const GameOfLifePage = React.lazy(() =>
  import('./pages/examples/GameOfLifePage').then((m) => ({ default: m.GameOfLifePage }))
);
const ChaosGamePage = React.lazy(() =>
  import('./pages/examples/ChaosGamePage').then((m) => ({ default: m.ChaosGamePage }))
);
const FibonacciPage = React.lazy(() =>
  import('./pages/examples/FibonacciPage').then((m) => ({ default: m.FibonacciPage }))
);
const FibonacciSpiralPage = React.lazy(() =>
  import('./pages/examples/FibonacciSpiralPage').then((m) => ({ default: m.FibonacciSpiralPage }))
);
const DicePage = React.lazy(() =>
  import('./pages/examples/DicePage').then((m) => ({ default: m.DicePage }))
);
const SimpleModelPage = React.lazy(() =>
  import('./pages/examples/SimpleModelPage').then((m) => ({ default: m.SimpleModelPage }))
);
const Automata1dPage = React.lazy(() =>
  import('./pages/examples/Automata1dPage').then((m) => ({ default: m.Automata1dPage }))
);
const EpidemicPage = React.lazy(() =>
  import('./pages/examples/EpidemicPage').then((m) => ({ default: m.EpidemicPage }))
);
const PredatorPreyPage = React.lazy(() =>
  import('./pages/examples/PredatorPreyPage').then((m) => ({ default: m.PredatorPreyPage }))
);
const CrowdComparePage = React.lazy(() =>
  import('./pages/examples/CrowdComparePage').then((m) => ({ default: m.CrowdComparePage }))
);
const LangtonAntPage = React.lazy(() =>
  import('./pages/examples/LangtonAntPage').then((m) => ({ default: m.LangtonAntPage }))
);
const BoidsPage = React.lazy(() =>
  import('./pages/examples/BoidsPage').then((m) => ({ default: m.BoidsPage }))
);
const SnakePage = React.lazy(() =>
  import('./pages/examples/SnakePage').then((m) => ({ default: m.SnakePage }))
);
const MazePage = React.lazy(() =>
  import('./pages/examples/MazePage').then((m) => ({ default: m.MazePage }))
);
const ActivatorsPage = React.lazy(() =>
  import('./pages/examples/ActivatorsPage').then((m) => ({ default: m.ActivatorsPage }))
);
const PercolationPage = React.lazy(() =>
  import('./pages/examples/PercolationPage').then((m) => ({ default: m.PercolationPage }))
);
const GravityPage = React.lazy(() =>
  import('./pages/examples/GravityPage').then((m) => ({ default: m.GravityPage }))
);
const GrayScottPage = React.lazy(() =>
  import('./pages/examples/GrayScottPage').then((m) => ({ default: m.GrayScottPage }))
);
const StableFluidsPage = React.lazy(() =>
  import('./pages/examples/StableFluidsPage').then((m) => ({ default: m.StableFluidsPage }))
);
const SandpilePage = React.lazy(() =>
  import('./pages/examples/SandpilePage').then((m) => ({ default: m.SandpilePage }))
);
const SphFluidPage = React.lazy(() =>
  import('./pages/examples/SphFluidPage').then((m) => ({ default: m.SphFluidPage }))
);
const IsingPage = React.lazy(() =>
  import('./pages/examples/IsingPage').then((m) => ({ default: m.IsingPage }))
);
const AntColonyPage = React.lazy(() =>
  import('./pages/examples/AntColonyPage').then((m) => ({ default: m.AntColonyPage }))
);
const TrafficPage = React.lazy(() =>
  import('./pages/examples/TrafficPage').then((m) => ({ default: m.TrafficPage }))
);
const AutomatickHeroPage = React.lazy(() =>
  import('./pages/examples/AutomatickHeroPage').then((m) => ({ default: m.AutomatickHeroPage }))
);
const WorldSpinnerPage = React.lazy(() =>
  import('./pages/examples/WorldSpinnerPage').then((m) => ({ default: m.WorldSpinnerPage }))
);
const AutomatickBubblesPage = React.lazy(() =>
  import('./pages/examples/AutomatickBubblesPage').then((m) => ({ default: m.AutomatickBubblesPage }))
);
const FallingSandPage = React.lazy(() =>
  import('./pages/examples/FallingSandPage').then((m) => ({ default: m.FallingSandPage }))
);
const SettlementPage = React.lazy(() =>
  import('./pages/examples/SettlementPage').then((m) => ({ default: m.SettlementPage }))
);
const ErosionPage = React.lazy(() =>
  import('./pages/examples/ErosionPage').then((m) => ({ default: m.ErosionPage }))
);
const EMFieldPage = React.lazy(() =>
  import('./pages/examples/EMFieldPage').then((m) => ({ default: m.EMFieldPage }))
);
const MaterialCAPage = React.lazy(() =>
  import('./pages/examples/MaterialCAPage').then((m) => ({ default: m.MaterialCAPage }))
);
const WavePage = React.lazy(() =>
  import('./pages/examples/WavePage').then((m) => ({ default: m.WavePage }))
);
const PhysarumPage = React.lazy(() =>
  import('./pages/examples/PhysarumPage').then((m) => ({ default: m.PhysarumPage }))
);
const SugarscapePage = React.lazy(() =>
  import('./pages/examples/SugarscapePage').then((m) => ({ default: m.SugarscapePage }))
);
const OpinionDynamicsPage = React.lazy(() =>
  import('./pages/examples/OpinionDynamicsPage').then((m) => ({ default: m.OpinionDynamicsPage }))
);
const MarketPage = React.lazy(() =>
  import('./pages/examples/MarketPage').then((m) => ({ default: m.MarketPage }))
);
const ParticleLifePage = React.lazy(() =>
  import('./pages/examples/ParticleLifePage').then((m) => ({ default: m.ParticleLifePage }))
);
const FireworksPage = React.lazy(() =>
  import('./pages/examples/FireworksPage').then((m) => ({ default: m.FireworksPage }))
);
const SpringMassPage = React.lazy(() =>
  import('./pages/examples/SpringMassPage').then((m) => ({ default: m.SpringMassPage }))
);
const ClothPage = React.lazy(() =>
  import('./pages/examples/ClothPage').then((m) => ({ default: m.ClothPage }))
);
const RigidBodyPage = React.lazy(() =>
  import('./pages/examples/RigidBodyPage').then((m) => ({ default: m.RigidBodyPage }))
);
const DoublePendulumPage = React.lazy(() =>
  import('./pages/examples/DoublePendulumPage').then((m) => ({ default: m.DoublePendulumPage }))
);
const ChaoticPendulumPage = React.lazy(() =>
  import('./pages/examples/ChaoticPendulumPage').then((m) => ({ default: m.ChaoticPendulumPage }))
);
const ForceGraphPage = React.lazy(() =>
  import('./pages/examples/ForceGraphPage').then((m) => ({ default: m.ForceGraphPage }))
);
const LSystemPage = React.lazy(() =>
  import('./pages/examples/LSystemPage').then((m) => ({ default: m.LSystemPage }))
);
const TerrainPage = React.lazy(() =>
  import('./pages/examples/TerrainPage').then((m) => ({ default: m.TerrainPage }))
);

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route element={<DocsLayout />}>
          <Route index element={<HomePage />} />
          {/* Guide — full shell with TOC */}
          <Route element={<ShellRoute variant='full' />}>
            <Route path='guide/getting-started' element={<GettingStartedPage />} />
            <Route path='guide/without-react' element={<WithoutReactPage />} />
            <Route path='guide/with-react' element={<WithReactPage />} />
            <Route path='guide/with-canvas' element={<WithCanvasPage />} />
            <Route path='guide/with-worker' element={<WithWorkerPage />} />
            <Route path='guide/tutorial' element={<TutorialPage />} />
            <Route path='guide/defining-a-sim' element={<DefiningASimPage />} />
            <Route path='guide/simulation-component' element={<SimulationComponentPage />} />
            <Route path='guide/using-the-hook' element={<UsingTheHookPage />} />
            <Route path='guide/controls' element={<ControlsGuidePage />} />
            <Route path='guide/canvas-rendering' element={<CanvasRenderingPage />} />
            <Route path='guide/visualization-patterns' element={<VisualizationPatternsPage />} />
            <Route path='api/define-sim' element={<DefineSimApiPage />} />
            <Route path='api/simulation' element={<SimulationApiPage />} />
            <Route path='api/use-simulation' element={<UseSimulationApiPage />} />
            <Route path='api/controls' element={<ControlsApiPage />} />
            <Route path='api/create-engine' element={<CreateEngineApiPage />} />
          </Route>
          {/* Examples — playground layout (sidebar + flush main, no TOC) */}
          <Route element={<ShellRoute variant='playground' />}>
          <Route path='examples' element={<ExamplesGalleryPage />} />
          <Route path='examples/counter' element={<CounterPage />} />
          <Route path='examples/inline-counter' element={<InlineCounterPage />} />
          <Route path='examples/fibonacci' element={<FibonacciPage />} />
          <Route path='examples/fibonacci-spiral' element={<FibonacciSpiralPage />} />
          <Route path='examples/dice' element={<DicePage />} />
          <Route path='examples/game-of-life' element={<GameOfLifePage />} />
          <Route path='examples/simple-model' element={<SimpleModelPage />} />
          <Route path='examples/automata-1d' element={<Automata1dPage />} />
          <Route path='examples/percolation' element={<PercolationPage />} />
          <Route path='examples/percolation-grid' element={<Navigate to='/examples/percolation' replace />} />
          <Route path='examples/activators' element={<ActivatorsPage />} />
          <Route path='examples/worker-canvas' element={<WorkerCanvasPage />} />
          <Route path='examples/chaos-game' element={<ChaosGamePage />} />
          <Route path='examples/langton-ant' element={<LangtonAntPage />} />
          <Route path='examples/gravity' element={<GravityPage />} />
          <Route path='examples/boids' element={<BoidsPage />} />
          <Route path='examples/snake' element={<SnakePage />} />
          <Route path='examples/mazes' element={<MazePage />} />
          <Route path='examples/epidemic' element={<EpidemicPage />} />
          <Route path='examples/predator-prey' element={<PredatorPreyPage />} />
          <Route path='examples/crowd-compare' element={<CrowdComparePage />} />
          <Route path='examples/segregation' element={<SegregationPage />} />
          <Route path='examples/segregation-local' element={<SegregationLocalPage />} />
          <Route path='examples/gray-scott' element={<GrayScottPage />} />
          <Route path='examples/stable-fluids' element={<StableFluidsPage />} />
          <Route path='examples/sandpile' element={<SandpilePage />} />
          <Route path='examples/sph-fluid' element={<SphFluidPage />} />
          <Route path='examples/ising' element={<IsingPage />} />
          <Route path='examples/ant-colony' element={<AntColonyPage />} />
          <Route path='examples/traffic' element={<TrafficPage />} />
          <Route path='examples/falling-sand' element={<FallingSandPage />} />
          <Route path='examples/settlement' element={<SettlementPage />} />
          <Route path='examples/erosion' element={<ErosionPage />} />
          <Route path='examples/electric-field' element={<EMFieldPage />} />
          <Route path='examples/material-ca' element={<MaterialCAPage />} />
          <Route path='examples/wave' element={<WavePage />} />
          <Route path='examples/physarum' element={<PhysarumPage />} />
          <Route path='examples/sugarscape' element={<SugarscapePage />} />
          <Route path='examples/opinion-dynamics' element={<OpinionDynamicsPage />} />
          <Route path='examples/market' element={<MarketPage />} />
          <Route path='examples/particle-life' element={<ParticleLifePage />} />
          <Route path='examples/fireworks' element={<FireworksPage />} />
          <Route path='examples/spring-mass' element={<SpringMassPage />} />
          <Route path='examples/cloth' element={<ClothPage />} />
          <Route path='examples/rigid-body' element={<RigidBodyPage />} />
          <Route path='examples/double-pendulum' element={<DoublePendulumPage />} />
          <Route path='examples/chaotic-pendulum' element={<ChaoticPendulumPage />} />
          <Route path='examples/force-graph' element={<ForceGraphPage />} />
          <Route path='examples/l-systems' element={<LSystemPage />} />
          <Route path='examples/terrain' element={<TerrainPage />} />
          <Route path='examples/automatick-hero' element={<AutomatickHeroPage />} />
          <Route path='examples/automatick-bubbles' element={<AutomatickBubblesPage />} />
          <Route path='examples/world-spinner' element={<WorldSpinnerPage />} />
          </Route>
          {/* Old routes redirect */}
          <Route path='guide/basic-blocks' element={<Navigate to='/guide/getting-started' replace />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
