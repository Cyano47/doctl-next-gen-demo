// In-memory, mutable mock data store. Seeded at startup; create/delete/rename
// mutate it in-session so the demo feels real and tab-completion stays live.

export interface Droplet {
  id: number;
  name: string;
  ip: string;
  region: string;
  size: string;
  image: string;
  status: "active" | "new" | "off";
  memoryMb: number;
  vcpus: number;
  createdAt: string;
}

export interface SSHKey {
  id: number;
  name: string;
  fingerprint: string;
}

export interface Database {
  id: string;
  name: string;
  engine: string;
  version: string;
  size: string;
  region: string;
  numNodes: number;
  status: "online" | "creating";
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    uri: string;
  };
}

export interface App {
  id: string;
  name: string;
  repo?: string;
  region: string;
  tier: string;
  url: string;
  status: "active" | "deploying";
  monthlyCost: number;
}

export interface K8sCluster {
  id: string;
  name: string;
  region: string;
  version: string;
  nodePool: string;
  nodeCount: number;
  status: "running" | "provisioning";
}

export interface Size {
  slug: string;
  vcpus: number;
  memoryMb: number;
  diskGb: number;
  priceMonthly: number;
  priceHourly: number;
}

export interface GpuSize {
  slug: string;
  model: string;
  vram: number;
  gpuCount: number;
  priceHourly: number;
  priceMonthly: number;
  regions: string[];
}

export interface Region {
  slug: string;
  name: string;
}

export interface Image {
  slug: string;
  distribution: string;
  name: string;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: "deployed" | "creating";
  endpoint: string;
}

let dropletSeq = 400300100;
function nextDropletId() {
  return ++dropletSeq;
}

function ip() {
  const r = () => Math.floor(Math.random() * 254) + 1;
  return `164.90.${r()}.${r()}`;
}

export class Store {
  droplets: Droplet[] = [];
  sshKeys: SSHKey[] = [];
  databases: Database[] = [];
  apps: App[] = [];
  clusters: K8sCluster[] = [];
  agents: Agent[] = [];

  readonly sizes: Size[] = [
    { slug: "s-1vcpu-512mb-10gb", vcpus: 1, memoryMb: 512, diskGb: 10, priceMonthly: 4, priceHourly: 0.006 },
    { slug: "s-1vcpu-1gb", vcpus: 1, memoryMb: 1024, diskGb: 25, priceMonthly: 6, priceHourly: 0.009 },
    { slug: "s-1vcpu-2gb", vcpus: 1, memoryMb: 2048, diskGb: 50, priceMonthly: 12, priceHourly: 0.018 },
    { slug: "s-2vcpu-2gb", vcpus: 2, memoryMb: 2048, diskGb: 60, priceMonthly: 18, priceHourly: 0.027 },
    { slug: "s-2vcpu-4gb", vcpus: 2, memoryMb: 4096, diskGb: 80, priceMonthly: 24, priceHourly: 0.036 },
    { slug: "s-4vcpu-8gb", vcpus: 4, memoryMb: 8192, diskGb: 160, priceMonthly: 48, priceHourly: 0.071 },
  ];

  readonly gpuSizes: GpuSize[] = [
    { slug: "gpu-h100x1-80gb", model: "NVIDIA H100", vram: 80, gpuCount: 1, priceHourly: 4.41, priceMonthly: 2522.16, regions: ["nyc2", "tor1"] },
    { slug: "gpu-h100x8-640gb", model: "NVIDIA H100", vram: 640, gpuCount: 8, priceHourly: 35.28, priceMonthly: 20177.28, regions: ["nyc2"] },
    { slug: "gpu-l40sx1-48gb", model: "NVIDIA L40S", vram: 48, gpuCount: 1, priceHourly: 1.57, priceMonthly: 898.08, regions: ["nyc2", "ams3"] },
    { slug: "gpu-a100x1-80gb", model: "NVIDIA A100", vram: 80, gpuCount: 1, priceHourly: 3.09, priceMonthly: 1767.6, regions: ["nyc2"] },
  ];

