import type { Block, CommandContext, Mode, ParsedCommand } from "../types";
import { tokenize, splitFlags, flagBool } from "./parse";
import { collectBooleanFlags, resolve, SHORT_FLAGS, type CommandNode } from "./model";
import { commandTree } from "./handlers";
import { blank, code, line, lines, panel, span, teachError, todayError } from "./blocks";

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

  // First token matched no command at all (e.g. `doctl frobnicate`). Real doctl
  // returns an unknown-command error rather than dumping root help.
  if (path.length === 0 && tokens.length > 0 && !tokens[0].startsWith("-")) {
    ctx.append(
      mode === "nextgen"
        ? teachError({ title: `unknown command "${tokens[0]}" for "doctl"`, suggestions: [{ text: "See all commands", command: "doctl help" }] })
        : todayError(`Error: unknown command "${tokens[0]}" for "doctl"`)
    );
    return;
  }

  // --describe: machine-readable introspection for any command.
  if (flagBool(flags, "describe")) {
    describe(node, path, ctx);
    return;
  }

  if (!node.handler) {
    // Matched a namespace but no runnable leaf.
    if (node.children) {
      ctx.append(namespaceHelp(node, path, mode));
    } else if (mode === "nextgen") {
      ctx.append(teachError({ title: `unknown command "${tokens.join(" ")}"`, suggestions: [{ text: "See all commands", command: "doctl help" }] }));
    } else {
      ctx.append(todayError(`Error: unknown command "${tokens.join(" ")}" for "doctl"`));
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

// Real doctl's global flag block, shown under every command's help.
const GLOBAL_FLAGS: string[] = [
  "  -t, --access-token string   API V2 access token",
  "  -u, --api-url string        Override default API endpoint",
  '  -c, --config string         Specify a custom config file (default "$HOME/Library/Application Support/doctl/config.yaml")',
  "      --context string        Specify a custom authentication context name",
  "      --http-retry-max int    Set maximum number of retries for requests that fail with a 429 or 500-level error (default 5)",
  "      --interactive           Enable interactive behavior. Defaults to true if the terminal supports it (default true)",
  '  -o, --output string         Desired output format [text|json] (default "text")',
  "      --trace                 Show a log of network activity while performing a command",
  "  -v, --verbose               Enable verbose output",
];

// Verbatim help for namespaces where we have confirmed real doctl output.
// Our command tree is a curated subset, so these override the tree-derived
// command lists to match the real CLI exactly.
const TODAY_NS_HELP: Record<string, { long: string[]; commands: [string, string][] }> = {
  auth: {
    long: [
      "The `doctl auth` commands allow you to authenticate doctl for use with your DigitalOcean account using tokens that you generate in the control panel at https://cloud.digitalocean.com/account/api/tokens.",
      "",
      "If you work with a just one account, call `doctl auth init` and supply the token when prompted. This creates an authentication context named `default`.",
      "",
      "To switch between multiple DigitalOcean accounts, including team accounts, create named contexts using `doctl auth init --context <name>`, then providing the applicable token when prompted. This saves the token under the name you provide. To switch between contexts, use `doctl auth switch --context <name>`.",
      "",
      "To remove accounts from the configuration file, run `doctl auth remove --context <name>`. This removes the token under the name you provide.",
    ],
    commands: [
      ["init", "Initialize doctl to use a specific account"],
      ["list", "List available authentication contexts"],
      ["remove", "Remove authentication contexts"],
      ["switch", "Switch between authentication contexts"],
      ["token", "Display current authentication context API token"],
    ],
  },
  balance: {
    long: ["The subcommands of `doctl balance` retrieve information about your account balance."],
    commands: [["get", "Retrieve your account balance"]],
  },
};

// Render a command namespace exactly as cobra (and thus real doctl) does:
// description, Usage, Available Commands, Flags, Global Flags, footer.
function cobraHelp(pathStr: string, long: string[], commands: [string, string][]): Block {
  const last = pathStr.split(" ").pop() ?? pathStr;
  const maxLen = commands.reduce((m, c) => Math.max(m, c[0].length), 0);
  const col = Math.max(12, maxLen + 4);
  return lines(
    ...long.map((p) => line(span(p))),
    blank(),
    line(span("Usage:")),
    line(span(`  doctl ${pathStr} [command]`)),
    blank(),
    line(span("Available Commands:")),
    ...commands.map(([n, s]) => line(span("  " + n.padEnd(col) + s))),
    blank(),
    line(span("Flags:")),
    line(span(`  -h, --help   help for ${last}`)),
    blank(),
    line(span("Global Flags:")),
    ...GLOBAL_FLAGS.map((f) => line(span(f))),
    blank(),
    line(span(`Use "doctl ${pathStr} [command] --help" for more information about a command.`))
  );
}

function namespaceHelp(node: CommandNode, path: string[], mode: Mode): Block {
  const pathStr = path.join(" ");
  if (mode !== "nextgen") {
    const override = TODAY_NS_HELP[pathStr];
    if (override) return cobraHelp(pathStr, override.long, override.commands);
    const cmds = (node.children ?? [])
      .filter((c) => !c.name.startsWith("__"))
      .map((c) => [c.name, c.summary] as [string, string]);
    return cobraHelp(pathStr, [node.summary], cmds);
  }
  // NEXT-GEN: keep the friendlier, guidance-oriented panel.
  return {
    kind: "panel",
    variant: "info",
    title: `doctl ${pathStr}`,
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
