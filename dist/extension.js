"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode9 = __toESM(require("vscode"));

// src/config/configurationManager.ts
var vscode = __toESM(require("vscode"));
var ConfigurationManager = class {
  constructor() {
    this._onDidChange = new vscode.EventEmitter();
    this.onDidChange = this._onDidChange.event;
  }
  getEffective() {
    const cfg = vscode.workspace.getConfiguration();
    const instances = (cfg.get("taiga.instances") || []).map((raw) => this.normalizeInstance(raw));
    const activeInstanceName2 = cfg.get("taiga.activeInstanceName") || void 0;
    return {
      instances,
      activeInstanceName: activeInstanceName2,
      verbose: !!cfg.get("taiga.enableVerboseLogging"),
      maxPageSize: cfg.get("taiga.maxPageSize") || 50
    };
  }
  watch(context) {
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("taiga")) {
        this._onDidChange.fire(this.getEffective());
      }
    }));
  }
  normalizeInstance(raw) {
    return {
      name: String(raw.name || ""),
      baseUrl: this.normalizeBaseUrl(String(raw.baseUrl || "")),
      authType: "token",
      tokenSecretId: raw.tokenSecretId || `taiga:${raw.name}:token`,
      token: raw.token ? String(raw.token) : void 0
    };
  }
  normalizeBaseUrl(rawBaseUrl) {
    let u = rawBaseUrl.trim().replace(/\/+$/, "");
    if (!u)
      return "";
    const hasApi = /\/api(\/|$)/.test(u);
    if (!hasApi)
      return `${u}/api/v1`;
    if (u.endsWith("/api"))
      return `${u}/v1`;
    return u;
  }
};

// src/auth/authManager.ts
var vscode2 = __toESM(require("vscode"));
var AuthManager = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async getToken(secretId) {
    return this.ctx.secrets.get(secretId);
  }
  async setToken(secretId, value) {
    const token = value || await vscode2.window.showInputBox({ prompt: "Enter Taiga API token", ignoreFocusOut: true, password: true });
    if (!token)
      return void 0;
    await this.ctx.secrets.store(secretId, token.trim());
    return token.trim();
  }
};

// src/utils/logger.ts
var vscode3 = __toESM(require("vscode"));
function createLogger(channelName = "Taiga", verboseFlag) {
  const channel = vscode3.window.createOutputChannel(channelName);
  function ts() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function redact(s) {
    return s.replace(/(Bearer\s+)[A-Za-z0-9._-]+/g, "$1***");
  }
  return {
    info(msg) {
      channel.appendLine(`[INFO] ${ts()} ${redact(msg)}`);
    },
    warn(msg) {
      channel.appendLine(`[WARN] ${ts()} ${redact(msg)}`);
    },
    error(msg) {
      channel.appendLine(`[ERROR] ${ts()} ${redact(msg)}`);
    },
    debug(msg) {
      if (verboseFlag())
        channel.appendLine(`[DEBUG] ${ts()} ${redact(msg)}`);
    }
  };
}

// src/api/errorTranslator.ts
function translate(status, body, networkErr) {
  if (networkErr)
    return { category: "network", message: networkErr.message };
  if (status === 401 || status === 403)
    return { category: "auth", httpStatus: status, message: body?.detail || "Unauthorized" };
  if (status === 404)
    return { category: "not_found", httpStatus: status, message: "Not Found" };
  if (status === 429)
    return { category: "rate_limit", httpStatus: status, message: "Rate limited" };
  if ([400, 409, 412, 422].includes(status))
    return { category: "validation", httpStatus: status, message: body?.message || "Validation error", details: body };
  if (status >= 500)
    return { category: "server", httpStatus: status, message: "Server error" };
  return { category: "unknown", httpStatus: status, message: "Unexpected response", details: body };
}

