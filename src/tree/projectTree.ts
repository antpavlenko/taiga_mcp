import * as vscode from 'vscode';
import { Project } from '../models/types';
import { ProjectService } from '../services/projectService';

export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ProjectItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private projects: Project[] = [];
  private loading = false;
  private baseUrlSet = false;
  private tokenPresent = false;

  constructor(private projectService: ProjectService) {}

  refresh(): void { this.load(); }

  getProjectCount(): number { return this.projects.length; }
  getProjects(): Project[] { return this.projects; }

  setConnectionState(opts: { baseUrlSet: boolean; tokenPresent: boolean }) {
    this.baseUrlSet = opts.baseUrlSet;
    this.tokenPresent = opts.tokenPresent;
    this._onDidChangeTreeData.fire();
  }

  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    try {
      this.projects = await this.projectService.listProjects();
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }

  getTreeItem(element: ProjectItem): vscode.TreeItem { return element; }

  getChildren(element?: ProjectItem): Promise<ProjectItem[]> {
    if (element) return Promise.resolve([]);
    if (this.loading && this.projects.length === 0) {
      return Promise.resolve([new ProjectItem('Loading...')]);
    }
    if (!this.baseUrlSet) {
      const item = new ProjectItem('Set Taiga URL in Settings');
      (item as any).command = { command: 'workbench.action.openSettings', title: 'Open Settings', arguments: ['taiga.baseUrl'] };
      return Promise.resolve([item]);
    }
    if (!this.tokenPresent) {
      const item = new ProjectItem('Connect to Taiga…');
      (item as any).command = { command: 'taiga.connect', title: 'Connect' };
      return Promise.resolve([item]);
    }
    if (!this.projects.length) return Promise.resolve([new ProjectItem('No projects found')]);
    return Promise.resolve(this.projects.map(p => new ProjectItem(p.name || `Project ${p.id}`, p)));
  }
}

export class ProjectItem extends vscode.TreeItem {
  project?: Project;
  constructor(label: string, project?: Project) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.project = project;
    if (!project) { (this as any).contextValue = 'info'; return; }
    (this as any).id = String(project.id);
    (this as any).tooltip = project.description || project.name || String(project.id);
    (this as any).contextValue = 'project';
    (this as any).command = { command: 'taiga.selectProject', title: 'Select Project', arguments: [project] };
  }
}
