import type { Block, CommandContext, ProgressBlock, Stage } from "../types";
import { store } from "../data/store";
import { flagBool, flagStr } from "./parse";
import type { CommandNode } from "./model";
import {
  blank,
  code,
  line,
  lines,
  panel,
  pricing,
  span,
  table,
  teachError,
  text,
  todayError,
} from "./blocks";

// -------------------------------------------------------------------------
// Shared helpers
// -------------------------------------------------------------------------

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// Animate a multi-stage progress block (the next-gen "waiting speaks" UX).
async function runProgress(
  ctx: CommandContext,
  title: string,
  stageDefs: { label: string; ms: number; detail?: string }[]
) {
  const stages: Stage[] = stageDefs.map((s) => ({ label: s.label, status: "pending", detail: s.detail }));
  const block: ProgressBlock = { kind: "progress", title, stages, spinnerFrame: 0, elapsedMs: 0, done: false };
  ctx.append(block);
  const start = Date.now();
  for (let i = 0; i < stageDefs.length; i++) {
    stages[i].status = "active";
    const stepStart = Date.now();
    const dur = stageDefs[i].ms;
    while (Date.now() - stepStart < dur) {
      await ctx.sleep(90);
      ctx.updateLast((b) => {
        const p = b as ProgressBlock;
        return { ...p, spinnerFrame: (p.spinnerFrame ?? 0) + 1, elapsedMs: Date.now() - start, stages: [...stages] };
      });
    }
    stages[i].status = "done";
    ctx.updateLast((b) => ({ ...(b as ProgressBlock), stages: [...stages], elapsedMs: Date.now() - start }));
  }
  ctx.updateLast((b) => ({ ...(b as ProgressBlock), done: true, elapsedMs: Date.now() - start }));
}

// Simulate today's silent hang: a bare spinner with zero information, then a
// terse one-liner. This is the "before" half of the story.
async function silentHang(ctx: CommandContext, seconds: number, finalLine: string) {
  const b: Block = { kind: "lines", lines: [line(span("", "muted"))] };
  ctx.append(b);
  const start = Date.now();
  while (Date.now() - start < seconds * 1000) {
    await ctx.sleep(120);
    const f = SPINNER[Math.floor((Date.now() - start) / 120) % SPINNER.length];
    ctx.updateLast(() => ({ kind: "lines", lines: [line(span(`${f} `, "muted"), span("(no output — process appears to hang)", "muted"))] }));
  }
  ctx.updateLast(() => ({ kind: "lines", lines: [line(span(finalLine))] }));
}

function money(n: number): string {
  return "$" + n.toFixed(2);
}

// Generic list projection supporting --output text|json|yaml|csv and
// --format / --field column selection.
interface Col {
  header: string;
  key: string;
  get: (r: any) => string;
}

function projectRequest(cols: Col[], request: string): Col[] {
  if (!request) return cols;
  const wanted = request.split(",").map((s) => s.trim().toLowerCase());
  const picked = wanted
    .map((w) => cols.find((c) => c.header.toLowerCase() === w || c.key.toLowerCase() === w))
    .filter((c): c is Col => Boolean(c));
  return picked.length ? picked : cols;
}

function emitList(ctx: CommandContext, records: any[], allCols: Col[], opts?: { jsonBloat?: (r: any) => any }) {
  const output = flagStr(ctx.parsed.flags, "output", "text");
  const request = flagStr(ctx.parsed.flags, "field") || flagStr(ctx.parsed.flags, "format");
  const cols = projectRequest(allCols, request);

  if (output === "json") {
    // Next-gen honors --field on JSON and returns a slim projection.
    // Today ignores it and dumps the full, region-bloated payload.
    if (ctx.mode === "nextgen") {
      const slim = records.map((r) => {
        const o: any = {};
        cols.forEach((c) => (o[c.key] = coerce(c.get(r))));
        return o;
      });
      ctx.append(code("json", JSON.stringify(slim, null, 2), request ? `Projected to: ${cols.map((c) => c.key).join(", ")}` : undefined));
    } else {
      const full = records.map((r) => (opts?.jsonBloat ? opts.jsonBloat(r) : r));
      ctx.append(code("json", JSON.stringify(full, null, 2), "Full payload — --field is ignored for JSON today (region object embedded)"));
    }
    return;
  }
  if (output === "yaml") {
    ctx.append(code("yaml", toYaml(records.map((r) => rowObj(r, cols))), undefined));
    return;
  }
  if (output === "csv") {
    if (ctx.mode !== "nextgen") {
      ctx.append(todayError('Error: unknown output format "csv"'));
      return;
    }
    const header = cols.map((c) => c.header).join(",");
    const body = records.map((r) => cols.map((c) => csvCell(c.get(r))).join(",")).join("\n");
    ctx.append(code("csv", `${header}\n${body}`));
    return;
  }
  // text table — real doctl uses exact-case headers, not uppercased.
  ctx.append(table(cols.map((c) => c.header), records.map((r) => cols.map((c) => c.get(r)))));
}

function rowObj(r: any, cols: Col[]) {
  const o: any = {};
  cols.forEach((c) => (o[c.key] = coerce(c.get(r))));
  return o;
}
function coerce(v: string): any {
  if (v === "") return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}
