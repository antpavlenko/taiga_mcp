import * as vscode from 'vscode';
// Task editor is loaded dynamically when needed to reduce coupling
import { UserStoryService } from '../services/userStoryService';
import { EpicService } from '../services/epicService';
import { SprintService } from '../services/sprintService';
import { UserStory, Epic, Sprint, UserRef } from '../models/types';
import { UserService } from '../services/userService';

export class StoryEditor {
  static async openForCreate(storyService: UserStoryService, epicService: EpicService, sprintService: SprintService, projectId: number, preselectedEpicIds?: number[], siteBaseUrl?: string, projectSlug?: string) {
    const panel = vscode.window.createWebviewPanel('taigaStoryEditor', 'New User Story', vscode.ViewColumn.Active, { enableScripts: true });
  const ext = vscode.extensions.getExtension('AntonPavlenko.taiga-mcp-extension') || vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
    if (ext) panel.iconPath = {
      light: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-light.svg'),
      dark: vscode.Uri.joinPath(ext.extensionUri, 'media/taiga-emblem-dark.svg'),
    };
    const nonce = getNonce();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    // Initial loading placeholder to avoid blank panel while fetching data
    panel.webview.html = renderLoadingHtml(csp);
  const epics = await epicService.listEpics(projectId as number);
  const sprints = await sprintService.listSprints(projectId as number);
  const userService = new UserService((storyService as any)['api']);
  const users: UserRef[] = await (async () => { try { return await userService.listProjectUsers(projectId as number); } catch { return []; } })();
  const statuses = await storyService.listUserStoryStatuses(projectId as number);
  const [roles, points] = await Promise.all([
    (async ()=>{ try { return await storyService.listRoles(projectId as number); } catch { return []; } })(),
    (async ()=>{ try { return await storyService.listPoints(projectId as number); } catch { return []; } })(),
  ]);
  panel.webview.html = renderHtml(csp, nonce, { mode: 'create', projectId, epics, sprints, users, statuses, roles, points, preselectedEpicIds, siteBaseUrl, projectSlug });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
        const { subject, description, epicIds, sprintId, statusId, assignedTo, tags, team_requirement, client_requirement, is_blocked, due_date, points } = msg.payload || {};
        const created = await storyService.createUserStory({ projectId, subject, description, epicIds: Array.isArray(epicIds) ? epicIds : undefined, milestoneId: sprintId, statusId, assignedTo, tags: Array.isArray(tags) ? tags.filter((t:string)=>t && t.trim().length>0) : undefined, teamRequirement: !!team_requirement, clientRequirement: !!client_requirement, isBlocked: !!is_blocked, dueDate: due_date || undefined, points });
        if (created) { vscode.window.showInformationMessage('User Story created'); panel.dispose(); vscode.commands.executeCommand('taiga.refreshAll'); }
        else { await handleTokenError(storyService, 'Creating user story failed'); }
      }
      if (msg.type === 'cancel') panel.dispose();
    });
  }

  static async openForEdit(storyService: UserStoryService, epicService: EpicService, sprintService: SprintService, story: UserStory, siteBaseUrl?: string, projectSlug?: string) {
    const panel = vscode.window.createWebviewPanel('taigaStoryEditor', `Edit Story: ${story.subject || story.id}`, vscode.ViewColumn.Active, { enableScripts: true });
  const ext2 = vscode.extensions.getExtension('AntonPavlenko.taiga-mcp-extension') || vscode.extensions.getExtension('antpavlenko.taiga-mcp-extension');
    if (ext2) panel.iconPath = {
      light: vscode.Uri.joinPath(ext2.extensionUri, 'media/taiga-emblem-light.svg'),
      dark: vscode.Uri.joinPath(ext2.extensionUri, 'media/taiga-emblem-dark.svg'),
    };
    const nonce = getNonce();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
  // Show loading immediately
  panel.webview.html = renderLoadingHtml(csp);
  const pidStr = projectIdOf(story as any);
  const pidNum = pidStr != null && !isNaN(Number(pidStr)) ? Number(pidStr) : (typeof (story as any)?.projectId === 'number' ? (story as any).projectId : undefined);
  const epics = await epicService.listEpics(pidNum as number);
  const sprints = await sprintService.listSprints(pidNum as number);
  const userService = new UserService((storyService as any)['api']);
  const users: UserRef[] = await (async () => { try { return await userService.listProjectUsers(pidNum as number); } catch { return []; } })();
  const statuses = await storyService.listUserStoryStatuses(pidNum as number);
  const [roles, points] = await Promise.all([
    (async ()=>{ try { return await storyService.listRoles(pidNum as number); } catch { return []; } })(),
    (async ()=>{ try { return await storyService.listPoints(pidNum as number); } catch { return []; } })(),
  ]);
  const full = await (async () => { try { return await storyService.getUserStory(story.id) || story; } catch { return story; } })();
  // fetch linked tasks and task statuses for grid
  const { TaskService } = await import('../services/taskService');
  const taskService = new TaskService((storyService as any)['api']);
  const tasks = await (async () => { try { return await taskService.listTasksByUserStory(full.id as number); } catch { return []; } })();
  const taskStatuses = await (async () => { try { return pidNum ? await taskService.listTaskStatuses(pidNum as number) : []; } catch { return []; } })();
  panel.webview.html = renderHtml(csp, nonce, { mode: 'edit', story: full, projectId: pidNum as number, epics, sprints, users, statuses, roles, points, siteBaseUrl, projectSlug, linkedTasks: tasks as any[], taskStatuses });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'save') {
        const { subject, description, epicIds, sprintId, statusId, assignedTo, tags, team_requirement, client_requirement, is_blocked, due_date, points } = msg.payload || {};
        const updated = await storyService.updateUserStory(story.id, { subject, description: description ?? null, epicIds: Array.isArray(epicIds) ? epicIds : undefined, milestoneId: sprintId ?? null, statusId: statusId ?? null, assignedTo: assignedTo ?? null, tags: Array.isArray(tags) ? tags.filter((t:string)=>t && t.trim().length>0) : undefined, teamRequirement: team_requirement ?? null, clientRequirement: client_requirement ?? null, isBlocked: is_blocked ?? null, dueDate: due_date ?? null, points, version: (full as any)?.version });
        if (updated) {
          vscode.window.showInformationMessage('User Story updated');
          panel.dispose();
          vscode.commands.executeCommand('taiga.refreshAll');
        } else {
          await handleTokenError(storyService, 'Updating user story failed');
        }
      }
      if (msg.type === 'addExistingTask') {
        try {
          const { TaskService } = await import('../services/taskService');
          const tsvc = new TaskService((storyService as any)['api']);
          const candidates = await tsvc.listTasksNotInStory(pidNum as number, full.id as number);
          if (!candidates.length) { vscode.window.showInformationMessage('No available tasks to add.'); return; }
          const picked = await vscode.window.showQuickPick(candidates.map(t => ({ label: (t as any).subject, description: String((t as any).id), t })), { placeHolder: 'Select a task to link' });
          if (picked) {
            await tsvc.updateTask((picked.t as any).id, { userStoryId: full.id as number });
            const refreshed = await tsvc.listTasksByUserStory(full.id as number);
            panel.webview.postMessage({ type: 'setLinkedTasks', tasks: refreshed });
          }
        } catch {}
      }
      if (msg.type === 'createNewTask') {
        try {
          await vscode.commands.executeCommand('taiga._openTaskEditorCreate', { projectId: pidNum, storyId: full.id, siteBaseUrl, projectSlug });
          const { TaskService } = await import('../services/taskService');
          const tsvc = new TaskService((storyService as any)['api']);
          const refreshed = await tsvc.listTasksByUserStory(full.id as number);
          panel.webview.postMessage({ type: 'setLinkedTasks', tasks: refreshed });
        } catch {}
      }
      if (msg.type === 'editTask' && msg.taskId) {
        try {
          await vscode.commands.executeCommand('taiga._openTaskEditorEdit', { taskId: Number(msg.taskId), siteBaseUrl, projectSlug });
        } catch {}
      }
      if (msg.type === 'removeTask' && msg.taskId) {
        try {
          const { TaskService } = await import('../services/taskService');
          const tsvc = new TaskService((storyService as any)['api']);
          await tsvc.updateTask(Number(msg.taskId), { userStoryId: null });
          const refreshed = await tsvc.listTasksByUserStory(full.id as number);
          panel.webview.postMessage({ type: 'setLinkedTasks', tasks: refreshed });
        } catch {}
      }
      if (msg.type === 'deleteTask' && msg.taskId) {
        try {
          const { TaskService } = await import('../services/taskService');
          const tsvc = new TaskService((storyService as any)['api']);
          const ok = await vscode.window.showWarningMessage('Delete this task?', { modal: true }, 'Delete');
          if (ok === 'Delete') {
            await tsvc.deleteTask(Number(msg.taskId));
            const refreshed = await tsvc.listTasksByUserStory(full.id as number);
            panel.webview.postMessage({ type: 'setLinkedTasks', tasks: refreshed });
            vscode.commands.executeCommand('taiga.refreshAll');
          }
        } catch {}
      }
      if (msg.type === 'cancel') panel.dispose();
    });
    panel.onDidChangeViewState(async (e) => {
      if (e.webviewPanel.active) {
        try {
          const refreshed = await taskService.listTasksByUserStory(full.id as number);
          panel.webview.postMessage({ type: 'setLinkedTasks', tasks: refreshed });
        } catch {}
      }
    });
  }
}

