# Cloud Console UI (DigitalOcean-inspired)

A React-based clone of the DigitalOcean Cloud Console with sidebar navigation, header, main content (Namespaces + build cards), and a DO.Assistant / Support Agent panel (Ask Docs) with conversational ticket creation.

## Run locally

**1. Install dependencies**

```bash
npm install
```

**2. Run the backend (Support Agent API)**

```bash
npm run server
```

Runs the API at http://localhost:3001 (chat, tickets, status, append, feedback).

**3. Run the frontend**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app proxies `/api` to the backend.

**Or run both at once**

```bash
npm run dev:all
```

## Host on DigitalOcean (App Platform)

The app is set up to run as a **single component** on [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/): one Node service builds the React app and serves both the API and the static site.

### Option A: Deploy from the Control Panel

1. **Push this repo** to GitHub (or GitLab / Bitbucket).
2. In the [DigitalOcean Control Panel](https://cloud.digitalocean.com/), go to **Apps** → **Create App** → choose your **source** (e.g. GitHub) and select this repository and branch.
3. App Platform will detect **`.do/app.yaml`** if present, or configure manually:
   - **Build command:** `npm ci && npm run build`
   - **Run command:** `npm start`
   - **HTTP port:** `8080`
4. Add **environment variables** in the App dashboard (e.g. `OPENAI_API_KEY` as a secret).
5. Deploy. The app will be at `https://<your-app>.ondigitalocean.app`.

### Option B: Deploy with doctl (CLI)

1. Push this repo to GitHub.
2. Install and authenticate [doctl](https://docs.digitalocean.com/reference/doctl/how-to/install/): `doctl auth init`.
3. Run from the project root:
   ```bash
   REPO=your-github-username/do-console-ui BRANCH=main ./scripts/deploy-do.sh
   ```
4. In the [Apps dashboard](https://cloud.digitalocean.com/apps), open the new app and add env vars (e.g. `OPENAI_API_KEY`), then redeploy if needed.

The server serves the React build from `dist/` for all non-API routes and the API at `/api/*` on the same origin.

## Using DigitalOcean MCP (Cursor and other MCP clients)

You can use the [DigitalOcean MCP server](https://docs.digitalocean.com/reference/mcp/) so Cursor (or Claude, VS Code Copilot, Windsurf) can manage and deploy this app on DigitalOcean via the API.

- **Setup:** See [`.cursor/README.md`](.cursor/README.md) for enabling the DigitalOcean MCP in Cursor (copy `.cursor/mcp.json.example` to `.cursor/mcp.json`, add your `DIGITALOCEAN_API_TOKEN`, restart Cursor).
- **App Platform:** With the `apps` service enabled, the MCP exposes tools to create/update apps, deploy from this repo, list deployments, and view logs. You can say e.g. “Deploy this app to App Platform” or “Create an App from this repo using `.do/app.yaml`.”
- **Remote MCP:** DigitalOcean also provides [hosted MCP endpoints](https://docs.digitalocean.com/reference/mcp/configure-mcp/) (e.g. `https://apps.mcp.digitalocean.com/mcp`) so you can connect without running `npx @digitalocean/mcp` locally.

## Agent: prompt and knowledge base

The chat uses a configurable agent that can drive UI templates (Ticket Creation, Submit rating) during the conversation.

- **System prompt**: Edit **`server/prompts/support-agent.md`** and paste your complete agent prompt there. This file is sent to the LLM as the system message.
- **Knowledge base**: Add `.md` or `.txt` files under **`server/knowledge/`**; they are loaded and appended to the system message for reference. Optionally add **`server/config/knowledge.json`** (see `knowledge.json.example`) with a `paths` array of extra file paths to include.
- **Templates**: The agent can call tools to show **Ticket Creation** (pre-filled form) or **Submit rating** (star rating + comment). The frontend renders these when the backend returns `template` and `templateData`.

Without `OPENAI_API_KEY`, the backend uses a stub that still shows the ticket form when you say “Create ticket”.

## Environment (optional)

Copy `.env.example` to `.env` and set:

- `PORT` – backend port (default 3001)
- `OPENAI_API_KEY` – for the conversational agent (optional; stub used if unset)
- `OPENAI_MODEL` – model name (default `gpt-4o-mini`)
- `SALESFORCE_STUB_FAIL=1` – simulate ticket creation failure for testing
- Real integrations: `SALESFORCE_*`, `ATLANTIS_*` when you plug in live services

## Features

- **Left sidebar**: Projects (collapsible), Manage (App Platform, Droplets, Kubernetes, etc.), footer links. **Support** opens the Ask Docs panel and nudge.
- **Header**: Global search, Create dropdown, notifications, project name, estimated costs, avatar.
- **Main content**: Namespaces table; “Build on what you have” cards (App Platform, Generative AI, Managed Databases).
- **Right panel (DO.Assistant / Support Agent)**:
  - Chat with backend; “Create ticket” (or similar) returns a ticket draft.
  - Ticket card with Tier 1/2/3, Issue, Resource, “From our conversation,” clarification counter (X of 5), file upload (10MB), Edit, Submit.
  - On success: ticket number, SLA ETA, Check status, Add to ticket, star rating + comment feedback.
  - On failure after 3 attempts: message and link to create ticket manually.
- **Backend**: Agent with system prompt + knowledge base; optional OpenAI integration; structured response for UI templates (ticket_draft, rating); ticket submit (Salesforce stub, 3 retries, failure logging), PII redaction, technical metadata (Atlantis stub), append-to-ticket, ticket status, feedback persistence.

Built with **React**, **Vite**, **Tailwind CSS**, and **Express** (backend).