function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function toYaml(arr: any[]): string {
  return arr
    .map((o) => "- " + Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n  "))
    .join("\n");
}

// -------------------------------------------------------------------------
// Column definitions
// -------------------------------------------------------------------------
// Next-gen keeps a curated, readable subset of columns.
const dropletCols: Col[] = [
  { header: "ID", key: "id", get: (d) => String(d.id) },
  { header: "Name", key: "name", get: (d) => d.name },
  { header: "Public IPv4", key: "public_ipv4", get: (d) => d.ip },
  { header: "Region", key: "region", get: (d) => d.region },
  { header: "Size", key: "size", get: (d) => d.size },
  { header: "Status", key: "status", get: (d) => d.status },
];

// ---- derived fields for the full "today" column set ---------------------
function diskFor(size: string): number {
  const s = store.sizes.find((x) => x.slug === size);
  if (s) return s.diskGb;
  return store.gpuSizes.find((g) => g.slug === size) ? 720 : 25;
}
function imageName(slug: string): string {
  const i = store.images.find((x) => x.slug === slug);
  return i ? `${i.distribution} ${i.name}` : slug;
}
function privateIp(id: number): string {
  return `10.124.0.${(id % 250) + 2}`;
}
const VPC_BY_REGION: Record<string, string> = {
  nyc1: "3cfbc22a-bf58-49d8-b13a-1168846f272e",
  nyc2: "9b1f0c2d-7e34-4a1b-8c5f-2d3e4f5a6b7c",
  nyc3: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  sfo3: "6d5e4c3b-2a19-4f8e-9d7c-0b1a2c3d4e5f",
  ams3: "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
};
function vpcFor(region: string): string {
  return VPC_BY_REGION[region] ?? "00000000-0000-4000-8000-000000000000";
}

// Real `doctl compute droplet list` — the full, wide, exact-case column set.
const dropletColsToday: Col[] = [
  { header: "ID", key: "id", get: (d) => String(d.id) },
  { header: "Name", key: "name", get: (d) => d.name },
  { header: "Public IPv4", key: "public_ipv4", get: (d) => d.ip },
  { header: "Private IPv4", key: "private_ipv4", get: (d) => privateIp(d.id) },
  { header: "Public IPv6", key: "public_ipv6", get: () => "" },
  { header: "Memory", key: "memory", get: (d) => String(d.memoryMb) },
  { header: "VCPUs", key: "vcpus", get: (d) => String(d.vcpus) },
  { header: "Disk", key: "disk", get: (d) => String(diskFor(d.size)) },
  { header: "Region", key: "region", get: (d) => d.region },
  { header: "Image", key: "image", get: (d) => imageName(d.image) },
  { header: "VPC UUID", key: "vpc_uuid", get: (d) => vpcFor(d.region) },
  { header: "Status", key: "status", get: (d) => d.status },
  { header: "Tags", key: "tags", get: () => "" },
  { header: "Features", key: "features", get: () => "droplet_agent,private_networking" },
  { header: "Volumes", key: "volumes", get: () => "" },
];

// Real `doctl databases list` storage column (MiB), keyed by slug.
function dbStorageMiB(size: string): number {
  const map: Record<string, number> = {
    "db-s-1vcpu-1gb": 10240,
    "db-s-1vcpu-2gb": 30720,
    "db-s-2vcpu-4gb": 61440,
    "db-s-4vcpu-8gb": 115712,
  };
  return map[size] ?? 10240;
}

// -------------------------------------------------------------------------
// Handlers
// -------------------------------------------------------------------------

// TODAY: reproduce the real `doctl` root help verbatim — plain, monochrome,
// two-column (name padded, then description), no boxes. This is the authentic
// "before" that the next-gen experience is measured against.
const renderTodayRootHelp = (ctx: CommandContext) => {
  const W = 20; // command-name column width (matches real doctl alignment)
  const row = (name: string, desc: string) =>
    line(span("  " + name.padEnd(W) + " " + desc));

  ctx.append(
    lines(
      line(span("doctl is a command line interface (CLI) for the DigitalOcean API.")),
      blank(),
      line(span("Usage:")),
      line(span("  doctl [command]")),
      blank(),
      line(span("Manage DigitalOcean Resources:")),
      row("1-click", "Display commands that pertain to 1-click applications"),
      row("account", "Display commands that retrieve account details"),
      row("apps", "Displays commands for working with apps"),
      row("compute", "Display commands that manage infrastructure"),
      row("databases", "Display commands that manage databases"),
      row("dedicated-inference", "Display commands for managing dedicated inference endpoints"),
      row("gradient", "Manage Gradient AI resources"),
      row("kubernetes", "Displays commands to manage Kubernetes clusters and configurations"),
      row("monitoring", "Display commands to manage monitoring"),
      row("network", "Display commands that manage network products"),
      row("nfs", "Display commands to manage network file storage"),
      row("projects", "Manage projects and assign resources to them"),
      row("registries", "Display commands for working with multiple container registries"),
      row("registry", "Display commands for working with container registries"),
      row("security", "Display commands to manage CSPM scans"),
      row("serverless", "Develop, test, and deploy serverless functions"),
      row("spaces", "Display commands that manage DigitalOcean Spaces."),
      row("vector-databases", "Display commands that manage vector databases"),
      row("vpcs", "Display commands that manage VPCs"),
      blank(),
      line(span("Inference:")),
      row("serverless-inference", "Call DigitalOcean serverless inference APIs"),
      blank(),
      line(span("Configure doctl:")),
      row("auth", "Display commands for authenticating doctl with an account"),
      row("version", "Show the current version"),
      blank(),
      line(span("View Billing:")),
      row("balance", "Display commands for retrieving your account balance"),
      row("billing-history", "Display commands for retrieving your billing history"),
      row("invoice", "Display commands for retrieving invoices for your account"),
      blank(),
      line(span("Additional Commands:")),
      row("completion", "Generate the autocompletion script for the specified shell"),
      row("help", "Help about any command"),
      blank(),
      line(span("Flags:")),
      line(span("  -t, --access-token string   API V2 access token")),
      line(span("  -u, --api-url string        Override default API endpoint")),
      line(span("  -c, --config string         Specify a custom config file (default \"$HOME/Library/Application Support/doctl/config.yaml\")")),
      line(span("      --context string        Specify a custom authentication context name")),
      line(span("  -h, --help                  help for doctl")),
      line(span("      --http-retry-max int    Set maximum number of retries for requests that fail with a 429 or 500-level error (default 5)")),
      line(span("      --interactive           Enable interactive behavior. Defaults to true if the terminal supports it (default true)")),
      line(span("  -o, --output string         Desired output format [text|json] (default \"text\")")),
      line(span("      --trace                 Show a log of network activity while performing a command")),
      line(span("  -v, --verbose               Enable verbose output")),
      blank(),
      line(span("Use \"doctl [command] --help\" for more information about a command.")),
    )
  );
};

const rootHandler = (ctx: CommandContext) => {
  // TODAY: the real doctl root help — a plain wall of commands, no guidance.
  if (ctx.mode !== "nextgen") {
    renderTodayRootHelp(ctx);
    return;
  }
  // NEXT-GEN: a welcoming, opinionated first run.
  ctx.append(
    panel(
      "welcome",
      [
        line(span("doctl", "accent", { bold: true }), span("  the DigitalOcean command line, reimagined")),
        blank(),
        line(span("Every workflow finishes in the terminal. Every wait speaks. Every error teaches.")),
        blank(),
        line(span("Try:", "muted")),
        line(span("  doctl compute droplet create web-1 --region nyc1 --size s-2vcpu-4gb --wait", "accent")),
        line(span("  doctl ask \"deploy my node app from github\"", "accent")),
        line(span("  doctl gradient agent chat support-bot --message \"hi\"", "accent")),
      ],
      { footer: line(span("Tip: press ", "muted"), span("Tab", "warn"), span(" to complete live resource names, or open a Guided Tour →", "muted")) }
    )
  );
};

const helpHandler = (ctx: CommandContext) => {
  // TODAY: `doctl help` prints the same root help as `doctl` — reproduce it.
  if (ctx.mode !== "nextgen") {
    renderTodayRootHelp(ctx);
    return;
  }
  // NEXT-GEN: guidance-first help with the AI/agent surface front and center.
  ctx.append(
    lines(
      line(span("doctl", "default", { bold: true }), span(" is the command line for DigitalOcean.")),
      blank(),
      line(span("USAGE", "muted", { bold: true })),
      line(span("  doctl [command] [flags]")),
      blank(),
      line(span("CORE", "muted", { bold: true }))
    )
  );
  ctx.append(
    table(
      ["NAMESPACE", "DESCRIPTION"],
      [
        ["compute", "Droplets, SSH keys, sizes, regions, snapshots"],
        ["apps", "App Platform: deploy from a repo, logs, cost preview"],
        ["databases", "Managed databases: create, connect (by name)"],
        ["kubernetes", "DOKS clusters and node pools"],
        [[span("gradient", "accent")], [span("AI Platform: agents, inference, chat (aliases: ai, genai)", "accent")]],
        ["auth", "Authenticate and manage contexts"],
      ]
    )
  );
  ctx.append(
    lines(
      blank(),
      line(span("AGENT & AI", "muted", { bold: true })),
      line(span("  doctl ask <prompt>       ", "accent"), span("Natural-language → command (HITL-gated)")),
      line(span("  doctl mcp serve          ", "accent"), span("Start an in-binary MCP server for agents")),
      line(span("  doctl rollback           ", "accent"), span("Reverse the last mutating operation")),
      blank(),
      line(span("Add ", "muted"), span("--describe", "warn"), span(" to any command for a machine-readable schema.", "muted"))
    )
  );
};

// Mock auth contexts backing the `doctl auth` subcommands.
const authContexts = ["default", "team-acme"];
let currentContext = "default";

const authInit = async (ctx: CommandContext) => {
  ctx.append(text("Please authenticate doctl by visiting:"));
  ctx.append(lines(line(span("  https://cloud.digitalocean.com/account/api/tokens?ctx=cli", "accent"))));
  await ctx.sleep(600);
  ctx.append(lines(line(span("Waiting for browser authorization… ", "muted"), span("done", "success"))));
  await ctx.sleep(300);
  if (ctx.mode === "nextgen") {
    ctx.append(
      panel(
        "success",
        [
          line(span("✓ Authenticated", "success", { bold: true }), span(" as ", "muted"), span("valapati@digitalocean.com")),
          blank(),
          line(span("You're in ", "muted"), span("New York (nyc1)", "default", { bold: true }), span(" · Droplet limit 25", "muted")),
          blank(),
          line(span("Next steps", "muted", { bold: true })),
          line(span("  1. ", "muted"), span("doctl compute droplet create my-first --region nyc1 --size s-1vcpu-1gb --wait", "accent")),
          line(span("  2. ", "muted"), span("doctl apps create --from-repo github.com/you/app", "accent")),
          line(span("  3. ", "muted"), span("doctl ask \"what can I build here?\"", "accent")),
        ],
        { title: "Welcome to DigitalOcean" }
      )
    );
  } else {
    ctx.append(lines(line(span("Validating token... ", "muted"), span("OK", "success"))));
  }
};

const authList = (ctx: CommandContext) => {
  // Real `doctl auth list` prints one context per line, marking the active one.
  ctx.append(lines(...authContexts.map((c) => line(span(c + (c === currentContext ? " (current)" : ""))))));
};

const authSwitch = (ctx: CommandContext) => {
  const target = flagStr(ctx.parsed.flags, "context") || ctx.parsed.positionals[0];
  if (!target) {
    return ctx.append(ctx.mode === "nextgen" ? teachError({ title: "missing --context", suggestions: [{ text: "List contexts", command: "doctl auth list" }] }) : todayError('Error: required flag(s) "context" not set'));
  }
  if (!authContexts.includes(target)) {
    return ctx.append(ctx.mode === "nextgen" ? teachError({ title: `context "${target}" not found`, suggestions: [{ text: "List contexts", command: "doctl auth list" }] }) : todayError(`Error: context ${target} does not exist`));
  }
  currentContext = target;
  ctx.append(text(`Now using context [${target}] by default`));
};

const authToken = (ctx: CommandContext) => {
  // The raw API token for the active context. Deliberately a non-conforming
  // placeholder (not 64 hex) so secret scanners don't flag this mock demo.
  ctx.append(text("dop_v1_example-token-not-a-real-secret"));
};

const authRemove = (ctx: CommandContext) => {
  const target = flagStr(ctx.parsed.flags, "context") || ctx.parsed.positionals[0];
  if (!target) {
    return ctx.append(ctx.mode === "nextgen" ? teachError({ title: "missing --context" }) : todayError('Error: required flag(s) "context" not set'));
  }
  if (target === currentContext) {
    return ctx.append(ctx.mode === "nextgen" ? teachError({ title: `cannot remove the current context "${target}"`, suggestions: [{ text: "Switch first", command: "doctl auth switch --context <other>" }] }) : todayError(`Error: cannot delete the current authentication context`));
  }
  ctx.append(text(`Removed context [${target}]`));
};

const accountGet = (ctx: CommandContext) => {
  ctx.append(
    table(
      ["Email", "Team", "Droplet Limit", "Status"],
      [["valapati@digitalocean.com", "Support Agent", "25", "active"]]
    )
  );
  if (ctx.mode === "nextgen") {
    ctx.append(
      lines(
        line(span("Active context: ", "muted"), span("default", "default", { bold: true }), span("  ·  region ", "muted"), span("nyc1", "default", { bold: true }), span("  ·  ", "muted"), span("12 / 25 droplets used", "muted")),
        line(span("Next: ", "muted"), span("doctl ask \"what can I build here?\"", "accent")),
      )
    );
  }
};

// ---- balance ------------------------------------------------------------
const balanceGet = (ctx: CommandContext) => {
  if (ctx.mode !== "nextgen") {
    // The raw 403 exactly as today's doctl surfaces it — one line, no guidance.
    ctx.append(apiError("GET", "customers/my/balance", 403, "You are not authorized to perform this operation"));
    return;
  }
  // Next-gen: the same failure, but the error explains itself and points forward.
  ctx.append(
    teachError({
      title: "Not authorized to read your balance (403)",
      cause: "Your active context's token doesn't include billing read scope.",
      suggestions: [
        { text: "Switch to a context with billing access", command: "doctl auth switch --context <name>" },
        { text: "Or generate a full-scope token", command: "doctl auth init" },
      ],
    })
  );
};

// ---- compute droplet ----------------------------------------------------
const dropletList = (ctx: CommandContext) => {
  const output = flagStr(ctx.parsed.flags, "output", "text");
  const cols = ctx.mode === "nextgen" ? dropletCols : dropletColsToday;
  emitList(ctx, store.droplets, cols, {
    jsonBloat: (d) => ({
      id: d.id,
      name: d.name,
      memory: d.memoryMb,
      vcpus: d.vcpus,
      status: d.status,
      networks: { v4: [{ ip_address: d.ip, type: "public" }] },
      // The bloat: the full region object with every size embedded per droplet.
      region: {
        slug: d.region,
        name: store.regions.find((r) => r.slug === d.region)?.name,
        sizes: store.sizes.map((s) => s.slug),
        available: true,
        features: ["backups", "ipv6", "metadata", "install_agent", "storage", "image_transfer"],
      },
      image: { slug: d.image, distribution: "Ubuntu" },
    }),
  });
  // Today prints only the table. Next-gen adds a guided projection tip.
  if (output === "text" && ctx.mode === "nextgen") {
    ctx.append(lines(line(span("Tip: ", "muted"), span("doctl compute droplet list --output csv", "accent"), span(" or ", "muted"), span("--field name,public_ipv4,status", "accent"), span(" to project columns.", "muted"))));
  }
};

const dropletGet = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (!ref) return ctx.append(ctx.mode === "nextgen" ? teachError({ title: "missing droplet name or ID", suggestions: [{ text: "List your droplets", command: "doctl compute droplet list" }] }) : missingArgs("droplet.get"));
  const d = store.findDroplet(ref);
  if (!d) return notFound(ctx, "Droplet", ref, "doctl compute droplet list");
  ctx.append(table(["ID", "Name", "Public IPv4", "Region", "Size", "Status"], [[String(d.id), d.name, d.ip, d.region, d.size, d.status]]));
  if (ctx.mode === "nextgen") ctx.append(lines(line(span("Connect: ", "muted"), span(`doctl compute ssh ${d.name}`, "accent"))));
};

