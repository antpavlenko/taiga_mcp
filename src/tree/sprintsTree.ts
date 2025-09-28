import * as vscode from 'vscode';
import { Sprint } from '../models/types';
import { SprintService } from '../services/sprintService';

export class SprintsTreeProvider implements vscode.TreeDataProvider<SprintItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SprintItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private sprints: Sprint[] = [];
  private loading = false;
  private activeProjectId?: number;
  private baseUrlSet = false;
  private tokenPresent = false;
  private selectedSprintId: number | null | undefined = undefined; // undefined = no filter, null = Backlog

  constructor(private sprintService: SprintService) {}

  setActiveProject(id?: number) { this.activeProjectId = id; this.refresh(); }
  setConnectionState(opts: { baseUrlSet: boolean; tokenPresent: boolean }) { this.baseUrlSet = opts.baseUrlSet; this.tokenPresent = opts.tokenPresent; this._onDidChangeTreeData.fire(); }
  refresh(): void { this.load(); }
  getSelectedSprintId(): number | null | undefined { return this.selectedSprintId; }
  setSelectedSprintId(id: number | null | undefined) { this.selectedSprintId = id; this._onDidChangeTreeData.fire(); }

  async load(): Promise<void> {
    if (this.loading) return; this.loading = true; this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId) this.sprints = await this.sprintService.listSprints(this.activeProjectId);
      else this.sprints = [];
    } finally { this.loading = false; this._onDidChangeTreeData.fire(); }
  }

  getTreeItem(element: SprintItem): vscode.TreeItem { return element; }
  getChildren(element?: SprintItem): Promise<SprintItem[]> {
    if (element) return Promise.resolve([]);
    if (this.loading) return Promise.resolve([new SprintItem('Loading...')]);
    if (!this.baseUrlSet) { const i = new SprintItem('Set Taiga URL in Settings'); (i as any).command = { command: 'workbench.action.openSettings', title: 'Open Settings', arguments: ['taiga.baseUrl'] }; return Promise.resolve([i]); }
    if (!this.tokenPresent) { const i = new SprintItem('Connect to Taiga…'); (i as any).command = { command: 'taiga.connect', title: 'Connect' }; return Promise.resolve([i]); }
    if (!this.activeProjectId) return Promise.resolve([new SprintItem('Select a project to view sprints')]);
    const items: SprintItem[] = [];
    // Backlog pseudo-item
    items.push(new SprintItem('Backlog', undefined, this.selectedSprintId === null, true));
    // Sort sprints: open first, closed last (detect via closed flag or end date in the past with closed status best-effort)
    const sorted = this.sprints.slice().sort((a: any, b: any) => {
      const ca = (a?.closed || a?.is_closed) ? 1 : 0;
      const cb = (b?.closed || b?.is_closed) ? 1 : 0;
      if (ca !== cb) return ca - cb;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    for (const s of sorted) items.push(new SprintItem(s.name || `Sprint ${s.id}`, s, this.selectedSprintId === s.id));
    return Promise.resolve(items);
  }
}

export class SprintItem extends vscode.TreeItem {
  sprint?: Sprint;
  constructor(label: string, sprint?: Sprint, selected?: boolean, isBacklog?: boolean) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.sprint = sprint;
    if (!sprint && !isBacklog) { (this as any).contextValue = 'info'; return; }
    (this as any).id = sprint ? String(sprint.id) : 'backlog';
    (this as any).contextValue = sprint ? 'sprint' : 'backlog';
    this.description = selected ? '●' : '';
    ;(this as any).command = { command: 'taiga.selectSprintFilter', title: 'Select Sprint', arguments: [sprint] };
    // Closed styling hint
    if (sprint && ((sprint as any).closed || (sprint as any).is_closed)) {
      this.iconPath = new vscode.ThemeIcon('circle-slash');
      if (!this.description) this.description = 'closed'; else this.description += ' • closed';
      this.resourceUri = vscode.Uri.parse('taiga://sprint/closed/' + sprint.id);
    }
  }
}
