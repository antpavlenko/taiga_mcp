import * as vscode from 'vscode';
import { ConfigurationManager } from './config/configurationManager';
import { AuthManager } from './auth/authManager';
import { createLogger } from './utils/logger';
import { TaigaApiClient } from './api/taigaApiClient';
import { ProjectService } from './services/projectService';
import { UserStoryService } from './services/userStoryService';
import { IssueService } from './services/issueService';
import { ProjectTreeProvider } from './tree/projectTree';
import { UserStoriesTreeProvider } from './tree/userStoriesTree';
import { IssuesTreeProvider } from './tree/issuesTree';
import { registerCommands } from './commands/registerCommands';
import { showDiagnostics } from './diagnostics/diagnostics';
import { NormalizedError } from './models/types';

let activeProject: any | undefined;
let activeInstanceName: string | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const configMgr = new ConfigurationManager();
  const currentCfg = configMgr.getEffective();
  activeInstanceName = currentCfg.activeInstanceName || currentCfg.instances[0]?.name;
  const logger = createLogger('Taiga', () => configMgr.getEffective().verbose);
  const authMgr = new AuthManager(context);

  function getActiveInstance() {
    const cfg = configMgr.getEffective();
    return cfg.instances.find(i => i.name === activeInstanceName);
  }

  let api = new TaigaApiClient(getActiveInstance()?.baseUrl || '', async () => {
    const inst = getActiveInstance();
    if (!inst) return undefined;
    // Prefer token from settings if provided; otherwise SecretStorage
    if (inst.token) return inst.token;
    return authMgr.getToken(inst.tokenSecretId!);
  }, undefined, (m) => logger.info(m));

  const projectService = new ProjectService(api);
  const userStoryService = new UserStoryService(api);
  const issueService = new IssueService(api);
  const projectTree = new ProjectTreeProvider(projectService);
  const storiesTree = new UserStoriesTreeProvider(userStoryService);
  const issuesTree = new IssuesTreeProvider(issueService);

  vscode.window.registerTreeDataProvider('taigaProjects', projectTree);
  vscode.window.registerTreeDataProvider('taigaUserStories', storiesTree);
  vscode.window.registerTreeDataProvider('taigaIssues', issuesTree);

  const commandCtx = {
  setActiveProject(project: any | undefined) { activeProject = project; storiesTree.setActiveProject(project?.id); issuesTree.setActiveProject(project?.id); },
    getActiveProject() { return activeProject; },
    showDiagnostics: () => showDiagnostics({
      activeInstance: getActiveInstance()?.name,
      activeProject,
      projectCount: projectTree.getProjectCount(),
      storyCount: storiesTree.getStoryCount()
    }),
    refreshAll: () => { projectTree.refresh(); storiesTree.refresh(); issuesTree.refresh(); },
    listInstances: () => configMgr.getEffective().instances,
    setActiveInstance: (name: string | undefined) => { activeInstanceName = name; commandCtx.refreshAll(); },
    setTokenForActiveInstance: async () => {
      const inst = getActiveInstance();
      if (!inst) { vscode.window.showWarningMessage('No active Taiga instance.'); return; }
      await authMgr.setToken(inst.tokenSecretId!);
      commandCtx.refreshAll();
    },
    connectWithCredentials: async () => {
      const inst = getActiveInstance();
      if (!inst) { vscode.window.showWarningMessage('No active Taiga instance.'); return; }
      const username = await vscode.window.showInputBox({ prompt: 'Taiga username or email', ignoreFocusOut: true });
      if (!username) return;
      const password = await vscode.window.showInputBox({ prompt: 'Taiga password', ignoreFocusOut: true, password: true });
      if (!password) return;
      // Build a minimal POST to /auth
      const authUrl = `${inst.baseUrl.replace(/\/$/, '')}/auth`;
      try {
        const resp = await (globalThis as any).fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ type: 'normal', username: username.trim(), password: password })
        });
        const text = await resp.text();
        let body: any = undefined; try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
        if (!resp.ok) {
          const err: NormalizedError = { category: resp.status === 401 ? 'auth' : 'server', httpStatus: resp.status, message: 'Authentication failed', details: body };
          vscode.window.showErrorMessage(`Taiga auth failed: ${err.message} (${resp.status})`);
          return;
        }
        const token = body?.auth_token || body?.token || body?.access_token;
        if (!token) {
          vscode.window.showErrorMessage('Taiga auth response did not include a token.');
          return;
        }
        await authMgr.setToken(inst.tokenSecretId!, token);
        vscode.window.showInformationMessage('Connected to Taiga.');
        commandCtx.refreshAll();
      } catch (e) {
        vscode.window.showErrorMessage(`Taiga auth error: ${(e as Error).message}`);
      }
    }
  };

  registerCommands(context, { projects: projectTree, userStories: storiesTree }, commandCtx);

  projectTree.load().then(()=>{
    if (activeProject) { storiesTree.load(); issuesTree.load(); }
  });

  logger.info('Taiga extension activated.');

  // React to settings changes
  configMgr.watch(context);
  configMgr.onDidChange(() => {
    const inst = getActiveInstance();
    // if active instance name changed or baseUrl changed, rebuild API client
    api = new TaigaApiClient(inst?.baseUrl || '', async () => {
      if (!inst) return undefined;
      if (inst.token) return inst.token;
      return authMgr.getToken(inst.tokenSecretId!);
    }, undefined, (m) => logger.info(m));
    // propagate active project if still set
    storiesTree.setActiveProject(activeProject?.id);
    issuesTree.setActiveProject(activeProject?.id);
    // refresh both trees
    projectTree.refresh();
    storiesTree.refresh();
    issuesTree.refresh();
  });
}

export function deactivate() {}