// Normalize an id-like value (number, string, or object with id/pk) into a string for safe comparisons
function normalizeId(val: any): string | undefined {
  if (val == null) return undefined;
  let v: any = val;
  if (typeof v === 'object') {
    if ('id' in v) v = (v as any).id;
    else if ('pk' in v) v = (v as any).pk;
    else return undefined;
  }
  const n = Number(v);
  return isNaN(n) ? String(v) : String(n);
}

function projectIdOf(obj: any): string | undefined {
  if (!obj) return undefined;
  return normalizeId(obj.projectId ?? obj.project_id ?? obj.project);
}

function renderHtml(csp: string, nonce: string, opts: { mode: 'create'|'edit'; projectId?: number; story?: UserStory; epics: Epic[]; sprints: Sprint[]; users?: UserRef[]; statuses?: Array<{ id: number; name: string }>; roles?: Array<{ id:number; name:string; slug?: string; computable?: boolean }>; points?: Array<{ id:number; name?:string; value?: number }>; preselectedEpicIds?: number[]; siteBaseUrl?: string; projectSlug?: string; linkedTasks?: any[]; taskStatuses?: Array<{ id:number; name:string }> }) {
  const story = opts.story;
  const subject = story?.subject || '';
  const description = (story as any)?.description || '';
  // Build selected epic ids further below; no single epicId used anymore
  const sprintId = (story as any)?.milestone || story?.milestoneId;
  const statusId = (story as any)?.status?.id ?? (story as any)?.status ?? '';
  const assignedId = (story as any)?.assigned_to || (story as any)?.assignedTo;
  const tags: string[] = Array.isArray((story as any)?.tags) ? (story as any)?.tags.map((t:any)=>String(t??'').replace(/,+$/,'').trim()).filter((t:string)=>t.length>0) : [];
  // Build set of selected epic ids from story.epics (array) or single epic field
  const selectedEpicIds = (() => {
    const s:any = story || {};
    if (Array.isArray(s.epics)) {
      return s.epics
        .map((x:any)=>{
          if (x == null) return NaN;
          if (typeof x === 'object') {
            const v = (x.id ?? x.pk ?? x.ref ?? undefined);
            const n = Number(v);
            return isNaN(n) ? NaN : n;
          }
          const n = Number(x);
          return isNaN(n) ? NaN : n;
        })
        .filter((n:number)=>!isNaN(n));
    }
    const single = s?.epic ?? s?.epicId;
    const base = (single!=null) ? [Number(single)] : [];
    if (opts.mode==='create' && Array.isArray(opts.preselectedEpicIds) && opts.preselectedEpicIds.length) {
      return Array.from(new Set([...base, ...opts.preselectedEpicIds.map(n=>Number(n)).filter(n=>!isNaN(n))]));
    }
    return base;
  })();
  // De-duplicate epics by id to avoid duplicates across projects/responses
  const epicsDedup = (() => {
    const pid = opts.mode==='create' ? String(opts.projectId ?? '') : projectIdOf(story as any);
    const filtered = (opts.epics || []).filter((e: any) => {
      const eid = projectIdOf(e);
      return !pid || !eid || String(eid) === String(pid);
    });
    return Array.from(new Map(filtered.map(e => [String((e as any).id), e])).values());
  })();
  const epicOptions = epicsDedup.map(e => {
    const label = (e as any).subject || (e as any).title || (e as any).name || '';
    const sel = selectedEpicIds.some((id: any) => String(id)===String((e as any).id)) ? ' selected' : '';
    return `<option value="${e.id}"${sel}>${escapeHtml(label)}</option>`;
  }).join('');
  const sProjectId = opts.mode==='create' ? String(opts.projectId ?? '') : projectIdOf(story as any);
  const sprintsFiltered = Array.from(new Map((opts.sprints || [])
    .filter((s:any)=> {
      const sid = projectIdOf(s);
      return !sProjectId || !sid || String(sid)===String(sProjectId);
    })
    .map(s => [String((s as any).id), s])).values());
  const sprintOptions = ['<option value="">(none)</option>', ...sprintsFiltered.map(s => `<option value="${(s as any).id}" ${sprintId=== (s as any).id?'selected':''}>${escapeHtml((s as any).name || String((s as any).id))}</option>`)].join('');
  const users = opts.users || [];
  const userOptions = ['<option value="">Unassigned</option>', ...users.map(u=>`<option value="${u.id}" ${String(assignedId)===String(u.id)?'selected':''}>${escapeHtml(u.fullName || u.username)}</option>`)].join('');
  const statuses = Array.from(new Map((opts.statuses || []).map(s => [String(s.id), s])).values());
  const statusOptions = ['<option value="">(none)</option>', ...statuses.map(s=>`<option value="${s.id}" ${String(statusId)===String(s.id)?'selected':''}>${escapeHtml(s.name)}</option>`)].join('');
  const isBlocked = !!(story as any)?.is_blocked || !!(story as any)?.blocked;
  const blockedReason = (story as any)?.blocked_note || (story as any)?.blocked_reason || '';
  const storyRef = (story as any)?.ref || (story as any)?.id;
  const linkedTasks = Array.isArray((opts as any).linkedTasks) ? (opts as any).linkedTasks : [];
  const taskStatuses = Array.isArray((opts as any).taskStatuses) ? (opts as any).taskStatuses : [];
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);}
  .loading{opacity:.8; font-style: italic;}
  .row{display:flex; gap:8px; align-items:center; margin:6px 0;}
    input[type=text], textarea, select, input[type=date]{width:100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(0,0,0,0.18)); padding: 4px 6px; border-radius: 2px;}
    @media (prefers-color-scheme: dark){ input[type=text], textarea, select, input[type=date]{ border-color: var(--vscode-input-border, rgba(255,255,255,0.18)); } input[type="date"]::-webkit-calendar-picker-indicator{ filter: invert(1) contrast(1.1); } }
    @media (prefers-color-scheme: light){ input[type="date"]::-webkit-calendar-picker-indicator{ filter: none; } }
  /* Runtime fallback: if we detect a dark-like background, force invert on the indicator */
  .darklike input[type="date"]::-webkit-calendar-picker-indicator{ filter: invert(1) brightness(1.2) contrast(1.1); }
  .actions{display:flex; gap:8px; margin-top:12px;}
  button{ background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border, transparent); border-radius: 2px; padding: 4px 10px; }
  button:hover{ background: var(--vscode-button-hoverBackground); }
  label{min-width:100px;}
  .header{ display:flex; align-items:center; justify-content: space-between; margin-bottom: 8px; }
    .right{ display:flex; align-items:center; gap:8px; }
    .header .right select{ width: 220px; }
  table.points{ width:100%; border-collapse: collapse; }
  table.points th, table.points td{ border:1px solid var(--vscode-input-border, rgba(128,128,128,.3)); padding:4px 6px; }
  table.points td.points-cell input, table.points td.points-cell select { text-align: right; text-align-last: right; width:100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(0,0,0,0.18)); padding: 4px 6px; border-radius: 2px; }
  /* Linked Tasks list styles (mirrors Epic editor list) */
  table.list{ width:100%; border-collapse: collapse; margin-top: 12px; table-layout: fixed; }
  table.list th, table.list td{ border:1px solid var(--vscode-input-border, rgba(128,128,128,.3)); padding:4px 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  th.sortable{ cursor:pointer; user-select: none; }
  th.sortable .dir{ opacity:.6; font-size: 11px; margin-left: 4px; }
  #taskSearch{ width:220px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px; border-radius: 2px; }
  .list-header{ display:flex; align-items:center; justify-content: space-between; margin-top: 16px; }
  .context-menu{ position:fixed; z-index:9999; background: var(--vscode-editor-background); border:1px solid var(--vscode-widget-border); box-shadow: 0 2px 8px rgba(0,0,0,.2); display:none; }
  .context-menu button{ display:block; width:100%; text-align:left; padding:6px 10px; background:transparent; border:0; color: var(--vscode-foreground); }
  .context-menu button:hover{ background: var(--vscode-list-hoverBackground); }
  .note{ opacity:.8; font-style: italic; font-size: 12px; }
  tr.closed td{ text-decoration: line-through; color: var(--vscode-disabledForeground, #9aa0a6); opacity: .85; }
  </style></head>
  <body>
  <script nonce="${nonce}">/* detect dark background and mark body for calendar icon contrast */(function(){try{var cs=getComputedStyle(document.body);var bg=cs.getPropertyValue('--vscode-editor-background').trim();function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return {r:r,g:g,b:b};}function parseBg(s){if(!s)return null;var m=s.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(m){return {r:+m[1],g:+m[2],b:+m[3]};}if(/^#/.test(s)){return hexToRgb(s);}return null;}var rgb=parseBg(bg);if(rgb){var L=0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b; if(L<140){document.body.classList.add('darklike');}}}catch(e){}})();</script>
  <div id="loading" class="loading" style="display:none;">Loading…</div>
  <div class="header">
    <h3 style="margin:0;">${opts.mode === 'create' ? 'Create User Story' : 'Edit User Story'}${opts.mode==='edit' && storyRef ? ` <em style="font-weight: normal; opacity: .8;">#${escapeHtml(String(storyRef))}</em>` : ''}</h3>
    <div class="right"><label style="min-width:auto;">Assigned to</label><select id="assigned">${userOptions}</select></div>
  </div>
  <div class="row"><label>Subject</label><input id="subject" type="text" value="${escapeHtml(subject)}" /></div>
  <div class="row"><label>Description</label><textarea id="desc" rows="6">${escapeHtml(description)}</textarea></div>
  <div class="row"><label>Epics</label><select id="epic" multiple size="5">${epicOptions}</select></div>
  <div class="row"><label>Sprint</label><select id="sprint">${sprintOptions}</select></div>
  <div class="row"><label>Status</label><select id="status">${statusOptions}</select></div>
  <div class="row"><label>Due date</label><input id="dueDate" type="date" value="${escapeHtml(((story as any)?.due_date || '').toString().slice(0,10))}" /></div>
    <div class="row"><label>Flags</label>
      <div class="flags" style="display:flex; gap:8px; align-items:center; width:100%;">
        <button id="teamReq" title="Team requirement">👥</button>
        <button id="clientReq" title="Client requirement">👤</button>
        <button id="blocked" title="Blocked">⛔</button>
        <input id="blockedReason" type="text" placeholder="Reason" value="${escapeHtml(String(blockedReason||''))}" />
      </div>
    </div>
  <div class="row"><label>Tags</label><input id="tags" type="text" placeholder="Comma-separated" value="${escapeHtml(tags.join(', '))}" /></div>
  <div class="row"><label>Story points</label>
    <div style="flex:1;">
      <table class="points">
        <thead><tr><th>Role</th><th>Points</th></tr></thead>
        <tbody id="pointsBody"></tbody>
      </table>
      <div id="pointsNote" class="note" style="margin-top: 4px;">Only computable roles can have story points. Non-computable roles are hidden.</div>
    </div>
  </div>
  ${(() => {
    const base = (opts as any).siteBaseUrl || '';
    const slug = (opts as any).projectSlug;
    let url = '';
    if (opts.mode === 'edit') {
      const idPart = String((story as any)?.ref || (story as any)?.id || '');
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/us/${idPart}` : `${base}/us/${idPart}`;
      }
    } else {
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/us` : `${base}/us`;
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
    <h4 style="margin:6px 0;">Linked Tasks</h4>
    <div class="right">
      <input id="taskSearch" type="text" placeholder="Search..." />
      <button id="addExistingTask">Add existing…</button>
      <button id="createNewTask">Create a new task…</button>
    </div>
  </div>
  <table class="list">
    <thead><tr>
      <th class="sortable" data-key="id" style="width:90px;">Ref <span class="dir" id="dir2-id"></span></th>
      <th class="sortable" data-key="name">Name <span class="dir" id="dir2-name"></span></th>
      <th class="sortable" data-key="assigned" style="width:200px;">Assigned to <span class="dir" id="dir2-assigned"></span></th>
      <th class="sortable" data-key="status" style="width:160px;">Status <span class="dir" id="dir2-status"></span></th>
    </tr></thead>
    <tbody id="tasksBody"></tbody>
  </table>
  <div id="tmenu" class="context-menu"></div>
  ` : ''}
  <script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const __users = ${JSON.stringify(users)};
  const __taskStatuses = ${JSON.stringify(taskStatuses)};
  let __tasks = Array.isArray(${JSON.stringify(linkedTasks)}) ? ${JSON.stringify(linkedTasks)} : [];
  let __tSortKey = 'id';
  let __tSortDir = 'asc';
  let __tSearch = '';
  function computeTaskRows(){
    function toRow(t){
      const dataId = t && t.id;
      const displayId = (t && (t.ref!=null ? t.ref : t.id));
      const name = (t && t.subject) || '';
      const assignedId = (t && (t.assigned_to!=null ? t.assigned_to : t.assignedTo));
      const assigned = __users.find(u=>String(u.id)===String(assignedId)) || {};
      const assignedName = assigned.fullName || assigned.username || '';
      const statusId = (t && (t.status && t.status.id || t.status || t.statusId));
      const st = __taskStatuses.find(ss=>String(ss.id)===String(statusId)) || {};
      const statusName = st.name || (statusId||'');
      const slug = (st && (st.slug || '')) || '';
      const low = String(slug || statusName).toLowerCase();
      // Robust closed detection: prefer explicit flags, then fall back to text heuristics
      const closedByText = /\b(closed|done|completed|resolved|archived)\b/.test(low);
      const isClosed = Boolean((st && (st.is_closed || st.isClosed)) || (t && (t.is_closed || t.closed)) || closedByText);
      return { dataId, displayId, name, assignedName, statusName, raw: t, closed: isClosed };
    }
    let rows = __tasks.map(toRow);
    if (__tSearch && __tSearch.trim().length){
      const q = __tSearch.trim().toLowerCase();
      rows = rows.filter(r => String(r.displayId).toLowerCase().includes(q) || String(r.name).toLowerCase().includes(q) || String(r.assignedName).toLowerCase().includes(q) || String(r.statusName).toLowerCase().includes(q));
    }
    const cmp = (a,b)=>{
      // Always push closed rows to the bottom regardless of secondary sort
      const ca = a.closed ? 1 : 0;
      const cb = b.closed ? 1 : 0;
      if (ca !== cb) return ca - cb;
      const dir = (__tSortDir==='asc') ? 1 : -1;
      switch(__tSortKey){
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
  function renderTaskSortIndicators(){
    ['id','name','assigned','status'].forEach(k=>{
      const el = document.getElementById('dir2-'+k); if (!el) return; el.textContent = (__tSortKey===k) ? (__tSortDir==='asc' ? '▲' : '▼') : '';
    });
  }
  function setTasks(tasks){ __tasks = Array.isArray(tasks) ? tasks.slice() : []; renderTasksTable(); }
  function renderTasksTable(){
    const body = document.getElementById('tasksBody'); if (!body) return;
    const rows = computeTaskRows();
    body.innerHTML = rows.map(r => (
      '<tr data-id="'+r.dataId+'" class="task-row'+(r.closed?' closed':'')+'">'
      + '<td style="width:90px;">'+String(r.displayId)+'</td>'
      + '<td>'+String(r.name)+'</td>'
      + '<td style="width:200px;">'+String(r.assignedName)+'</td>'
      + '<td style="width:160px;">'+String(r.statusName)+'</td>'
      + '</tr>'
    )).join('');
    renderTaskSortIndicators();
  }
  (function(){
    var search = document.getElementById('taskSearch');
    if (search) search.addEventListener('input', function(){ __tSearch = (search && search.value) ? search.value : ''; renderTasksTable(); });
    var ths = document.querySelectorAll('th.sortable'); ths.forEach(function(th){ th.addEventListener('click', function(){ var key = th.getAttribute('data-key'); if (!key) return; if (th.closest('table') && th.closest('table').contains(document.getElementById('tasksBody'))) { if (__tSortKey === key) { __tSortDir = (__tSortDir==='asc') ? 'desc' : 'asc'; } else { __tSortKey = key; __tSortDir = 'asc'; } renderTasksTable(); } }); });
    renderTasksTable();
  })();
  window.addEventListener('message', function(e){ var msg=e.data||{}; if (msg.type==='setLinkedTasks'){ setTasks(msg.tasks||[]); }});
  var addTaskBtn = document.getElementById('addExistingTask'); if (addTaskBtn) addTaskBtn.addEventListener('click', function(){ vscode.postMessage({ type: 'addExistingTask' }); });
  var createTaskBtn = document.getElementById('createNewTask'); if (createTaskBtn) createTaskBtn.addEventListener('click', function(){ vscode.postMessage({ type: 'createNewTask' }); });
  var tmenu = document.getElementById('tmenu');
  function hideTaskMenu(){ if (tmenu) { tmenu.style.display='none'; tmenu.innerHTML=''; } }
  function showTaskMenu(x, y, id){ if (!tmenu) return; tmenu.innerHTML='';
    function add(label, type){ var b=document.createElement('button'); b.textContent=label; b.addEventListener('click', function(e){ e.stopPropagation(); hideTaskMenu(); vscode.postMessage({ type: type, taskId: Number(id) }); }); tmenu.appendChild(b); }
    add('Edit the task…','editTask');
    add('Remove the task from the story','removeTask');
    add('Delete the task','deleteTask');
    tmenu.style.display='block';
    // Clamp to viewport after display to measure size
    var mw = tmenu.offsetWidth || 180; var mh = tmenu.offsetHeight || 100;
    var nx = Math.max(0, Math.min(x, (window.innerWidth || 0) - mw - 4));
    var ny = Math.max(0, Math.min(y, (window.innerHeight || 0) - mh - 4));
    tmenu.style.left = nx + 'px'; tmenu.style.top = ny + 'px';
  }
  var tasksBodyEl = document.getElementById('tasksBody');
  function getRow(target){ return target && target.closest ? target.closest('.task-row') : null; }
  if (tasksBodyEl) {
    tasksBodyEl.addEventListener('contextmenu', function(ev){ var row = getRow(ev.target); if (row) { ev.preventDefault(); ev.stopPropagation(); var id = row.getAttribute('data-id'); showTaskMenu(ev.pageX, ev.pageY, id); } });
    // Fallback for environments where contextmenu is suppressed
    tasksBodyEl.addEventListener('mousedown', function(ev){ if (ev.button === 2) { var row = getRow(ev.target); if (row) { ev.preventDefault(); ev.stopPropagation(); var id = row.getAttribute('data-id'); showTaskMenu(ev.pageX, ev.pageY, id); } } });
  }
  // Block default text context menu when interacting with task rows or our custom menu
  document.addEventListener('contextmenu', function(ev){ var target = ev.target || null; var insideTaskRow = target && target.closest ? target.closest('.task-row') : null; var insideMenu = target && target.closest ? target.closest('#tmenu') : null; if (insideTaskRow || insideMenu) { ev.preventDefault(); ev.stopPropagation(); } });
  document.addEventListener('click', function(ev){ if (!tmenu) return; if (tmenu.style.display!=='block') return; if (!tmenu.contains(ev.target)) hideTaskMenu(); });
  document.addEventListener('keydown', function(ev){ if ((ev.key||'').toLowerCase()==='escape') hideTaskMenu(); });
  document.addEventListener('scroll', function(){ hideTaskMenu(); }, true);
  window.addEventListener('blur', function(){ hideTaskMenu(); });
  // Simple loading placeholder toggle in case of slow initialization
  (function(){ try { var ld=document.getElementById('loading'); if(ld){ ld.style.display='none'; } } catch(e){} })();
    const teamBtn = document.getElementById('teamReq');
    const clientBtn = document.getElementById('clientReq');
  const blockedBtn = document.getElementById('blocked');
  const blockedReasonInput = document.getElementById('blockedReason');
  function renderFlag(btn, active){ btn.style.opacity = active ? '1' : '0.5'; }
    let teamRequirement = ${((story as any)?.team_requirement ? 'true' : 'false')};
    let clientRequirement = ${((story as any)?.client_requirement ? 'true' : 'false')};
  let _isBlocked = ${isBlocked ? 'true' : 'false'};
    if (teamBtn) { renderFlag(teamBtn, teamRequirement); teamBtn.addEventListener('click', ()=>{ teamRequirement = !teamRequirement; renderFlag(teamBtn, teamRequirement); }); }
    if (clientBtn) { renderFlag(clientBtn, clientRequirement); clientBtn.addEventListener('click', ()=>{ clientRequirement = !clientRequirement; renderFlag(clientBtn, clientRequirement); }); }
    if (blockedBtn) { renderFlag(blockedBtn, _isBlocked); blockedBtn.addEventListener('click', ()=>{ _isBlocked = !_isBlocked; renderFlag(blockedBtn, _isBlocked); }); }
  const epicSel = document.getElementById('epic');
  // Initialize role-based points rows from possible story points maps (roleId -> pointId/value).
  const pointsBody = document.getElementById('pointsBody');
  try {
    // Build and de-duplicate roles by id and by name (case-insensitive)
    const rolesRaw = ${JSON.stringify((opts.roles || []).map(r=>({id:r.id, name:r.name, slug: (r as any)?.slug, computable: (r as any)?.computable})))};
    var roles = Array.isArray(rolesRaw) ? Array.from(new Map(rolesRaw.map(function(r){ return [String(r.id), { id: r.id, name: r.name, slug: r.slug }]; })).values()) : [];
    // Second pass: collapse duplicates that have the same normalized name
    if (Array.isArray(roles)) {
      var byName = new Map();
      var unique = [];
      roles.forEach(function(r){
        var key = String((r && r.name ? r.name : '')).trim().toLowerCase();
        if (!byName.has(key)) { byName.set(key, true); unique.push(r); }
      });
      roles = unique;
    }
    // Filter out non-computable roles if computable flag is present
    roles = roles.filter(function(r){ return (rolesRaw.find(function(x){ return String(x.id)===String(r.id); }) || {}).computable !== false; });
    // existing points candidates (different Taiga versions/serializations)
    const existingCandidates = ${JSON.stringify({
      points: (story as any)?.points ?? null,
      role_points: (story as any)?.role_points ?? null,
      points_by_role: (story as any)?.points_by_role ?? null,
      total_points: (story as any)?.total_points ?? null
    })};
    function normalizeExisting(c){
      var out = {};
      function take(obj){
        for (var k in obj){ if (!Object.prototype.hasOwnProperty.call(obj,k)) continue; var v = obj[k];
          if (v && typeof v === 'object') { if ('id' in v) out[k] = v.id; else if ('pk' in v) out[k] = v.pk; else if ('value' in v) out[k] = v.value; else if ('point' in v && v.point && typeof v.point==='object' && 'id' in v.point) out[k] = v.point.id; }
          else { out[k] = v; }
        }
      }
      if (!c) return out;
      if (c.points && typeof c.points === 'object') take(c.points);
      if (c.role_points && typeof c.role_points === 'object') take(c.role_points);
      if (c.points_by_role && typeof c.points_by_role === 'object') take(c.points_by_role);
      return out;
    }
    const existingRaw = normalizeExisting(existingCandidates);
    // Build a flexible lookup by role id, slug, or name (case-insensitive)
    var existingLookup = new Map();
    Object.keys(existingRaw).forEach(function(k){
      var v = existingRaw[k];
      var asNum = Number(k);
      if (!isNaN(asNum)) existingLookup.set('id:' + String(asNum), v);
      if (typeof k === 'string') {
        var low = k.trim().toLowerCase();
        existingLookup.set('slug:' + low, v);
        existingLookup.set('name:' + low, v);
      }
    });
    const pointsList = ${JSON.stringify(opts.points || [])};
    function resolveExistingForRole(role){
      var byId = existingLookup.get('id:' + String(role.id));
      if (byId != null) return byId;
      var bySlug = role.slug ? existingLookup.get('slug:' + String(role.slug).trim().toLowerCase()) : undefined;
      if (bySlug != null) return bySlug;
      var byName = role.name ? existingLookup.get('name:' + String(role.name).trim().toLowerCase()) : undefined;
      return byName;
    }
    function addRow(role){
      const tr = document.createElement('tr');
      const roleId = role.id; const roleName = role.name || ('Role ' + roleId);
      var existing = resolveExistingForRole(role);
      var found = false;
      var opts = pointsList.map(function(p){
        var disp = (p && p.value != null) ? String(p.value) : (p && p.name ? String(p.name) : '');
        var isSel = (String(existing)===String(p.id) || String(existing)===String(p.value));
        if (isSel) found = true;
        return '<option value="' + p.id + '"' + (isSel ? ' selected' : '') + '>' + disp + '</option>';
      });
      var unknown = (!found && existing !== '' && existing != null) ? '<option value="" selected disabled>(' + String(existing) + ')</option>' : '<option value=""></option>';
      const options = [unknown].concat(opts).join('');
      var cellHtml = '<td data-roleid="' + roleId + '">' + roleName + '</td>' +
                     '<td class="points-cell"><select>' + options + '</select></td>';
      tr.innerHTML = cellHtml;
      if (pointsBody) pointsBody.appendChild(tr);
    }
    function addGenericRow(){
      const tr = document.createElement('tr');
      var total = ${JSON.stringify(((opts.story as any)?.total_points) ?? null)};
      var found = false;
      var optsHtml = pointsList.map(function(p){
        var disp = (p && p.value != null) ? String(p.value) : (p && p.name ? String(p.name) : (p && p.id != null ? String(p.id) : ''));
        var isSel = (total != null && (String(total)===String(p.value) || String(total)===String(p.name) || String(total)===String(p.id)));
        if (isSel) found = true;
        return '<option value="' + p.id + '"' + (isSel ? ' selected' : '') + '>' + disp + '</option>';
      });
      var unknown = (!found && total != null) ? '<option value="" selected disabled>(' + String(total) + ')</option>' : '<option value=""></option>';
      const options = [unknown].concat(optsHtml).join('');
      tr.innerHTML = '<td data-roleid="">Points</td><td class="points-cell"><select>' + options + '</select></td>';
      if (pointsBody) pointsBody.appendChild(tr);
    }
    if (Array.isArray(roles) && roles.length) { roles.forEach(function(r){ addRow(r); }); } else { addGenericRow(); }
  } catch (e) {}
  const saveBtn = document.getElementById('save');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    // Collect role->points mapping
    const pts = {};
    if (pointsBody) {
      Array.from(pointsBody.querySelectorAll('tr')).forEach(function(tr){
        var td = tr.querySelector('td');
        var roleId = td ? td.getAttribute('data-roleid') : null;
        var select = tr.querySelector('select');
        if (select && select.value !== '' && roleId) {
          var idVal = Number(select.value);
          if (!isNaN(idVal)) { pts[roleId] = idVal; }
        }
      });
    }
    // Collect selected epics (multi-select)
    var epicIds = [];
    try {
      if (epicSel && epicSel.selectedOptions) {
        epicIds = Array.from(epicSel.selectedOptions).map(function(o){ return Number(o.value); }).filter(function(n){ return !isNaN(n); });
      } else if (epicSel && epicSel.value) {
        var v = Number(epicSel.value); if (!isNaN(v)) epicIds = [v];
      }
    } catch (e) {}
    vscode.postMessage({ type: 'save', payload: {
      subject: (document.getElementById('subject')).value,
      description: (document.getElementById('desc')).value,
      epicIds: epicIds,
      sprintId: parseNullableInt((document.getElementById('sprint')).value),
      statusId: parseNullableInt((document.getElementById('status')).value),
      assignedTo: parseNullableInt((document.getElementById('assigned')).value),
      tags: (document.getElementById('tags')).value.split(',').map(s=>s.replace(/,+$/, '').trim()).filter(s=>s.length>0),
      team_requirement: teamRequirement,
      client_requirement: clientRequirement,
  is_blocked: _isBlocked,
  blocked_reason: blockedReasonInput ? (blockedReasonInput).value : '',
      due_date: (document.getElementById('dueDate')).value,
      points: pts
    }});
  });
  const cancelBtn = document.getElementById('cancel');
  if (cancelBtn && cancelBtn.addEventListener) cancelBtn.addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));
  function parseNullableInt(v){ return v===''? undefined : Number(v); }
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
function renderLoadingHtml(csp: string){
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);} .loading{opacity:.8; font-style: italic;}
  </style></head>
  <body><div class="loading">Loading…</div></body></html>`;
}
