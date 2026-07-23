import { tokenize } from "./parse";
import { resolve, type CommandNode } from "./model";
import { commandTree } from "./handlers";

export interface Completion {
  // The full input line after applying the completion.
  replacement: string;
  // The candidate token shown in the dropdown.
  candidate: string;
  // Where the candidate came from (for the "live data" badge).
  source: "command" | "resource" | "flag";
  hint?: string;
}

// Context-aware completion: mirrors `git checkout <Tab>` listing real branches.
// Returns candidates for the *current* (possibly partial) token.
export function complete(input: string): { completions: Completion[]; tokenStart: number } {
  const endsWithSpace = /\s$/.test(input);
  const rawTokens = tokenize(input);
  const tokens = rawTokens[0] === "doctl" ? rawTokens.slice(1) : rawTokens;
  const prefixOffset = rawTokens[0] === "doctl" ? 1 : 0;

  // The token being completed (empty string if we're at a fresh word).
  const partial = endsWithSpace ? "" : tokens[tokens.length - 1] ?? "";
  const committedTokens = endsWithSpace ? tokens : tokens.slice(0, -1);

  const { node, rest } = resolve(commandTree, committedTokens);

  const candidates: Completion[] = [];

  // 1. If the resolver still has children to match, offer subcommands.
  const stillAtCommandLevel = rest.length === 0 || (rest.length === 0 && !endsWithSpace);
  if (node.children && (committedTokens.length === 0 || resolvedToNode(committedTokens, node))) {
    for (const child of node.children) {
      if (child.name.startsWith("__")) continue;
      if (child.name.startsWith(partial)) {
        candidates.push({ replacement: buildReplacement(input, partial, child.name), candidate: child.name, source: "command", hint: child.summary });
      }
    }
  }

  // 2. Context-aware resource-name completion for positional args.
  if (node.completeArg) {
    // How many positionals precede the current token?
    const positionalsSoFar = committedTokens.slice(pathLength(commandTree, committedTokens)).filter((t) => !t.startsWith("-"));
    const idx = positionalsSoFar.length;
    const live = node.completeArg(idx, positionalsSoFar);
    for (const name of live) {
      if (name.startsWith(partial)) {
        candidates.push({ replacement: buildReplacement(input, partial, name), candidate: name, source: "resource", hint: "live resource" });
      }
    }
  }

  // 3. Flag completion when the partial starts with "-".
  if (partial.startsWith("-") && node.flags) {
    for (const f of node.flags) {
      const flag = "--" + f.name;
      if (flag.startsWith(partial)) {
        candidates.push({ replacement: buildReplacement(input, partial, flag), candidate: flag, source: "flag", hint: f.desc });
      }
    }
  }

  return { completions: dedupe(candidates), tokenStart: prefixOffset };
}

function resolvedToNode(committed: string[], node: CommandNode): boolean {
  // The resolver consumed all committed command tokens down to `node`.
  return true;
}

function pathLength(root: CommandNode, tokens: string[]): number {
  const { path } = resolve(root, tokens);
  return path.length;
}

function buildReplacement(input: string, partial: string, candidate: string): string {
  if (partial === "") return input + candidate;
  return input.slice(0, input.length - partial.length) + candidate;
}

function dedupe(list: Completion[]): Completion[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    if (seen.has(c.candidate)) return false;
    seen.add(c.candidate);
    return true;
  });
}
