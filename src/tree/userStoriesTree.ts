import * as vscode from 'vscode';
import { UserStory } from '../models/types';
import { UserStoryService } from '../services/userStoryService';

export class UserStoriesTreeProvider implements vscode.TreeDataProvider<UserStoryItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<UserStoryItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private stories: UserStory[] = [];
  private loading = false;
  private activeProjectId?: number;

  constructor(private userStoryService: UserStoryService) {}

  setActiveProject(id?: number) {
    this.activeProjectId = id;
    this.refresh();
  }

  refresh(): void { this.load(); }

  getStoryCount(): number { return this.stories.length; }
  getStories(): UserStory[] { return this.stories; }

  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    try {
      if (this.activeProjectId) {
        this.stories = await this.userStoryService.listUserStories(this.activeProjectId);
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
    if (!this.activeProjectId) {
      return Promise.resolve([new UserStoryItem('Select a project to view stories')]);
    }
    if (!this.stories.length) {
      return Promise.resolve([new UserStoryItem('No user stories')]);
    }
    return Promise.resolve(this.stories.map(s => new UserStoryItem(`${s.ref ? s.ref + ' ' : ''}${s.subject || 'User Story'}`, s)));
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
  }
}