const dropletCreate = async (ctx: CommandContext) => {
  const names = ctx.parsed.positionals;
  if (!names.length) return ctx.append(ctx.mode === "nextgen" ? teachError({ title: "missing droplet name", cause: "Usage: doctl compute droplet create <name>... [flags]" }) : missingArgs("droplet.create"));
  const region = flagStr(ctx.parsed.flags, "region", "nyc1");
  const size = flagStr(ctx.parsed.flags, "size", "s-1vcpu-1gb");
  const image = flagStr(ctx.parsed.flags, "image", "ubuntu-24-04-x64");
  const sshRef = flagStr(ctx.parsed.flags, "ssh-keys");
  const wait = flagBool(ctx.parsed.flags, "wait");

  // Validate region/image/size — this is where teaching errors shine.
  if (!store.regions.find((r) => r.slug === region)) return badRegion(ctx, region);
  if (!store.images.find((i) => i.slug === image)) return badImage(ctx, image);
  const sizeObj = store.findSize(size);
  if (!sizeObj) return badSize(ctx, size);
  const gpu = store.gpuSizes.find((g) => g.slug === size);

  // SSH key by NAME (name acceptance) — next-gen; today only accepts fingerprint.
  let sshKey = undefined as ReturnType<typeof store.findSSHKey>;
  if (sshRef) {
    sshKey = store.findSSHKey(sshRef);
    if (!sshKey) return notFound(ctx, "SSH key", sshRef, "doctl compute ssh-key list");
    if (ctx.mode !== "nextgen" && sshKey.name === sshRef) {
      return ctx.append(todayError(`Error: ssh key "${sshRef}" not found (expects an ID or fingerprint, not a name)`));
    }
  }

  // Pricing preview before commit (next-gen only).
  if (ctx.mode === "nextgen") {
    const monthly = gpu ? gpu.priceMonthly : (sizeObj as any).priceMonthly;
    const hourly = gpu ? gpu.priceHourly : (sizeObj as any).priceHourly;
    ctx.append(
      pricing(
        `About to create ${names.length} droplet${names.length > 1 ? "s" : ""}`,
        [
          { label: "Size", value: `${size}${gpu ? `  (${gpu.model}, ${gpu.vram}GB VRAM)` : ""}` },
          { label: "Region", value: `${region} — ${store.regions.find((r) => r.slug === region)?.name}` },
          { label: "Image", value: image },
          ...(sshKey ? [{ label: "SSH key", value: `${sshKey.name} (${sshKey.fingerprint.slice(0, 17)}…)` }] : []),
          { label: "Rate", value: `${money(hourly)}/hr` },
        ],
        money(monthly * names.length),
        "/mo",
        gpu ? "GPU droplets bill hourly. You will be charged while the droplet is running." : undefined
      )
    );
  }

  if (wait) {
    if (ctx.mode === "nextgen") {
      await runProgress(ctx, `Creating ${names.join(", ")}`, [
        { label: "Reserving capacity", ms: 700 },
        { label: "Provisioning droplet", ms: 1200, detail: `${size} @ ${region}` },
        { label: "Attaching network", ms: 900 },
        { label: sshKey ? `Installing SSH key '${sshKey.name}'` : "Configuring access", ms: 700 },
        { label: "Booting", ms: 800 },
      ]);
    } else {
      await silentHang(ctx, 3, "");
    }
  }

  const created = names.map((n) => store.createDroplet({ name: n, region, size, image }));

  if (ctx.mode === "nextgen") {
    ctx.append(table(["ID", "Name", "Public IPv4", "Region", "Size"], created.map((d) => [String(d.id), d.name, d.ip, d.region, d.size])));
    const first = created[0];
    ctx.append(
      panel("success", [
        line(span("✓ ", "success"), span(`${created.length} droplet${created.length > 1 ? "s" : ""} ready`, "default", { bold: true }), span(` in ${wait ? "~52s" : "the background"}`, "muted")),
        blank(),
        line(span("SSH in: ", "muted"), span(`doctl compute ssh ${first.name}`, "accent")),
        line(span("Or:     ", "muted"), span(`ssh root@${first.ip}`, "accent")),
        ...(gpu ? [line(span("GPU:    ", "muted"), span(`nvidia-smi ready — ${gpu.model} ×${gpu.gpuCount}`, "accent"))] : []),
      ])
    );
    ctx.append(lines(line(span("Made a mistake? ", "muted"), span("doctl rollback", "accent"), span(" undoes this.", "muted"))));
  } else {
    ctx.append(table(["ID", "Name", "Public IPv4", "Status"], created.map((d) => [String(d.id), d.name, "", "new"])));
    ctx.append(lines(line(span("Notice: ", "warn"), span("IP is empty — the droplet is still booting. Poll with `doctl compute droplet get` to find out when it's ready.", "muted"))));
  }
};

