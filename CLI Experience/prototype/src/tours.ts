// Guided tours map 1:1 to the 10 doctl test journeys (doctl-test-journeys.md).
// Each is a scripted narrative a presenter can click through.

export interface Tour {
  id: string;
  tj: string;
  title: string;
  persona: Persona;
  blurb: string;
  steps: string[];
}

export type Persona =
  | "Evaluator"
  | "Platform Engineer"
  | "AI Infra Engineer"
  | "Vibe Coder"
  | "CLI Orchestrator"
  | "Agent / MCP";

export const PERSONAS: Persona[] = [
  "Evaluator",
  "Platform Engineer",
  "AI Infra Engineer",
  "Vibe Coder",
  "CLI Orchestrator",
  "Agent / MCP",
];

export const TOURS: Tour[] = [
  {
    id: "tj01",
    tj: "TJ-01",
    title: "First-run onboarding",
    persona: "Evaluator",
    blurb: "Auth → first Droplet → SSH, with a welcoming first run.",
    steps: [
      "doctl auth init",
      "doctl compute droplet create my-first --image ubuntu-24-04-x64 --size s-1vcpu-1gb --region nyc1 --wait",
      "doctl compute ssh my-first",
    ],
  },
  {
    id: "tj02",
    tj: "TJ-02",
    title: "Droplet + named SSH key",
    persona: "Platform Engineer",
    blurb: "Create a Droplet using an SSH key by name, with live progress.",
    steps: [
      "doctl compute ssh-key list",
      "doctl compute droplet create aziz-droplet --image ubuntu-24-04-x64 --size s-2vcpu-4gb --region nyc1 --ssh-keys my-macbook --wait",
    ],
  },
  {
    id: "tj03",
    tj: "TJ-03",
    title: "App Platform deploy from repo",
    persona: "Vibe Coder",
    blurb: "Deploy a Node app straight from GitHub — no YAML spec.",
    steps: [
      "doctl apps create --from-repo github.com/do-community/sample-nodejs",
    ],
  },
  {
    id: "tj04",
    tj: "TJ-04",
    title: "Database connection by name",
    persona: "CLI Orchestrator",
    blurb: "Retrieve DB credentials by name, secrets masked by default.",
    steps: [
      "doctl databases list",
      "doctl databases connection orders-pg",
    ],
  },
  {
    id: "tj05",
    tj: "TJ-05",
    title: "AI agent discovery + chat",
    persona: "AI Infra Engineer",
    blurb: "Find the AI namespace, then actually talk to an agent.",
    steps: [
      "doctl gradient agent list",
      "doctl gradient agent chat support-bot --message \"how do I scale you?\"",
    ],
  },
  {
    id: "tj06",
    tj: "TJ-06",
    title: "GPU discovery + provisioning",
    persona: "AI Infra Engineer",
    blurb: "GPU sizes with model + VRAM columns in one place.",
    steps: [
      "doctl compute size list --gpu",
      "doctl compute droplet create trainer --image ubuntu-24-04-x64 --size gpu-h100x1-80gb --region nyc2 --wait",
    ],
  },
  {
    id: "tj07",
    tj: "TJ-07",
    title: "Async progress feedback",
    persona: "CLI Orchestrator",
    blurb: "Long provisions show their work instead of hanging.",
    steps: [
      "doctl kubernetes cluster create k8s-demo --region nyc1 --node-pool \"name=pool1;size=s-2vcpu-2gb;count=3\" --wait",
    ],
  },
  {
    id: "tj08",
    tj: "TJ-08",
    title: "JSON projection + CSV",
    persona: "CLI Orchestrator",
    blurb: "Field projection on JSON and native CSV — Andrew's fix.",
    steps: [
      "doctl compute droplet list --output json --field id,name,public_ipv4,status",
      "doctl compute droplet list --output csv",
    ],
  },
  {
    id: "tj09",
    tj: "TJ-09",
    title: "Errors that teach",
    persona: "Evaluator",
    blurb: "Invalid inputs return named, actionable errors.",
    steps: [
      "doctl compute droplet create err-test --image ubuntu-24-04-x64 --size s-1vcpu-1gb --region INVALID_REGION",
      "doctl databases connection nonexistent-cluster",
    ],
  },
  {
    id: "tj10",
    tj: "TJ-10",
    title: "Agent / MCP surface",
    persona: "Agent / MCP",
    blurb: "In-binary MCP server + machine-readable command schema.",
    steps: [
      "doctl mcp serve",
      "doctl compute droplet create web-1 --size s-2vcpu-4gb --region nyc1 --describe",
    ],
  },
  {
    id: "ask",
    tj: "Later",
    title: "doctl ask (natural language)",
    persona: "Vibe Coder",
    blurb: "Describe intent; approve the proposed command (HITL).",
    steps: [
      "doctl ask \"deploy my node app from github\"",
    ],
  },
];
