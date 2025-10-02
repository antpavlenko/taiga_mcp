import * as vscode from 'vscode';
import { SprintService } from '../services/sprintService';
import { Sprint } from '../models/types';

export class SprintEditor {
  static async openForCreate(sprintService: SprintService, projectId: number) {
    const panel = vscode.window.createWebviewPanel('taigaSprintEditor', 'New Sprint', vscode.ViewColumn.Active, { enableScripts: true });
  const ext = vscode.extensions.getExtension('AntonPavlenko.taiga-mcp-extension') || vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
    if (ext) panel.iconPath = {
      light: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-light.svg'),
      dark: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-dark.svg'),
    };
  const nonce = getNonce();
  const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
  panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${csp}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class="loading">Loading…</div></body></html>`;
    panel.webview.html = renderHtml(csp, nonce, { mode: 'create' });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
        const { name, start, end } = msg.payload || {};
        const created = await sprintService.createSprint({ projectId, name, startDate: start || undefined, endDate: end || undefined });
        if (created) { vscode.window.showInformationMessage('Sprint created'); panel.dispose(); vscode.commands.executeCommand('taiga.refreshAll'); }
      }
      if (msg.type === 'cancel') panel.dispose();
    });
  }

  static async openForEdit(sprintService: SprintService, sprint: Sprint) {
    const panel = vscode.window.createWebviewPanel('taigaSprintEditor', `Edit Sprint: ${(sprint as any).name || sprint.id}`, vscode.ViewColumn.Active, { enableScripts: true });
  const ext = vscode.extensions.getExtension('AntonPavlenko.taiga-mcp-extension') || vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
    if (ext) panel.iconPath = {
      light: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-light.svg'),
      dark: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-dark.svg'),
    };
  // Show loading placeholder while fetching
  const nonceLoading = getNonce();
  const cspLoading = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonceLoading}';`;
  panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${cspLoading}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class="loading">Loading…</div></body></html>`;
  // Fetch full sprint to ensure fields like description (if any in custom) are present
    const full = await (async () => { try { return await sprintService.getSprint(sprint.id) || sprint; } catch { return sprint; } })();
    const nonce = getNonce();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    panel.webview.html = renderHtml(csp, nonce, { mode: 'edit', sprint: full });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
        const { name, start, end, closed } = msg.payload || {};
        const updated = await sprintService.updateSprint(sprint.id, {
          name: name ?? null,
          startDate: start ?? null,
          endDate: end ?? null,
          closed: !!closed,
        });
        if (updated) { vscode.window.showInformationMessage('Sprint updated'); panel.dispose(); vscode.commands.executeCommand('taiga.refreshAll'); }
      }
      if (msg.type === 'cancel') panel.dispose();
    });
  }
}

function renderHtml(csp: string, nonce: string, opts: { mode: 'create'|'edit'; sprint?: Sprint }) {
  const s = opts.sprint as any;
  const name = s?.name || '';
  const start = s?.estimated_start || s?.startDate || '';
  const end = s?.estimated_finish || s?.endDate || '';
  const closed = !!s?.closed;
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);}
  .row{display:flex; gap:8px; align-items:center; margin:6px 0;}
  input[type=text], input[type=date]{width:100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px; border-radius: 2px;}
  .actions{display:flex; gap:8px; margin-top:12px;}
  button{ background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border, transparent); border-radius: 2px; padding: 4px 10px; }
  button:hover{ background: var(--vscode-button-hoverBackground); }
  label{ min-width: 120px; }
  </style></head>
  <body>
  <div class="row"><label>Name</label><input id="name" type="text" value="${escapeHtml(name)}" /></div>
  <div class="row"><label>Start date</label><input id="start" type="date" value="${escapeHtml(start)}" /></div>
  <div class="row"><label>End date</label><input id="end" type="date" value="${escapeHtml(end)}" /></div>
  ${opts.mode === 'edit' ? '<div class="row"><label>Closed</label><input id="closed" type="checkbox" '+(closed?'checked':'')+' /></div>' : ''}
  <div class="actions">
    <button id="save">Save</button>
    <button id="cancel">Cancel</button>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('save').addEventListener('click', () => {
      vscode.postMessage({ type: 'save', payload: {
        name: (document.getElementById('name')).value,
        start: (document.getElementById('start')).value,
        end: (document.getElementById('end')).value,
        closed: (document.getElementById('closed')||{checked:false}).checked,
      }});
    });
    document.getElementById('cancel').addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));
  </script>
  </body></nhtml>`;
}

function escapeHtml(s: string){ return s.replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c] as string)); }
function getNonce(){ let t=''; const p='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for(let i=0;i<32;i++) t+=p.charAt(Math.floor(Math.random()*p.length)); return t; }
