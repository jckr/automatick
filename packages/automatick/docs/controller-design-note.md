# automatick `controller` — design note (DRAFT)

> Status: **draft for discussion. No code yet.** Written to be reacted to with
> a fresh brain. The goal is to decide *whether* and *in what exact shape* a
> controller layer belongs in automatick — not to lock in an API.

## 1. Motivation & prior art

Today automatick models **one sealed simulation** per `<Simulation>`:

- `params` flow **in** (persistent config, from the outside)
- `inputs` flow **in** (transient, consumed once)
- `data` is the **out** — private, computed by `step`, owned by the sim

This is great for a single self-contained world. It does **not** cover the
emerging need (surfaced while brainstorming rogue-x, but general):

> Several simulations — call them **views**, in the MVC / React sense — each
> keep **private data only they can touch**, but each can opt into a
> **contract to publish a select slice** of that data to a shared world, and
> read other views' published slices. Views never reach into each other.

**Prior art — Foxglove.** Foxglove visualizes robot/log data as a dashboard of
widgets over a **central timeline**. The shape it commits to, hard:

- **Time is central**, and so are **time controls**. A play/scrub control can
  be *surfaced* inside a widget, but it acts on the *one* global current time
  `T`. There is deliberately **no independent per-widget clock** — the whole
  point of observability is "see everything coherent at the same `T`."
- **Data is central** — one source of truth, sampled at `T`.
- **Widgets own** their *selection* of data, their *preparation* of it for
  render, and *local view options* — never time, never the shared state.

This note adopts the Foxglove discipline and reconciles it with automatick's
simulation model. The question it answers: can automatick grow this layer
**without loosening the tightness of a single sim**, or is it net-negative?

Working conclusion: **yes, if and only if** the additions below are (a) opt-in,
(b) expressed through the *existing* in/out ports, and (c) layered *above* an
unchanged sim contract.

## 2. Two roles: producers vs. views

The earlier framing treated every participant as a sim. Foxglove makes the
split explicit — there are **two distinct roles**, and many participants are
*not* producers:

- **Producer** — advances the shared world. Today this is an automatick sim
  stepping (`step: data → next data`). It could equally be a **recording being
  replayed** (the world is read from a log instead of computed). Producers
  write into the world via their **publish** contract (§4).
- **View / projector** — reads `world @ T`, *prepares* it for render, and holds
  *local presentation options*. It produces **nothing** into the world and owns
  **no clock**.

The unification: a Foxglove dashboard is views over a *recorded* world; a
rogue-x screen is views over a *simulated* world. **Same shape** — the only
difference is whether the world is fed by live producers or a log. One layer
serves both.

> A sim can play both roles (produce *and* render its own data) — that's just
> today's single-`<Simulation>` case, the degenerate one-node graph.

## 3. Core principle — conductor, not holes in the walls

A view never references another view. Instead:

1. **Each producer declares what it publishes.** A pure selector over its own
   private data. Default: publishes nothing. This is the "contract to share
   select data with the world" — the producer owns its window.
2. **The controller owns the shared world *and* time** = the composition of
   every published slice (plus optional controller-owned state), sampled along
   one central timeline.
3. **The controller feeds the world back into each participant through existing
   ports** — producers' `params`/`inputs`, views' selection. No new port is
   added to a sim's `step`.

The controller is a *conductor*: it reads each producer's **out** port (`data`,
via its `publish` selector) and writes to each consumer's **in** ports. It is
not a shared mutable blackboard that participants poke at.

> The continuity that proves we're not fighting the design: today `params` come
> from React. A controller just generalizes *where params come from* — "a pure
> function of the shared world" instead of "a prop." Same port.

## 4. The sim contract is FROZEN (the non-negotiable)

- `defineSim`, and `step({ data, params, inputs, tick, random, ... })`, are
  **unchanged**. `step` does **not** gain a `world` argument.
- `data`/`params`/`inputs` keep their exact current meanings.
- A sim authored today runs **identically** with or without a controller. No
  controller ⇒ zero cost, zero new concepts.
- Everything new lives in a **new, optional layer** (working name
  `automatick/controller`).
- Under a controller, a sim engine cedes its **time control** to the center
  (the controller drives `advance`/`seek` on each engine — capabilities the
  engine already exposes with `autoFrame: false`). This is not a contract
  change: it's the same "time/status comes from outside" generalization as
  params. Standalone, a sim keeps its own play/pause.

If sharing or time ever leaks into `step`'s signature, we've traded the thing
that makes automatick good for convenience. That is the bright line.

## 5. The only additions

1. **`publish` (per producer, optional).** A pure selector:
   `(data, params, tick) => PublicSlice`. Structured-cloneable output. The
   explicit share contract. Omitted ⇒ invisible to the world.
2. **`select` + `prepare` (per view).** `select(world @ T) => slice`, then
   prepare for render. Pure reads; no writes.
