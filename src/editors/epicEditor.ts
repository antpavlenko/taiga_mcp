import * as vscode from 'vscode';
import { EpicService, EpicStatus } from '../services/epicService';
import { UserStoryService } from '../services/userStoryService';
import { UserStory } from '../models/types';
import { UserRef } from '../models/types';
import { Epic } from '../models/types';

export class EpicEditor {
  static async openForCreate(epicService: EpicService, projectId: number, users?: UserRef[], statuses?: EpicStatus[], siteBaseUrl?: string, projectSlug?: string) {
    const panel = vscode.window.createWebviewPanel('taigaEpicEditor', 'New Epic', vscode.ViewColumn.Active, { enableScripts: true });
  const ext = vscode.extensions.getExtension('AntonPavlenko.taiga-mcp-extension') || vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
    if (ext) panel.iconPath = {
      light: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-light.svg'),
      dark: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-dark.svg'),
    };
  const nonce = getNonce();
  const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
  panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${csp}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class="loading">Loading…</div></body></html>`;
  panel.webview.html = renderHtml(csp, nonce, { mode: 'create', users: users || [], statuses: statuses || [], siteBaseUrl, projectSlug, projectId });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
  const { title, color, description, status, team_requirement, client_requirement, blocked, tags, assigned_to } = msg.payload || {};
  const safeTags = Array.isArray(tags) ? tags.filter((t: string) => !!t && t.trim().length > 0) : undefined;
  const created = await epicService.createEpic({ projectId, title, color: color || undefined, description: description || undefined, statusId: status ? Number(status) : undefined, teamRequirement: !!team_requirement, clientRequirement: !!client_requirement, isBlocked: !!blocked, tags: safeTags, assignedTo: assigned_to ? Number(assigned_to) : undefined });
        if (created) {
          vscode.window.showInformationMessage('Epic created');
          panel.dispose();
          vscode.commands.executeCommand('taiga.refreshAll');
        } else {
          await handleTokenError(epicService, 'Creating epic failed');
        }
      }
      if (msg.type === 'cancel') panel.dispose();
    });
  }

  static async openForEdit(epicService: EpicService, epic: Epic, users?: UserRef[], statuses?: EpicStatus[], storyService?: UserStoryService, siteBaseUrl?: string, projectSlug?: string) {
    const panel = vscode.window.createWebviewPanel('taigaEpicEditor', `Edit Epic: ${(epic as any).title || (epic as any).subject || epic.id}`, vscode.ViewColumn.Active, { enableScripts: true });
  const ext2 = vscode.extensions.getExtension('AntonPavlenko.taiga-mcp-extension') || vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
    if (ext2) panel.iconPath = {
      light: vscode.Uri.joinPath(ext2.extensionUri, 'media/taiga-emblem-light.svg'),
      dark: vscode.Uri.joinPath(ext2.extensionUri, 'media/taiga-emblem-dark.svg'),
    };
    const nonce = getNonce();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    // Show loading while we fetch statuses if needed
    panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${csp}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class=loading>Loading…</div></body></html>`;
  // Try to fetch statuses for the project if possible; epic has projectId
  const projectId = (epic as any).projectId || (epic as any).project || 0;
  let statusList: EpicStatus[] = statuses || [];
  try { if (projectId && !statusList.length) statusList = await epicService.listEpicStatuses(projectId); } catch {}
  // Fetch data for linked stories table
  const storyStatuses = await (async () => { try { return projectId ? await (new UserStoryService((epicService as any)['api'])).listUserStoryStatuses(projectId) : []; } catch { return []; } })();
  const linkedStories: UserStory[] = await (async () => { try { return (storyService && projectId) ? await storyService.listUserStoriesForEpic(projectId, epic.id) : []; } catch { return []; } })();
  panel.webview.html = renderHtml(csp, nonce, { mode: 'edit', epic, statuses: statusList, users: users || [], linkedStories, storyStatuses, siteBaseUrl, projectSlug, projectId });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
        const { title, color, description, status, team_requirement, client_requirement, blocked, tags, assigned_to } = msg.payload || {};
        const safeTags = Array.isArray(tags) ? tags.filter((t: string) => !!t && t.trim().length > 0) : undefined;
        const updated = await epicService.updateEpic(epic.id, {
          title: title ?? null,
          color: (color ?? '') || null,
          description: description ?? null,
          statusId: status ? Number(status) : null,
          teamRequirement: !!team_requirement,
          clientRequirement: !!client_requirement,
          isBlocked: !!blocked,
          tags: safeTags,
          assignedTo: assigned_to ? Number(assigned_to) : null,
          version: (epic as any)?.version,
        });
        if (updated) {
          vscode.window.showInformationMessage('Epic updated');
          panel.dispose();
          vscode.commands.executeCommand('taiga.refreshAll');
        } else {
          await handleTokenError(epicService, 'Updating epic failed');
        }
      }
      if (msg.type === 'addExistingStory') {
        if (!storyService || !projectId) return;
        const candidates = await storyService.listUserStoriesNotInEpic(projectId, epic.id);
        if (!candidates.length) { vscode.window.showInformationMessage('No available user stories to add.'); return; }
        const picked = await vscode.window.showQuickPick(candidates.map(s => ({ label: s.subject, description: String((s as any).ref ?? s.id), s })), { placeHolder: 'Select a user story to add' });
        if (picked) {
          await storyService.addUserStoryToEpic(epic.id, picked.s.id);
          const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
          panel.webview.postMessage({ type: 'setLinkedStories', stories: refreshed });
        }
      }
      if (msg.type === 'createNewStory') {
        // Open the Story create editor with preselected epic
        try {
          const { StoryEditor } = await import('./storyEditor');
          await StoryEditor.openForCreate(storyService!, new EpicService((epicService as any)['api']), new (await import('../services/sprintService')).SprintService((epicService as any)['api']), projectId, [epic.id]);
        } catch {}
      }
      if (msg.type === 'editStory' && msg.storyId) {
        try {
          const sFull = await (storyService as any).getUserStory?.(msg.storyId);
          if (sFull) {
            const { StoryEditor } = await import('./storyEditor');
            await StoryEditor.openForEdit(storyService!, new EpicService((epicService as any)['api']), new (await import('../services/sprintService')).SprintService((epicService as any)['api']), sFull);
          }
        } catch {}
      }
      if (msg.type === 'removeStory' && msg.storyId) {
        if (!storyService) return;
        await storyService.removeUserStoryFromEpic(epic.id, Number(msg.storyId));
        if (projectId) {
          const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
          panel.webview.postMessage({ type: 'setLinkedStories', stories: refreshed });
        }
      }
      if (msg.type === 'deleteStory' && msg.storyId) {
        if (!storyService) return;
        const ok = await vscode.window.showWarningMessage('Delete this user story?', { modal: true }, 'Delete');
        if (ok === 'Delete') {
          await (storyService as any).deleteUserStory?.(Number(msg.storyId));
          if (projectId) {
            const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
            panel.webview.postMessage({ type: 'setLinkedStories', stories: refreshed });
          }
          vscode.commands.executeCommand('taiga.refreshAll');
        }
      }
      if (msg.type === 'cancel') panel.dispose();
    });
    // Refresh linked stories when the editor regains focus
    panel.onDidChangeViewState(async (e) => {
      if (e.webviewPanel.active && storyService && projectId) {
        const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
        panel.webview.postMessage({ type: 'setLinkedStories', stories: refreshed });
      }
    });
  }
}

