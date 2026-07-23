import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Block, Choice, ConfirmBlock, Entry, Mode, OutputEntry } from "../types";
import { execute } from "../engine/execute";
import { complete, type Completion } from "../engine/complete";
import { store } from "../data/store";
import { BlockView } from "./BlockView";

let uid = 0;
const nextId = () => `e${++uid}`;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface TerminalHandle {
  run: (command: string, modeOverride?: Mode) => Promise<void>;
  clear: () => void;
  reset: () => void;
  focus: () => void;
}

interface TerminalProps {
  mode: Mode;
  onCommand?: (command: string) => void;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  { mode, onCommand },
  ref
) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);

  const [comps, setComps] = useState<Completion[]>([]);
  const [compIdx, setCompIdx] = useState(0);
  const [showComp, setShowComp] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries]);

  const updateEntry = useCallback((id: string, fn: (e: OutputEntry) => OutputEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === id && e.type === "output" ? fn(e) : e)));
  }, []);

  const runCommand = useCallback(
    async (command: string, modeOverride?: Mode) => {
      const cmd = command.trim();
      if (!cmd) return;
      const activeMode = modeOverride ?? modeRef.current;
      onCommand?.(cmd);
      const inputId = nextId();
      const outId = nextId();
      setEntries((prev) => [
        ...prev,
        { id: inputId, type: "input", prompt: "~", command: cmd, mode: activeMode },
        { id: outId, type: "output", blocks: [], running: true, mode: activeMode },
      ]);
      setBusy(true);

      const hooks = {
        set: (blocks: Block[]) => updateEntry(outId, (e) => ({ ...e, blocks })),
        append: (block: Block) =>
          updateEntry(outId, (e) => ({ ...e, blocks: [...e.blocks, block] })),
        updateLast: (mutate: (b: Block) => Block) =>
          updateEntry(outId, (e) => {
            if (!e.blocks.length) return e;
            const blocks = e.blocks.slice();
            blocks[blocks.length - 1] = mutate(blocks[blocks.length - 1]);
            return { ...e, blocks };
          }),
        sleep,
        run: (c: string) => {
          void runCommand(c);
        },
      };

      try {
        await execute(cmd, activeMode, hooks);
      } catch (err) {
        hooks.append({
          kind: "error",
          variant: "nextgen",
          title: "prototype error",
          cause: String(err),
        });
      }
      updateEntry(outId, (e) => ({ ...e, running: false }));
      setBusy(false);
    },
    [updateEntry, onCommand]
  );

  const submit = useCallback(
    (command: string) => {
      const cmd = command.trim();
      setInput("");
      setShowComp(false);
      if (cmd) {
        setHistory((h) => [...h, cmd]);
        setHistIdx(-1);
      }
      void runCommand(cmd || "doctl");
    },
    [runCommand]
  );

  useImperativeHandle(ref, () => ({
    run: runCommand,
    clear: () => setEntries([]),
    reset: () => {
      store.reset();
      setEntries([]);
    },
    focus: () => inputRef.current?.focus(),
  }));

  const applyCompletion = (c: Completion) => {
    setInput(c.replacement);
    setShowComp(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (showComp && comps.length) {
        const next = (compIdx + 1) % comps.length;
        setCompIdx(next);
        return;
      }
      const { completions } = complete(input);
      if (completions.length === 1) {
        applyCompletion(completions[0]);
      } else if (completions.length > 1) {
        setComps(completions);
        setCompIdx(0);
        setShowComp(true);
      }
      return;
    }
    if (e.key === "Enter") {
      if (showComp && comps.length) {
        e.preventDefault();
        applyCompletion(comps[compIdx]);
        return;
      }
      submit(input);
      return;
    }
    if (e.key === "Escape") {
      setShowComp(false);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showComp && comps.length) {
        setCompIdx((i) => (i - 1 + comps.length) % comps.length);
        return;
      }
      if (!history.length) return;
      const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showComp && comps.length) {
        setCompIdx((i) => (i + 1) % comps.length);
        return;
      }
      if (histIdx === -1) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
      return;
    }
  };

  const onChoose = (entryId: string, blockIdx: number, choice: Choice) => {
    // Freeze the confirm block, then optionally run its command.
    updateEntry(entryId, (e) => {
      const blocks = e.blocks.slice();
      const b = blocks[blockIdx] as ConfirmBlock;
      blocks[blockIdx] = { ...b, resolvedLabel: choice.label };
      return { ...e, blocks };
    });
    if (choice.command) void runCommand(choice.command);
  };

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="scroll">
        {entries.map((entry) =>
          entry.type === "input" ? (
            <div key={entry.id} className={"input-echo" + (entry.mode === "today" ? " mono" : "")}>
              <span className="ps1">
                <span className="ps1-ctx">{entry.mode === "today" ? "doctl@today" : "doctl@2.0"}</span>
                <span className="ps1-sep"> </span>
                <span className="ps1-path">{entry.prompt}</span>
                <span className="ps1-mark"> $</span>
              </span>
              <span className="cmd-text">{entry.command}</span>
            </div>
          ) : (
            <div key={entry.id} className={"output" + (entry.mode === "today" ? " mono" : "")}>
              {entry.blocks.map((b, i) => (
                <BlockView key={i} block={b} onChoose={(c) => onChoose(entry.id, i, c)} />
              ))}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className={"prompt-row" + (mode === "today" ? " mono" : "")}>
        <span className="ps1">
          <span className="ps1-ctx">{mode === "today" ? "doctl@today" : "doctl@2.0"}</span>
          <span className="ps1-sep"> </span>
          <span className="ps1-path">~</span>
          <span className="ps1-mark"> $</span>
        </span>
        <div className="input-wrap">
          <input
            ref={inputRef}
            className="cmd-input"
            value={input}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={busy ? "" : "type a doctl command, or press Tab to complete…"}
            onChange={(e) => {
              setInput(e.target.value);
              if (showComp) setShowComp(false);
            }}
            onKeyDown={onKeyDown}
            autoFocus
          />
          {showComp && comps.length > 0 && (
            <div className="comp-menu">
              <div className="comp-head">
                {comps.length} completions · Tab to cycle · Enter to accept
              </div>
              {comps.map((c, i) => (
                <div
                  key={c.candidate}
                  className={"comp-item" + (i === compIdx ? " sel" : "")}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyCompletion(c);
                  }}
                >
                  <span className="comp-cand">{c.candidate}</span>
                  <span className={"comp-src " + c.source}>{c.source === "resource" ? "live" : c.source}</span>
                  {c.hint && <span className="comp-hint">{c.hint}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
