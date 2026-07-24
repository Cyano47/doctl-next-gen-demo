import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal, type TerminalHandle } from "./components/Terminal";
import { PERSONAS, TOURS, type Persona } from "./tours";
import type { Mode } from "./types";

const QUICK = [
  { label: "Pricing preview", cmd: "doctl compute droplet create demo --size s-2vcpu-4gb --region nyc1 --wait" },
  { label: "Teaching error", cmd: "doctl compute droplet create x --image ubuntu-24-04-x64 --size s-1vcpu-1gb --region INVALID_REGION" },
  { label: "Tab-complete", cmd: "doctl compute droplet delete " },
  { label: "Agent schema", cmd: "doctl compute droplet create web-1 --size s-2vcpu-4gb --region nyc1 --describe" },
  { label: "Rollback", cmd: "doctl rollback" },
  { label: "MCP serve", cmd: "doctl mcp serve" },
];

function Logo() {
  return (
    <svg className="do-logo" viewBox="0 0 32 32" aria-hidden>
      <path
        d="M16 5.5c-5.8 0-10.5 4.7-10.5 10.5H10a6 6 0 1 1 6 6v4.5c5.8 0 10.5-4.7 10.5-10.5S21.8 5.5 16 5.5z"
        fill="currentColor"
      />
      <rect x="10" y="22" width="4.5" height="4.5" fill="currentColor" />
      <rect x="6.5" y="25.5" width="3.5" height="3.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function App() {
  // Two fully independent flows — one per mode. Both stay mounted and keep
  // their own history/scroll; the toggle just reveals one or the other.
  const todayRef = useRef<TerminalHandle>(null);
  const nextRef = useRef<TerminalHandle>(null);
  const [mode, setMode] = useState<Mode>("nextgen");
  const [lastCommand, setLastCommand] = useState<string>("");
  const [persona, setPersona] = useState<Persona | "All">("All");
  const [busy, setBusy] = useState(false);
  const bootRef = useRef(false);

  const refFor = (m: Mode) => (m === "today" ? todayRef : nextRef);
  const activeRef = () => refFor(mode);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    // Seed each flow with its own first-run help.
    void todayRef.current?.run("doctl");
    void nextRef.current?.run("doctl");
  }, []);

  // Focus the active flow's input whenever the toggle switches screens.
  useEffect(() => {
    activeRef().current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const tours = useMemo(
    () => (persona === "All" ? TOURS : TOURS.filter((t) => t.persona === persona)),
    [persona]
  );

  const runTour = async (steps: string[]) => {
    const ref = activeRef();
    setBusy(true);
    for (const step of steps) {
      await ref.current?.run(step);
      await new Promise((r) => setTimeout(r, 550));
    }
    setBusy(false);
    ref.current?.focus();
  };

  // Toggling simply switches which flow is on screen — no re-running, no mixing.
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
  };

  // Replay the last command from the current flow into the other flow, then
  // switch to it — an explicit way to line up a before/after.
  const replayInOtherMode = async () => {
    if (!lastCommand) return;
    const other: Mode = mode === "nextgen" ? "today" : "nextgen";
    setMode(other);
    await refFor(other).current?.run(lastCommand);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">
            <Logo />
          </span>
          <div className="brand-text">
            <div className="brand-title">
              doctl <span className="brand-badge">next-gen</span>
            </div>
            <div className="brand-sub">Interactive demo · mock data · real command syntax</div>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="mode-toggle" role="tablist" aria-label="Experience mode">
            <button
              className={"mode-opt" + (mode === "today" ? " active today" : "")}
              onClick={() => switchMode("today")}
            >
              Today
            </button>
            <button
              className={"mode-opt" + (mode === "nextgen" ? " active next" : "")}
              onClick={() => switchMode("nextgen")}
            >
              Next-gen
            </button>
          </div>
          <button className="ghost-btn" disabled={!lastCommand || busy} onClick={replayInOtherMode}>
            ⇄ Replay in {mode === "nextgen" ? "Today" : "Next-gen"}
          </button>
          <button className="ghost-btn" onClick={() => activeRef().current?.clear()}>
            Clear
          </button>
          <button
            className="ghost-btn"
            onClick={() => {
              activeRef().current?.reset();
              void activeRef().current?.run("doctl");
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <div className="side-section">
            <div className="side-title">Guided tours</div>
            <div className="persona-filter">
              <button
                className={"chip" + (persona === "All" ? " on" : "")}
                onClick={() => setPersona("All")}
              >
                All
              </button>
              {PERSONAS.map((p) => (
                <button
                  key={p}
                  className={"chip" + (persona === p ? " on" : "")}
                  onClick={() => setPersona(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="tour-list">
              {tours.map((t) => (
                <button
                  key={t.id}
                  className="tour"
                  disabled={busy}
                  onClick={() => runTour(t.steps)}
                >
                  <div className="tour-top">
                    <span className="tour-tj">{t.tj}</span>
                    <span className="tour-persona">{t.persona}</span>
                  </div>
                  <div className="tour-title">{t.title}</div>
                  <div className="tour-blurb">{t.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="side-section">
            <div className="side-title">Quick try</div>
            <div className="quick-list">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  className="quick"
                  disabled={busy}
                  onClick={() => void activeRef().current?.run(q.cmd)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="side-foot">
            <div className="legend">
              <span className="dot next" /> Next-gen: reliability + agent surface
            </div>
            <div className="legend">
              <span className="dot today" /> Today: doctl v1.155.0 behavior
            </div>
            <div className="legend-note">
              Today and Next-gen are separate screens — switch with the toggle. Hit <b>Replay</b> to
              run your last command in the other screen.
            </div>
          </div>
        </aside>

        <main className="main">
          <div className={"term-view" + (mode === "today" ? " show" : " hide")}>
            <Terminal ref={todayRef} mode="today" onCommand={setLastCommand} />
          </div>
          <div className={"term-view" + (mode === "nextgen" ? " show" : " hide")}>
            <Terminal ref={nextRef} mode="nextgen" onCommand={setLastCommand} />
          </div>
        </main>
      </div>
    </div>
  );
}
