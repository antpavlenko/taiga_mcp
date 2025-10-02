import * as vscode from 'vscode';
import { Issue } from '../models/types';
import { IssueService } from '../services/issueService';

export class IssuesTreeProvider implements vscode.TreeDataProvider<IssueItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<IssueItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private issues: Issue[] = [];
  private loading = false;
  private activeProjectId?: number;
  private baseUrlSet = false;
  private tokenPresent = false;
  private includeClosed = false;
  private selectedEpicIds: number[] = [];
  private selectedSprintId: number | null | undefined = undefined; // undefined=no filter, null=Backlog, number=sprint

  constructor(private issueService: IssueService) {}

  setActiveProject(id?: number) {
    this.activeProjectId = id;
    this.refresh();
  }

  setIncludeClosed(v: boolean) { this.includeClosed = v; this.refresh(); }
  getIncludeClosed(): boolean { return this.includeClosed; }
  setEpicFilter(ids: number[]) { this.selectedEpicIds = ids; /* requirement: epic filter must not be applied to issues */ this.refresh(); }
  getEpicFilter(): number[] { return this.selectedEpicIds; }
  setSprintFilter(id: number | null | undefined) { this.selectedSprintId = id; this.refresh(); }

  refresh(): void { this.load(); }
  setConnectionState(opts: { baseUrlSet: boolean; tokenPresent: boolean }) {
    this.baseUrlSet = opts.baseUrlSet;
    this.tokenPresent = opts.tokenPresent;
    this._onDidChangeTreeData.fire();
  }

  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId) {
        this.issues = await this.issueService.listIssues(this.activeProjectId, this.includeClosed, this.selectedSprintId);
        // Requirement: do not apply epic filter to issues
      } else {
        this.issues = [];
      }
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }

  getTreeItem(element: IssueItem): vscode.TreeItem { return element; }

  getChildren(element?: IssueItem): Promise<IssueItem[]> {
    if (element) return Promise.resolve([]);
    if (this.loading) return Promise.resolve([new IssueItem('Loading...')]);
    if (!this.baseUrlSet) {
      const item = new IssueItem('Set Taiga URL in Settings');
      (item as any).command = { command: 'workbench.action.openSettings', title: 'Open Settings', arguments: ['taiga.baseUrl'] };
      return Promise.resolve([item]);
    }
    if (!this.tokenPresent) {
      const item = new IssueItem('Connect to Taiga…');
      (item as any).command = { command: 'taiga.connect', title: 'Connect' };
      return Promise.resolve([item]);
    }
    if (!this.activeProjectId) return Promise.resolve([new IssueItem('Select a project to view issues')]);
    const rows: IssueItem[] = [];
    if (!this.issues.length) rows.push(new IssueItem('No issues'));
    else {
      // Sort open first, closed last if status object hints closure
      const getClosed = (i: any) => {
        const st = i?.status || i?.statusId;
        const isClosed = typeof st === 'object' ? (st.is_closed || st.isClosed || false) : false;
        const slug = (typeof st === 'object' ? (st.slug || '') : '').toString().toLowerCase();
        const name = (typeof st === 'object' ? (st.name || '') : '').toString().toLowerCase();
        const closedByText = slug.includes('closed') || name.includes('closed') || slug.includes('done') || name.includes('done') || slug.includes('finished') || name.includes('finished') || slug.includes('resolved') || name.includes('resolved');
        return Boolean(isClosed || closedByText || i?.is_closed || i?.closed);
      };
      const sorted = this.issues.slice().sort((a: any, b: any) => {
        const ca = getClosed(a) ? 1 : 0;
        const cb = getClosed(b) ? 1 : 0;
        if (ca !== cb) return ca - cb;
        const ra = Number((a as any).ref ?? a.id ?? 0);
        const rb = Number((b as any).ref ?? b.id ?? 0);
        return (ra || 0) - (rb || 0);
      });
      rows.push(...sorted.map(i => new IssueItem(i)));
    }
    return Promise.resolve(rows);
  }
}

export class IssueItem extends vscode.TreeItem {
  issue?: Issue;
  constructor(issueOrLabel: Issue | string, maybeIssue?: Issue) {
    const issue = (typeof issueOrLabel === 'string') ? maybeIssue : (issueOrLabel as Issue);
    const label = (typeof issueOrLabel === 'string') ? issueOrLabel : (`[${(issue as any)?.ref ?? issue?.id}] ${issue?.subject || 'Issue'}`);
    super(label, vscode.TreeItemCollapsibleState.None);
    this.issue = issue;
    if (!issue) { (this as any).contextValue = 'info'; return; }
    (this as any).id = String(issue.id);
    (this as any).tooltip = issue.subject || String(issue.id);
    (this as any).contextValue = 'issue';
    // Closed hint styling similar to stories
    const st: any = (issue as any).status || (issue as any).statusId;
    const isClosed = (typeof st === 'object' ? (st.is_closed || st.isClosed || false) : false)
      || (typeof st === 'object' ? ((st.slug || '').toString().toLowerCase().includes('closed') || (st.name || '').toString().toLowerCase().includes('closed') || (st.slug || '').toString().toLowerCase().includes('done') || (st.name || '').toString().toLowerCase().includes('done') || (st.slug || '').toString().toLowerCase().includes('resolved') || (st.name || '').toString().toLowerCase().includes('resolved')) : false)
      || ((issue as any).is_closed || (issue as any).closed);
    if (isClosed) {
      this.description = 'closed';
      this.iconPath = new vscode.ThemeIcon('circle-slash');
      this.resourceUri = vscode.Uri.parse('taiga://issue/closed/' + issue.id);
    }
    // Double-click open behavior: same debounce approach as user stories, reuse dedicated command
    (this as any).command = { command: 'taiga._openIssueOnDoubleClick', title: 'Open Issue', arguments: [{ issue }] };
  }
}
