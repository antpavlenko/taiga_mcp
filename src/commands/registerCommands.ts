import * as vscode from 'vscode';
import { Project } from '../models/types';
import { UserStoriesTreeProvider } from '../tree/userStoriesTree';
import { EpicsTreeProvider } from '../tree/epicsTree';
import { SprintsTreeProvider } from '../tree/sprintsTree';
import { Epic } from '../models/types';

export interface CommandContext {
  setActiveProject(project: Project | undefined): void;
  getActiveProject(): Project | undefined;
  showDiagnostics(): void;
  refreshAll(): void;
  setToken(): Promise<void>;
  connectWithCredentials(): Promise<void>;
}

export function registerCommands(ctx: vscode.ExtensionContext, providers: { userStories: UserStoriesTreeProvider; epics?: EpicsTreeProvider; sprints?: SprintsTreeProvider; issuesProvider?: { setIncludeClosed(v:boolean):void; getIncludeClosed():boolean; refresh():void; setEpicFilter?(ids:number[]):void; setSprintFilter?(id:number|null|undefined):void } }, commandCtx: CommandContext) {
  const disposables: vscode.Disposable[] = [];

  disposables.push(
    vscode.commands.registerCommand('taiga.refreshAll', () => commandCtx.refreshAll()),
    vscode.commands.registerCommand('taiga.selectProject', (project: Project) => {
      commandCtx.setActiveProject(project);
      commandCtx.refreshAll();
    }),
    vscode.commands.registerCommand('taiga.showDiagnostics', () => commandCtx.showDiagnostics()),
    vscode.commands.registerCommand('taiga.setToken', async () => { await commandCtx.setToken(); }),
    vscode.commands.registerCommand('taiga.connect', async () => { await commandCtx.connectWithCredentials(); }),

    // Filters
    vscode.commands.registerCommand('taiga.toggleEpicFilter', (epic: Epic) => {
      if (!providers.epics) return;
      providers.epics.toggleEpicSelection(epic.id);
      const ids = providers.epics.getSelectedEpicIds();
      providers.userStories.setEpicFilter(ids);
      if (providers.issuesProvider && typeof providers.issuesProvider.setEpicFilter === 'function') {
        providers.issuesProvider.setEpicFilter(ids);
      }
    }),
    vscode.commands.registerCommand('taiga.selectSprintFilter', (sprint?: { id?: number }) => {
      if (!providers.sprints) return;
      // Tri-state behavior: undefined => clear filter, null => backlog, number => specific sprint
      let next: number | null | undefined;
      const current = providers.sprints.getSelectedSprintId();
      if (sprint?.id == null) {
        // Clicked Backlog. If already backlog, clear filter; else set backlog
        next = current === null ? undefined : null;
      } else {
        // Clicked a sprint. Toggle: if same sprint -> clear; else set to that sprint
        next = current === sprint.id ? undefined : sprint.id;
      }
      providers.sprints.setSelectedSprintId(next);
      providers.userStories.setSprintFilter(next);
      if (providers.issuesProvider && typeof providers.issuesProvider.setSprintFilter === 'function') {
        providers.issuesProvider.setSprintFilter(next);
      }
    }),

    // Issues: toggle show closed handled in extension to persist state
  );

  disposables.forEach(d => ctx.subscriptions.push(d));
}
