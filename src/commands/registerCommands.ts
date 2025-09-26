import * as vscode from 'vscode';
import { Project, InstanceConfig } from '../models/types';
import { ProjectTreeProvider } from '../tree/projectTree';
import { UserStoriesTreeProvider } from '../tree/userStoriesTree';

export interface CommandContext {
  setActiveProject(project: Project | undefined): void;
  getActiveProject(): Project | undefined;
  showDiagnostics(): void;
  refreshAll(): void;
  listInstances(): InstanceConfig[];
  setActiveInstance(name: string | undefined): void;
  setTokenForActiveInstance(): Promise<void>;
  connectWithCredentials(): Promise<void>;
}

export function registerCommands(ctx: vscode.ExtensionContext, _providers: { projects: ProjectTreeProvider; userStories: UserStoriesTreeProvider }, commandCtx: CommandContext) {
  const disposables: vscode.Disposable[] = [];

  disposables.push(
    vscode.commands.registerCommand('taiga.refreshAll', () => commandCtx.refreshAll()),
    vscode.commands.registerCommand('taiga.selectProject', (project: Project) => {
      commandCtx.setActiveProject(project);
      commandCtx.refreshAll();
    }),
    vscode.commands.registerCommand('taiga.showDiagnostics', () => commandCtx.showDiagnostics()),
    vscode.commands.registerCommand('taiga.selectInstance', async () => {
      const items = commandCtx.listInstances().map(i => ({ label: i.name, description: i.baseUrl }));
      const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Select Taiga instance' });
      if (pick) { commandCtx.setActiveInstance(pick.label); commandCtx.refreshAll(); }
    }),
    vscode.commands.registerCommand('taiga.setToken', async () => { await commandCtx.setTokenForActiveInstance(); }),
    vscode.commands.registerCommand('taiga.connect', async () => { await commandCtx.connectWithCredentials(); })
  );

  disposables.forEach(d => ctx.subscriptions.push(d));
}
