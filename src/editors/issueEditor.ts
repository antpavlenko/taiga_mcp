import * as vscode from 'vscode';
import { IssueService } from '../services/issueService';
import { UserService } from '../services/userService';
import { UserRef, Issue } from '../models/types';

export class IssueEditor {
  static async openForCreate(issueService: IssueService, projectId: number, siteBaseUrl?: string, projectSlug?: string) {
    const panel = vscode.window.createWebviewPanel('taigaIssueEditor', 'New Issue', vscode.ViewColumn.Active, { enableScripts: true });
    const ext = vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
  if (ext) panel.iconPath = {
    light: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-light.svg'),
    dark: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-dark.svg'),
  };
    const nonce = getNonce(); const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    panel.webview.html = renderLoadingHtml(csp);
    const userService = new UserService((issueService as any)['api']);
    const users: UserRef[] = await (async () => { try { return await userService.listProjectUsers(projectId); } catch { return []; } })();
  const statuses = await (async () => { try { return await issueService.listIssueStatuses(projectId); } catch { return []; } })();
  const types = await (async () => { try { return await issueService.listIssueTypes(projectId); } catch { return []; } })();
  const severities = await (async () => { try { return await issueService.listIssueSeverities(projectId); } catch { return []; } })();
  const priorities = await (async () => { try { return await issueService.listIssuePriorities(projectId); } catch { return []; } })();
  panel.webview.html = renderHtml(csp, nonce, { mode: 'create', users, statuses, siteBaseUrl, projectSlug, types, severities, priorities });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
  const { subject, description, statusId, assignedTo, due_date, tags, typeId, severityId, priorityId } = msg.payload || {};
  const res = await issueService.createIssue({ projectId, subject, description, statusId, assignedTo, dueDate: due_date, tags, typeId, severityId, priorityId });
        if (!res) { await handleTokenError(issueService, 'Creating issue failed'); return; }
        vscode.window.showInformationMessage('Issue created'); panel.dispose(); vscode.commands.executeCommand('taiga.refreshAll');
      }
      if (msg.type === 'cancel') panel.dispose();
    });
  }

  static async openForEdit(issueService: IssueService, issue: Issue, siteBaseUrl?: string, projectSlug?: string) {
    const panel = vscode.window.createWebviewPanel('taigaIssueEditor', `Edit Issue: ${issue.subject || issue.id}`, vscode.ViewColumn.Active, { enableScripts: true });
    const ext = vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
  if (ext) panel.iconPath = {
    light: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-light.svg'),
    dark: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-dark.svg'),
  };
    const nonce = getNonce(); const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    panel.webview.html = renderLoadingHtml(csp);
    const pid = (issue as any).projectId ?? (issue as any).project;
    const userService = new UserService((issueService as any)['api']);
    const users: UserRef[] = await (async () => { try { return pid ? await userService.listProjectUsers(Number(pid)) : []; } catch { return []; } })();
    const statuses = await (async () => { try { return pid ? await issueService.listIssueStatuses(Number(pid)) : []; } catch { return []; } })();
    const types = await (async () => { try { return pid ? await issueService.listIssueTypes(Number(pid)) : []; } catch { return []; } })();
    const severities = await (async () => { try { return pid ? await issueService.listIssueSeverities(Number(pid)) : []; } catch { return []; } })();
    const priorities = await (async () => { try { return pid ? await issueService.listIssuePriorities(Number(pid)) : []; } catch { return []; } })();
    const full = await (async () => { try { return await (issueService as any).getIssue?.(issue.id) || issue; } catch { return issue; } })();
    panel.webview.html = renderHtml(csp, nonce, { mode: 'edit', issue: full, users, statuses, types, severities, priorities, siteBaseUrl, projectSlug });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
        const { subject, description, statusId, assignedTo, due_date, tags, typeId, severityId, priorityId } = msg.payload || {};
        const res = await issueService.updateIssue(issue.id, { subject, description: description ?? null, statusId: statusId ?? null, assignedTo: assignedTo ?? null, dueDate: due_date ?? null, tags: tags ?? undefined, typeId: typeId ?? null, severityId: severityId ?? null, priorityId: priorityId ?? null, version: (full as any)?.version });
        if (!res) { await handleTokenError(issueService, 'Updating issue failed'); return; }
        vscode.window.showInformationMessage('Issue updated'); panel.dispose(); vscode.commands.executeCommand('taiga.refreshAll');
      }
      if (msg.type === 'cancel') panel.dispose();
    });
  }
}

