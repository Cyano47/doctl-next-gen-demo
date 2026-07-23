import type {
  Block,
  Choice,
  CodeBlock,
  ConfirmBlock,
  ErrorBlock,
  Line,
  LinesBlock,
  PanelBlock,
  PricingBlock,
  ProgressBlock,
  Span,
  TableBlock,
} from "../types";

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function SpanView({ s }: { s: Span }) {
  const cls = ["tone-" + (s.tone ?? "default")];
  if (s.bold) cls.push("b");
  if (s.dim) cls.push("dim");
  return <span className={cls.join(" ")}>{s.text}</span>;
}

function LineView({ line }: { line: Line }) {
  return (
    <div className="ln">
      {line.map((s, i) => (
        <SpanView key={i} s={s} />
      ))}
    </div>
  );
}

function isSpanRow(row: unknown): row is Span[][] {
  return Array.isArray(row) && row.length > 0 && Array.isArray((row as any)[0]);
}

function Cell({ value }: { value: string | Span[] }) {
  if (typeof value === "string") return <>{value}</>;
  return (
    <>
      {value.map((s, i) => (
        <SpanView key={i} s={s} />
      ))}
    </>
  );
}

function Table({ b }: { b: TableBlock }) {
  return (
    <div className="tbl-wrap">
      {b.title && <div className="tbl-title">{b.title}</div>}
      <table className="tbl">
        <thead>
          <tr>
            {b.columns.map((c, i) => (
              <th key={i} className={b.highlightColumns?.includes(i) ? "hl" : ""}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.rows.map((row, ri) => (
            <tr key={ri}>
              {(row as any[]).map((cell, ci) => (
                <td key={ci} className={b.highlightColumns?.includes(ci) ? "hl" : ""}>
                  <Cell value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Code({ b }: { b: CodeBlock }) {
  return (
    <div className="code">
      <div className="code-head">
        <span className="code-lang">{b.language}</span>
        {b.caption && <span className="code-cap">{b.caption}</span>}
      </div>
      <pre>{b.content}</pre>
    </div>
  );
}

function Progress({ b }: { b: ProgressBlock }) {
  const frame = SPINNER[(b.spinnerFrame ?? 0) % SPINNER.length];
  const total = b.stages.length;
  const done = b.stages.filter((s) => s.status === "done").length;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="prog">
      <div className="prog-head">
        <span className="prog-title">{b.title}</span>
        <span className="prog-elapsed">{((b.elapsedMs ?? 0) / 1000).toFixed(1)}s</span>
      </div>
      <div className="prog-bar">
        <div className="prog-fill" style={{ width: `${b.done ? 100 : pct}%` }} />
      </div>
      <div className="prog-stages">
        {b.stages.map((s, i) => (
          <div key={i} className={"stage " + s.status}>
            <span className="stage-icon">
              {s.status === "done" ? "✓" : s.status === "active" ? frame : "○"}
            </span>
            <span className="stage-label">{s.label}</span>
            {s.detail && <span className="stage-detail">{s.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Pricing({ b }: { b: PricingBlock }) {
  return (
    <div className="pricing">
      <div className="pricing-head">
        <span className="pricing-title">{b.title}</span>
        <span className="pricing-badge">cost preview</span>
      </div>
      <div className="pricing-rows">
        {b.rows.map((r, i) => (
          <div key={i} className={"pricing-row" + (r.emphasis ? " em" : "")}>
            <span className="pr-label">{r.label}</span>
            <span className="pr-value">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="pricing-total">
        <span>Estimated total</span>
        <span className="pt-value">
          {b.total}
          <span className="pt-cadence">{b.cadence}</span>
        </span>
      </div>
      {b.note && <div className="pricing-note">{b.note}</div>}
    </div>
  );
}

function ErrorView({ b }: { b: ErrorBlock }) {
  if (b.variant === "today") {
    return (
      <div className="err today">
        <div className="err-raw">{b.raw}</div>
      </div>
    );
  }
  return (
    <div className="err nextgen">
      <div className="err-title">
        <span className="err-mark">✗</span> {b.title}
      </div>
      {b.cause && <div className="err-cause">{b.cause}</div>}
      {b.suggestions && b.suggestions.length > 0 && (
        <div className="err-sugg">
          {b.suggestions.map((s, i) => (
            <div key={i} className="err-sugg-item">
              <span className="bullet">→</span> {s.text}
              {s.command && <code className="err-cmd">{s.command}</code>}
            </div>
          ))}
        </div>
      )}
      {b.requestId && <div className="err-rid">request id: {b.requestId}</div>}
    </div>
  );
}

function Panel({ b }: { b: PanelBlock }) {
  return (
    <div className={"panel " + b.variant}>
      {b.title && <div className="panel-title">{b.title}</div>}
      <div className="panel-body">
        {b.lines.map((l, i) => (
          <LineView key={i} line={l} />
        ))}
      </div>
      {b.footer && (
        <div className="panel-footer">
          <LineView line={b.footer} />
        </div>
      )}
    </div>
  );
}

function Confirm({
  b,
  onChoose,
}: {
  b: ConfirmBlock;
  onChoose: (c: Choice) => void;
}) {
  return (
    <div className="confirm">
      <div className="confirm-prompt">
        <LineView line={b.prompt} />
      </div>
      {b.resolvedLabel ? (
        <div className="confirm-resolved">▸ {b.resolvedLabel}</div>
      ) : (
        <div className="confirm-choices">
          {b.choices.map((c, i) => (
            <button
              key={i}
              className={"btn tone-" + (c.tone ?? "default")}
              onClick={() => onChoose(c)}
            >
              {c.label}
              {c.note && <span className="btn-note">{c.note}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BlockView({
  block,
  onChoose,
}: {
  block: Block;
  onChoose: (c: Choice) => void;
}) {
  switch (block.kind) {
    case "lines":
      return (
        <div className="lines">
          {(block as LinesBlock).lines.map((l, i) => (
            <LineView key={i} line={l} />
          ))}
        </div>
      );
    case "table":
      return <Table b={block} />;
    case "code":
      return <Code b={block} />;
    case "progress":
      return <Progress b={block} />;
    case "pricing":
      return <Pricing b={block} />;
    case "error":
      return <ErrorView b={block} />;
    case "panel":
      return <Panel b={block} />;
    case "confirm":
      return <Confirm b={block} onChoose={onChoose} />;
    default:
      return null;
  }
}
