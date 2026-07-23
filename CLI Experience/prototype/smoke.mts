// Headless smoke test: exercise the command engine in both modes and make sure
// every flagship command produces blocks without throwing. Run with:
//   node smoke.mts
import { execute } from "./src/engine/execute.ts";
import type { Block, Mode } from "./src/types.ts";

const commands = [
  "doctl",
  "doctl help",
  "doctl auth init",
  "doctl compute droplet list",
  "doctl compute droplet list --output json --field id,name,public_ipv4,status",
  "doctl compute droplet list --output csv",
  "doctl compute droplet get web-prod-01",
  "doctl compute droplet create smoke-1 --image ubuntu-24-04-x64 --size s-2vcpu-4gb --region nyc1 --ssh-keys my-macbook --wait",
  "doctl compute droplet create bad --image ubuntu-24-04-x64 --size s-1vcpu-1gb --region INVALID_REGION",
  "doctl compute size list --gpu",
  "doctl dedicated-inference get-sizes",
  "doctl apps create --from-repo github.com/do-community/sample-nodejs",
  "doctl databases connection orders-pg",
  "doctl kubernetes cluster create k8s-smoke --region nyc1 --wait",
  "doctl gradient agent list",
  "doctl gradient agent chat support-bot --message hello",
  "doctl ask \"deploy my node app from github\"",
  "doctl rollback",
  "doctl mcp serve",
  "doctl compute droplet create web-1 --size s-2vcpu-4gb --region nyc1 --describe",
];

let failures = 0;

async function runOne(cmd: string, mode: Mode) {
  const blocks: Block[] = [];
  const hooks = {
    set: (b: Block[]) => {
      blocks.length = 0;
      blocks.push(...b);
    },
    append: (b: Block) => {
      blocks.push(b);
    },
    updateLast: (m: (b: Block) => Block) => {
      if (blocks.length) blocks[blocks.length - 1] = m(blocks[blocks.length - 1]);
    },
    sleep: (_ms: number) => Promise.resolve(),
    run: (_c: string) => {},
  };
  try {
    await execute(cmd, mode, hooks);
    if (!blocks.length) {
      console.log(`  [warn] ${mode}: "${cmd}" produced 0 blocks`);
    }
    return blocks.length;
  } catch (err) {
    failures++;
    console.log(`  [FAIL] ${mode}: "${cmd}" -> ${(err as Error).message}`);
    return 0;
  }
}

for (const mode of ["nextgen", "today"] as Mode[]) {
  console.log(`\n== mode: ${mode} ==`);
  for (const cmd of commands) {
    const n = await runOne(cmd, mode);
    console.log(`  ok   ${mode}: ${String(n).padStart(2)} blocks  ${cmd}`);
  }
}

console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURES"}`);
process.exit(failures === 0 ? 0 : 1);