// src/api/taigaApiClient.ts
var TaigaApiClient = class {
  constructor(baseUrl, tokenProvider, fetchImpl, log) {
    this.baseUrl = baseUrl;
    this.tokenProvider = tokenProvider;
    this.log = log;
    this.fetchFn = fetchImpl || globalThis.fetch;
  }
  async get(path, opts = {}) {
    if (!this.baseUrl) {
      this.log?.(`[TaigaApi] No baseUrl configured; skipping GET ${path}`);
      return { status: 0, headers: {}, error: translate(0, null, new Error("No Taiga baseUrl configured")) };
    }
    const token = await this.tokenProvider();
    const url = this.buildUrl(path, opts.query);
    this.log?.(`[TaigaApi] GET ${url} (token=${token ? "present" : "missing"})`);
    const headers = { Accept: "application/json", ...opts.headers || {} };
    if (token)
      headers.Authorization = `Bearer ${token}`;
    let resp;
    try {
      resp = await this.fetchFn(url, { method: "GET", headers });
    } catch (e) {
      this.log?.(`[TaigaApi] GET ${url} network error: ${e.message}`);
      return { status: 0, headers: {}, error: translate(0, null, e) };
    }
    let data = void 0;
    const text = await resp.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!resp.ok) {
      this.log?.(`[TaigaApi] GET ${url} -> ${resp.status}`);
      return { status: resp.status, headers: this.headerObj(resp), error: translate(resp.status, data) };
    }
    this.log?.(`[TaigaApi] GET ${url} -> ${resp.status}`);
    return { status: resp.status, headers: this.headerObj(resp), data };
  }
  buildUrl(path, query) {
    const base = `${this.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    if (!query)
      return base;
    const params = Object.entries(query).filter(([, v]) => v !== void 0 && v !== null).flatMap(([k, v]) => Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]);
    if (!params.length)
      return base;
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
    return `${base}?${qs}`;
  }
  headerObj(resp) {
    const out = {};
    resp.headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
};

// src/services/projectService.ts
var ProjectService = class {
  constructor(api) {
    this.api = api;
  }
  async listProjects() {
    const { data, error } = await this.api.get("/projects");
    if (error || data == null)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
};

// src/services/userStoryService.ts
var UserStoryService = class {
  constructor(api) {
    this.api = api;
  }
  async listUserStories(projectId) {
    const { data, error } = await this.api.get("/userstories", { query: { project: projectId } });
    if (error || data == null)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
};

// src/services/issueService.ts
var IssueService = class {
  constructor(api) {
    this.api = api;
  }
  async listIssues(projectId) {
    const { data, error } = await this.api.get("/issues", { query: { project: projectId } });
    if (error || data == null)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
};

// src/tree/projectTree.ts
var vscode4 = __toESM(require("vscode"));
var ProjectTreeProvider = class {
  constructor(projectService) {
    this.projectService = projectService;
    this._onDidChangeTreeData = new vscode4.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.projects = [];
    this.loading = false;
  }
  refresh() {
    this.load();
  }
  getProjectCount() {
    return this.projects.length;
  }
  getProjects() {
    return this.projects;
  }
  async load() {
    if (this.loading)
      return;
    this.loading = true;
    try {
      this.projects = await this.projectService.listProjects();
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element)
      return Promise.resolve([]);
    if (this.loading && this.projects.length === 0) {
      return Promise.resolve([new ProjectItem("Loading...")]);
    }
    if (!this.projects.length) {
      return Promise.resolve([new ProjectItem("No projects (check token/instance)")]);
    }
    return Promise.resolve(this.projects.map((p) => new ProjectItem(p.name || `Project ${p.id}`, p)));
  }
};
var ProjectItem = class extends vscode4.TreeItem {
  constructor(label, project) {
    super(label, vscode4.TreeItemCollapsibleState.None);
    this.project = project;
    if (!project) {
      this.contextValue = "info";
      return;
    }
    this.id = String(project.id);
    this.tooltip = project.description || project.name || String(project.id);
    this.contextValue = "project";
    this.command = { command: "taiga.selectProject", title: "Select Project", arguments: [project] };
  }
};

// src/tree/userStoriesTree.ts
var vscode5 = __toESM(require("vscode"));
var UserStoriesTreeProvider = class {
  constructor(userStoryService) {
    this.userStoryService = userStoryService;
    this._onDidChangeTreeData = new vscode5.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.stories = [];
    this.loading = false;
  }
  setActiveProject(id) {
    this.activeProjectId = id;
    this.refresh();
  }
  refresh() {
    this.load();
  }
  getStoryCount() {
    return this.stories.length;
  }
  getStories() {
    return this.stories;
  }
  async load() {
    if (this.loading)
      return;
    this.loading = true;
    try {
      if (this.activeProjectId) {
        this.stories = await this.userStoryService.listUserStories(this.activeProjectId);
      } else {
        this.stories = [];
      }
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element)
      return Promise.resolve([]);
    if (this.loading) {
      return Promise.resolve([new UserStoryItem("Loading...")]);
    }
    if (!this.activeProjectId) {
      return Promise.resolve([new UserStoryItem("Select a project to view stories")]);
    }
    if (!this.stories.length) {
      return Promise.resolve([new UserStoryItem("No user stories")]);
    }
    return Promise.resolve(this.stories.map((s) => new UserStoryItem(`${s.ref ? s.ref + " " : ""}${s.subject || "User Story"}`, s)));
  }
};
var UserStoryItem = class extends vscode5.TreeItem {
  constructor(label, story) {
    super(label, vscode5.TreeItemCollapsibleState.None);
    this.story = story;
    if (!story) {
      this.contextValue = "info";
      return;
    }
    this.id = String(story.id);
    this.tooltip = story.subject || String(story.id);
    this.contextValue = "userStory";
  }
};

// src/tree/issuesTree.ts
var vscode6 = __toESM(require("vscode"));
var IssuesTreeProvider = class {
  constructor(issueService) {
    this.issueService = issueService;
    this._onDidChangeTreeData = new vscode6.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.issues = [];
    this.loading = false;
  }
  setActiveProject(id) {
    this.activeProjectId = id;
    this.refresh();
  }
  refresh() {
    this.load();
  }
  async load() {
    if (this.loading)
      return;
    this.loading = true;
    try {
      if (this.activeProjectId) {
        this.issues = await this.issueService.listIssues(this.activeProjectId);
      } else {
        this.issues = [];
      }
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element)
      return Promise.resolve([]);
    if (this.loading)
      return Promise.resolve([new IssueItem("Loading...")]);
    if (!this.activeProjectId)
      return Promise.resolve([new IssueItem("Select a project to view issues")]);
    if (!this.issues.length)
      return Promise.resolve([new IssueItem("No issues")]);
    return Promise.resolve(this.issues.map((i) => new IssueItem(i.subject || `Issue ${i.id}`, i)));
  }
};
var IssueItem = class extends vscode6.TreeItem {
  constructor(label, issue) {
    super(label, vscode6.TreeItemCollapsibleState.None);
    this.issue = issue;
    if (!issue) {
      this.contextValue = "info";
      return;
    }
    this.id = String(issue.id);
    this.tooltip = issue.subject || String(issue.id);
    this.contextValue = "issue";
  }
};

// src/commands/registerCommands.ts
var vscode7 = __toESM(require("vscode"));
function registerCommands(ctx, _providers, commandCtx) {
  const disposables = [];
  disposables.push(
    vscode7.commands.registerCommand("taiga.refreshAll", () => commandCtx.refreshAll()),
    vscode7.commands.registerCommand("taiga.selectProject", (project) => {
      commandCtx.setActiveProject(project);
      commandCtx.refreshAll();
    }),
    vscode7.commands.registerCommand("taiga.showDiagnostics", () => commandCtx.showDiagnostics()),
    vscode7.commands.registerCommand("taiga.selectInstance", async () => {
      const items = commandCtx.listInstances().map((i) => ({ label: i.name, description: i.baseUrl }));
      const pick = await vscode7.window.showQuickPick(items, { placeHolder: "Select Taiga instance" });
      if (pick) {
        commandCtx.setActiveInstance(pick.label);
        commandCtx.refreshAll();
      }
    }),
    vscode7.commands.registerCommand("taiga.setToken", async () => {
      await commandCtx.setTokenForActiveInstance();
    }),
    vscode7.commands.registerCommand("taiga.connect", async () => {
      await commandCtx.connectWithCredentials();
    })
  );
  disposables.forEach((d) => ctx.subscriptions.push(d));
}

// src/diagnostics/diagnostics.ts
var vscode8 = __toESM(require("vscode"));
function showDiagnostics(state) {
  const lines = [
    `Active Instance: ${state.activeInstance || "none"}`,
    `Active Project: ${state.activeProject ? state.activeProject.name : "none"}`,
    `Projects Loaded: ${state.projectCount}`,
    `User Stories Loaded: ${state.storyCount}`
  ];
  vscode8.window.showInformationMessage(lines.join("\n"));
}

// src/extension.ts
var activeProject;
var activeInstanceName;
async function activate(context) {
  const configMgr = new ConfigurationManager();
  const currentCfg = configMgr.getEffective();
  activeInstanceName = currentCfg.activeInstanceName || currentCfg.instances[0]?.name;
  const logger = createLogger("Taiga", () => configMgr.getEffective().verbose);
  const authMgr = new AuthManager(context);
  function getActiveInstance() {
    const cfg = configMgr.getEffective();
    return cfg.instances.find((i) => i.name === activeInstanceName);
  }
  let api = new TaigaApiClient(getActiveInstance()?.baseUrl || "", async () => {
    const inst = getActiveInstance();
    if (!inst)
      return void 0;
    if (inst.token)
      return inst.token;
    return authMgr.getToken(inst.tokenSecretId);
  }, void 0, (m) => logger.info(m));
  const projectService = new ProjectService(api);
  const userStoryService = new UserStoryService(api);
  const issueService = new IssueService(api);
  const projectTree = new ProjectTreeProvider(projectService);
  const storiesTree = new UserStoriesTreeProvider(userStoryService);
  const issuesTree = new IssuesTreeProvider(issueService);
  vscode9.window.registerTreeDataProvider("taigaProjects", projectTree);
  vscode9.window.registerTreeDataProvider("taigaUserStories", storiesTree);
  vscode9.window.registerTreeDataProvider("taigaIssues", issuesTree);
  const commandCtx = {
    setActiveProject(project) {
      activeProject = project;
      storiesTree.setActiveProject(project?.id);
      issuesTree.setActiveProject(project?.id);
    },
    getActiveProject() {
      return activeProject;
    },
    showDiagnostics: () => showDiagnostics({
      activeInstance: getActiveInstance()?.name,
      activeProject,
      projectCount: projectTree.getProjectCount(),
      storyCount: storiesTree.getStoryCount()
    }),
    refreshAll: () => {
      projectTree.refresh();
      storiesTree.refresh();
      issuesTree.refresh();
    },
    listInstances: () => configMgr.getEffective().instances,
    setActiveInstance: (name) => {
      activeInstanceName = name;
      commandCtx.refreshAll();
    },
    setTokenForActiveInstance: async () => {
      const inst = getActiveInstance();
      if (!inst) {
        vscode9.window.showWarningMessage("No active Taiga instance.");
        return;
      }
      await authMgr.setToken(inst.tokenSecretId);
      commandCtx.refreshAll();
    },
    connectWithCredentials: async () => {
      const inst = getActiveInstance();
      if (!inst) {
        vscode9.window.showWarningMessage("No active Taiga instance.");
        return;
      }
      const username = await vscode9.window.showInputBox({ prompt: "Taiga username or email", ignoreFocusOut: true });
      if (!username)
        return;
      const password = await vscode9.window.showInputBox({ prompt: "Taiga password", ignoreFocusOut: true, password: true });
      if (!password)
        return;
      const authUrl = `${inst.baseUrl.replace(/\/$/, "")}/auth`;
      try {
        const resp = await globalThis.fetch(authUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ type: "normal", username: username.trim(), password })
        });
        const text = await resp.text();
        let body = void 0;
        try {
          body = text ? JSON.parse(text) : void 0;
        } catch {
          body = text;
        }
        if (!resp.ok) {
          const err = { category: resp.status === 401 ? "auth" : "server", httpStatus: resp.status, message: "Authentication failed", details: body };
          vscode9.window.showErrorMessage(`Taiga auth failed: ${err.message} (${resp.status})`);
          return;
        }
        const token = body?.auth_token || body?.token || body?.access_token;
        if (!token) {
          vscode9.window.showErrorMessage("Taiga auth response did not include a token.");
          return;
        }
        await authMgr.setToken(inst.tokenSecretId, token);
        vscode9.window.showInformationMessage("Connected to Taiga.");
        commandCtx.refreshAll();
      } catch (e) {
        vscode9.window.showErrorMessage(`Taiga auth error: ${e.message}`);
      }
    }
  };
  registerCommands(context, { projects: projectTree, userStories: storiesTree }, commandCtx);
  projectTree.load().then(() => {
    if (activeProject) {
      storiesTree.load();
      issuesTree.load();
    }
  });
  logger.info("Taiga extension activated.");
  configMgr.watch(context);
  configMgr.onDidChange(() => {
    const inst = getActiveInstance();
    api = new TaigaApiClient(inst?.baseUrl || "", async () => {
      if (!inst)
        return void 0;
      if (inst.token)
        return inst.token;
      return authMgr.getToken(inst.tokenSecretId);
    }, void 0, (m) => logger.info(m));
    storiesTree.setActiveProject(activeProject?.id);
    issuesTree.setActiveProject(activeProject?.id);
    projectTree.refresh();
    storiesTree.refresh();
    issuesTree.refresh();
  });
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