  readonly regions: Region[] = [
    { slug: "nyc1", name: "New York 1" },
    { slug: "nyc2", name: "New York 2" },
    { slug: "nyc3", name: "New York 3" },
    { slug: "sfo3", name: "San Francisco 3" },
    { slug: "ams3", name: "Amsterdam 3" },
    { slug: "lon1", name: "London 1" },
    { slug: "sgp1", name: "Singapore 1" },
    { slug: "tor1", name: "Toronto 1" },
  ];

  readonly images: Image[] = [
    { slug: "ubuntu-24-04-x64", distribution: "Ubuntu", name: "24.04 (LTS) x64" },
    { slug: "ubuntu-22-04-x64", distribution: "Ubuntu", name: "22.04 (LTS) x64" },
    { slug: "debian-12-x64", distribution: "Debian", name: "12 x64" },
    { slug: "fedora-40-x64", distribution: "Fedora", name: "40 x64" },
    { slug: "docker-24-04", distribution: "Marketplace", name: "Docker on Ubuntu 24.04" },
  ];

  readonly models: string[] = ["llama3-8b-instruct", "llama3-70b-instruct", "mistral-7b", "gpt-oss-120b"];

  constructor() {
    this.seed();
  }

  seed() {
    this.droplets = [
      { id: nextDropletId(), name: "web-prod-01", ip: "164.90.12.44", region: "nyc1", size: "s-2vcpu-4gb", image: "ubuntu-24-04-x64", status: "active", memoryMb: 4096, vcpus: 2, createdAt: "2026-06-02" },
      { id: nextDropletId(), name: "web-prod-02", ip: "164.90.12.51", region: "nyc1", size: "s-2vcpu-4gb", image: "ubuntu-24-04-x64", status: "active", memoryMb: 4096, vcpus: 2, createdAt: "2026-06-02" },
      { id: nextDropletId(), name: "ci-runner", ip: "164.90.31.9", region: "sfo3", size: "s-4vcpu-8gb", image: "docker-24-04", status: "active", memoryMb: 8192, vcpus: 4, createdAt: "2026-06-20" },
    ];
    this.sshKeys = [
      { id: 41219001, name: "my-macbook", fingerprint: "3b:16:bf:6a:2e:9c:41:aa:70:5d:9c:12:4e:6a:11:8f" },
      { id: 41219002, name: "ci-deploy-key", fingerprint: "9a:52:d1:0c:77:34:2b:ee:41:90:aa:1c:2d:3e:4f:56" },
    ];
    this.databases = [
      {
        id: "db-9f2a1c74-1d3e-4a2b-8c5f-1a2b3c4d5e6f",
        name: "orders-pg",
        engine: "pg",
        version: "16",
        size: "db-s-1vcpu-2gb",
        region: "nyc1",
        numNodes: 1,
        status: "online",
        connection: {
          host: "orders-pg-do-user-9421.b.db.ondigitalocean.com",
          port: 25060,
          user: "doadmin",
          password: "AVNS_x93Kd2LmQ7pR4sTvW1y",
          database: "defaultdb",
          uri: "postgresql://doadmin:AVNS_x93Kd2LmQ7pR4sTvW1y@orders-pg-do-user-9421.b.db.ondigitalocean.com:25060/defaultdb?sslmode=require",
        },
      },
    ];
    this.apps = [
      { id: "app-1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", name: "marketing-site", repo: "do-community/marketing-site", region: "nyc", tier: "basic-xxs", url: "https://marketing-site-abc12.ondigitalocean.app", status: "active", monthlyCost: 5 },
    ];
    this.clusters = [
      { id: "k8s-7c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f", name: "prod-cluster", region: "nyc1", version: "1.31.1-do.0", nodePool: "pool-worker", nodeCount: 3, status: "running" },
    ];
    this.agents = [
      { id: "agent-3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7a8b", name: "support-bot", model: "llama3-70b-instruct", status: "deployed", endpoint: "https://support-bot-xy12z.agents.do-ai.run" },
    ];
  }

  reset() {
    this.seed();
  }

