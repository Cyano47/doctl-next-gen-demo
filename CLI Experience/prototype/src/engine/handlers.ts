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
      ctx.append(teachError({ title: "unknown output format \"csv\"", cause: "Today doctl supports only text, json, and yaml." }));
      return;
    }
    const header = cols.map((c) => c.header).join(",");
    const body = records.map((r) => cols.map((c) => csvCell(c.get(r))).join(",")).join("\n");
    ctx.append(code("csv", `${header}\n${body}`));
    return;
  }
  // text table
  ctx.append(table(cols.map((c) => c.header.toUpperCase()), records.map((r) => cols.map((c) => c.get(r)))));
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
const dropletCols: Col[] = [
  { header: "ID", key: "id", get: (d) => String(d.id) },
  { header: "Name", key: "name", get: (d) => d.name },
  { header: "Public IPv4", key: "public_ipv4", get: (d) => d.ip },
  { header: "Region", key: "region", get: (d) => d.region },
  { header: "Size", key: "size", get: (d) => d.size },
  { header: "Status", key: "status", get: (d) => d.status },
];

// -------------------------------------------------------------------------
// Handlers
// -------------------------------------------------------------------------

const rootHandler = (ctx: CommandContext) => {
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

const accountGet = (ctx: CommandContext) => {
  ctx.append(
    table(
      ["Email", "Team", "Droplet Limit", "Status"],
      [["valapati@digitalocean.com", "Support Agent", "25", "active"]]
    )
  );
};

// ---- compute droplet ----------------------------------------------------
const dropletList = (ctx: CommandContext) => {
  emitList(ctx, store.droplets, dropletCols, {
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
};

const dropletGet = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (!ref) return ctx.append(teachError({ title: "missing droplet name or ID", suggestions: [{ text: "List your droplets", command: "doctl compute droplet list" }] }));
  const d = store.findDroplet(ref);
  if (!d) return notFound(ctx, "Droplet", ref, "doctl compute droplet list");
  ctx.append(table(["ID", "Name", "Public IPv4", "Region", "Size", "Status"], [[String(d.id), d.name, d.ip, d.region, d.size, d.status]]));
  if (ctx.mode === "nextgen") ctx.append(lines(line(span("Connect: ", "muted"), span(`doctl compute ssh ${d.name}`, "accent"))));
};

const dropletCreate = async (ctx: CommandContext) => {
  const names = ctx.parsed.positionals;
  if (!names.length) return ctx.append(teachError({ title: "missing droplet name", cause: "Usage: doctl compute droplet create <name>... [flags]" }));
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
  if (!ref) return ctx.append(teachError({ title: "missing droplet name or ID" }));
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
  ctx.append(table(["Slug", "Region"], store.regions.map((r) => [r.slug, r.name])));
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
  ctx.append(table(["ID", "Name", "URL", "Tier", "Status"], store.apps.map((a) => [a.id.slice(0, 12) + "…", a.name, a.url, a.tier, a.status])));
};
const appsGet = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (ctx.mode !== "nextgen" && store.apps.find((a) => a.name === ref)) {
    return ctx.append(todayError(`GET https://api.digitalocean.com/v2/apps/${ref}: 404 (request "a1b2") app not found`, "a1b2c3d4"));
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
  if (!name) return ctx.append(teachError({ title: "missing database cluster name" }));
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
  ctx.append(table(["ID", "Name", "Engine", "Region", "Status"], store.databases.map((d) => [d.id.slice(0, 12) + "…", d.name, `${d.engine} ${d.version}`, d.region, d.status])));
};
const dbGet = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (ctx.mode !== "nextgen" && store.databases.find((d) => d.name === ref)) {
    return ctx.append(todayError(`GET https://api.digitalocean.com/v2/databases/${ref}: 404 (request "9f2a") cluster not found`, "9f2a1c74"));
  }
  const d = ref ? store.findDatabase(ref) : undefined;
  if (!d) return notFound(ctx, "Database cluster", ref ?? "", "doctl databases list");
  ctx.append(table(["ID", "Name", "Engine", "Version", "Size", "Region", "Status"], [[d.id, d.name, d.engine, d.version, d.size, d.region, d.status]]));
};
const dbConnection = (ctx: CommandContext) => {
  const ref = ctx.parsed.positionals[0];
  if (ctx.mode !== "nextgen") {
    if (store.databases.find((d) => d.name === ref)) {
      return ctx.append(todayError(`GET https://api.digitalocean.com/v2/databases/${ref}: 404 (request "9f2a") cluster not found`, "9f2a1c74"));
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
  if (!name) return ctx.append(teachError({ title: "missing cluster name" }));
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
    return ctx.append(todayError('{"error":"invalid","messages":{"base":["7648b7ff"]}}'));
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
    return ctx.append(teachError({ title: "unknown command \"chat\" for \"doctl gradient agent\"", cause: "Today you can manage agents but not talk to them — there is no chat/invoke/run verb." }));
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
  if (ctx.mode !== "nextgen") return ctx.append(teachError({ title: "unknown command \"rollback\"", cause: "There is no rollback in doctl today." }));
  const last = store.droplets[store.droplets.length - 1];
  await runProgress(ctx, "Rolling back last operation", [{ label: "Locating last mutation", ms: 500 }, { label: last ? `Destroying ${last.name}` : "Reverting", ms: 800 }]);
  if (last) store.deleteDroplet(last.name);
  ctx.append(panel("success", [line(span("✓ Rolled back", "success", { bold: true }), span(last ? `  removed ${last.name}` : "", "muted")), line(span("Reversibility is what makes delegating to an agent feel safe.", "muted"))]));
};

// ---- mcp serve ----------------------------------------------------------
const mcpServe = async (ctx: CommandContext) => {
  if (ctx.mode !== "nextgen") return ctx.append(teachError({ title: "unknown command \"mcp\"", cause: "doctl ships no MCP server today; the external one is a partial mirror." }));
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
function notFound(ctx: CommandContext, kind: string, ref: string, listCmd: string) {
  if (ctx.mode === "nextgen") {
    ctx.append(teachError({ title: `${kind} '${ref}' not found`, suggestions: [{ text: `See available ${kind.toLowerCase()}s`, command: listCmd }] }));
  } else {
    ctx.append(todayError(`GET https://api.digitalocean.com/v2/...: 404 (request "ab12") not found`, "ab12cd34"));
  }
}
function badRegion(ctx: CommandContext, region: string) {
  if (ctx.mode === "nextgen") ctx.append(teachError({ title: `Region '${region}' not found`, cause: "That region slug doesn't exist or isn't available to your account.", suggestions: [{ text: "List valid regions", command: "doctl compute region list" }] }));
  else ctx.append(todayError("POST https://api.digitalocean.com/v2/droplets: 422 (request \"c4f1\") There are no regions available that match your request", "c4f1a2b3"));
}
function badImage(ctx: CommandContext, image: string) {
  if (ctx.mode === "nextgen") ctx.append(teachError({ title: `Image '${image}' not found`, suggestions: [{ text: "List public images", command: "doctl compute image list --public" }] }));
  else ctx.append(todayError("POST https://api.digitalocean.com/v2/droplets: 404 (request \"d5g2\") image not found", "d5g2b3c4"));
}
function badSize(ctx: CommandContext, size: string) {
  if (ctx.mode === "nextgen") ctx.append(teachError({ title: `Size '${size}' not found`, suggestions: [{ text: "List sizes", command: "doctl compute size list" }, { text: "List GPU sizes", command: "doctl compute size list --gpu" }] }));
  else ctx.append(todayError("POST https://api.digitalocean.com/v2/droplets: 422 (request \"e6h3\") invalid size", "e6h3c4d5"));
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
    { name: "auth", summary: "Authenticate", children: [{ name: "init", summary: "Authenticate doctl", handler: authInit }] },
    { name: "account", summary: "Account", children: [{ name: "get", summary: "Get account info", handler: accountGet }] },
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