const dropletDelete = async (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (!ref) return ctx.append(ctx.mode === "nextgen" ? teachError({ title: "missing droplet name or ID" }) : missingArgs("droplet.delete"));
  const d = store.findDroplet(ref);
  if (!d) return notFound(ctx, "Droplet", ref, "doctl compute droplet list");

  const force = flagBool(ctx.parsed.flags, "force");
  if (ctx.mode === "nextgen" && !force) {
    // Targeted friction: confirm on a destructive op, with a dry-run summary.
    ctx.append({
      kind: "confirm",
      prompt: line(span("This will permanently destroy ", "warn"), span(d.name, "default", { bold: true }), span(` (${d.ip}, ${d.region}).`, "warn")),
      choices: [
        { label: "Destroy", command: `__do_delete_droplet ${d.name}`, tone: "error" },
        { label: "Cancel", tone: "muted", note: "no changes made" },
      ],
    });
    return;
  }
  store.deleteDroplet(d.name);
  ctx.append(lines(line(span("✓ ", "success"), span(`Deleted droplet ${d.name}`))));
  if (ctx.mode === "nextgen") ctx.append(lines(line(span("Undo with ", "muted"), span("doctl rollback", "accent"))));
};

// Internal command the confirm block calls once the user clicks "Destroy".
const doDeleteDroplet = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  const ok = store.deleteDroplet(ref);
  ctx.append(lines(line(ok ? span("✓ ", "success") : span("✗ ", "error"), span(ok ? `Destroyed droplet ${ref}` : `Droplet ${ref} not found`))));
  if (ok) ctx.append(lines(line(span("Undo with ", "muted"), span("doctl rollback", "accent"))));
};

const computeSSH = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  const d = ref ? store.findDroplet(ref) : undefined;
  if (!d) return notFound(ctx, "Droplet", ref ?? "", "doctl compute droplet list");
  ctx.append(
    lines(
      line(span(`Connecting to ${d.name} (${d.ip})…`, "muted")),
      blank(),
      line(span("Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-31-generic x86_64)", "success")),
      line(span(`root@${d.name}:~# `, "prompt"), span("_", "muted")),
    )
  );
};

const sshKeyList = (ctx: CommandContext) => {
  ctx.append(table(["ID", "Name", "Fingerprint"], store.sshKeys.map((k) => [String(k.id), k.name, k.fingerprint])));
  if (ctx.mode === "nextgen") {
    const first = store.sshKeys[0];
    ctx.append(lines(line(span("Use it by name: ", "muted"), span(`doctl compute droplet create web --ssh-keys ${first?.name ?? "<name>"}`, "accent"))));
  } else {
    ctx.append(lines(line(span("Notice: ", "warn"), span("--ssh-keys expects an ID or fingerprint (not the name) when creating a droplet.", "muted"))));
  }
};

const sizeList = (ctx: CommandContext) => {
  const gpuOnly = flagBool(ctx.parsed.flags, "gpu") || flagStr(ctx.parsed.flags, "gpu") !== "";
  if (gpuOnly) return gpuSizeTable(ctx);
  const rows = store.sizes.map((s) => [s.slug, String(s.vcpus), `${(s.memoryMb / 1024).toFixed(0)} GB`, `${s.diskGb} GB`, ctx.mode === "nextgen" ? `${money(s.priceMonthly)}/mo` : money(s.priceMonthly)]);
  ctx.append(table(["Slug", "vCPUs", "Memory", "Disk", ctx.mode === "nextgen" ? "Price" : "Price Monthly"], rows));
  if (ctx.mode === "nextgen") ctx.append(lines(line(span("GPU sizes: ", "muted"), span("doctl compute size list --gpu", "accent"))));
};

const gpuSizeTable = (ctx: CommandContext) => {
  if (ctx.mode === "nextgen") {
    ctx.append(
      table(
        ["Slug", "GPU Model", "VRAM", "GPUs", "Price/hr", "Regions"],
        store.gpuSizes.map((g) => [g.slug, g.model, `${g.vram} GB`, String(g.gpuCount), money(g.priceHourly), g.regions.join(", ")]),
        { highlightColumns: [1, 2] }
      )
    );
    ctx.append(lines(line(span("Create one: ", "muted"), span("doctl compute droplet create trainer --gpu-model nvidia-h100 --region nyc2 --wait", "accent"))));
  } else {
    // Today: model is buried in the slug, no model/VRAM columns.
    ctx.append(table(["Slug", "Memory", "vCPUs", "Price Monthly"], store.gpuSizes.map((g) => [g.slug, "245760", "20", money(g.priceMonthly)])));
    ctx.append(lines(line(span("Notice: ", "warn"), span("no GPU model or VRAM column — you must decode 'h100' from the slug.", "muted"))));
  }
};

