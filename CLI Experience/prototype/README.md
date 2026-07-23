# doctl Next-Gen — Interactive Demo

A self-contained, browser-based terminal that renders the **next-generation doctl experience** from the PRD/Vision against deterministic **mock data**. It understands **real doctl command syntax** (real verbs, flags, and resource names) — no auth, no network, no charges. Safe to show to customers and leadership.

Built for the [doctl Next-Gen PRD](../doctl-next-gen-prd-v1.2.md), grounded in the [10 test journeys](../doctl-test-journeys.md), the [Vision](../CLI%20Experience%20Vision.md), and the [v1.155.0 workflow audit](../Workflow%20gaps%20-%20test%20results.md).

---

## Run it locally

```bash
cd prototype
npm install
npm run dev        # http://localhost:5173
```

Production build (shareable static bundle):

```bash
npm run build      # -> dist/
npm run preview    # serves the built site on :4173
```

---

## What to show (2-minute demo script)

1. **Type a real command** — `doctl compute droplet create web-1 --size s-2vcpu-4gb --region nyc1 --wait`
   - See the **pricing preview** before commit, the **multi-stage progress TUI**, and the **SSH next-step**.
2. **Flip the toggle to "Today", then click "⇄ Replay"** — the same command **hangs silently** and returns an empty IP. This is the before/after story.
3. **Tab-completion** — type `doctl compute droplet delete ` and press **Tab**. Live resource names appear (Issue #699).
4. **Errors that teach** — `doctl compute droplet create x --image ubuntu-24-04-x64 --size s-1vcpu-1gb --region INVALID_REGION`.
5. **Name acceptance + masked secrets** — `doctl databases connection orders-pg`.
6. **GPU discovery** — `doctl compute size list --gpu` (model + VRAM columns).
7. **Agent surface** — `doctl mcp serve`, `doctl compute droplet create web-1 --describe`, and `doctl ask "deploy my node app from github"` (HITL confirm).
8. Or just click a **Guided Tour** in the sidebar (each maps to a TJ) and filter by **persona**.

The **Reset** button reseeds the mock data; **Clear** wipes the scrollback.

---

## Feature → source mapping

| Demo element | doctl PRD / Vision | Journey |
|---|---|---|
| Progress TUI on `--wait` | Progress is a trust signal (Shift 2) | TJ-07 |
| Pricing preview before commit | Resolve cost uncertainty (Shift 1) | TJ-06 |
| Teaching errors + "did you mean" | Every error teaches (Shift 4) | TJ-09 |
| Context-aware tab-completion | Section 9, Issue #699 | TJ-01/02 |
| Name acceptance + `--no-secrets` | DB creds by name (Now) | TJ-04 |
| GPU model/VRAM columns | GPU discovery (Now) | TJ-06 |
| App Platform `--from-repo` | App Platform end-to-end (Now) | TJ-03 |
| JSON `--field` / CSV | Andrew's fix (Now) | TJ-08 |
| `--describe` / `mcp serve` | Agent Mode (Next) | TJ-10 |
| `doctl ask` (HITL) | AI surface (Later) | ask |
| `doctl rollback` + dry-run confirm | Undo lowers cost of autonomy (Next) | — |

---

## Deploy to the cloud (DO App Platform)

Build locally first, then push to DigitalOcean App Platform. App Platform builds from a **git source**, so the code needs to live in a GitHub repo it can pull.

**Prerequisite:** push this `prototype/` to a GitHub repo (either as its own repo, or set `source_dir` in the spec to `CLI Experience/prototype` for the monorepo).

### Option A — via the DO MCP (agent)

1. Fill in `.do/app-static.yaml` repo/branch (or run `scripts/deploy-do.sh` to generate `.do/app-deploy.yaml`).
2. Call `apps__apps-create-app-from-spec` with that spec.
3. Poll `apps__apps-get-deployment-status` for the live URL.

### Option B — via doctl (CLI parity)

```bash
REPO=youruser/your-repo BRANCH=main ./scripts/deploy-do.sh
# runs: doctl apps create --spec .do/app-deploy.yaml
doctl apps list        # grab the live URL
```

A nice meta touch: the demo *about* doctl App Platform deploys is itself shipped *via* an App Platform deploy.

---

## Architecture

```
src/
  data/store.ts        seeded, mutable mock data (feeds commands + completion)
  engine/
    parse.ts           tokenizer + flag parser (quotes, --k=v, -o, booleans)
    model.ts           command-tree types + resolver
    handlers.ts        every command handler + the doctl command tree
    execute.ts         resolve -> run, plus --describe introspection
    complete.ts        context-aware Tab completion
    blocks.ts          output-block builders
  components/
    Terminal.tsx       shell: input, history, Tab menu, streaming execution
    BlockView.tsx      renderers for each block kind
  tours.ts             10 guided tours (mapped to the test journeys)
  App.tsx              chrome: mode toggle, replay, persona filter, quick actions
```

Everything is deterministic and in-memory. `smoke.mts` exercises every flagship command in both modes (bundle with esbuild + `node` to run).
