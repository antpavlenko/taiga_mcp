import * as vscode from 'vscode';
import { Issue } from '../models/types';
import { IssueService } from '../services/issueService';

export class IssuesTreeProvider implements vscode.TreeDataProvider<IssueItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<IssueItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private issues: Issue[] = [];
  private loading = false;
  private activeProjectId?: number;

  constructor(private issueService: IssueService) {}

  setActiveProject(id?: number) {
    this.activeProjectId = id;
    this.refresh();
  }

  refresh(): void { this.load(); }

  async load(): Promise<void> {
    if (this.loading) return;
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

  getTreeItem(element: IssueItem): vscode.TreeItem { return element; }

  getChildren(element?: IssueItem): Promise<IssueItem[]> {
    if (element) return Promise.resolve([]);
    if (this.loading) return Promise.resolve([new IssueItem('Loading...')]);
    if (!this.activeProjectId) return Promise.resolve([new IssueItem('Select a project to view issues')]);
    if (!this.issues.length) return Promise.resolve([new IssueItem('No issues')]);
    return Promise.resolve(this.issues.map(i => new IssueItem(i.subject || `Issue ${i.id}`, i)));
  }
}

export class IssueItem extends vscode.TreeItem {
  issue?: Issue;
  constructor(label: string, issue?: Issue) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.issue = issue;
    if (!issue) { (this as any).contextValue = 'info'; return; }
    (this as any).id = String(issue.id);
    (this as any).tooltip = issue.subject || String(issue.id);
    (this as any).contextValue = 'issue';
  }
}
