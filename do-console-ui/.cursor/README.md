# Cursor MCP – DigitalOcean

This folder holds MCP (Model Context Protocol) configuration for use with Cursor and DigitalOcean.

## Enable DigitalOcean MCP in Cursor

1. **Get a DigitalOcean API token**  
   [Create a Personal Access Token](https://cloud.digitalocean.com/account/api/tokens) with **Read** and **Write** scope (for App Platform deploy/management).

2. **Add the DigitalOcean MCP server**
   - Copy `mcp.json.example` to `mcp.json`:
     ```bash
     cp .cursor/mcp.json.example .cursor/mcp.json
     ```
   - Edit `.cursor/mcp.json` and replace `YOUR_DIGITALOCEAN_API_TOKEN` with your token.
   - **Do not commit** `mcp.json` (it is listed in `.gitignore`).

   **Or** add the same config to Cursor’s global MCP settings: **Cursor Settings → MCP** and add the `digitalocean` server (command: `npx`, args: `["-y", "@digitalocean/mcp", "--services", "apps"]`, env: `DIGITALOCEAN_API_TOKEN`).

3. **Restart Cursor** so it loads the MCP server.

## What you can do with DigitalOcean MCP

With the DigitalOcean MCP server connected, Cursor (and other MCP clients) can use DigitalOcean tools to:

- **App Platform:** create apps, deploy from this repo, list/update/delete apps, view logs and deployments.
- **Other services** (if you add them via `--services`): Droplets, Kubernetes, Databases, Spaces, Networking, etc.  
  See [DigitalOcean MCP](https://docs.digitalocean.com/reference/mcp/) and [mcp-digitalocean](https://github.com/digitalocean-labs/mcp-digitalocean).

Example prompts in Cursor:

- “Deploy this app to DigitalOcean App Platform using the connected repo.”
- “List my App Platform apps.”
- “Create an App Platform app from this repository with the spec in `.do/app.yaml`.”

## Remote MCP (optional)

DigitalOcean also offers **Remote MCP** (hosted endpoints) so you don’t run the server locally.  
See [Configure Remote MCP](https://docs.digitalocean.com/reference/mcp/configure-mcp/) and use the App Platform endpoint in your MCP client if you prefer that over the local `npx` setup.
