import * as vscode from 'vscode';
import { Epic } from '../models/types';
import { EpicService } from '../services/epicService';

export class EpicsTreeProvider implements vscode.TreeDataProvider<EpicItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<EpicItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private epics: Epic[] = [];
  private loading = false;
  private activeProjectId?: number;
  private baseUrlSet = false;
  private tokenPresent = false;
  private selectedEpicIds = new Set<number>();

  constructor(private epicService: EpicService) {}

  setActiveProject(id?: number) { this.activeProjectId = id; this.refresh(); }
  setConnectionState(opts: { baseUrlSet: boolean; tokenPresent: boolean }) { this.baseUrlSet = opts.baseUrlSet; this.tokenPresent = opts.tokenPresent; this._onDidChangeTreeData.fire(); }
  refresh(): void { this.load(); }
  getSelectedEpicIds(): number[] { return Array.from(this.selectedEpicIds); }
  setSelectedEpicIds(ids: number[]) { this.selectedEpicIds = new Set(ids); this._onDidChangeTreeData.fire(); }
  toggleEpicSelection(epicId: number) { if (this.selectedEpicIds.has(epicId)) this.selectedEpicIds.delete(epicId); else this.selectedEpicIds.add(epicId); this._onDidChangeTreeData.fire(); }

  async load(): Promise<void> {
    if (this.loading) return; this.loading = true; this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId) this.epics = await this.epicService.listEpics(this.activeProjectId);
      else this.epics = [];
    } finally { this.loading = false; this._onDidChangeTreeData.fire(); }
  }

  getTreeItem(element: EpicItem): vscode.TreeItem { return element; }
  getChildren(element?: EpicItem): Promise<EpicItem[]> {
    if (element) return Promise.resolve([]);
    if (this.loading) return Promise.resolve([new EpicItem('Loading...')]);
    if (!this.baseUrlSet) { const i = new EpicItem('Set Taiga URL in Settings'); (i as any).command = { command: 'workbench.action.openSettings', title: 'Open Settings', arguments: ['taiga.baseUrl'] }; return Promise.resolve([i]); }
    if (!this.tokenPresent) { const i = new EpicItem('Connect to Taiga…'); (i as any).command = { command: 'taiga.connect', title: 'Connect' }; return Promise.resolve([i]); }
    if (!this.activeProjectId) return Promise.resolve([new EpicItem('Select a project to view epics')]);
    if (!this.epics.length) return Promise.resolve([new EpicItem('No epics')]);
    // Sort: open first (not closed), closed last based on status flags/names
    const getClosed = (e: any) => {
      const st = e?.status || e?.statusId;
      const isClosed = typeof st === 'object' ? (st.is_closed || st.isClosed || false) : false;
      const slug = (typeof st === 'object' ? (st.slug || '') : '').toString().toLowerCase();
      const name = (typeof st === 'object' ? (st.name || '') : '').toString().toLowerCase();
      const closedByText = slug.includes('closed') || name.includes('closed') || slug.includes('done') || name.includes('done') || slug.includes('finished') || name.includes('finished');
      return Boolean(isClosed || closedByText || e?.is_closed || e?.closed || e?.blocked === true);
    };
    const sorted = this.epics.slice().sort((a: any, b: any) => {
      const ca = getClosed(a) ? 1 : 0;
      const cb = getClosed(b) ? 1 : 0;
      if (ca !== cb) return ca - cb;
      return String((a.title || a.subject || '')).localeCompare(String((b.title || b.subject || '')));
    });
    return Promise.resolve(sorted.map(e => {
      const label = (e as any).title || (e as any).subject || (e as any).name || `Epic ${e.id}`;
      return new EpicItem(label, e, this.selectedEpicIds.has(e.id));
    }));
  }
}

export class EpicItem extends vscode.TreeItem {
  epic?: Epic;
  constructor(label: string, epic?: Epic, selected?: boolean) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.epic = epic;
    if (!epic) { (this as any).contextValue = 'info'; return; }
    (this as any).id = String(epic.id);
    (this as any).tooltip = (epic as any).description || label;
    (this as any).contextValue = 'epic';
    // Visual selection hint
    this.description = selected ? '✓' : '';
    // Colored icon via data URI SVG if color present
    const color = (epic as any).color || (epic as any).hexColor || (epic as any).hex_color || undefined;
    if (color) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='6' fill='${color}' stroke='${color}'/></svg>`;
      this.iconPath = vscode.Uri.parse(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    }
    (this as any).command = { command: 'taiga.toggleEpicFilter', title: 'Toggle Epic Filter', arguments: [epic] };
    // Closed styling hint
    const st: any = (epic as any).status || (epic as any).statusId;
    const isClosed = (typeof st === 'object' ? (st.is_closed || st.isClosed || false) : false)
      || (typeof st === 'object' ? ((st.slug || '').toString().toLowerCase().includes('closed') || (st.name || '').toString().toLowerCase().includes('closed') || (st.slug || '').toString().toLowerCase().includes('done') || (st.name || '').toString().toLowerCase().includes('done')) : false)
      || ((epic as any).is_closed || (epic as any).closed);
    if (isClosed) {
      // override icon to indicate closed
      this.iconPath = new vscode.ThemeIcon('circle-slash');
      if (!this.description) this.description = 'closed'; else this.description += ' • closed';
      this.resourceUri = vscode.Uri.parse('taiga://epic/closed/' + epic.id);
    }
  }
}