async function handleTokenError(service: any, fallbackMsg: string) {
  try {
    const api = (service as any)['api'];
    const test = await api.get('/users/me');
    if (test?.error && test.error.category === 'auth') {
      const pick = await vscode.window.showWarningMessage('Your Taiga session has expired. Reconnect?', 'Reconnect');
      if (pick === 'Reconnect') { await vscode.commands.executeCommand('taiga.connect'); }
    } else {
      vscode.window.showErrorMessage(fallbackMsg);
    }
  } catch {
    vscode.window.showErrorMessage(fallbackMsg);
  }
}

function renderHtml(csp: string, nonce: string, opts: { mode: 'create'|'edit'; issue?: Issue; users?: UserRef[]; statuses?: Array<{ id:number; name:string }>; types?: Array<{ id:number; name:string }>; severities?: Array<{ id:number; name:string }>; priorities?: Array<{ id:number; name:string }>; siteBaseUrl?: string; projectSlug?: string }){
  const t = opts.issue as any;
  const subject = t?.subject || '';
  const description = t?.description || '';
  const assignedId = t?.assigned_to ?? t?.assignedTo;
  const statusId = t?.status?.id ?? t?.status ?? t?.statusId;
  const dueDate = (t?.due_date || '').toString().slice(0,10);
  const tags: string[] = Array.isArray(t?.tags) ? (t?.tags || []).map((x:any)=>String(x??'').replace(/,+$/, '').trim()).filter((s:string)=>s.length>0) : [];
  const users = opts.users || [];
  const statuses = opts.statuses || [];
  const types = opts.types || [];
  const severities = opts.severities || [];
  const priorities = opts.priorities || [];
  const typeId = (t?.type && (t?.type.id ?? t?.type)) ?? t?.type;
  const severityId = (t?.severity && (t?.severity.id ?? t?.severity)) ?? t?.severity;
  const priorityId = (t?.priority && (t?.priority.id ?? t?.priority)) ?? t?.priority;
  const userOptions = ['<option value="">Unassigned</option>', ...users.map(u=>`<option value="${u.id}" ${String(assignedId)===String(u.id)?'selected':''}>${escapeHtml(u.fullName || u.username)}</option>`)].join('');
  const statusOptions = ['<option value="">(none)</option>', ...statuses.map(s=>`<option value="${s.id}" ${String(statusId)===String(s.id)?'selected':''}>${escapeHtml(s.name)}</option>`)].join('');
  const typeOptions = ['<option value="">(none)</option>', ...types.map(s=>`<option value="${s.id}" ${String(typeId)===String(s.id)?'selected':''}>${escapeHtml(s.name)}</option>`)].join('');
  const severityOptions = ['<option value="">(none)</option>', ...severities.map(s=>`<option value="${s.id}" ${String(severityId)===String(s.id)?'selected':''}>${escapeHtml(s.name)}</option>`)].join('');
  const priorityOptions = ['<option value="">(none)</option>', ...priorities.map(s=>`<option value="${s.id}" ${String(priorityId)===String(s.id)?'selected':''}>${escapeHtml(s.name)}</option>`)].join('');
  const ref = t?.ref || t?.id;
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);} .row{display:flex; gap:8px; align-items:center; margin:6px 0;} .row > label{ flex: 0 0 110px; } .row > :not(label){ flex: 1 1 auto; }
  input[type=text], textarea, select, input[type=date]{width:100%; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(0,0,0,0.18)); padding: 4px 6px; border-radius: 2px;}
  @media (prefers-color-scheme: dark){ input[type=text], textarea, select, input[type=date]{ border-color: var(--vscode-input-border, rgba(255,255,255,0.18)); } input[type="date"]::-webkit-calendar-picker-indicator{ filter: invert(1) contrast(1.1); } } @media (prefers-color-scheme: light){ input[type="date"]::-webkit-calendar-picker-indicator{ filter: none; } } .darklike input[type="date"]::-webkit-calendar-picker-indicator{ filter: invert(1) brightness(1.2) contrast(1.1); }
  .header{ display:flex; align-items:center; justify-content: space-between; margin-bottom: 8px; }
  .right{ display:flex; align-items:center; gap:8px; }
  .header .right select{ width: 220px; }
  .note{ opacity:.8; font-style: italic; font-size: 12px; }
  button{ -webkit-appearance: none; appearance: none; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border, transparent); border-radius: 2px; padding: 4px 10px; }
  button:hover{ background: var(--vscode-button-hoverBackground); }
  </style></head>
  <body>
  <script nonce="${nonce}">/* detect dark background and mark body for calendar icon contrast */(function(){try{var cs=getComputedStyle(document.body);var bg=cs.getPropertyValue('--vscode-editor-background').trim();function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return {r:r,g:g,b:b};}function parseBg(s){if(!s)return null;var m=s.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(m){return {r:+m[1],g:+m[2],b:+m[3]};}if(/^#/.test(s)){return hexToRgb(s);}return null;}var rgb=parseBg(bg);if(rgb){var L=0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b; if(L<140){document.body.classList.add('darklike');}}}catch(e){}})();</script>
  <div class="header">
    <h3 style="margin:0;">${opts.mode==='create' ? 'Create Issue' : 'Edit Issue'}${opts.mode==='edit' && ref ? ` <em style="font-weight: normal; opacity: .8;">#${escapeHtml(String(ref))}</em>` : ''}</h3>
    <div class="right"><label style="min-width:auto;">Assigned to</label><select id="assigned">${userOptions}</select></div>
  </div>
  <div class="row"><label>Subject</label><input id="subject" type="text" value="${escapeHtml(subject)}" /></div>
  <div class="row"><label>Description</label><textarea id="desc" rows="6">${escapeHtml(description)}</textarea></div>
  <div class="row"><label>Status</label><select id="status">${statusOptions}</select></div>
  <div class="row"><label>Type</label><select id="type">${typeOptions}</select></div>
  <div class="row"><label>Severity</label><select id="severity">${severityOptions}</select></div>
  <div class="row"><label>Priority</label><select id="priority">${priorityOptions}</select></div>
  <div class="row"><label>Tags</label><input id="tags" type="text" placeholder="Comma-separated" value="${escapeHtml(tags.join(', '))}" /></div>
  <div class="row"><label>Due date</label><input id="dueDate" type="date" value="${escapeHtml(dueDate)}" /></div>
  ${(() => { const base = opts.siteBaseUrl || ''; const slug = opts.projectSlug; let url = ''; if (opts.mode==='edit'){ const idPart = String(ref || ''); if (base) url = slug ? `${base}/project/${encodeURIComponent(slug)}/issue/${idPart}` : `${base}/issue/${idPart}`; } else { if (base) url = slug ? `${base}/project/${encodeURIComponent(slug)}/issues` : `${base}/issues`; } const linkHtml = url ? ` (<a href="${url}" target="_blank">${escapeHtml(url)}</a>)` : ''; return `<div class=\"row\"><label></label><div class=\"note\">Comments can be edited in Taiga interface only${linkHtml}</div></div>`; })()}
  <div class="actions">
    <button id="save">Save</button>
    <button id="cancel">Cancel</button>
  </div>
  <script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const saveBtn = document.getElementById('save');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'save', payload: {
      subject: (document.getElementById('subject')).value,
      description: (document.getElementById('desc')).value,
  statusId: parseNullableInt((document.getElementById('status')).value),
  typeId: parseNullableInt((document.getElementById('type')).value),
  severityId: parseNullableInt((document.getElementById('severity')).value),
  priorityId: parseNullableInt((document.getElementById('priority')).value),
      assignedTo: parseNullableInt((document.getElementById('assigned')).value),
      due_date: (document.getElementById('dueDate')).value,
      tags: (document.getElementById('tags')).value.split(',').map(s=>s.replace(/,+$/, '').trim()).filter(s=>s.length>0)
    }});
  });
  const cancelBtn = document.getElementById('cancel'); if (cancelBtn) cancelBtn.addEventListener('click', ()=>vscode.postMessage({ type: 'cancel' }));
  function parseNullableInt(v){ return v===''? undefined : Number(v); }
  </script>
  </body></html>`;
}

function escapeHtml(s: string){ return s.replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c] as string)); }
function getNonce(){ let t=''; const p='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for(let i=0;i<32;i++) t+=p.charAt(Math.floor(Math.random()*p.length)); return t; }
function renderLoadingHtml(csp: string){
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);} .loading{opacity:.8; font-style: italic; font-size: 12px;}
  </style></head>
  <body><div class="loading">Loading…</div></body></html>`;
}