const regionList = (ctx: CommandContext) => {
  if (ctx.mode === "nextgen") {
    ctx.append(
      table(
        ["Slug", "Region", "Available", "Features"],
        store.regions.map((r) => [r.slug, r.name, "yes", "backups, ipv6, metadata"]),
        { highlightColumns: [2] }
      )
    );
    ctx.append(lines(line(span("Filter with ", "muted"), span("doctl compute region list --output csv", "accent"), span(" or ", "muted"), span("--field slug,available", "accent"))));
  } else {
    ctx.append(table(["Slug", "Region"], store.regions.map((r) => [r.slug, r.name])));
  }
};

const dedicatedGetSizes = (ctx: CommandContext) => {
  ctx.append(
    table(
      ["GPU Slug", "Price/Hour", "GPU Count", "VRAM (GB)", "GPU Model", "Regions"],
      store.gpuSizes.map((g) => [g.slug, `${g.priceHourly.toFixed(2)} USD`, String(g.gpuCount), String(g.vram), g.model.toLowerCase().replace(" ", "_"), g.regions.join(", ")])
    )
  );
};

// ---- apps ---------------------------------------------------------------
const appsCreate = async (ctx: CommandContext) => {
  const repo = flagStr(ctx.parsed.flags, "from-repo");
  const spec = flagStr(ctx.parsed.flags, "spec");
  if (!repo && !spec) {
    if (ctx.mode === "nextgen") {
      return ctx.append(
        teachError({
          title: "provide a source for the app",
          cause: "Deploy straight from a repo, or pass a spec file.",
          suggestions: [
            { text: "Deploy from GitHub", command: "doctl apps create --from-repo github.com/do-community/sample-nodejs" },
            { text: "Use a spec file", command: "doctl apps create --spec app.yaml" },
          ],
        })
      );
    }
    return ctx.append(todayError('Error: required flag(s) "spec" not set'));
  }
  const name = (repo || spec).split("/").pop()!.replace(/\.git|\.yaml|\.yml/g, "") || "app";

  if (repo && ctx.mode === "nextgen") {
    ctx.append(panel("info", [line(span("Detected ", "muted"), span("Node.js", "default", { bold: true }), span(" app in ", "muted"), span(repo, "accent")), line(span("Auto-generated an App Platform spec — no YAML required.", "muted"))]));
    ctx.append(pricing("App Platform · basic-xxs", [{ label: "Web service", value: "basic-xxs · 512 MB" }, { label: "Region", value: "nyc" }, { label: "Build", value: "auto-detected (npm)" }], "$5.00", "/mo"));
    await runProgress(ctx, `Deploying ${name}`, [
      { label: "Cloning repository", ms: 800 },
      { label: "Detecting buildpack (Node.js)", ms: 700 },
      { label: "Building", ms: 1600, detail: "npm ci && npm run build" },
      { label: "Pushing image", ms: 900 },
      { label: "Starting service + health check", ms: 900 },
    ]);
  } else if (spec) {
    await silentHang(ctx, ctx.mode === "nextgen" ? 0 : 2, "");
  }

  const app = store.createApp({ name, repo: repo || "spec://" + spec });
  if (ctx.mode === "nextgen") {
    ctx.append(panel("success", [line(span("✓ Live: ", "success", { bold: true }), span(app.url, "accent")), blank(), line(span("Logs:   ", "muted"), span(`doctl apps logs ${app.name} --follow`, "accent")), line(span("Manage: ", "muted"), span(`doctl apps get ${app.name}`, "accent"))]));
  } else {
    ctx.append(lines(line(span(`Notice: created app ${app.id}`, "muted")), line(span("(use the UUID for further commands — `apps get` does not accept the name)", "muted"))));
  }
};

const appsList = (ctx: CommandContext) => {
  if (ctx.mode !== "nextgen") {
    // Real `doctl apps list` columns. Deployment IDs / timestamps are derived.
    ctx.append(
      table(
        ["ID", "Spec Name", "Default Ingress", "Active Deployment ID", "In Progress Deployment ID", "Created At", "Updated At"],
        store.apps.map((a) => [a.id, a.name, a.url, a.id.replace(/^app-/, ""), "", "2026-06-02 09:14:22 +0000 UTC", "2026-07-20 11:02:51 +0000 UTC"])
      )
    );
    return;
  }
  ctx.append(table(["ID", "Name", "URL", "Tier", "Status"], store.apps.map((a) => [a.id.slice(0, 12) + "…", a.name, a.url, a.tier, a.status])));
};
const appsGet = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (ctx.mode !== "nextgen" && store.apps.find((a) => a.name === ref)) {
    return ctx.append(apiError("GET", `apps/${ref}`, 404, "app not found"));
  }
  const a = ref ? store.findApp(ref) : undefined;
  if (!a) return notFound(ctx, "App", ref ?? "", "doctl apps list");
  ctx.append(table(["ID", "Name", "URL", "Repo", "Tier", "Status"], [[a.id, a.name, a.url, a.repo ?? "-", a.tier, a.status]]));
};
const appsLogs = async (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  const a = ref ? store.findApp(ref) : store.apps[0];
  if (!a) return notFound(ctx, "App", ref ?? "", "doctl apps list");
  const logLines = [
    "[build] => Cloning repo…",
    "[build] => Detected Node.js",
    "[build] $ npm ci",
    "[build] added 214 packages in 6s",
    "[build] $ npm run build",
    "[build] ✓ compiled successfully",
    "[deploy] => Uploading image",
    "[deploy] => Health check passed",
    "[deploy] ✓ Deployment live",
  ];
  ctx.append({ kind: "lines", lines: [line(span(`Streaming logs for ${a.name} (--follow)…`, "muted"))] });
  for (const l of logLines) {
    await ctx.sleep(260);
    ctx.append({ kind: "lines", lines: [line(span(l, l.includes("✓") ? "success" : "default"))] });
  }
};
const appsPropose = (ctx: CommandContext) => {
  ctx.append(pricing("apps propose", [{ label: "app_cost", value: "$5.00" }, { label: "tier", value: "basic-xxs" }, { label: "max_free_static_apps", value: "3" }], "$5.00", "/mo", "This propose UX is the model every resource now follows."));
};

