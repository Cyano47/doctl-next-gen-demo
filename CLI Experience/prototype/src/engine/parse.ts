// Tokenizer + flag parser for real doctl-style command lines.

// Split a command line into tokens, honoring single/double quotes so that
// `doctl ask "create a 2GB droplet in NYC"` keeps the quoted phrase intact.
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (cur) {
        tokens.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur) tokens.push(cur);
  return tokens;
}

export interface SplitResult {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

// Given already-matched command tokens removed, split the rest into positionals
// and flags. `booleanFlags` names flags that never take a value.
export function splitFlags(
  rest: string[],
  booleanFlags: Set<string>,
  shortMap: Record<string, string> = {}
): SplitResult {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < rest.length; i++) {
    const tok = rest[i];
    if (tok.startsWith("--")) {
      const body = tok.slice(2);
      const eq = body.indexOf("=");
      if (eq !== -1) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
        continue;
      }
      const name = body;
      if (booleanFlags.has(name)) {
        flags[name] = true;
        continue;
      }
      const next = rest[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else if (tok.startsWith("-") && tok.length > 1) {
      const short = tok.slice(1);
      const name = shortMap[short] ?? short;
      if (booleanFlags.has(name)) {
        flags[name] = true;
        continue;
      }
      const next = rest[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else {
      positionals.push(tok);
    }
  }
  return { positionals, flags };
}

export function flagStr(
  flags: Record<string, string | boolean>,
  name: string,
  fallback = ""
): string {
  const v = flags[name];
  if (typeof v === "string") return v;
  return fallback;
}

export function flagBool(
  flags: Record<string, string | boolean>,
  name: string
): boolean {
  return flags[name] === true || flags[name] === "true";
}
