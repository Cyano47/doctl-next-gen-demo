// Small builders to keep command handlers terse.
import type {
  Block,
  ErrorBlock,
  Line,
  LinesBlock,
  PanelBlock,
  PricingBlock,
  Span,
  TableBlock,
  Tone,
} from "../types";

export function span(text: string, tone?: Tone, extra?: Partial<Span>): Span {
  return { text, tone, ...extra };
}

export function line(...spans: (Span | string)[]): Line {
  return spans.map((s) => (typeof s === "string" ? { text: s } : s));
}

export function text(...raw: string[]): LinesBlock {
  return { kind: "lines", lines: raw.map((r) => [{ text: r }]) };
}

export function lines(...ls: Line[]): LinesBlock {
  return { kind: "lines", lines: ls };
}

export function blank(): Line {
  return [{ text: "" }];
}

export function table(
  columns: string[],
  rows: (string[] | Span[][])[],
  opts?: { title?: string; highlightColumns?: number[] }
): TableBlock {
  return {
    kind: "table",
    columns,
    rows: rows as any,
    title: opts?.title,
    highlightColumns: opts?.highlightColumns,
  };
}

export function panel(
  variant: PanelBlock["variant"],
  ls: Line[],
  opts?: { title?: string; footer?: Line }
): PanelBlock {
  return { kind: "panel", variant, lines: ls, title: opts?.title, footer: opts?.footer };
}

export function pricing(
  title: string,
  rows: PricingBlock["rows"],
  total: string,
  cadence: string,
  note?: string
): PricingBlock {
  return { kind: "pricing", title, rows, total, cadence, note };
}

export function todayError(raw: string, requestId?: string): ErrorBlock {
  return { kind: "error", variant: "today", raw, requestId };
}

export function teachError(opts: {
  title: string;
  cause?: string;
  suggestions?: { text: string; command?: string }[];
  requestId?: string;
}): ErrorBlock {
  return {
    kind: "error",
    variant: "nextgen",
    title: opts.title,
    cause: opts.cause,
    suggestions: opts.suggestions,
    requestId: opts.requestId,
  };
}

export function code(
  language: "json" | "yaml" | "csv" | "bash" | "text",
  content: string,
  caption?: string
): Block {
  return { kind: "code", language, content, caption };
}