// ---- databases ----------------------------------------------------------
const dbCreate = async (ctx: CommandContext) => {
  const name = ctx.parsed.positionals[0];
  if (!name) return ctx.append(ctx.mode === "nextgen" ? teachError({ title: "missing database cluster name" }) : missingArgs("databases.create"));
  const engine = flagStr(ctx.parsed.flags, "engine", "pg");
  const version = flagStr(ctx.parsed.flags, "version", "16");
  const size = flagStr(ctx.parsed.flags, "size", "db-s-1vcpu-1gb");
  const region = flagStr(ctx.parsed.flags, "region", "nyc1");
  const wait = flagBool(ctx.parsed.flags, "wait");
  if (ctx.mode === "nextgen") ctx.append(pricing(`Managed ${engine} ${version}`, [{ label: "Plan", value: size }, { label: "Nodes", value: "1" }, { label: "Region", value: region }], "$15.00", "/mo"));
  if (wait) {
    if (ctx.mode === "nextgen") {
      await runProgress(ctx, `Creating ${name}`, [
        { label: "Allocating cluster", ms: 900 },
        { label: "Provisioning storage", ms: 1200 },
        { label: "Configuring replication", ms: 900 },
        { label: "Running health checks", ms: 800 },
      ]);
    } else {
      await silentHang(ctx, 3, "");
    }
  }
  const db = store.createDatabase({ name, engine, version, size, region, numNodes: 1 });
  if (ctx.mode === "nextgen") {
    ctx.append(panel("success", [line(span("✓ ", "success"), span(`${name} online`, "default", { bold: true })), blank(), line(span("Get creds by name: ", "muted"), span(`doctl databases connection ${name}`, "accent"))]));
  } else {
    ctx.append(lines(line(span(`Notice: created ${db.id}`, "muted"))));
  }
};
const dbList = (ctx: CommandContext) => {
  if (ctx.mode !== "nextgen") {
    // Real `doctl databases list` columns, full IDs, exact case.
    ctx.append(
      table(
        ["ID", "Name", "Engine", "Version", "Number of Nodes", "Region", "Status", "Size", "Storage (MiB)"],
        store.databases.map((d) => [d.id, d.name, d.engine, d.version, String(d.numNodes), d.region, d.status, d.size, String(dbStorageMiB(d.size))])
      )
    );
    return;
  }
  ctx.append(table(["ID", "Name", "Engine", "Region", "Status"], store.databases.map((d) => [d.id.slice(0, 12) + "…", d.name, `${d.engine} ${d.version}`, d.region, d.status])));
};
const dbGet = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (ctx.mode !== "nextgen" && store.databases.find((d) => d.name === ref)) {
    return ctx.append(apiError("GET", `databases/${ref}`, 404, "cluster not found"));
  }
  const d = ref ? store.findDatabase(ref) : undefined;
  if (!d) return notFound(ctx, "Database cluster", ref ?? "", "doctl databases list");
  ctx.append(table(["ID", "Name", "Engine", "Version", "Size", "Region", "Status"], [[d.id, d.name, d.engine, d.version, d.size, d.region, d.status]]));
};
const dbConnection = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (ctx.mode !== "nextgen") {
    if (store.databases.find((d) => d.name === ref)) {
      return ctx.append(apiError("GET", `databases/${ref}`, 404, "cluster not found"));
    }
    const d = ref ? store.findDatabase(ref) : undefined;
    if (!d) return notFound(ctx, "Database cluster", ref ?? "", "doctl databases list");
    // Today: dumps the password in plaintext to scrollback.
    ctx.append(code("text", `host: ${d.connection.host}\nport: ${d.connection.port}\nuser: ${d.connection.user}\npassword: ${d.connection.password}\ndatabase: ${d.connection.database}\nuri: ${d.connection.uri}`, "Plaintext secrets written to scrollback"));
    return;
  }
  // Next-gen: accepts the name, masks secrets by default.
  const d = ref ? store.findDatabase(ref) : undefined;
  if (!d) return notFound(ctx, "Database cluster", ref ?? "", "doctl databases list");
  const noSecrets = !flagBool(ctx.parsed.flags, "show-secrets");
  const pw = noSecrets ? "•••••••••••••• (use --show-secrets to reveal)" : d.connection.password;
  const uri = noSecrets ? d.connection.uri.replace(d.connection.password, "••••••••") : d.connection.uri;
  ctx.append(table(["Field", "Value"], [["host", d.connection.host], ["port", String(d.connection.port)], ["user", d.connection.user], ["password", pw], ["database", d.connection.database]]));
  ctx.append(code("bash", `export DATABASE_URL="${uri}"`, "Secrets masked by default — safe for screen sharing"));
};

// ---- kubernetes ---------------------------------------------------------
const k8sCreate = async (ctx: CommandContext) => {
  const name = ctx.parsed.positionals[0];
  if (!name) return ctx.append(ctx.mode === "nextgen" ? teachError({ title: "missing cluster name" }) : missingArgs("kubernetes.cluster.create"));
  const region = flagStr(ctx.parsed.flags, "region", "nyc1");
  const wait = flagBool(ctx.parsed.flags, "wait");
  if (wait) {
    if (ctx.mode === "nextgen") {
      await runProgress(ctx, `Creating cluster ${name}`, [
        { label: "Provisioning control plane", ms: 1400 },
        { label: "Creating node pool", ms: 1200, detail: "3 × s-2vcpu-2gb" },
        { label: "Joining nodes", ms: 1100 },
        { label: "Writing kubeconfig", ms: 600 },
      ]);
    } else {
      await silentHang(ctx, 4, "");
    }
  }
  const c = store.createCluster({ name, region, nodePool: "pool-1", nodeCount: 3 });
  if (ctx.mode === "nextgen") ctx.append(panel("success", [line(span("✓ ", "success"), span(`${name} running`, "default", { bold: true })), line(span("kubeconfig merged — ", "muted"), span(`kubectl config use-context do-${region}-${name}`, "accent"))]));
  else ctx.append(lines(line(span(`Notice: created ${c.id}`, "muted"))));
};
const k8sList = (ctx: CommandContext) => {
  ctx.append(table(["ID", "Name", "Region", "Version", "Nodes", "Status"], store.clusters.map((c) => [c.id.slice(0, 12) + "…", c.name, c.region, c.version, String(c.nodeCount), c.status])));
};

// ---- gradient (AI) ------------------------------------------------------
const agentList = (ctx: CommandContext) => {
  ctx.append(table(["ID", "Name", "Model", "Status", "Endpoint"], store.agents.map((a) => [a.id.slice(0, 14) + "…", a.name, a.model, a.status, a.endpoint])));
};
const agentCreate = async (ctx: CommandContext) => {
  const name = flagStr(ctx.parsed.flags, "name") || ctx.parsed.positionals[0];
  const model = flagStr(ctx.parsed.flags, "model", "llama3-8b-instruct");
  if (!name) {
    if (ctx.mode === "nextgen") return ctx.append(teachError({ title: "missing --name", cause: "An agent needs a name and a model.", suggestions: [{ text: "Example", command: "doctl gradient agent create --name support-bot --model llama3-70b-instruct" }] }));
    return ctx.append(todayError('Error: required flag(s) "name" not set'));
  }
  if (ctx.mode === "nextgen") await runProgress(ctx, `Creating agent ${name}`, [{ label: "Reserving inference capacity", ms: 900 }, { label: `Loading ${model}`, ms: 1200 }, { label: "Exposing endpoint", ms: 700 }]);
  const a = store.createAgent({ name, model });
  if (ctx.mode === "nextgen") ctx.append(panel("agent", [line(span("✓ Agent deployed", "success", { bold: true })), line(span("Endpoint: ", "muted"), span(a.endpoint, "accent")), blank(), line(span("Talk to it: ", "muted"), span(`doctl gradient agent chat ${name} --message "hello"`, "accent"))]));
  else ctx.append(lines(line(span(`Notice: created ${a.id}`, "muted"))));
};
const agentChat = async (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  const msg = flagStr(ctx.parsed.flags, "message") || flagStr(ctx.parsed.flags, "prompt") || ctx.parsed.positionals.slice(1).join(" ");
  if (ctx.mode !== "nextgen") {
    return ctx.append(unknownCommand("chat", "doctl gradient agent"));
  }
  const a = ref ? store.findAgent(ref) : undefined;
  if (!a) return notFound(ctx, "Agent", ref ?? "", "doctl gradient agent list");
  ctx.append(lines(line(span("you  ", "muted"), span(msg || "hello"))));
  ctx.append({ kind: "lines", lines: [line(span(`${a.name}  `, "accent"), span("…thinking", "muted"))] });
  await ctx.sleep(700);
  const reply = msg.toLowerCase().includes("droplet")
    ? "You can create one with `doctl compute droplet create`. Want me to draft the command?"
    : `Hi! I'm ${a.name}, running ${a.model} on DigitalOcean. How can I help with your infrastructure today?`;
  ctx.updateLast(() => ({ kind: "lines", lines: [line(span(`${a.name}  `, "accent"), span(reply))] }));
};

