import type { Block, CommandContext, Mode, ParsedCommand } from "../types";
import { tokenize, splitFlags, flagBool } from "./parse";
import { collectBooleanFlags, resolve, SHORT_FLAGS, type CommandNode } from "./model";
import { commandTree } from "./handlers";
import { blank, code, line, lines, panel, span, teachError } from "./blocks";

const BOOLEAN_FLAGS = collectBooleanFlags(commandTree);

export interface RunHooks {
  set: (blocks: Block[]) => void;
  append: (block: Block) => void;
  updateLast: (mutate: (b: Block) => Block) => void;
  sleep: (ms: number) => Promise<void>;
  run: (command: string) => void;
}

// Strip an optional leading "doctl" so both `doctl compute ...` and
// `compute ...` work.
function normalize(tokens: string[]): string[] {
  if (tokens[0] === "doctl") return tokens.slice(1);
  return tokens;
}

export async function execute(input: string, mode: Mode, hooks: RunHooks): Promise<void> {
  const raw = tokenize(input.trim());
  const tokens = normalize(raw);
  if (!tokens.length) {
    // bare `doctl`
    commandTree.handler?.(makeCtx({ tokens: [], positionals: [], flags: {} }, mode, hooks));
    return;
  }

  const { node, path, rest } = resolve(commandTree, tokens);
  const { positionals, flags } = splitFlags(rest, BOOLEAN_FLAGS, SHORT_FLAGS);
  const parsed: ParsedCommand = { tokens, positionals, flags };
  const ctx = makeCtx(parsed, mode, hooks);

  // --describe: machine-readable introspection for any command.
  if (flagBool(flags, "describe")) {
    describe(node, path, ctx);
    return;
  }

  if (!node.handler) {
    // Matched a namespace but no runnable leaf.
    if (node.children) {
      ctx.append(namespaceHelp(node, path));
    } else {
      ctx.append(teachError({ title: `unknown command "${tokens.join(" ")}"`, suggestions: [{ text: "See all commands", command: "doctl help" }] }));
    }
    return;
  }

  await node.handler(ctx);
}

function makeCtx(parsed: ParsedCommand, mode: Mode, hooks: RunHooks): CommandContext {
  return {
    parsed,
    mode,
    set: hooks.set,
    append: hooks.append,
    updateLast: hooks.updateLast,
    sleep: hooks.sleep,
    run: hooks.run,
  };
}

function namespaceHelp(node: CommandNode, path: string[]): Block {
  return {
    kind: "panel",
    variant: "info",
    title: `doctl ${path.join(" ")}`,
    lines: [
      line(span(node.summary, "muted")),
      blank(),
      line(span("Subcommands", "muted", { bold: true })),
      ...(node.children ?? []).filter((c) => !c.name.startsWith("__")).map((c) => line(span("  " + c.name.padEnd(14), "accent"), span(c.summary, "muted"))),
    ],
  };
}

function describe(node: CommandNode, path: string[], ctx: CommandContext) {
  const schema = {
    command: ["doctl", ...path].join(" "),
    summary: node.summary,
    arguments: node.argHint ? [node.argHint] : [],
    flags: (node.flags ?? []).map((f) => ({ name: f.name, short: f.short, type: f.boolean ? "boolean" : "string", value: f.value, description: f.desc })),
    output_contract: { stdout: "result", stderr: "diagnostics", exit_codes: { "0": "success", "1": "error", "2": "usage" } },
    schema_version: "2.0.0",
  };
  ctx.append(panel("agent", [line(span("Machine-readable contract", "default", { bold: true }), span("  (Agent Mode)", "muted"))], { title: `doctl ${path.join(" ")} --describe` }));
  ctx.append(code("json", JSON.stringify(schema, null, 2)));
}