3. **Controller definition** — named producers + views, plus per-participant
   **wiring**: `paramsFrom(world) => Partial<Params>` and/or
   `inputsFrom(world) => Input[]`, all **pure** functions of the shared world.
   (Keeping params vs inputs distinct preserves the existing taxonomy:
   persistent config vs consumed-once perturbation.)
4. **Shared world store** = merge of all `publish` outputs (+ optional
   controller-owned state), buffered over time (§7). Read-only to participants;
   only the controller commits it.

None of this touches a sim's internals.

## 6. Time — central, including the controls

The live question was: "the clock could be a singleton, though that may break
the contract." After the Foxglove lens, the answer is sharper than "singleton
beat / private cadence" (that earlier idea is **withdrawn**):

- **One central timeline.** A single current `T` and a single set of playback
  controls (play / pause / seek / speed / loop) owned by the controller.
- **Controls surface anywhere, act centrally.** A play or scrub control can
  live in a view's UI, but it manipulates the *one* global `T`. Moving time
  moves it everywhere — exactly Foxglove.
- **Views own no clock.** A view that appears "paused" is really *pinning its
  selection to a fixed `T`* while central time rolls on — a selection choice,
  not a private clock. Coherence is preserved by construction.
- **One controller = one timeline = one coherent world.** Genuinely
  independent timelines are simply *separate controllers*, not a feature inside
  one. This is the clean boundary that kills the "independent free-running
  clocks over shared state" hard-mode: it's not in scope because it's a
  different controller.

This doesn't break the frozen contract: under a controller, time/status is
driven from the center (§4), the same way params already come from outside.

## 7. History, scrubbing & determinism

Foxglove makes **history first-class** — you scrub backwards. So in this model
the world is a **buffered timeline**, not just "the latest frame," and:

- A view showing a window `T-k … T` is just reading world **history** at an
  offset. (This resolves the earlier "past data values" open question: history
  is a property of the **central world**, not bolted onto each sim.)
- **Scrubbing = moving central `T`.** For a *recorded* world, seeking back is a
  trivial buffer read. For a *live simulation*, seeking back means replay —
  and **automatick's seed-determinism is exactly what makes that possible**:
  same seed + same params/inputs timeline ⇒ replay from seed to any `T`.
- **Edge worth naming:** Foxglove can only scrub *recordings*. automatick +
  this model can scrub a **running simulation**, because the run is
  reproducible. That's a capability neither tool has alone.

Determinism note: the replay unit is the **controller** (its seed(s) + the
graph's params/inputs timeline). Each producer stays deterministic given what
it's fed. State is exchanged via a **double-buffered / atomic commit** — every
producer reads the *previous* committed world frame, computes its next `data`,
then the controller recomputes every `publish`, merges, and commits the next
frame, all at once. Order-independent and cycle-safe (A↔B). (Same atomic-patch
discipline rogue-x already uses — convergent design, a good sign.)

## 8. Worker boundary

- The shared world must stay **structured-cloneable** — already required of
  `data`/`params`/`inputs`, so `publish` slices and the history buffer inherit
  the rule.
- The controller marshals the world; cross-worker sharing inherits the **same
  snapshot latency** as today's worker mode. No promise of zero-latency
  cross-thread shared state. Tightly-coupled participants should be co-located.

## 9. Non-goals (v1)

- ❌ Direct participant-to-participant reads (always via publish → world →
  ports / selection).
- ❌ Any change to `step`'s signature or the sim contract.
- ❌ Independent per-view clocks. One controller = one timeline; multiple
  timelines = multiple controllers.
- ❌ A mandatory controller — simple single sims pay nothing and learn nothing.
- ❌ Low-latency cross-worker shared state.

## 10. Open questions

- **Wiring API shape:** per-participant `paramsFrom`/`inputsFrom`/`select`
  selectors, vs an explicit edge list, vs a Redux/zustand-style store with
  subscriptions. (Leaning selectors — reuses the params mental model.)
- **Controller-owned state:** world state that *no* producer publishes (pure
  orchestration vars) — who steps it? (A degenerate producer?)
- **History bounds:** ring-buffer length / memory vs scrub depth; and for live
  sims, replay-from-seed vs keep-the-buffer when seeking far back.
- **View prepare caching:** prepared render data is per-view and `T`-dependent;
  define when it's recomputed vs memoized.
- **Naming:** controller / conductor / world / store / stage; producer / view.

## 11. Verdict (for discussion)

This turns automatick from "one sealed simulation" into "a **central timeline +
shared world**, with sealed **producers** that advance it and sealed **views**
that project it" — without weakening any single box. It absorbs the Foxglove
observability shape and the rogue-x multi-view shape into *one* abstraction, and
it gains a capability neither has alone: **scrubbing a live, deterministic
simulation.**

Recommended next step after this note is agreed: a tiny **prototype** — one
producer publishing a value, one view selecting it at central `T`, a single
central clock with play/pause/scrub, and double-buffered commit — to validate
the commit model, the central-time model, and the frozen-contract claim before
any public API is committed.
