import * as vscode from 'vscode';
import { UserStory } from '../models/types';
import { UserStoryService } from '../services/userStoryService';

export class UserStoriesTreeProvider implements vscode.TreeDataProvider<UserStoryItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<UserStoryItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private stories: UserStory[] = [];
  private loading = false;
  private activeProjectId?: number;
  private selectedEpicIds: number[] = [];
  private selectedSprintId: number | null | undefined = undefined; // undefined = no sprint filter, null = backlog
  private baseUrlSet = false;
  private tokenPresent = false;

  constructor(private userStoryService: UserStoryService) {}

  setActiveProject(id?: number) {
    this.activeProjectId = id;
    this.refresh();
  }

  setEpicFilter(ids: number[]) { this.selectedEpicIds = ids; this.refresh(); }
  setSprintFilter(id: number | null | undefined) { this.selectedSprintId = id; this.refresh(); }

  refresh(): void { this.load(); }
  setConnectionState(opts: { baseUrlSet: boolean; tokenPresent: boolean }) {
    this.baseUrlSet = opts.baseUrlSet;
    this.tokenPresent = opts.tokenPresent;
    this._onDidChangeTreeData.fire();
  }

  getStoryCount(): number { return this.stories.length; }
  getStories(): UserStory[] { return this.stories; }

  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId) {
        const milestoneId = this.selectedSprintId === undefined ? undefined : this.selectedSprintId;
        this.stories = await this.userStoryService.listUserStories(this.activeProjectId, { milestoneId });
            if (this.selectedEpicIds?.length) {
              // Support multiple shapes: s.epicId (number), s.epic (id or object), s.epics (array of ids or objects)
              const set = new Set(this.selectedEpicIds.map(x => String(x)));
              this.stories = this.stories.filter((s: any) => {
                const single = s?.epicId ?? s?.epic;
                const singleId = (single && typeof single === 'object') ? (single.id ?? single.pk ?? undefined) : single;
                if (singleId != null && set.has(String(singleId))) return true;
                const arr = Array.isArray(s?.epics) ? s.epics : [];
                return arr.some((e: any) => set.has(String((e && typeof e === 'object') ? (e.id ?? e.pk ?? e) : e)));
              });
        }
      } else {
        this.stories = [];
      }
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }

  getTreeItem(element: UserStoryItem): vscode.TreeItem { return element; }

  getChildren(element?: UserStoryItem): Promise<UserStoryItem[]> {
    if (element) return Promise.resolve([]);
    if (this.loading) {
      return Promise.resolve([new UserStoryItem('Loading...')]);
    }
    if (!this.baseUrlSet) {
      const item = new UserStoryItem('Set Taiga URL in Settings');
      (item as any).command = { command: 'workbench.action.openSettings', title: 'Open Settings', arguments: ['taiga.baseUrl'] };
      return Promise.resolve([item]);
    }
    if (!this.tokenPresent) {
      const item = new UserStoryItem('Connect to Taiga…');
      (item as any).command = { command: 'taiga.connect', title: 'Connect' };
      return Promise.resolve([item]);
    }
    if (!this.activeProjectId) {
      return Promise.resolve([new UserStoryItem('Select a project to view stories')]);
    }
    if (!this.stories.length) {
      return Promise.resolve([new UserStoryItem('No user stories')]);
    }
    // Sort: open first, then closed last; within groups by ref/id ascending
    const getClosed = (s: any) => {
      const st = s?.status || s?.statusId;
      // If status has an is_closed flag, prefer it; otherwise try common closed indicators by slug/name
      const isClosed = typeof st === 'object' ? (st.is_closed || st.isClosed || false) : false;
      const slug = (typeof st === 'object' ? (st.slug || '') : '').toString().toLowerCase();
      const name = (typeof st === 'object' ? (st.name || '') : '').toString().toLowerCase();
      const closedByText = slug.includes('closed') || name.includes('closed') || slug.includes('done') || name.includes('done') || slug.includes('finished') || name.includes('finished');
      return Boolean(isClosed || closedByText || s?.is_closed || s?.closed);
    };
    const sorted = this.stories.slice().sort((a: any, b: any) => {
      const ca = getClosed(a) ? 1 : 0;
      const cb = getClosed(b) ? 1 : 0;
      if (ca !== cb) return ca - cb; // open (0) before closed (1)
      const ra = Number(a.ref ?? a.id ?? 0);
      const rb = Number(b.ref ?? b.id ?? 0);
      return (ra || 0) - (rb || 0);
    });
    return Promise.resolve(sorted.map(s => new UserStoryItem(`[${s.ref ?? s.id}] ${s.subject || 'User Story'}`, s)));
  }
}

export class UserStoryItem extends vscode.TreeItem {
  story?: UserStory;
  constructor(label: string, story?: UserStory) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.story = story;
    if (!story) { (this as any).contextValue = 'info'; return; }
    (this as any).id = String(story.id);
    (this as any).tooltip = story.subject || String(story.id);
    (this as any).contextValue = 'userStory';
    // Mark closed with strikethrough/grey via markdown-supported label
    const st: any = (story as any).status || (story as any).statusId;
    const isClosed = (typeof st === 'object' ? (st.is_closed || st.isClosed || false) : false)
      || (typeof st === 'object' ? ((st.slug || '').toString().toLowerCase().includes('closed') || (st.name || '').toString().toLowerCase().includes('closed') || (st.slug || '').toString().toLowerCase().includes('done') || (st.name || '').toString().toLowerCase().includes('done')) : false)
      || ((story as any).is_closed || (story as any).closed);
    if (isClosed) {
      // Use description to grey out and let label keep ref; VS Code does not support markdown strikethrough in TreeItem.label, but we can hint via description prefix
      this.description = 'closed';
      this.iconPath = new vscode.ThemeIcon('circle-slash');
      this.resourceUri = vscode.Uri.parse('taiga://userstory/closed/' + story.id);
    }
    // Use a command that the extension debounces to open only on double-click
    (this as any).command = { command: 'taiga._openUserStoryOnDoubleClick', title: 'Open User Story', arguments: [{ story }] };
  }
}
