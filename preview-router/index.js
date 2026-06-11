const http = require("node:http");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { URL } = require("node:url");
const httpProxy = require("http-proxy");

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.PORT || 4999);
const IPC_PORT = Number(process.env.IPC_PORT || 4998);
const PREVIEW_DOMAIN = process.env.WEBMAKER_PREVIEW_DOMAIN || "preview.localhost";
const PREVIEW_PORT = process.env.WEBMAKER_PREVIEW_CONTAINER_PORT || "5173";

const ports = new Map();
const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
});

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function parseWorkspaceId(hostHeader) {
  const host = String(hostHeader || "").split(":")[0].toLowerCase();
  const suffix = `.${PREVIEW_DOMAIN.toLowerCase()}`;
  if (!host.endsWith(suffix)) return null;
  const workspaceId = host.slice(0, -suffix.length);
  return workspaceId || null;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function targetForRequest(req) {
  const workspaceId = parseWorkspaceId(req.headers.host);
  if (!workspaceId) {
    return { workspaceId: null, target: null };
  }
  const port = ports.get(workspaceId);
  return {
    workspaceId,
    target: port ? `http://127.0.0.1:${port}` : null,
  };
}

function getContainerNames(entry) {
  if (Array.isArray(entry.Names)) return entry.Names;
  if (typeof entry.Names === "string") return [entry.Names];
  if (Array.isArray(entry.names)) return entry.names;
  if (typeof entry.names === "string") return [entry.names];
  return [];
}

function getWorkspaceIdFromContainer(entry) {
  const labels = entry.Labels || entry.labels || {};
  if (labels && typeof labels === "object" && labels["webmaker.workspace"]) {
    return String(labels["webmaker.workspace"]);
  }
  const name = getContainerNames(entry).find((item) => item.startsWith("preview-"));
  return name ? name.replace(/^preview-/, "") : "";
}

async function readPodmanPort(containerName) {
  const { stdout } = await execFileAsync("podman", [
    "port",
    containerName,
    `${PREVIEW_PORT}/tcp`,
  ]);
  const mapped = stdout.trim();
  const port = Number(mapped.split(":").pop());
  return Number.isFinite(port) && port > 0 ? port : null;
}

async function hydrateFromPodman() {
  try {
    const { stdout } = await execFileAsync("podman", [
      "ps",
      "--filter",
      "label=webmaker.preview=true",
      "--format",
      "json",
    ]);
    const containers = JSON.parse(stdout || "[]");
    if (!Array.isArray(containers)) return;

    for (const entry of containers) {
      const workspaceId = getWorkspaceIdFromContainer(entry);
      const containerName = getContainerNames(entry)[0];
      if (!workspaceId || !containerName) continue;
      const port = await readPodmanPort(containerName).catch(() => null);
      if (!port) continue;
      ports.set(workspaceId, port);
      console.log(`Registered existing preview ${workspaceId} -> ${port}`);
    }
  } catch (error) {
    console.warn(`Could not hydrate preview ports from Podman: ${error.message}`);
  }
}

proxy.on("error", (error, req, res) => {
  if (res && !res.headersSent) {
    sendJson(res, 502, { error: "Preview proxy failed", detail: error.message });
  }
});

const server = http.createServer((req, res) => {
  const { workspaceId, target } = targetForRequest(req);
  if (!workspaceId || !target) {
    sendJson(res, 503, { error: "Preview not ready", workspaceId });
    return;
  }
  proxy.web(req, res, { target });
});

server.on("upgrade", (req, socket, head) => {
  const { workspaceId, target } = targetForRequest(req);
  if (!workspaceId || !target) {
    socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
    socket.destroy();
    return;
  }
  proxy.ws(req, socket, head, { target });
});

const ipcServer = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  try {
    if (req.method === "POST" && url.pathname === "/register") {
      const body = await readJson(req);
      if (!body.workspaceId || !Number.isFinite(Number(body.port))) {
        sendJson(res, 400, { error: "workspaceId and numeric port are required" });
        return;
      }
      ports.set(String(body.workspaceId), Number(body.port));
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "DELETE" && url.pathname === "/unregister") {
      const body = await readJson(req);
      if (body.workspaceId) {
        ports.delete(String(body.workspaceId));
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/ports") {
      sendJson(res, 200, Object.fromEntries(ports.entries()));
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Invalid request" });
  }
});

server.listen(PORT, () => {
  console.log(`Preview router listening on ${PORT}`);
  void hydrateFromPodman();
});

ipcServer.listen(IPC_PORT, "127.0.0.1", () => {
  console.log(`Preview router IPC listening on 127.0.0.1:${IPC_PORT}`);
});
