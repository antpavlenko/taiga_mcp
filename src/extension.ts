import * as vscode from 'vscode';
import { ConfigurationManager } from './config/configurationManager';
import { AuthManager } from './auth/authManager';
import { createLogger } from './utils/logger';
import { TaigaApiClient } from './api/taigaApiClient';
import { ProjectService } from './services/projectService';
import { UserStoryService } from './services/userStoryService';
import { IssueService } from './services/issueService';
// ProjectTree replaced by Controls view combobox
import { UserStoriesTreeProvider } from './tree/userStoriesTree';
import { IssuesTreeProvider } from './tree/issuesTree';
import { EpicsTreeProvider } from './tree/epicsTree';
import { SprintsTreeProvider } from './tree/sprintsTree';
import { EpicService } from './services/epicService';
import { SprintService } from './services/sprintService';
import { TaskService } from './services/taskService';
import { UserService } from './services/userService';
import { ControlsViewProvider } from './views/controlsView';
import { registerCommands } from './commands/registerCommands';
import { showDiagnostics } from './diagnostics/diagnostics';
import { NormalizedError } from './models/types';
import { EpicEditor } from './editors/epicEditor';
import { StoryEditor } from './editors/storyEditor';
import { SprintEditor } from './editors/sprintEditor';

let activeProject: any | undefined;
// filters persisted via providers/memento in future