  // ---- lookups (name OR id, the whole point of "name acceptance") --------
  findDroplet(ref: string): Droplet | undefined {
    return this.droplets.find((d) => d.name === ref || String(d.id) === ref);
  }
  findDatabase(ref: string): Database | undefined {
    return this.databases.find((d) => d.name === ref || d.id === ref);
  }
  findApp(ref: string): App | undefined {
    return this.apps.find((a) => a.name === ref || a.id === ref);
  }
  findCluster(ref: string): K8sCluster | undefined {
    return this.clusters.find((c) => c.name === ref || c.id === ref);
  }
  findAgent(ref: string): Agent | undefined {
    return this.agents.find((a) => a.name === ref || a.id === ref);
  }
  findSize(slug: string): Size | GpuSize | undefined {
    return this.sizes.find((s) => s.slug === slug) || this.gpuSizes.find((g) => g.slug === slug);
  }
  findSSHKey(ref: string): SSHKey | undefined {
    return this.sshKeys.find((k) => k.name === ref || String(k.id) === ref || k.fingerprint === ref);
  }

  // ---- mutations ---------------------------------------------------------
  createDroplet(opts: { name: string; region: string; size: string; image: string }): Droplet {
    const size = this.sizes.find((s) => s.slug === opts.size);
    const gpu = this.gpuSizes.find((g) => g.slug === opts.size);
    const d: Droplet = {
      id: nextDropletId(),
      name: opts.name,
      ip: ip(),
      region: opts.region,
      size: opts.size,
      image: opts.image,
      status: "active",
      memoryMb: size ? size.memoryMb : gpu ? 245760 : 1024,
      vcpus: size ? size.vcpus : gpu ? 20 : 1,
      createdAt: "2026-07-23",
    };
    this.droplets.push(d);
    return d;
  }
  deleteDroplet(ref: string): boolean {
    const idx = this.droplets.findIndex((d) => d.name === ref || String(d.id) === ref);
    if (idx === -1) return false;
    this.droplets.splice(idx, 1);
    return true;
  }
  createDatabase(opts: { name: string; engine: string; version: string; size: string; region: string; numNodes: number }): Database {
    const db: Database = {
      id: `db-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`,
      name: opts.name,
      engine: opts.engine,
      version: opts.version,
      size: opts.size,
      region: opts.region,
      numNodes: opts.numNodes,
      status: "online",
      connection: {
        host: `${opts.name}-do-user-9421.b.db.ondigitalocean.com`,
        port: 25060,
        user: "doadmin",
        password: "AVNS_" + Math.random().toString(36).slice(2, 18),
        database: "defaultdb",
        uri: "",
      },
    };
    db.connection.uri = `${opts.engine === "pg" ? "postgresql" : opts.engine}://${db.connection.user}:${db.connection.password}@${db.connection.host}:${db.connection.port}/${db.connection.database}?sslmode=require`;
    this.databases.push(db);
    return db;
  }
  createApp(opts: { name: string; repo: string }): App {
    const a: App = {
      id: `app-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`,
      name: opts.name,
      repo: opts.repo,
      region: "nyc",
      tier: "basic-xxs",
      url: `https://${opts.name}-${Math.random().toString(36).slice(2, 7)}.ondigitalocean.app`,
      status: "active",
      monthlyCost: 5,
    };
    this.apps.push(a);
    return a;
  }
  createCluster(opts: { name: string; region: string; nodePool: string; nodeCount: number }): K8sCluster {
    const c: K8sCluster = {
      id: `k8s-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`,
      name: opts.name,
      region: opts.region,
      version: "1.31.1-do.0",
      nodePool: opts.nodePool,
      nodeCount: opts.nodeCount,
      status: "running",
    };
    this.clusters.push(c);
    return c;
  }
  createAgent(opts: { name: string; model: string }): Agent {
    const a: Agent = {
      id: `agent-${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`,
      name: opts.name,
      model: opts.model,
      status: "deployed",
      endpoint: `https://${opts.name}-${Math.random().toString(36).slice(2, 7)}.agents.do-ai.run`,
    };
    this.agents.push(a);
    return a;
  }
}

// Single shared instance for the session.
export const store = new Store();
