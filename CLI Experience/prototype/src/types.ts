// Core types shared across the terminal, engine, and renderers.

export type Mode = "today" | "nextgen";

export type Tone =
  | "default"
  | "muted"
  | "success"
  | "warn"
  | "error"
  | "accent"
  | "prompt";

// A styled span of text within a line.
export interface Span {
  text: string;
  tone?: Tone;
  bold?: boolean;
  dim?: boolean;
}

export type Line = Span[];

// ---- Output blocks -------------------------------------------------------
// A command handler produces an ordered list of blocks. Blocks can be replaced
// or appended over time to support streaming / animation (e.g. progress TUI).

export interface LinesBlock {
  kind: "lines";
  lines: Line[];
}

export interface TableBlock {
  kind: "table";
  title?: string;
  columns: string[];
  rows: Span[][][] | string[][];
  // optional per-column emphasis (e.g. highlight the new GPU model column)
  highlightColumns?: number[];
}

export interface CodeBlock {
  kind: "code";
  language: "json" | "yaml" | "csv" | "bash" | "text";
  content: string;
  caption?: string;
}

export interface Stage {
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

export interface ProgressBlock {
  kind: "progress";
  title: string;
  stages: Stage[];
  spinnerFrame?: number;
  elapsedMs?: number;
  done?: boolean;
}

export interface PricingRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface PricingBlock {
  kind: "pricing";
  title: string;
  rows: PricingRow[];
  total: string;
  cadence: string; // e.g. "/mo" or "/hr"
  note?: string;
}

export interface ErrorBlock {
  kind: "error";
  // "today" = brittle single-line HTTP dump; "nextgen" = structured teaching error
  variant: "today" | "nextgen";
  raw?: string; // the raw HTTP line for the "today" variant
  title?: string;
  cause?: string;
  suggestions?: { text: string; command?: string }[];
  requestId?: string;
}

export type PanelVariant = "info" | "success" | "warn" | "welcome" | "agent";

export interface PanelBlock {
  kind: "panel";
  variant: PanelVariant;
  title?: string;
  lines: Line[];
  footer?: Line;
}

// A choice block renders clickable actions (used for HITL confirm on `doctl ask`,
// dry-run confirmation on destructive ops, etc.).
export interface Choice {
  label: string;
  command?: string; // run this command when chosen
  tone?: Tone;
  note?: string;
}

export interface ConfirmBlock {
  kind: "confirm";
  prompt: Line;
  choices: Choice[];
  resolvedLabel?: string; // set once the user picks, to freeze the block
}

export type Block =
  | LinesBlock
  | TableBlock
  | CodeBlock
  | ProgressBlock
  | PricingBlock
  | ErrorBlock
  | PanelBlock
  | ConfirmBlock;

// ---- Terminal entries ----------------------------------------------------

export interface InputEntry {
  id: string;
  type: "input";
  prompt: string;
  command: string;
  mode: Mode;
}

export interface OutputEntry {
  id: string;
  type: "output";
  blocks: Block[];
  running: boolean;
  mode: Mode;
}

export type Entry = InputEntry | OutputEntry;

// ---- Command execution context ------------------------------------------

export interface ParsedCommand {
  tokens: string[]; // full token list e.g. ["compute","droplet","create","web-1"]
  positionals: string[]; // non-flag args after the matched command path
  flags: Record<string, string | boolean>;
}

export interface CommandContext {
  parsed: ParsedCommand;
  mode: Mode;
  // Replace all blocks for this output entry.
  set: (blocks: Block[]) => void;
  // Append a single block.
  append: (block: Block) => void;
  // Update the last block in place via a mutator (used for animation).
  updateLast: (mutate: (b: Block) => Block) => void;
  sleep: (ms: number) => Promise<void>;
  // Run another command programmatically (used by confirm/ask flows).
  run: (command: string) => void;
}

export type CommandHandler = (ctx: CommandContext) => Promise<void> | void;