export async function activate(context: vscode.ExtensionContext) {
  const configMgr = new ConfigurationManager();
  const currentCfg = configMgr.getEffective();
  const logger = createLogger('Taiga', () => configMgr.getEffective().verbose);
  const authMgr = new AuthManager(context);

  async function getToken(): Promise<string | undefined> {
    const token = await authMgr.getToken(currentCfg.tokenSecretId);
    return token;
  }

  let api = new TaigaApiClient(currentCfg.baseUrl || '', getToken, undefined, (m) => logger.info(m));

  const projectService = new ProjectService(api);
  const userStoryService = new UserStoryService(api);
  const issueService = new IssueService(api);
  const epicService = new EpicService(api);
  const sprintService = new SprintService(api);
  const storiesTree = new UserStoriesTreeProvider(userStoryService);
  const issuesTree = new IssuesTreeProvider(issueService);
  const epicsTree = new EpicsTreeProvider(epicService);
  const sprintsTree = new SprintsTreeProvider(sprintService);
  const taskService = new TaskService(api);
  const userService = new UserService(api);

  // Register trees
  vscode.window.registerTreeDataProvider('taigaEpics', epicsTree);
  vscode.window.registerTreeDataProvider('taigaSprints', sprintsTree);
  // Use a TreeView for User Stories so we can implement double-click behavior
  const storiesTreeView = vscode.window.createTreeView('taigaUserStories', { treeDataProvider: storiesTree });
  context.subscriptions.push(storiesTreeView);
  vscode.window.registerTreeDataProvider('taigaIssues', issuesTree);
  // Register Controls webview
  const controlsProvider = new ControlsViewProvider(projectService, {
    getActiveProject() { return activeProject; },
    async setActiveProjectById(id: number) {
      const projects = await projectService.listProjects();
      const p = projects.find(x => x.id === id);
      if (p) {
        // show loading immediately across views
        epicsTree.setActiveProject(p.id);
        sprintsTree.setActiveProject(p.id);
        storiesTree.setActiveProject(p.id);
        issuesTree.setActiveProject(p.id);
        commandCtx.setActiveProject(p as any);
      }
    },
    async connect() { await commandCtx.connectWithCredentials(); },
    getShowClosedIssues() { return issuesTree.getIncludeClosed(); },
    async setShowClosedIssues(v: boolean) {
      issuesTree.setIncludeClosed(v);
      await context.globalState.update('taiga.issues.includeClosed', v);
    }
  });
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(ControlsViewProvider.viewId, controlsProvider));

  async function updateConnectionState() {
    const cfg = configMgr.getEffective();
    const token = await authMgr.getToken(cfg.tokenSecretId);
    const baseUrlSet = !!cfg.baseUrl;
    const tokenPresent = !!token;
    epicsTree.setConnectionState({ baseUrlSet, tokenPresent });
    sprintsTree.setConnectionState({ baseUrlSet, tokenPresent });
    storiesTree.setConnectionState({ baseUrlSet, tokenPresent });
    issuesTree.setConnectionState({ baseUrlSet, tokenPresent });
  }

  const commandCtx = {
  setActiveProject(project: any | undefined) {
      activeProject = project;
      context.globalState.update('taiga.activeProject', project ? { id: project.id, name: project.name } : undefined);
      epicsTree.setActiveProject(project?.id);
      sprintsTree.setActiveProject(project?.id);
      storiesTree.setActiveProject(project?.id);
      issuesTree.setActiveProject(project?.id);
    },
    getActiveProject() { return activeProject; },
    showDiagnostics: () => showDiagnostics({
      activeInstance: currentCfg.baseUrl,
      activeProject,
      projectCount: 0,
      storyCount: storiesTree.getStoryCount()
    }),
  refreshAll: () => { epicsTree.refresh(); sprintsTree.refresh(); storiesTree.refresh(); issuesTree.refresh(); },
    setToken: async () => {
      await authMgr.setToken(currentCfg.tokenSecretId);
      commandCtx.refreshAll();
    },
    connectWithCredentials: async () => {
      const username = await vscode.window.showInputBox({ prompt: 'Taiga username or email', ignoreFocusOut: true });
      if (!username) return;
      const password = await vscode.window.showInputBox({ prompt: 'Taiga password', ignoreFocusOut: true, password: true });
      if (!password) return;
      // Build a minimal POST to /auth
      const authUrl = `${configMgr.getEffective().baseUrl.replace(/\/$/, '')}/auth`;
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
        await authMgr.setToken(configMgr.getEffective().tokenSecretId, token);
        vscode.window.showInformationMessage('Connected to Taiga.');
  await updateConnectionState();
        // After connect, prompt to select project
        const projects = await projectService.listProjects();
        const picked = await vscode.window.showQuickPick(projects.map(p => ({ label: p.name, description: String(p.id), p })), { placeHolder: 'Select Taiga project' });
        if (picked) {
          commandCtx.setActiveProject(picked.p);
        }
        commandCtx.refreshAll();
      } catch (e) {
        vscode.window.showErrorMessage(`Taiga auth error: ${(e as Error).message}`);
      }
    }
  };

  registerCommands(context, { userStories: storiesTree, epics: epicsTree, sprints: sprintsTree, issuesProvider: issuesTree }, commandCtx);

  // Implement double-click to open User Story editor using an internal command debounce
  (function setupUserStoryDoubleClickCommand() {
    let lastById = new Map<string, number>();
    context.subscriptions.push(vscode.commands.registerCommand('taiga._openUserStoryOnDoubleClick', (arg?: any) => {
      const story = arg?.story;
      if (!story) return;
      const id = String(story.id);
      const now = Date.now();
      const prev = lastById.get(id) || 0;
      if (now - prev < 350) {
        vscode.commands.executeCommand('taiga.editUserStory', { story });
        lastById.delete(id);
      } else {
        lastById.set(id, now);
        // Clear after timeout to avoid stale entries
        setTimeout(() => { if ((Date.now() - (lastById.get(id) || 0)) >= 350) lastById.delete(id); }, 400);
      }
    }));
  })();

  // Implement double-click to open Issue editor
  (function setupIssueDoubleClickCommand() {
    let lastById = new Map<string, number>();
    context.subscriptions.push(vscode.commands.registerCommand('taiga._openIssueOnDoubleClick', async (arg?: any) => {
      const issue = arg?.issue;
      if (!issue) return;
      const id = String(issue.id);
      const now = Date.now();
      const prev = lastById.get(id) || 0;
      if (now - prev < 350) {
        await vscode.commands.executeCommand('taiga.editIssue', { issue });
        lastById.delete(id);
      } else {
        lastById.set(id, now);
        setTimeout(() => { if ((Date.now() - (lastById.get(id) || 0)) >= 350) lastById.delete(id); }, 400);
      }
    }));
  })();

  // CRUD command implementations (lightweight editors)
  context.subscriptions.push(
    vscode.commands.registerCommand('taiga.createEpic', async () => {
      if (!activeProject) { vscode.window.showWarningMessage('Select a project first'); return; }
      const [users, statuses] = await Promise.all([
        (async () => { try { return await userService.listProjectUsers(activeProject.id); } catch { return []; } })(),
        (async () => { try { return await epicService.listEpicStatuses(activeProject.id); } catch { return []; } })(),
      ]);
      const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
      let projectSlug: string | undefined = undefined;
      try {
        const projects = await projectService.listProjects();
        projectSlug = projects.find(p => p.id === activeProject!.id)?.slug;
      } catch {}
      await EpicEditor.openForCreate(epicService, activeProject.id, users, statuses, siteBaseUrl, projectSlug);
    }),
    // Internal helpers to open Task editors from other parts (e.g., webview-backed editors)
    vscode.commands.registerCommand('taiga._openTaskEditorCreate', async (args?: any) => {
      try {
        if (!args) return;
        const projectId = Number(args.projectId);
        const storyId = Number(args.storyId);
        if (!projectId || !storyId) return;
        const { TaskEditor } = await import('./editors/taskEditor');
        await TaskEditor.openForCreate(taskService, projectId, storyId, args.siteBaseUrl, args.projectSlug);
      } catch {}
    }),
    vscode.commands.registerCommand('taiga._openTaskEditorEdit', async (args?: any) => {
      try {
        if (!args) return;
        const taskId = Number(args.taskId);
        if (!taskId) return;
        const full = await taskService.getTask(taskId);
        if (!full) return;
        const { TaskEditor } = await import('./editors/taskEditor');
        await TaskEditor.openForEdit(taskService, full as any, args.siteBaseUrl, args.projectSlug);
      } catch {}
    }),
    vscode.commands.registerCommand('taiga.editEpic', async (node?: any) => {
      const epic = node?.epic; if (!epic) return;
      // Fetch full epic details to ensure description and other fields are present
      const fullEpic = await (async () => { try { return await epicService.getEpic(epic.id) || epic; } catch { return epic; } })();
      const projectId = (fullEpic as any).projectId || (fullEpic as any).project || activeProject?.id;
      const [users, statuses] = await Promise.all([
        (async () => { try { return projectId ? await userService.listProjectUsers(projectId) : []; } catch { return []; } })(),
        (async () => { try { return projectId ? await epicService.listEpicStatuses(projectId) : []; } catch { return []; } })(),
      ]);
      const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
      let projectSlug: string | undefined = undefined;
      try {
        const projects = await projectService.listProjects();
        projectSlug = projectId ? projects.find(p => p.id === projectId)?.slug : undefined;
      } catch {}
      await EpicEditor.openForEdit(epicService, fullEpic, users, statuses, userStoryService, siteBaseUrl, projectSlug);
    }),
    vscode.commands.registerCommand('taiga.deleteEpic', async (node?: any) => {
      const epic = node?.epic; if (!epic) return;
      const label = (epic as any).title || (epic as any).subject || (epic as any).name || `Epic ${epic.id}`;
      const ok = await vscode.window.showWarningMessage(`Delete epic "${label}"?`, { modal: true }, 'Delete');
      if (ok === 'Delete') { if (await epicService.deleteEpic(epic.id)) { vscode.window.showInformationMessage('Epic deleted'); epicsTree.refresh(); } }
    }),
      vscode.commands.registerCommand('taiga.addStoriesToEpic', async (node?: any) => {
        const epic = node?.epic; if (!epic) return;
        if (!activeProject) { vscode.window.showWarningMessage('Select a project first'); return; }
        await storiesTree.load();
        const all = storiesTree.getStories();
        const picks = await vscode.window.showQuickPick(all.map(s => ({ label: s.subject, description: String(s.ref ?? s.id), s })), { canPickMany: true, placeHolder: 'Select stories to add to epic' });
        if (!picks || !picks.length) return;
        // Link using nested relation endpoint to support many-to-many
        for (const p of picks) { await userStoryService.addUserStoryToEpic(epic.id, p.s.id); }
        vscode.window.showInformationMessage(`Added ${picks.length} stories to epic`);
        storiesTree.refresh();
      }),

    vscode.commands.registerCommand('taiga.createSprint', async () => {
      if (!activeProject) { vscode.window.showWarningMessage('Select a project first'); return; }
      await SprintEditor.openForCreate(sprintService, activeProject.id);
    }),
    vscode.commands.registerCommand('taiga.editSprint', async (node?: any) => {
      const sprint = node?.sprint; if (!sprint) return;
      const full = await (async () => { try { return await sprintService.getSprint(sprint.id) || sprint; } catch { return sprint; } })();
      await SprintEditor.openForEdit(sprintService, full);
    }),
    vscode.commands.registerCommand('taiga.deleteSprint', async (node?: any) => {
      const sprint = node?.sprint; if (!sprint) return;
      const ok = await vscode.window.showWarningMessage(`Delete sprint "${sprint.name}"?`, { modal: true }, 'Delete');
      if (ok === 'Delete') { if (await sprintService.deleteSprint(sprint.id)) { vscode.window.showInformationMessage('Sprint deleted'); sprintsTree.refresh(); } }
    }),

    vscode.commands.registerCommand('taiga.createUserStory', async () => {
      if (!activeProject) { vscode.window.showWarningMessage('Select a project first'); return; }
      const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
      let projectSlug: string | undefined = undefined;
      try {
        const projects = await projectService.listProjects();
        projectSlug = projects.find(p => p.id === activeProject!.id)?.slug;
      } catch {}
      await StoryEditor.openForCreate(userStoryService, epicService, sprintService, activeProject.id, undefined, siteBaseUrl, projectSlug);
    }),
    vscode.commands.registerCommand('taiga.createUserStoryForEpic', async (node?: any) => {
      const epic = node?.epic; if (!epic || !activeProject) return;
      const subject = await vscode.window.showInputBox({ prompt: `New story subject (epic: ${epic.title})` }); if (!subject) return;
      const created = await userStoryService.createUserStory({ projectId: activeProject.id, subject, epicId: epic.id });
      if (created) { vscode.window.showInformationMessage('User Story created'); storiesTree.refresh(); }
    }),
    vscode.commands.registerCommand('taiga.editUserStory', async (node?: any) => {
      const story = node?.story; if (!story) return;
      const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
      // Resolve slug best-effort from active project or from list
      let projectSlug: string | undefined = undefined;
      try {
        const pidStr = String((story as any)?.projectId ?? (story as any)?.project ?? activeProject?.id ?? '');
        const pid = Number(pidStr);
        const projects = await projectService.listProjects();
        projectSlug = !isNaN(pid) ? projects.find(p => p.id === pid)?.slug : undefined;
      } catch {}
      await StoryEditor.openForEdit(userStoryService, epicService, sprintService, story, siteBaseUrl, projectSlug);
    }),
    vscode.commands.registerCommand('taiga.manageStoryTasks', async (node?: any) => {
      const story = node?.story; if (!story) return;
      const tasks = await taskService.listTasksByUserStory(story.id);
      const picked = await vscode.window.showQuickPick(tasks.map(t => ({ label: t.subject, description: String(t.id), t })), { placeHolder: 'Tasks (pick to edit in editor or Esc to close)' });
      if (picked) {
        try {
          const { TaskEditor } = await import('./editors/taskEditor');
          const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
          // Resolve slug best-effort
          let projectSlug: string | undefined = undefined;
          try {
            const pidStr = String((story as any)?.projectId ?? (story as any)?.project ?? activeProject?.id ?? '');
            const pid = Number(pidStr);
            const projects = await projectService.listProjects();
            projectSlug = !isNaN(pid) ? projects.find(p => p.id === pid)?.slug : undefined;
          } catch {}
          await TaskEditor.openForEdit(taskService, picked.t as any, siteBaseUrl, projectSlug);
        } catch {}
      }
    }),
    vscode.commands.registerCommand('taiga.createTaskForStory', async (node?: any) => {
      const story = node?.story; if (!story || !activeProject) return;
      try {
        const { TaskEditor } = await import('./editors/taskEditor');
        const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
        let projectSlug: string | undefined = undefined;
        try {
          const projects = await projectService.listProjects();
          projectSlug = projects.find(p => p.id === activeProject!.id)?.slug;
        } catch {}
        await TaskEditor.openForCreate(taskService, activeProject.id, story.id, siteBaseUrl, projectSlug);
      } catch {}
    }),
    vscode.commands.registerCommand('taiga.deleteUserStory', async (node?: any) => {
      const story = node?.story; if (!story) return;
      const ok = await vscode.window.showWarningMessage(`Delete user story "${story.subject}"?`, { modal: true }, 'Delete');
      if (ok === 'Delete') { if (await userStoryService.deleteUserStory(story.id)) { vscode.window.showInformationMessage('User Story deleted'); storiesTree.refresh(); } }
    }),

    vscode.commands.registerCommand('taiga.createIssue', async () => {
      if (!activeProject) { vscode.window.showWarningMessage('Select a project first'); return; }
      const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
      let projectSlug: string | undefined = undefined;
      try { const projects = await projectService.listProjects(); projectSlug = projects.find(p => p.id === activeProject!.id)?.slug; } catch {}
      const { IssueEditor } = await import('./editors/issueEditor');
      await IssueEditor.openForCreate(issueService, activeProject.id, siteBaseUrl, projectSlug);
    }),
    vscode.commands.registerCommand('taiga.editIssue', async (node?: any) => {
      const issue = node?.issue; if (!issue) return;
      const siteBaseUrl = (configMgr.getEffective().baseUrl || '').replace(/\/(api)(\/v\d+)?$/, '');
      // Resolve slug
      let projectSlug: string | undefined = undefined;
      try { const pid = (issue as any).projectId ?? (issue as any).project ?? activeProject?.id; const projects = await projectService.listProjects(); projectSlug = projects.find(p => String(p.id) === String(pid))?.slug; } catch {}
      const full = await (async () => { try { return await (issueService as any).getIssue?.(issue.id) || issue; } catch { return issue; } })();
      const { IssueEditor } = await import('./editors/issueEditor');
      await IssueEditor.openForEdit(issueService, full as any, siteBaseUrl, projectSlug);
    }),
    vscode.commands.registerCommand('taiga.deleteIssue', async (node?: any) => {
      const issue = node?.issue; if (!issue) return;
      const ok = await vscode.window.showWarningMessage(`Delete issue "${issue.subject}"?`, { modal: true }, 'Delete');
      if (ok === 'Delete') { if (await issueService.deleteIssue(issue.id)) { vscode.window.showInformationMessage('Issue deleted'); issuesTree.refresh(); } }
    })
  );

  // Restore selected project
  const saved = context.globalState.get<{ id: number; name: string }>('taiga.activeProject');
  if (saved) {
    activeProject = saved;
    epicsTree.setActiveProject(saved.id);
    sprintsTree.setActiveProject(saved.id);
    storiesTree.setActiveProject(saved.id);
    issuesTree.setActiveProject(saved.id);
  }
  const showClosed = context.globalState.get<boolean>('taiga.issues.includeClosed');
  if (typeof showClosed === 'boolean') issuesTree.setIncludeClosed(showClosed);

  updateConnectionState();
  if (activeProject) { epicsTree.load(); sprintsTree.load(); storiesTree.load(); issuesTree.load(); }

  logger.info('Taiga extension activated.');

  // React to settings changes
  configMgr.watch(context);
  configMgr.onDidChange(async () => {
    const cfg = configMgr.getEffective();
    // rebuild API client if baseUrl changed
    api = new TaigaApiClient(cfg.baseUrl || '', getToken, undefined, (m) => logger.info(m));
    await updateConnectionState();
    // propagate active project if still set
    epicsTree.setActiveProject(activeProject?.id);
    sprintsTree.setActiveProject(activeProject?.id);
    storiesTree.setActiveProject(activeProject?.id);
    issuesTree.setActiveProject(activeProject?.id);
    // refresh views
    epicsTree.refresh();
    sprintsTree.refresh();
    storiesTree.refresh();
    issuesTree.refresh();
  });

  // Persist toggle changes when command invoked
  vscode.commands.registerCommand('taiga.toggleShowClosedIssues', async () => {
    const next = !issuesTree.getIncludeClosed();
    issuesTree.setIncludeClosed(next);
    await context.globalState.update('taiga.issues.includeClosed', next);
  });
}

export function deactivate() {}
