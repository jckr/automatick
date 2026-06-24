# automatick `controller` — design note (DRAFT)

> Status: **draft for discussion. No code yet.** Written to be reacted to with
> a fresh brain. The goal is to decide *whether* and *in what exact shape* a
> controller layer belongs in automatick — not to lock in an API.

## 1. Motivation

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

The question this note answers: can automatick grow a layer for that **without
loosening the tightness of a single sim**, or is it net-negative?

Working conclusion: **yes, if and only if** the additions below are (a) opt-in,
(b) expressed through the *existing* in/out ports, and (c) layered *above* an
unchanged sim contract.

## 2. Core principle — conductor, not holes in the walls

A view never references another view. Instead:

1. **Each sim declares what it publishes.** A pure selector over its own
   private data. Default: publishes nothing. This is the "contract to share
   select data with the world" — the sim owns its window.
2. **The controller owns the shared world** = the composition of every sim's
   published slice (plus, optionally, controller-owned seed state).
3. **The controller feeds the world back into each sim through its existing
   in-ports** (`params` and/or `inputs`). No new port is added to the sim.

The controller is a *conductor*: it reads each sim's **out** port (`data`, via
its `publish` selector) and writes to each sim's **in** ports
(`params`/`inputs`). It is not a shared mutable blackboard that sims poke at.

> The continuity that proves we're not fighting the design: today `params`
> come from React. A controller just generalizes *where params come from* —
> "a pure function of the shared world" instead of "a prop." Same port.

## 3. The sim contract is FROZEN (the non-negotiable)

- `defineSim`, and `step({ data, params, inputs, tick, random, ... })`,
  are **unchanged**. `step` does **not** gain a `world` argument.
- `data`/`params`/`inputs` keep their exact current meanings.
- A sim authored today runs **identically** whether or not a controller is
  present. No controller ⇒ zero cost, zero new concepts.
- Everything new lives in a **new, optional layer** (working name
  `automatick/controller`).

If sharing ever leaks into `step`'s signature, we've traded the thing that
makes automatick good for convenience. That is the bright line.

## 4. The only additions

1. **`publish` (per sim, optional).** A pure selector:
   `(data, params, tick) => PublicSlice`. Structured-cloneable output. This is
   the explicit share contract. Omitted ⇒ the sim is invisible to the world.

2. **Controller definition.** A set of named sims + per-sim **wiring**:
   - `paramsFrom(world) => Partial<Params>` — derive persistent config, and/or
   - `inputsFrom(world) => Input[]` — derive transient events,
   both **pure** functions of the shared world. (Distinguishing the two
   preserves the existing params-vs-inputs taxonomy: persistent config vs
   consumed-once perturbation.)

3. **Shared world store** = merge of all `publish` outputs (+ optional
   controller-owned state). Read-only to sims; only the controller commits it.

That's the whole surface. Notice none of it touches a sim's internals.

## 5. Determinism & the commit model

Today a run is reproducible from `seed + params-timeline + inputs-timeline`.
With a controller, the **replay unit moves up one level**: the *controller's*
seed(s) + the graph's timeline. Each individual sim remains deterministic given
the inputs it is fed. This is a **generalization, not a violation** — but it
must be stated loudly: you replay the *graph*, not a sim in isolation.

To keep it deterministic and to handle cycles (view A publishes something view
B reads, and vice-versa), use a **double-buffered / atomic commit**:

1. Every sim reads the **previous committed world frame**.
2. Every sim computes its next `data` (pure `step`, as today).
3. The controller recomputes every `publish`, merges, and commits the
   **next world frame** — all at once.

This is order-independent, cycle-safe, and pure. (It is, notably, the same
atomic-patch-compose discipline rogue-x already uses — convergent design, a
good sign.)

## 6. The clock — singleton beat, private cadence

The live worry: "the clock could be a singleton, though that may break the
contract." It does **not**, provided we split two things the engine currently
fuses:

- **The beat** — the monotonic "time advances now" source. This **should** be
  a singleton owned by the controller. A single unambiguous timeline is what
  makes "previous world frame" well-defined and shared state deterministic.
- **The cadence + status** — "does *this* view advance on this beat? at what
  rate? is it paused?" This stays **per-sim, private.**

So one heartbeat, but each view keeps its own play/pause/speed, expressed as an
**integer divider/phase of the base beat** (advance every beat / every Nth beat
/ paused ⇒ republish the same frame). The contract only breaks if a singleton
clock *also* forces singleton **status** — i.e. you can no longer pause one
view independently. Keep status private; share only the beat.

Constraint for v1: per-sim rates are integer multiples/dividers of the base
beat. **Arbitrary, independent wall-clock rates over shared state is out of
scope** (that's the genuinely hard mode; see Non-goals). Maps cleanly onto
rogue-x, where the host owns the clock and per-mode suspension freezes parts.

## 7. Worker boundary

- The shared world must stay **structured-cloneable** — already required of
  `data`/`params`/`inputs`, so `publish` slices inherit the same rule.
- The controller marshals the world. Cross-worker sharing therefore inherits
  the **same snapshot latency** as today's worker mode. We do **not** promise
  zero-latency cross-thread shared state. Sims that must share tightly should
  be co-located (same thread / same worker).

## 8. Non-goals (v1)

- ❌ Direct sim-to-sim reads (always via publish → world → params/inputs).
- ❌ Any change to `step`'s signature or the sim contract.
- ❌ Independent free-running clocks over shared state.
- ❌ A mandatory controller — simple single sims pay nothing and learn nothing.
- ❌ Low-latency cross-worker shared state.

## 9. Open questions

- **Wiring API shape:** per-sim `paramsFrom`/`inputsFrom` selectors, vs an
  explicit edge list `from(simA).to(simB)`, vs a Redux/zustand-style store with
  subscriptions. (Leaning selectors — it reuses the params mental model.)
- **Controller-owned state:** is there world state that *no* sim publishes
  (pure orchestration vars), and if so who steps it? (A degenerate sim?)
- **History / "past data":** the brainstorm mentioned past `data` values
  feeding the next `data`. That's a *separate* feature (a per-sim history
  buffer) — note it here, design it independently, don't entangle with the
  controller.
- **Naming:** controller / conductor / world / store / stage.
- **Schedule/order surfacing:** is commit order ever observable, or strictly
  hidden behind the double buffer? (Prefer hidden.)

## 10. Verdict (for discussion)

This turns automatick from "one sealed simulation" into "a graph of sealed
simulations a conductor wires together," **without weakening any single box**.
It happens to be exactly the rogue-x multi-view / shared-state shape, so it
solves both with one principled abstraction instead of bending either tool.

Recommended next step after this note is agreed: a tiny **two-sim prototype**
(A publishes a value, B reads it as a param, single beat, double-buffered
commit) to validate the commit model and the frozen-contract claim before any
public API is committed.