// ---- doctl ask (NL → command, HITL) -------------------------------------
const askHandler = (ctx: CommandContext) => {
  // `doctl ask` is a next-gen surface; today there is no such command.
  if (ctx.mode !== "nextgen") return ctx.append(unknownCommand("ask", "doctl"));
  const prompt = ctx.parsed.positionals.join(" ").trim();
  if (!prompt) return ctx.append(teachError({ title: "ask what?", suggestions: [{ text: "Try", command: 'doctl ask "deploy my node app from github"' }] }));
  const suggestion = intentToCommand(prompt);
  ctx.append(
    panel("info", [
      line(span("Understood: ", "muted"), span(prompt)),
      blank(),
      line(span("Proposed command", "muted", { bold: true })),
      line(span("  " + suggestion.command, "accent")),
      ...(suggestion.note ? [blank(), line(span(suggestion.note, "muted"))] : []),
    ], { title: "doctl ask" })
  );
  ctx.append({
    kind: "confirm",
    prompt: line(span("Run this command?", "warn"), span("  (nothing runs until you approve — HITL)", "muted")),
    choices: [
      { label: "Run it", command: suggestion.command, tone: "success" },
      { label: "Cancel", tone: "muted", note: "no changes made" },
    ],
  });
};

function intentToCommand(prompt: string): { command: string; note?: string } {
  const p = prompt.toLowerCase();
  const region = /sf|san fran/.test(p) ? "sfo3" : /amsterdam|eu|europe/.test(p) ? "ams3" : "nyc1";
  if (/gpu|h100|train|fine-?tune|inference/.test(p)) {
    return { command: `doctl compute droplet create trainer --size gpu-h100x1-80gb --region nyc2 --image ubuntu-24-04-x64 --wait`, note: "High-cost resource — pricing shown before commit, HITL required." };
  }
  if (/app|deploy|github|node|next|repo/.test(p)) {
    return { command: `doctl apps create --from-repo github.com/do-community/sample-nodejs`, note: "Detected an App Platform deploy from a repo." };
  }
  if (/database|postgres|pg|mysql|redis/.test(p)) {
    return { command: `doctl databases create app-db --engine pg --version 16 --size db-s-1vcpu-1gb --region ${region} --wait` };
  }
  if (/agent|chatbot|llm|ai/.test(p)) {
    return { command: `doctl gradient agent create --name my-agent --model llama3-70b-instruct` };
  }
  const sizeMatch = p.match(/(\d+)\s?gb/);
  const size = sizeMatch ? `s-${Number(sizeMatch[1]) >= 4 ? 2 : 1}vcpu-${sizeMatch[1]}gb` : "s-1vcpu-1gb";
  return { command: `doctl compute droplet create web-1 --size ${size} --region ${region} --image ubuntu-24-04-x64 --wait` };
}

// ---- rollback -----------------------------------------------------------
const rollbackHandler = async (ctx: CommandContext) => {
  if (ctx.mode !== "nextgen") return ctx.append(unknownCommand("rollback", "doctl"));
  const last = store.droplets[store.droplets.length - 1];
  await runProgress(ctx, "Rolling back last operation", [{ label: "Locating last mutation", ms: 500 }, { label: last ? `Destroying ${last.name}` : "Reverting", ms: 800 }]);
  if (last) store.deleteDroplet(last.name);
  ctx.append(panel("success", [line(span("✓ Rolled back", "success", { bold: true }), span(last ? `  removed ${last.name}` : "", "muted")), line(span("Reversibility is what makes delegating to an agent feel safe.", "muted"))]));
};

// ---- mcp serve ----------------------------------------------------------
const mcpServe = async (ctx: CommandContext) => {
  if (ctx.mode !== "nextgen") return ctx.append(unknownCommand("mcp", "doctl"));
  ctx.append(lines(line(span("Starting doctl MCP server (in-binary)…", "muted"))));
  await ctx.sleep(500);
  ctx.append(panel("agent", [
    line(span("● ", "success"), span("MCP server listening", "default", { bold: true }), span("  stdio", "muted")),
    blank(),
    line(span("Auto-generated ", "muted"), span("142", "accent"), span(" tool descriptors from the command tree:", "muted")),
    line(span("  compute.droplet.create · apps.create · databases.connection · gradient.agent.chat · …", "muted")),
    blank(),
    line(span("Claude, Cursor, and any MCP client can now drive doctl natively — like gh or wrangler.", "muted")),
  ], { title: "doctl mcp serve" }));
};