function renderHtml(csp: string, nonce: string, opts: { mode: 'create'|'edit'; epic?: Epic; statuses?: EpicStatus[]; users?: UserRef[]; linkedStories?: UserStory[]; storyStatuses?: Array<{ id:number; name:string }>; siteBaseUrl?: string; projectSlug?: string; projectId?: number }) {
  const epic = opts.epic;
  const title = (epic as any)?.title || (epic as any)?.subject || (epic as any)?.name || '';
    const color = (epic as any)?.color || (epic as any)?.hexColor || (epic as any)?.hex_color || '';
  const description = (epic as any)?.description || '';
    const status = (epic as any)?.status?.id ?? (epic as any)?.statusId ?? (epic as any)?.status ?? '';
  const statuses = opts.statuses || [];
  const statusSelect = statuses.length
    ? `<select id="status">${['<option value="">(none)</option>', ...statuses.map(s=>`<option value="${s.id}" ${String(status)===String(s.id)?'selected':''}>${escapeHtml(s.name)}</option>`)].join('')}</select>`
    : `<input id="status" type="text" placeholder="Status (choose from Taiga)" value="${escapeHtml(String(status || ''))}" />`;
  const teamReq = !!(epic as any)?.team_requirement;
  const clientReq = !!(epic as any)?.client_requirement;
  const blocked = !!(epic as any)?.is_blocked || !!(epic as any)?.blocked;
  const blockedReason = (epic as any)?.blocked_note || (epic as any)?.blocked_reason || '';
  const tags: string[] = Array.isArray((epic as any)?.tags)
    ? (epic as any)?.tags
        .map((t: any) => String(t ?? ''))
        .map((t: string) => t.replace(/,+$/, '').trim())
        .filter((t: string) => t.length > 0)
    : [];
  const users = opts.users || [];
  const assignedId = (epic as any)?.assigned_to || (epic as any)?.assignedTo;
  const userSelect = ['<option value="">Unassigned</option>', ...users.map(u=>`<option value="${u.id}" ${String(assignedId)===String(u.id)?'selected':''}>${escapeHtml(u.fullName || u.username)}</option>`)].join('');
  const stories = Array.isArray(opts.linkedStories) ? opts.linkedStories : [];
  const storyStatuses = Array.isArray(opts.storyStatuses) ? opts.storyStatuses : [];
  function renderStoriesRows() {
    return stories.map((s:any) => {
      const dataId = s?.id; // always use real ID for commands
      const displayId = s?.ref ?? s?.id; // show ref if available
      const name = s?.subject || '';
      const assignedId = s?.assigned_to ?? s?.assignedTo;
      const assignedName = (()=>{ const f = users.find(u=>String(u.id)===String(assignedId)); return f ? (f.fullName || f.username) : ''; })();
      const statusId = s?.status?.id ?? s?.status;
      const statusName = (()=>{ const st = storyStatuses.find(ss=>String(ss.id)===String(statusId)); return st ? st.name : (statusId || ''); })();
      return `<tr data-id="${dataId}" class="story-row">
        <td style="width:90px;">${escapeHtml(String(displayId))}</td>
        <td>${escapeHtml(String(name))}</td>
        <td style="width:200px;">${escapeHtml(String(assignedName))}</td>
        <td style="width:160px;">${escapeHtml(String(statusName))}</td>
      </tr>`;
    }).join('');
  }
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);}
  .row{display:flex; gap:8px; align-items:center; margin:6px 0;}
  input[type=text], textarea, select, input[type=date]{width:100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(0,0,0,0.18)); padding: 4px 6px; border-radius: 2px;}
  @media (prefers-color-scheme: dark){ input[type=text], textarea, select, input[type=date]{ border-color: var(--vscode-input-border, rgba(255,255,255,0.18)); } input[type=\"date\"]::-webkit-calendar-picker-indicator{ filter: invert(1) contrast(1.1); } }
  @media (prefers-color-scheme: light){ input[type=\"date\"]::-webkit-calendar-picker-indicator{ filter: none; } }
  .darklike input[type=\"date\"]::-webkit-calendar-picker-indicator{ filter: invert(1) brightness(1.2) contrast(1.1); }
  .actions{display:flex; gap:8px; margin:12px 0 18px 0;}
  button{ background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border, transparent); border-radius: 2px; padding: 4px 10px; }
  button:hover{ background: var(--vscode-button-hoverBackground); }
  label{ min-width: 90px; }
  .color-palette{ display:flex; gap:6px; flex-wrap: wrap; }
  .swatch{ width:16px; height:16px; border-radius: 50%; border: 1px solid rgba(0,0,0,.15); cursor:pointer; display:inline-block; }
  .swatch.selected{ outline: 2px solid var(--vscode-focusBorder); }
  .flags button{ cursor: pointer; }
  .header{ display:flex; align-items:center; justify-content: space-between; margin-bottom: 8px; }
  .right{ display:flex; align-items:center; gap:8px; }
  .header .right select{ width: 220px; }
  table.list{ width:100%; border-collapse: collapse; margin-top: 12px; table-layout: fixed; }
  table.list th, table.list td{ border:1px solid var(--vscode-input-border, rgba(128,128,128,.3)); padding:4px 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  th.sortable{ cursor:pointer; user-select: none; }
  th.sortable .dir{ opacity:.6; font-size: 11px; margin-left: 4px; }
  #storySearch{ width:220px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px; border-radius: 2px; }
  .list-header{ display:flex; align-items:center; justify-content: space-between; margin-top: 16px; }
  .context-menu{ position:fixed; z-index:9999; background: var(--vscode-editor-background); border:1px solid var(--vscode-widget-border); box-shadow: 0 2px 8px rgba(0,0,0,.2); display:none; }
  .context-menu button{ display:block; width:100%; text-align:left; padding:6px 10px; background:transparent; border:0; color: var(--vscode-foreground); }
  .context-menu button:hover{ background: var(--vscode-list-hoverBackground); }
  .note{ opacity:.8; font-style: italic; font-size: 12px; }
  tr.closed td{ text-decoration: line-through; color: var(--vscode-disabledForeground, #9aa0a6); opacity: .85; }
  </style></head>
  <body>
  <script nonce="${nonce}">/* detect dark background and mark body for calendar icon contrast */(function(){try{var cs=getComputedStyle(document.body);var bg=cs.getPropertyValue('--vscode-editor-background').trim();function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return {r:r,g:g,b:b};}function parseBg(s){if(!s)return null;var m=s.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(m){return {r:+m[1],g:+m[2],b:+m[3]};}if(/^#/.test(s)){return hexToRgb(s);}return null;}var rgb=parseBg(bg);if(rgb){var L=0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b; if(L<140){document.body.classList.add('darklike');}}}catch(e){}})();</script>
  <div class="header">
    <h3 style="margin:0;">${opts.mode === 'create' ? 'Create Epic' : 'Edit Epic'}${opts.mode==='edit' ? ` <em style="font-weight: normal; opacity: .8;">#${escapeHtml(String((epic as any)?.ref || (epic as any)?.id || ''))}</em>` : ''}</h3>
    <div class="right"><label style="min-width:auto;">Assigned to</label><select id="assigned">${userSelect}</select></div>
  </div>
  <div class="row"><label>Title</label><input id="title" type="text" value="${escapeHtml(title)}" /></div>
  <div class="row"><label>Color</label><input id="color" type="text" placeholder="#RRGGBB (optional)" value="${escapeHtml(color)}" /></div>
  <div class="row"><label></label><div class="color-palette" id="palette"></div></div>
  <div class="row"><label>Status</label>${statusSelect}</div>
  <div class="row"><label>Flags</label>
    <div class="flags" style="display:flex; gap:8px; align-items:center; width:100%;">
      <button id="teamReq" title="Team requirement">👥</button>
      <button id="clientReq" title="Client requirement">👤</button>
      <button id="blocked" title="Blocked">⛔</button>
      <input id="blockedReason" type="text" placeholder="Reason" value="${escapeHtml(String(blockedReason||''))}" />
    </div>
  </div>
  <div class="row"><label>Tags</label><input id="tags" type="text" placeholder="Comma-separated" value="${escapeHtml(tags.join(', '))}" /></div>
  <div class="row"><label>Description</label><textarea id="desc" rows="6">${escapeHtml(description)}</textarea></div>
  ${(() => {
    const base = opts.siteBaseUrl || '';
    const slug = opts.projectSlug;
    let url = '';
    if (opts.mode === 'edit') {
      const idPart = String((epic as any)?.ref || (epic as any)?.id || '');
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/epic/${idPart}` : `${base}/epic/${idPart}`;
      }
    } else {
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/epics` : `${base}/epics`;
      }
    }
    const linkHtml = url ? ` (<a href="${url}" target="_blank">${escapeHtml(url)}</a>)` : '';
    return `<div class=\"row\"><label></label><div class=\"note\">Comments can be edited in Taiga interface only${linkHtml}</div></div>`;
  })()}
  <div class="actions">
    <button id="save">Save</button>
    <button id="cancel">Cancel</button>
  </div>
  ${opts.mode==='edit' ? `
  <div class="list-header">
    <h4 style="margin:6px 0;">Linked User Stories</h4>
    <div class="right">
      <input id="storySearch" type="text" placeholder="Search..." />
      <button id="addExisting">Add existing…</button>
      <button id="createNew">Create a new user story…</button>
    </div>
  </div>
  <table class="list">
    <thead><tr>
      <th class="sortable" data-key="id" style="width:90px;">Ref <span class="dir" id="dir-id"></span></th>
      <th class="sortable" data-key="name">Name <span class="dir" id="dir-name"></span></th>
      <th class="sortable" data-key="assigned" style="width:200px;">Assigned to <span class="dir" id="dir-assigned"></span></th>
      <th class="sortable" data-key="status" style="width:160px;">Status <span class="dir" id="dir-status"></span></th>
    </tr></thead>
    <tbody id="storiesBody">${renderStoriesRows()}</tbody>
  </table>
  <div id="cmenu" class="context-menu"></div>
  ` : ''}
  <script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const users = ${JSON.stringify(users)};
  const storyStatuses = ${JSON.stringify(storyStatuses)};
  let __stories = Array.isArray(${JSON.stringify(stories)}) ? ${JSON.stringify(stories)} : [];
  let __sortKey = 'id';
  let __sortDir = 'asc';
  let __search = '';
  function computeViewRows(){
    function toRow(s){
      const dataId = s && s.id;
      const displayId = (s && (s.ref!=null ? s.ref : s.id));
      const name = (s && s.subject) || '';
      const assignedId = (s && (s.assigned_to!=null ? s.assigned_to : s.assignedTo));
      const assigned = users.find(u=>String(u.id)===String(assignedId)) || {};
      const assignedName = assigned.fullName || assigned.username || '';
  const statusId = (s && (s.status && s.status.id || s.status));
  const st = storyStatuses.find(ss=>String(ss.id)===String(statusId)) || {};
  const statusName = st.name || (statusId||'');
  const slug = (st && (st.slug || '')) || '';
  const low = String(slug || statusName).toLowerCase();
  const closedByText = /\b(closed|done|completed|resolved|archived)\b/.test(low);
  const isClosed = Boolean(st.is_closed || st.isClosed || closedByText || (s && (s.is_closed || s.closed)));
  return { dataId, displayId, name, assignedName, statusName, raw: s, closed: isClosed };
    }
    let rows = __stories.map(toRow);
    if (__search && __search.trim().length){
      const q = __search.trim().toLowerCase();
      rows = rows.filter(r => String(r.displayId).toLowerCase().includes(q) || String(r.name).toLowerCase().includes(q) || String(r.assignedName).toLowerCase().includes(q) || String(r.statusName).toLowerCase().includes(q));
    }
    const cmp = (a,b)=>{
      // Always push closed rows to the bottom regardless of secondary sort
      const ca = a.closed ? 1 : 0;
      const cb = b.closed ? 1 : 0;
      if (ca !== cb) return ca - cb;
      const dir = (__sortDir==='asc') ? 1 : -1;
      switch(__sortKey){
        case 'id': return ((Number(a.displayId)||0) - (Number(b.displayId)||0)) * dir;
        case 'name': return String(a.name).localeCompare(String(b.name)) * dir;
        case 'assigned': return String(a.assignedName).localeCompare(String(b.assignedName)) * dir;
        case 'status': return String(a.statusName).localeCompare(String(b.statusName)) * dir;
        default: return 0;
      }
    };
    rows.sort(cmp);
    return rows;
  }
  function renderSortIndicators(){
    ['id','name','assigned','status'].forEach(k=>{
      const el = document.getElementById('dir-'+k); if (!el) return; el.textContent = (__sortKey===k) ? (__sortDir==='asc' ? '▲' : '▼') : '';
    });
  }
  function setStories(stories){ __stories = Array.isArray(stories) ? stories.slice() : []; renderTable(); }
  function renderTable(){
    const body = document.getElementById('storiesBody'); if (!body) return;
    const rows = computeViewRows();
    body.innerHTML = rows.map(r => (
      '<tr data-id="'+r.dataId+'" class="story-row'+(r.closed?' closed':'')+'">'
      + '<td style="width:90px;">'+String(r.displayId)+'</td>'
      + '<td>'+String(r.name)+'</td>'
      + '<td style="width:200px;">'+String(r.assignedName)+'</td>'
      + '<td style="width:160px;">'+String(r.statusName)+'</td>'
      + '</tr>'
    )).join('');
    renderSortIndicators();
  }
  // Initialize interactions
  (function(){
    var search = document.getElementById('storySearch');
    if (search) search.addEventListener('input', function(){
      // Use plain JS; avoid TS-only casts in webview
      __search = (search && search.value) ? search.value : '';
      renderTable();
    });
    var ths = document.querySelectorAll('th.sortable'); ths.forEach(function(th){ th.addEventListener('click', function(){
      var key = th.getAttribute('data-key');
      if (!key) return;
      if (__sortKey === key) { __sortDir = (__sortDir==='asc') ? 'desc' : 'asc'; }
      else { __sortKey = key; __sortDir = 'asc'; }
      renderTable();
    }); });
    renderTable();
  })();
  window.addEventListener('message', function(e){ var msg=e.data||{}; if (msg.type==='setLinkedStories'){ setStories(msg.stories||[]); }});
  var addBtn = document.getElementById('addExisting'); if (addBtn) addBtn.addEventListener('click', function(){ vscode.postMessage({ type: 'addExistingStory' }); });
  var createBtn = document.getElementById('createNew'); if (createBtn) createBtn.addEventListener('click', function(){ vscode.postMessage({ type: 'createNewStory' }); });
  // Context menu for story rows
  var cmenu = document.getElementById('cmenu');
  document.addEventListener('contextmenu', function(ev){
    var row = ev.target && (ev.target.closest ? ev.target.closest('.story-row') : null);
    if (row) {
      ev.preventDefault();
      var id = row.getAttribute('data-id');
      if (cmenu) {
        cmenu.innerHTML = '';
        function add(label,type){ var b=document.createElement('button'); b.textContent=label; b.addEventListener('click', function(){ cmenu.style.display='none'; vscode.postMessage({ type: type, storyId: Number(id) }); }); cmenu.appendChild(b); }
        add('Edit the user story…','editStory');
        add('Remove the user story from the epic','removeStory');
        add('Delete the user story','deleteStory');
        cmenu.style.left = ev.pageX + 'px'; cmenu.style.top = ev.pageY + 'px'; cmenu.style.display = 'block';
      }
    } else { if (cmenu) cmenu.style.display = 'none'; }
  });
  document.addEventListener('click', function(){ if (cmenu) cmenu.style.display='none'; });
  const taigaColors = ['#ecf0f1','#1abc9c','#2ecc71','#3498db','#9b59b6','#34495e','#16a085','#27ae60','#2980b9','#8e44ad','#2c3e50','#f1c40f','#e67e22','#e74c3c','#95a5a6','#f39c12','#d35400','#c0392b','#7f8c8d'];
  const palette = document.getElementById('palette');
  const colorInput = document.getElementById('color');
  const statusInput = document.getElementById('status');
  const teamBtn = document.getElementById('teamReq');
  const clientBtn = document.getElementById('clientReq');
  const blockedBtn = document.getElementById('blocked');
  const blockedReasonInput = document.getElementById('blockedReason');
  const tagsInput = document.getElementById('tags');
  // initialize flags
  let teamRequirement = ${teamReq ? 'true' : 'false'};
  let clientRequirement = ${clientReq ? 'true' : 'false'};
  let isBlocked = ${blocked ? 'true' : 'false'};
  function renderFlag(btn, active){ btn.style.opacity = active ? '1' : '0.5'; }
  renderFlag(teamBtn, teamRequirement); renderFlag(clientBtn, clientRequirement); renderFlag(blockedBtn, isBlocked);
  teamBtn.addEventListener('click', ()=>{ teamRequirement = !teamRequirement; renderFlag(teamBtn, teamRequirement); });
  clientBtn.addEventListener('click', ()=>{ clientRequirement = !clientRequirement; renderFlag(clientBtn, clientRequirement); });
  blockedBtn.addEventListener('click', ()=>{ isBlocked = !isBlocked; renderFlag(blockedBtn, isBlocked); });
  function renderPalette(){
    palette.innerHTML = '';
    const current = (colorInput.value||'').toLowerCase();
    taigaColors.forEach(c => {
      const el = document.createElement('span'); el.className = 'swatch' + (current===c.toLowerCase() ? ' selected' : ''); el.style.background = c; el.title = c; el.addEventListener('click', ()=>{ colorInput.value = c; renderPalette(); }); palette.appendChild(el);
    });
  }
  colorInput.addEventListener('input', renderPalette);
  renderPalette();
  document.getElementById('save').addEventListener('click', () => {
    vscode.postMessage({ type: 'save', payload: {
      title: (document.getElementById('title')).value,
      color: (document.getElementById('color')).value,
      description: (document.getElementById('desc')).value,
      status: statusInput.value,
      team_requirement: teamRequirement,
      client_requirement: clientRequirement,
  blocked: isBlocked,
  blocked_reason: blockedReasonInput ? (blockedReasonInput).value : '',
      tags: (tagsInput.value||'')
        .split(',')
        .map(s=>s.replace(/,+$/, '').trim())
        .filter(s=>s.length>0),
      assigned_to: (document.getElementById('assigned')).value
    }});
  });
  document.getElementById('cancel').addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));
  </script>
  </body></html>`;
}

function escapeHtml(s: string){ return s.replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c] as string)); }
function getNonce(){ let t=''; const p='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for(let i=0;i<32;i++) t+=p.charAt(Math.floor(Math.random()*p.length)); return t; }
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
