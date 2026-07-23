import type { CommandHandler } from "../types";

export interface FlagSpec {
  name: string;
  short?: string;
  boolean?: boolean;
  value?: string; // placeholder for the value, e.g. "<slug>"
  desc: string;
  example?: string;
}

export interface CommandNode {
  name: string;
  aliases?: string[];
  summary: string;
  children?: CommandNode[];
  handler?: CommandHandler;
  flags?: FlagSpec[];
  examples?: string[];
  argHint?: string;
  // Context-aware completion for positional arguments (returns live candidates).
  completeArg?: (index: number, positionals: string[]) => string[];
}

export interface ResolveResult {
  node: CommandNode;
  path: string[]; // matched command path names
  rest: string[]; // remaining tokens (positionals + flags)
}

function matches(node: CommandNode, tok: string): boolean {
  return node.name === tok || (node.aliases?.includes(tok) ?? false);
}

// Walk the tree matching tokens to the deepest command node.
export function resolve(root: CommandNode, tokens: string[]): ResolveResult {
  let node = root;
  const path: string[] = [];
  let i = 0;
  while (i < tokens.length && node.children) {
    const child = node.children.find((c) => matches(c, tokens[i]));
    if (!child) break;
    node = child;
    path.push(child.name);
    i++;
  }
  return { node, path, rest: tokens.slice(i) };
}

// Collect every boolean flag name in the tree (for the flag parser).
export function collectBooleanFlags(root: CommandNode): Set<string> {
  const set = new Set<string>([
    "wait",
    "help",
    "describe",
    "no-header",
    "dry-run",
    "no-secrets",
    "follow",
    "force",
    "agent",
  ]);
  const walk = (n: CommandNode) => {
    n.flags?.forEach((f) => {
      if (f.boolean) set.add(f.name);
    });
    n.children?.forEach(walk);
  };
  walk(root);
  return set;
}

// Short-flag map (e.g. -o -> output).
export const SHORT_FLAGS: Record<string, string> = {
  o: "output",
  h: "help",
};