// ---- shared error helpers ----------------------------------------------
// Real doctl surfaces API failures as a single stderr line, prefixed with
// "Error: ", carrying the HTTP verb, URL, status, a full request UUID, and the
// server message — no hint, no suggestion. These helpers reproduce that shape.
function ridUUID(): string {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function apiError(method: string, path: string, status: number, message: string) {
  return todayError(`Error: ${method} https://api.digitalocean.com/v2/${path}: ${status} (request "${ridUUID()}") ${message}`);
}
// cobra's "missing required arguments" error uses the dotted command path.
function missingArgs(cmdPath: string) {
  return todayError(`Error: (${cmdPath}) command is missing required arguments`);
}
// cobra's unknown-subcommand / unknown-command error.
function unknownCommand(sub: string, parent: string) {
  return todayError(`Error: unknown command "${sub}" for "${parent}"`);
}

function notFound(ctx: CommandContext, kind: string, ref: string, listCmd: string) {
  if (ctx.mode === "nextgen") {
    ctx.append(teachError({ title: `${kind} '${ref}' not found`, suggestions: [{ text: `See available ${kind.toLowerCase()}s`, command: listCmd }] }));
  } else {
    ctx.append(apiError("GET", "droplets/" + encodeURIComponent(ref || ""), 404, "The resource you requested could not be found."));
  }
}
function badRegion(ctx: CommandContext, region: string) {
  if (ctx.mode === "nextgen") ctx.append(teachError({ title: `Region '${region}' not found`, cause: "That region slug doesn't exist or isn't available to your account.", suggestions: [{ text: "List valid regions", command: "doctl compute region list" }] }));
  else ctx.append(apiError("POST", "droplets", 422, "There are no regions available that match your request"));
}
function badImage(ctx: CommandContext, image: string) {
  if (ctx.mode === "nextgen") ctx.append(teachError({ title: `Image '${image}' not found`, suggestions: [{ text: "List public images", command: "doctl compute image list --public" }] }));
  else ctx.append(apiError("POST", "droplets", 404, "image not found"));
}
function badSize(ctx: CommandContext, size: string) {
  if (ctx.mode === "nextgen") ctx.append(teachError({ title: `Size '${size}' not found`, suggestions: [{ text: "List sizes", command: "doctl compute size list" }, { text: "List GPU sizes", command: "doctl compute size list --gpu" }] }));
  else ctx.append(apiError("POST", "droplets", 422, "invalid size"));
}

// -------------------------------------------------------------------------
// Command tree
// -------------------------------------------------------------------------
export const commandTree: CommandNode = {
  name: "doctl",
  summary: "The DigitalOcean command line",
  handler: rootHandler,
  children: [
    { name: "help", summary: "Show help", handler: helpHandler },
    { name: "version", summary: "Show version", handler: (ctx) => ctx.append(text("doctl version 2.0.0-nextgen (mock)")) },
    {
      name: "auth",
      summary: "Display commands for authenticating doctl with an account",
      children: [
        { name: "init", summary: "Initialize doctl to use a specific account", handler: authInit, flags: [{ name: "context", value: "<name>", desc: "Authentication context name" }] },
        { name: "list", aliases: ["ls"], summary: "List available authentication contexts", handler: authList },
        { name: "remove", summary: "Remove authentication contexts", handler: authRemove, flags: [{ name: "context", value: "<name>", desc: "Authentication context name" }] },
        { name: "switch", summary: "Switch between authentication contexts", handler: authSwitch, flags: [{ name: "context", value: "<name>", desc: "Authentication context name" }] },
        { name: "token", summary: "Display current authentication context API token", handler: authToken },
      ],
    },
    { name: "account", summary: "Account", children: [{ name: "get", summary: "Get account info", handler: accountGet }] },
    { name: "balance", summary: "Display commands for retrieving your account balance", children: [{ name: "get", summary: "Retrieve your account balance", handler: balanceGet }] },
    {
      name: "compute",
      summary: "Droplets and related resources",
      children: [
        {
          name: "droplet",
          aliases: ["droplets"],
          summary: "Manage droplets",
          children: [
            { name: "list", aliases: ["ls"], summary: "List droplets", handler: dropletList, flags: [{ name: "output", short: "o", value: "text|json|yaml|csv", desc: "Output format" }, { name: "field", value: "<keys>", desc: "Project JSON to specific fields" }, { name: "format", value: "<cols>", desc: "Column subset (text)" }] },
            { name: "get", summary: "Get a droplet (by name or ID)", handler: dropletGet, argHint: "<name|id>", completeArg: (i) => (i === 0 ? store.droplets.map((d) => d.name) : []) },
            { name: "create", summary: "Create droplet(s)", handler: dropletCreate, argHint: "<name>...", flags: [{ name: "region", value: "<slug>", desc: "Region slug", example: "nyc1" }, { name: "size", value: "<slug>", desc: "Size slug", example: "s-2vcpu-4gb" }, { name: "image", value: "<slug>", desc: "Image slug", example: "ubuntu-24-04-x64" }, { name: "ssh-keys", value: "<name|id>", desc: "SSH key by NAME or ID", example: "my-macbook" }, { name: "wait", boolean: true, desc: "Wait and show live progress" }] },
            { name: "delete", aliases: ["rm"], summary: "Delete a droplet", handler: dropletDelete, argHint: "<name|id>", flags: [{ name: "force", short: "f", boolean: true, desc: "Skip confirmation" }], completeArg: (i) => (i === 0 ? store.droplets.map((d) => d.name) : []) },
            { name: "__do_delete_droplet", summary: "(internal)", handler: doDeleteDroplet },
          ],
        },
        { name: "ssh", summary: "SSH into a droplet (by name)", handler: computeSSH, argHint: "<name|id>", completeArg: (i) => (i === 0 ? store.droplets.map((d) => d.name) : []) },
        { name: "ssh-key", aliases: ["ssh-keys"], summary: "Manage SSH keys", children: [{ name: "list", summary: "List SSH keys", handler: sshKeyList }] },
        { name: "size", summary: "List sizes", children: [{ name: "list", summary: "List sizes", handler: sizeList, flags: [{ name: "gpu", boolean: true, desc: "Show GPU sizes with model + VRAM" }] }] },
        { name: "region", summary: "List regions", children: [{ name: "list", summary: "List regions", handler: regionList }] },
      ],
    },
    { name: "dedicated-inference", summary: "Dedicated inference GPUs", children: [{ name: "get-sizes", summary: "List GPU sizes", handler: dedicatedGetSizes }] },
    {
      name: "apps",
      summary: "App Platform",
      children: [
        { name: "create", summary: "Create an app", handler: appsCreate, flags: [{ name: "from-repo", value: "<url>", desc: "Deploy directly from a git repo", example: "github.com/do-community/sample-nodejs" }, { name: "spec", value: "<path>", desc: "App spec file" }] },
        { name: "list", aliases: ["ls"], summary: "List apps", handler: appsList },
        { name: "get", summary: "Get an app (by name or ID)", handler: appsGet, argHint: "<name|id>", completeArg: (i) => (i === 0 ? store.apps.map((a) => a.name) : []) },
        { name: "logs", summary: "Stream app logs", handler: appsLogs, argHint: "<name|id>", flags: [{ name: "follow", boolean: true, desc: "Stream logs" }, { name: "type", value: "build|deploy|run", desc: "Log type" }], completeArg: (i) => (i === 0 ? store.apps.map((a) => a.name) : []) },
        { name: "propose", summary: "Preview cost before creating", handler: appsPropose, flags: [{ name: "spec", value: "<path>", desc: "App spec file" }] },
      ],
    },
    {
      name: "databases",
      aliases: ["db", "database"],
      summary: "Managed databases",
      children: [
        { name: "create", summary: "Create a database cluster", handler: dbCreate, argHint: "<name>", flags: [{ name: "engine", value: "pg|mysql|redis", desc: "Engine" }, { name: "version", value: "<n>", desc: "Version" }, { name: "size", value: "<slug>", desc: "Size" }, { name: "region", value: "<slug>", desc: "Region" }, { name: "wait", boolean: true, desc: "Wait with progress" }] },
        { name: "list", aliases: ["ls"], summary: "List clusters", handler: dbList },
        { name: "get", summary: "Get a cluster (by name)", handler: dbGet, argHint: "<name|id>", completeArg: (i) => (i === 0 ? store.databases.map((d) => d.name) : []) },
        { name: "connection", aliases: ["conn"], summary: "Get connection details (by name)", handler: dbConnection, argHint: "<name|id>", flags: [{ name: "show-secrets", boolean: true, desc: "Reveal masked secrets" }], completeArg: (i) => (i === 0 ? store.databases.map((d) => d.name) : []) },
      ],
    },
    {
      name: "kubernetes",
      aliases: ["k8s", "kube"],
      summary: "Kubernetes (DOKS)",
      children: [
        {
          name: "cluster",
          aliases: ["clusters"],
          summary: "Manage clusters",
          children: [
            { name: "create", summary: "Create a cluster", handler: k8sCreate, argHint: "<name>", flags: [{ name: "region", value: "<slug>", desc: "Region" }, { name: "node-pool", value: "<spec>", desc: "Node pool spec" }, { name: "wait", boolean: true, desc: "Wait with progress" }] },
            { name: "list", aliases: ["ls"], summary: "List clusters", handler: k8sList },
          ],
        },
      ],
    },
    {
      name: "gradient",
      aliases: ["ai", "genai"],
      summary: "AI Platform: agents & inference",
      children: [
        {
          name: "agent",
          aliases: ["agents"],
          summary: "Manage AI agents",
          children: [
            { name: "list", aliases: ["ls"], summary: "List agents", handler: agentList },
            { name: "create", summary: "Create an agent", handler: agentCreate, flags: [{ name: "name", value: "<name>", desc: "Agent name" }, { name: "model", value: "<slug>", desc: "Model" }] },
            { name: "chat", aliases: ["invoke", "run"], summary: "Talk to an agent", handler: agentChat, argHint: "<name>", flags: [{ name: "message", short: "m", value: "<text>", desc: "Message to send" }], completeArg: (i) => (i === 0 ? store.agents.map((a) => a.name) : []) },
          ],
        },
      ],
    },
    { name: "ask", summary: "Natural-language → command (HITL)", handler: askHandler, argHint: "<prompt>" },
    { name: "rollback", summary: "Undo the last mutating operation", handler: rollbackHandler },
    { name: "mcp", summary: "Model Context Protocol server", children: [{ name: "serve", summary: "Start in-binary MCP server", handler: mcpServe }] },
  ],
};
