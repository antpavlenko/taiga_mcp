import * as vscode from 'vscode';
import { ProjectService } from '../services/projectService';

export interface ControlsContext {
  getActiveProject(): { id: number; name: string } | undefined;
  setActiveProjectById(id: number): Promise<void>;
  connect(): Promise<void>;
  getShowClosedIssues(): boolean;
  setShowClosedIssues(v: boolean): Promise<void>;
}

export class ControlsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'taigaControls';
  private view?: vscode.WebviewView;

  constructor(private projectService: ProjectService, private ctx: ControlsContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'connect') {
        await this.ctx.connect();
        await this.render();
      } else if (msg.type === 'selectProject') {
        const id = Number(msg.id);
        await this.ctx.setActiveProjectById(id);
        await this.render();
      } else if (msg.type === 'toggleShowClosed') {
        await this.ctx.setShowClosedIssues(!!msg.value);
        await this.render();
      } else if (msg.type === 'refresh') {
        await this.render();
      }
    });
    return this.render();
  }

  async render() {
    const projects = await this.projectService.listProjects();
    const active = this.ctx.getActiveProject();
    const showClosed = this.ctx.getShowClosedIssues();
    const options = projects.map(p => `<option value="${p.id}" ${active?.id === p.id ? 'selected' : ''}>${escapeHtml(p.name || String(p.id))}</option>`).join('');
    const nonce = getNonce();
  const csp = `default-src 'none'; img-src vscode-resource: https: data:; style-src 'unsafe-inline' vscode-resource:; script-src 'nonce-${nonce}';`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body { font-family: var(--vscode-font-family); padding: 8px; background: var(--vscode-sideBar-background); color: var(--vscode-foreground); }
  .row { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
  .label { min-width: 70px; color: var(--vscode-foreground); }
  select, input[type="text"], textarea {
    width: 100%;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent);
    padding: 4px 6px;
    border-radius: 2px;
  }
  input[type="checkbox"] { accent-color: var(--vscode-focusBorder); }
  button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border, transparent); border-radius: 2px; padding: 6px 10px; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  #connect { width: 100%; text-align: center; }
  .label { min-width: 90px; }
  hr { border: none; border-top: 1px solid var(--vscode-panelSection-border); margin: 8px 0; }
  </style>
</head>
<body>
  <div class="row"><button id="connect">Connect…</button></div>
  <div class="row">
    <span class="label">Project</span>
    <select id="project">${options}</select>
  </div>
  <div class="row">
    <input type="checkbox" id="showClosed" ${showClosed ? 'checked' : ''} />
    <label for="showClosed">Show closed issues</label>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('connect').addEventListener('click', () => vscode.postMessage({ type: 'connect' }));
    document.getElementById('project').addEventListener('change', (e) => vscode.postMessage({ type: 'selectProject', id: e.target.value }));
    document.getElementById('showClosed').addEventListener('change', (e) => vscode.postMessage({ type: 'toggleShowClosed', value: e.target.checked }));
    // re-render occurs on actions; explicit refresh button removed to avoid duplication with view title actions
  </script>
</body>
</html>`;
    if (this.view) {
      this.view.webview.html = html;
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]+/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c] as string));
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
