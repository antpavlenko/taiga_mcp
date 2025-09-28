"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/sprintService.ts
var sprintService_exports = {};
__export(sprintService_exports, {
  SprintService: () => SprintService
});
var SprintService;
var init_sprintService = __esm({
  "src/services/sprintService.ts"() {
    "use strict";
    SprintService = class {
      constructor(api) {
        this.api = api;
      }
      async listSprints(projectId) {
        const { data, error } = await this.api.get("/milestones", { query: { project: projectId } });
        if (error || data == null)
          return [];
        if (Array.isArray(data))
          return data;
        if (Array.isArray(data.results))
          return data.results;
        return [];
      }
      async createSprint(input) {
        const payload = { project: input.projectId, name: input.name };
        if (input.startDate !== void 0)
          payload.estimated_start = input.startDate;
        if (input.endDate !== void 0)
          payload.estimated_finish = input.endDate;
        const { data, error } = await this.api.post("/milestones", payload);
        if (error)
          return void 0;
        return data;
      }
      async updateSprint(id, input) {
        const payload = {};
        if (input.name !== void 0)
          payload.name = input.name;
        if (input.startDate !== void 0)
          payload.estimated_start = input.startDate;
        if (input.endDate !== void 0)
          payload.estimated_finish = input.endDate;
        if (input.closed !== void 0)
          payload.closed = input.closed;
        const { data, error } = await this.api.patch(`/milestones/${id}`, payload);
        if (error)
          return void 0;
        return data;
      }
      async deleteSprint(id) {
        const { status, error } = await this.api.delete(`/milestones/${id}`);
        return !error && status >= 200 && status < 300;
      }
      async getSprint(id) {
        const { data, error } = await this.api.get(`/milestones/${id}`);
        if (error)
          return void 0;
        return data;
      }
    };
  }
});

// src/services/taskService.ts
var taskService_exports = {};
__export(taskService_exports, {
  TaskService: () => TaskService
});
var TaskService;
var init_taskService = __esm({
  "src/services/taskService.ts"() {
    "use strict";
    TaskService = class {
      constructor(api) {
        this.api = api;
      }
      async listTasksByUserStory(userStoryId) {
        const { data, error } = await this.api.get("/tasks", { query: { user_story: userStoryId } });
        if (error || data == null)
          return [];
        if (Array.isArray(data))
          return data;
        if (Array.isArray(data.results))
          return data.results;
        return [];
      }
      async listTasksByProject(projectId) {
        const { data, error } = await this.api.get("/tasks", { query: { project: projectId } });
        if (error || data == null)
          return [];
        if (Array.isArray(data))
          return data;
        if (Array.isArray(data.results))
          return data.results;
        return [];
      }
      async createTask(input) {
        const payload = { project: input.projectId, user_story: input.userStoryId, subject: input.subject };
        if (input.description !== void 0)
          payload.description = input.description;
        if (input.statusId !== void 0)
          payload.status = input.statusId;
        if (input.assignedTo !== void 0)
          payload.assigned_to = input.assignedTo;
        if (input.dueDate !== void 0)
          payload.due_date = input.dueDate;
        if (input.tags !== void 0)
          payload.tags = input.tags;
        if (input.isBlocked !== void 0)
          payload.is_blocked = input.isBlocked;
        const { data, error } = await this.api.post("/tasks", payload);
        if (error)
          return void 0;
        return data;
      }
      async updateTask(id, input) {
        const payload = {};
        if (input.subject !== void 0)
          payload.subject = input.subject;
        if (input.description !== void 0)
          payload.description = input.description;
        if (input.statusId !== void 0)
          payload.status = input.statusId;
        if (input.assignedTo !== void 0)
          payload.assigned_to = input.assignedTo;
        if (input.userStoryId !== void 0)
          payload.user_story = input.userStoryId;
        if (input.dueDate !== void 0)
          payload.due_date = input.dueDate;
        if (input.tags !== void 0)
          payload.tags = input.tags;
        if (input.isBlocked !== void 0)
          payload.is_blocked = input.isBlocked;
        if (input.version !== void 0)
          payload.version = input.version;
        const { data, error } = await this.api.patch(`/tasks/${id}`, payload);
        if (error)
          return void 0;
        return data;
      }
      async deleteTask(id) {
        const { status, error } = await this.api.delete(`/tasks/${id}`);
        return !error && status >= 200 && status < 300;
      }
      async getTask(id) {
        const { data, error } = await this.api.get(`/tasks/${id}`);
        if (error)
          return void 0;
        return data;
      }
      async listTaskStatuses(projectId) {
        const { data, error } = await this.api.get("/task-statuses", { query: { project: projectId } });
        if (error || data == null)
          return [];
        const arr = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
        const seen = /* @__PURE__ */ new Set();
        const out = [];
        for (const s of arr) {
          const key = String(s?.id);
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ id: s.id, name: s.name, slug: s.slug });
          }
        }
        return out;
      }
      async listTasksNotInStory(projectId, userStoryId) {
        const all = await this.listTasksByProject(projectId);
        const target = String(userStoryId);
        return all.filter((t) => String(t?.user_story ?? t?.userStoryId ?? "") !== target);
      }
    };
  }
});

// src/services/userService.ts
var UserService;
var init_userService = __esm({
  "src/services/userService.ts"() {
    "use strict";
    UserService = class {
      constructor(api) {
        this.api = api;
      }
      async listProjectUsers(projectId) {
        const { data, error } = await this.api.get("/memberships", { query: { project: projectId } });
        if (!error && data) {
          const arr = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
          if (Array.isArray(arr)) {
            const mapped = arr.map((m) => {
              const u = typeof m.user === "object" && m.user ? m.user : typeof m.member === "object" && m.member ? m.member : void 0;
              const id = u?.id ?? m.user ?? m.member;
              const usernameFromUser = u?.username || u?.user_name || u?.email;
              const fullNameFromUser = u?.full_name || u?.fullName || u?.user_full_name;
              const usernameFromMembership = m.user_email || m.email || (typeof id !== "undefined" ? String(id) : void 0);
              const fullNameFromMembership = m.full_name || m.user_full_name || void 0;
              const username = usernameFromUser || usernameFromMembership;
              const fullName = fullNameFromUser || fullNameFromMembership;
              return { id, username, fullName };
            }).filter((u) => u.id !== void 0 && u.id !== null);
            if (mapped.length)
              return mapped;
          }
        }
        const { data: data2 } = await this.api.get("/users", { query: { project: projectId } });
        const arr2 = Array.isArray(data2) ? data2 : Array.isArray(data2?.results) ? data2.results : [];
        return (arr2 || []).map((u) => ({ id: u.id, username: u.username || u.email || String(u.id), fullName: u.full_name || u.fullName }));
      }
    };
  }
});

// src/editors/storyEditor.ts
var storyEditor_exports = {};
__export(storyEditor_exports, {
  StoryEditor: () => StoryEditor
});
function normalizeId(val) {
  if (val == null)
    return void 0;
  let v = val;
  if (typeof v === "object") {
    if ("id" in v)
      v = v.id;
    else if ("pk" in v)
      v = v.pk;
    else
      return void 0;
  }
  const n = Number(v);
  return isNaN(n) ? String(v) : String(n);
}
function projectIdOf(obj) {
  if (!obj)
    return void 0;
  return normalizeId(obj.projectId ?? obj.project_id ?? obj.project);
}
function renderHtml(csp, nonce, opts) {
  const story = opts.story;
  const subject = story?.subject || "";
  const description = story?.description || "";
  const sprintId = story?.milestone || story?.milestoneId;
  const statusId = story?.status?.id ?? story?.status ?? "";
  const assignedId = story?.assigned_to || story?.assignedTo;
  const tags = Array.isArray(story?.tags) ? story?.tags.map((t) => String(t ?? "").replace(/,+$/, "").trim()).filter((t) => t.length > 0) : [];
  const selectedEpicIds = (() => {
    const s = story || {};
    if (Array.isArray(s.epics)) {
      return s.epics.map((x) => {
        if (x == null)
          return NaN;
        if (typeof x === "object") {
          const v = x.id ?? x.pk ?? x.ref ?? void 0;
          const n2 = Number(v);
          return isNaN(n2) ? NaN : n2;
        }
        const n = Number(x);
        return isNaN(n) ? NaN : n;
      }).filter((n) => !isNaN(n));
    }
    const single = s?.epic ?? s?.epicId;
    const base = single != null ? [Number(single)] : [];
    if (opts.mode === "create" && Array.isArray(opts.preselectedEpicIds) && opts.preselectedEpicIds.length) {
      return Array.from(/* @__PURE__ */ new Set([...base, ...opts.preselectedEpicIds.map((n) => Number(n)).filter((n) => !isNaN(n))]));
    }
    return base;
  })();
  const epicsDedup = (() => {
    const pid = opts.mode === "create" ? String(opts.projectId ?? "") : projectIdOf(story);
    const filtered = (opts.epics || []).filter((e) => {
      const eid = projectIdOf(e);
      return !pid || !eid || String(eid) === String(pid);
    });
    return Array.from(new Map(filtered.map((e) => [String(e.id), e])).values());
  })();
  const epicOptions = epicsDedup.map((e) => {
    const label = e.subject || e.title || e.name || "";
    const sel = selectedEpicIds.some((id) => String(id) === String(e.id)) ? " selected" : "";
    return `<option value="${e.id}"${sel}>${escapeHtml2(label)}</option>`;
  }).join("");
  const sProjectId = opts.mode === "create" ? String(opts.projectId ?? "") : projectIdOf(story);
  const sprintsFiltered = Array.from(new Map((opts.sprints || []).filter((s) => {
    const sid = projectIdOf(s);
    return !sProjectId || !sid || String(sid) === String(sProjectId);
  }).map((s) => [String(s.id), s])).values());
  const sprintOptions = ['<option value="">(none)</option>', ...sprintsFiltered.map((s) => `<option value="${s.id}" ${sprintId === s.id ? "selected" : ""}>${escapeHtml2(s.name || String(s.id))}</option>`)].join("");
  const users = opts.users || [];
  const userOptions = ['<option value="">Unassigned</option>', ...users.map((u) => `<option value="${u.id}" ${String(assignedId) === String(u.id) ? "selected" : ""}>${escapeHtml2(u.fullName || u.username)}</option>`)].join("");
  const statuses = Array.from(new Map((opts.statuses || []).map((s) => [String(s.id), s])).values());
  const statusOptions = ['<option value="">(none)</option>', ...statuses.map((s) => `<option value="${s.id}" ${String(statusId) === String(s.id) ? "selected" : ""}>${escapeHtml2(s.name)}</option>`)].join("");
  const isBlocked = !!story?.is_blocked || !!story?.blocked;
  const storyRef = story?.ref || story?.id;
  const linkedTasks = Array.isArray(opts.linkedTasks) ? opts.linkedTasks : [];
  const taskStatuses = Array.isArray(opts.taskStatuses) ? opts.taskStatuses : [];
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
  <script nonce="${nonce}">/* detect dark background and mark body for calendar icon contrast */(function(){try{var cs=getComputedStyle(document.body);var bg=cs.getPropertyValue('--vscode-editor-background').trim();function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return {r:r,g:g,b:b};}function parseBg(s){if(!s)return null;var m=s.match(/rgba?((d+)s*,s*(d+)s*,s*(d+)/i);if(m){return {r:+m[1],g:+m[2],b:+m[3]};}if(/^#/.test(s)){return hexToRgb(s);}return null;}var rgb=parseBg(bg);if(rgb){var L=0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b; if(L<140){document.body.classList.add('darklike');}}}catch(e){}})();</script>
  <div id="loading" class="loading" style="display:none;">Loading\u2026</div>
  <div class="header">
    <h3 style="margin:0;">${opts.mode === "create" ? "Create User Story" : "Edit User Story"}${opts.mode === "edit" && storyRef ? ` <em style="font-weight: normal; opacity: .8;">#${escapeHtml2(String(storyRef))}</em>` : ""}</h3>
    <div class="right"><label style="min-width:auto;">Assigned to</label><select id="assigned">${userOptions}</select></div>
  </div>
  <div class="row"><label>Subject</label><input id="subject" type="text" value="${escapeHtml2(subject)}" /></div>
  <div class="row"><label>Description</label><textarea id="desc" rows="6">${escapeHtml2(description)}</textarea></div>
  <div class="row"><label>Epics</label><select id="epic" multiple size="5">${epicOptions}</select></div>
  <div class="row"><label>Sprint</label><select id="sprint">${sprintOptions}</select></div>
  <div class="row"><label>Status</label><select id="status">${statusOptions}</select></div>
  <div class="row"><label>Due date</label><input id="dueDate" type="date" value="${escapeHtml2((story?.due_date || "").toString().slice(0, 10))}" /></div>
    <div class="row"><label>Flags</label>
      <div class="flags" style="display:flex; gap:8px;">
        <button id="teamReq" title="Team requirement">\u{1F465}</button>
        <button id="clientReq" title="Client requirement">\u{1F464}</button>
        <button id="blocked" title="Blocked">\u26D4</button>
      </div>
    </div>
  <div class="row"><label>Tags</label><input id="tags" type="text" placeholder="Comma-separated" value="${escapeHtml2(tags.join(", "))}" /></div>
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
    const base = opts.siteBaseUrl || "";
    const slug = opts.projectSlug;
    let url = "";
    if (opts.mode === "edit") {
      const idPart = String(story?.ref || story?.id || "");
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/userstory/${idPart}` : `${base}/userstory/${idPart}`;
      }
    } else {
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/userstories` : `${base}/userstories`;
      }
    }
    const linkHtml = url ? ` (<a href="${url}" target="_blank">${escapeHtml2(url)}</a>)` : "";
    return `<div class="row"><label></label><div class="note">Comments can be edited in Taiga interface only${linkHtml}</div></div>`;
  })()}
  <div class="actions">
    <button id="save">Save</button>
    <button id="cancel">Cancel</button>
  </div>
  ${opts.mode === "edit" ? `
  <div class="list-header">
    <h4 style="margin:6px 0;">Linked Tasks</h4>
    <div class="right">
      <input id="taskSearch" type="text" placeholder="Search..." />
      <button id="addExistingTask">Add existing\u2026</button>
      <button id="createNewTask">Create a new task\u2026</button>
    </div>
  </div>
  <table class="list">
    <thead><tr>
      <th class="sortable" data-key="id" style="width:90px;">ID <span class="dir" id="dir2-id"></span></th>
      <th class="sortable" data-key="name">Name <span class="dir" id="dir2-name"></span></th>
      <th class="sortable" data-key="assigned" style="width:200px;">Assigned to <span class="dir" id="dir2-assigned"></span></th>
      <th class="sortable" data-key="status" style="width:160px;">Status <span class="dir" id="dir2-status"></span></th>
    </tr></thead>
    <tbody id="tasksBody"></tbody>
  </table>
  <div id="tmenu" class="context-menu"></div>
  ` : ""}
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
      const el = document.getElementById('dir2-'+k); if (!el) return; el.textContent = (__tSortKey===k) ? (__tSortDir==='asc' ? '\u25B2' : '\u25BC') : '';
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
    add('Edit the task\u2026','editTask');
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
  function renderFlag(btn, active){ btn.style.opacity = active ? '1' : '0.5'; }
    let teamRequirement = ${story?.team_requirement ? "true" : "false"};
    let clientRequirement = ${story?.client_requirement ? "true" : "false"};
  let _isBlocked = ${isBlocked ? "true" : "false"};
    if (teamBtn) { renderFlag(teamBtn, teamRequirement); teamBtn.addEventListener('click', ()=>{ teamRequirement = !teamRequirement; renderFlag(teamBtn, teamRequirement); }); }
    if (clientBtn) { renderFlag(clientBtn, clientRequirement); clientBtn.addEventListener('click', ()=>{ clientRequirement = !clientRequirement; renderFlag(clientBtn, clientRequirement); }); }
    if (blockedBtn) { renderFlag(blockedBtn, _isBlocked); blockedBtn.addEventListener('click', ()=>{ _isBlocked = !_isBlocked; renderFlag(blockedBtn, _isBlocked); }); }
  const epicSel = document.getElementById('epic');
  // Initialize role-based points rows from possible story points maps (roleId -> pointId/value).
  const pointsBody = document.getElementById('pointsBody');
  try {
    // Build and de-duplicate roles by id and by name (case-insensitive)
    const rolesRaw = ${JSON.stringify((opts.roles || []).map((r) => ({ id: r.id, name: r.name, slug: r?.slug, computable: r?.computable })))};
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
    points: story?.points ?? null,
    role_points: story?.role_points ?? null,
    points_by_role: story?.points_by_role ?? null,
    total_points: story?.total_points ?? null
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
      var total = ${JSON.stringify(opts.story?.total_points ?? null)};
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
function escapeHtml2(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function getNonce2() {
  let t = "";
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++)
    t += p.charAt(Math.floor(Math.random() * p.length));
  return t;
}
async function handleTokenError(service, fallbackMsg) {
  try {
    const api = service["api"];
    const test = await api.get("/users/me");
    if (test?.error && test.error.category === "auth") {
      const pick = await vscode10.window.showWarningMessage("Your Taiga session has expired. Reconnect?", "Reconnect");
      if (pick === "Reconnect") {
        await vscode10.commands.executeCommand("taiga.connect");
      }
    } else {
      vscode10.window.showErrorMessage(fallbackMsg);
    }
  } catch {
    vscode10.window.showErrorMessage(fallbackMsg);
  }
}
function renderLoadingHtml(csp) {
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);} .loading{opacity:.8; font-style: italic;}
  </style></head>
  <body><div class="loading">Loading\u2026</div></body></html>`;
}
var vscode10, StoryEditor;
var init_storyEditor = __esm({
  "src/editors/storyEditor.ts"() {
    "use strict";
    vscode10 = __toESM(require("vscode"));
    init_userService();
    StoryEditor = class {
      static async openForCreate(storyService, epicService, sprintService, projectId, preselectedEpicIds, siteBaseUrl, projectSlug) {
        const panel = vscode10.window.createWebviewPanel("taigaStoryEditor", "New User Story", vscode10.ViewColumn.Active, { enableScripts: true });
        const ext = vscode10.extensions.getExtension("antpavlenko.taiga-mcp-extension");
        if (ext)
          panel.iconPath = {
            light: vscode10.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
            dark: vscode10.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
          };
        const nonce = getNonce2();
        const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
        panel.webview.html = renderLoadingHtml(csp);
        const epics = await epicService.listEpics(projectId);
        const sprints = await sprintService.listSprints(projectId);
        const userService = new UserService(storyService["api"]);
        const users = await (async () => {
          try {
            return await userService.listProjectUsers(projectId);
          } catch {
            return [];
          }
        })();
        const statuses = await storyService.listUserStoryStatuses(projectId);
        const [roles, points] = await Promise.all([
          (async () => {
            try {
              return await storyService.listRoles(projectId);
            } catch {
              return [];
            }
          })(),
          (async () => {
            try {
              return await storyService.listPoints(projectId);
            } catch {
              return [];
            }
          })()
        ]);
        panel.webview.html = renderHtml(csp, nonce, { mode: "create", projectId, epics, sprints, users, statuses, roles, points, preselectedEpicIds, siteBaseUrl, projectSlug });
        panel.webview.onDidReceiveMessage(async (msg) => {
          if (msg.type === "save") {
            const { subject, description, epicIds, sprintId, statusId, assignedTo, tags, team_requirement, client_requirement, is_blocked, due_date, points: points2 } = msg.payload || {};
            const created = await storyService.createUserStory({ projectId, subject, description, epicIds: Array.isArray(epicIds) ? epicIds : void 0, milestoneId: sprintId, statusId, assignedTo, tags: Array.isArray(tags) ? tags.filter((t) => t && t.trim().length > 0) : void 0, teamRequirement: !!team_requirement, clientRequirement: !!client_requirement, isBlocked: !!is_blocked, dueDate: due_date || void 0, points: points2 });
            if (created) {
              vscode10.window.showInformationMessage("User Story created");
              panel.dispose();
              vscode10.commands.executeCommand("taiga.refreshAll");
            } else {
              await handleTokenError(storyService, "Creating user story failed");
            }
          }
          if (msg.type === "cancel")
            panel.dispose();
        });
      }
      static async openForEdit(storyService, epicService, sprintService, story, siteBaseUrl, projectSlug) {
        const panel = vscode10.window.createWebviewPanel("taigaStoryEditor", `Edit Story: ${story.subject || story.id}`, vscode10.ViewColumn.Active, { enableScripts: true });
        const ext2 = vscode10.extensions.getExtension("antpavlenko.taiga-mcp-extension");
        if (ext2)
          panel.iconPath = {
            light: vscode10.Uri.joinPath(ext2.extensionUri, "media/taiga-emblem-light.svg"),
            dark: vscode10.Uri.joinPath(ext2.extensionUri, "media/taiga-emblem-dark.svg")
          };
        const nonce = getNonce2();
        const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
        panel.webview.html = renderLoadingHtml(csp);
        const pidStr = projectIdOf(story);
        const pidNum = pidStr != null && !isNaN(Number(pidStr)) ? Number(pidStr) : typeof story?.projectId === "number" ? story.projectId : void 0;
        const epics = await epicService.listEpics(pidNum);
        const sprints = await sprintService.listSprints(pidNum);
        const userService = new UserService(storyService["api"]);
        const users = await (async () => {
          try {
            return await userService.listProjectUsers(pidNum);
          } catch {
            return [];
          }
        })();
        const statuses = await storyService.listUserStoryStatuses(pidNum);
        const [roles, points] = await Promise.all([
          (async () => {
            try {
              return await storyService.listRoles(pidNum);
            } catch {
              return [];
            }
          })(),
          (async () => {
            try {
              return await storyService.listPoints(pidNum);
            } catch {
              return [];
            }
          })()
        ]);
        const full = await (async () => {
          try {
            return await storyService.getUserStory(story.id) || story;
          } catch {
            return story;
          }
        })();
        const { TaskService: TaskService2 } = await Promise.resolve().then(() => (init_taskService(), taskService_exports));
        const taskService = new TaskService2(storyService["api"]);
        const tasks = await (async () => {
          try {
            return await taskService.listTasksByUserStory(full.id);
          } catch {
            return [];
          }
        })();
        const taskStatuses = await (async () => {
          try {
            return pidNum ? await taskService.listTaskStatuses(pidNum) : [];
          } catch {
            return [];
          }
        })();
        panel.webview.html = renderHtml(csp, nonce, { mode: "edit", story: full, projectId: pidNum, epics, sprints, users, statuses, roles, points, siteBaseUrl, projectSlug, linkedTasks: tasks, taskStatuses });
        panel.webview.onDidReceiveMessage(async (msg) => {
          if (msg.type === "save") {
            const { subject, description, epicIds, sprintId, statusId, assignedTo, tags, team_requirement, client_requirement, is_blocked, due_date, points: points2 } = msg.payload || {};
            const updated = await storyService.updateUserStory(story.id, { subject, description: description ?? null, epicIds: Array.isArray(epicIds) ? epicIds : void 0, milestoneId: sprintId ?? null, statusId: statusId ?? null, assignedTo: assignedTo ?? null, tags: Array.isArray(tags) ? tags.filter((t) => t && t.trim().length > 0) : void 0, teamRequirement: team_requirement ?? null, clientRequirement: client_requirement ?? null, isBlocked: is_blocked ?? null, dueDate: due_date ?? null, points: points2, version: full?.version });
            if (updated) {
              vscode10.window.showInformationMessage("User Story updated");
              panel.dispose();
              vscode10.commands.executeCommand("taiga.refreshAll");
            } else {
              await handleTokenError(storyService, "Updating user story failed");
            }
          }
          if (msg.type === "addExistingTask") {
            try {
              const { TaskService: TaskService3 } = await Promise.resolve().then(() => (init_taskService(), taskService_exports));
              const tsvc = new TaskService3(storyService["api"]);
              const candidates = await tsvc.listTasksNotInStory(pidNum, full.id);
              if (!candidates.length) {
                vscode10.window.showInformationMessage("No available tasks to add.");
                return;
              }
              const picked = await vscode10.window.showQuickPick(candidates.map((t) => ({ label: t.subject, description: String(t.id), t })), { placeHolder: "Select a task to link" });
              if (picked) {
                await tsvc.updateTask(picked.t.id, { userStoryId: full.id });
                const refreshed = await tsvc.listTasksByUserStory(full.id);
                panel.webview.postMessage({ type: "setLinkedTasks", tasks: refreshed });
              }
            } catch {
            }
          }
          if (msg.type === "createNewTask") {
            try {
              await vscode10.commands.executeCommand("taiga._openTaskEditorCreate", { projectId: pidNum, storyId: full.id, siteBaseUrl, projectSlug });
              const { TaskService: TaskService3 } = await Promise.resolve().then(() => (init_taskService(), taskService_exports));
              const tsvc = new TaskService3(storyService["api"]);
              const refreshed = await tsvc.listTasksByUserStory(full.id);
              panel.webview.postMessage({ type: "setLinkedTasks", tasks: refreshed });
            } catch {
            }
          }
          if (msg.type === "editTask" && msg.taskId) {
            try {
              await vscode10.commands.executeCommand("taiga._openTaskEditorEdit", { taskId: Number(msg.taskId), siteBaseUrl, projectSlug });
            } catch {
            }
          }
          if (msg.type === "removeTask" && msg.taskId) {
            try {
              const { TaskService: TaskService3 } = await Promise.resolve().then(() => (init_taskService(), taskService_exports));
              const tsvc = new TaskService3(storyService["api"]);
              await tsvc.updateTask(Number(msg.taskId), { userStoryId: null });
              const refreshed = await tsvc.listTasksByUserStory(full.id);
              panel.webview.postMessage({ type: "setLinkedTasks", tasks: refreshed });
            } catch {
            }
          }
          if (msg.type === "deleteTask" && msg.taskId) {
            try {
              const { TaskService: TaskService3 } = await Promise.resolve().then(() => (init_taskService(), taskService_exports));
              const tsvc = new TaskService3(storyService["api"]);
              const ok = await vscode10.window.showWarningMessage("Delete this task?", { modal: true }, "Delete");
              if (ok === "Delete") {
                await tsvc.deleteTask(Number(msg.taskId));
                const refreshed = await tsvc.listTasksByUserStory(full.id);
                panel.webview.postMessage({ type: "setLinkedTasks", tasks: refreshed });
                vscode10.commands.executeCommand("taiga.refreshAll");
              }
            } catch {
            }
          }
          if (msg.type === "cancel")
            panel.dispose();
        });
        panel.onDidChangeViewState(async (e) => {
          if (e.webviewPanel.active) {
            try {
              const refreshed = await taskService.listTasksByUserStory(full.id);
              panel.webview.postMessage({ type: "setLinkedTasks", tasks: refreshed });
            } catch {
            }
          }
        });
      }
    };
  }
});

// src/editors/taskEditor.ts
var taskEditor_exports = {};
__export(taskEditor_exports, {
  TaskEditor: () => TaskEditor
});
function renderHtml4(csp, nonce, opts) {
  const t = opts.task;
  const subject = t?.subject || "";
  const description = t?.description || "";
  const assignedId = t?.assigned_to ?? t?.assignedTo;
  const statusId = t?.status?.id ?? t?.status ?? t?.statusId;
  const dueDate = (t?.due_date || "").toString().slice(0, 10);
  const isBlocked = !!(t?.is_blocked || t?.blocked);
  const tags = Array.isArray(t?.tags) ? (t?.tags || []).map((x) => String(x ?? "").replace(/,+$/, "").trim()).filter((s) => s.length > 0) : [];
  const users = opts.users || [];
  const statuses = opts.statuses || [];
  const userOptions = ['<option value="">Unassigned</option>', ...users.map((u) => `<option value="${u.id}" ${String(assignedId) === String(u.id) ? "selected" : ""}>${escapeHtml5(u.fullName || u.username)}</option>`)].join("");
  const statusOptions = ['<option value="">(none)</option>', ...statuses.map((s) => `<option value="${s.id}" ${String(statusId) === String(s.id) ? "selected" : ""}>${escapeHtml5(s.name)}</option>`)].join("");
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
  <script nonce="${nonce}">/* detect dark background and mark body for calendar icon contrast */(function(){try{var cs=getComputedStyle(document.body);var bg=cs.getPropertyValue('--vscode-editor-background').trim();function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return {r:r,g:g,b:b};}function parseBg(s){if(!s)return null;var m=s.match(/rgba?((d+)s*,s*(d+)s*,s*(d+)/i);if(m){return {r:+m[1],g:+m[2],b:+m[3]};}if(/^#/.test(s)){return hexToRgb(s);}return null;}var rgb=parseBg(bg);if(rgb){var L=0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b; if(L<140){document.body.classList.add('darklike');}}}catch(e){}})();</script>
  <div class="header">
    <h3 style="margin:0;">${opts.mode === "create" ? "Create Task" : "Edit Task"}${opts.mode === "edit" && ref ? ` <em style="font-weight: normal; opacity: .8;">#${escapeHtml5(String(ref))}</em>` : ""}</h3>
    <div class="right"><label style="min-width:auto;">Assigned to</label><select id="assigned">${userOptions}</select></div>
  </div>
  <div class="row"><label>Subject</label><input id="subject" type="text" value="${escapeHtml5(subject)}" /></div>
  <div class="row"><label>Description</label><textarea id="desc" rows="6">${escapeHtml5(description)}</textarea></div>
  <div class="row"><label>Status</label><select id="status">${statusOptions}</select></div>
  <div class="row"><label>Flags</label>
    <div class="flags" style="display:flex; gap:8px;">
      <button id="blocked" title="Blocked">\u26D4</button>
    </div>
  </div>
  <div class="row"><label>Tags</label><input id="tags" type="text" placeholder="Comma-separated" value="${escapeHtml5(tags.join(", "))}" /></div>
  <div class="row"><label>Due date</label><input id="dueDate" type="date" value="${escapeHtml5(dueDate)}" /></div>
  ${(() => {
    const base = opts.siteBaseUrl || "";
    const slug = opts.projectSlug;
    let url = "";
    if (opts.mode === "edit") {
      const idPart = String(ref || "");
      if (base)
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/task/${idPart}` : `${base}/task/${idPart}`;
    } else {
      if (base)
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/tasks` : `${base}/tasks`;
    }
    const linkHtml = url ? ` (<a href="${url}" target="_blank">${escapeHtml5(url)}</a>)` : "";
    return `<div class="row"><label></label><div class="note">Comments can be edited in Taiga interface only${linkHtml}</div></div>`;
  })()}
  <div class="actions">
    <button id="save">Save</button>
    <button id="cancel">Cancel</button>
  </div>
  <script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const blockedBtn = document.getElementById('blocked');
  let _isBlocked = ${isBlocked ? "true" : "false"};
  function renderFlag(btn, active){ btn.style.opacity = active ? '1' : '0.5'; }
  if (blockedBtn) { renderFlag(blockedBtn, _isBlocked); blockedBtn.addEventListener('click', ()=>{ _isBlocked = !_isBlocked; renderFlag(blockedBtn, _isBlocked); }); }
  const saveBtn = document.getElementById('save');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'save', payload: {
      subject: (document.getElementById('subject')).value,
      description: (document.getElementById('desc')).value,
      statusId: parseNullableInt((document.getElementById('status')).value),
      assignedTo: parseNullableInt((document.getElementById('assigned')).value),
      due_date: (document.getElementById('dueDate')).value,
      tags: (document.getElementById('tags')).value.split(',').map(s=>s.replace(/,+$/, '').trim()).filter(s=>s.length>0),
      is_blocked: _isBlocked
    }});
  });
  const cancelBtn = document.getElementById('cancel'); if (cancelBtn) cancelBtn.addEventListener('click', ()=>vscode.postMessage({ type: 'cancel' }));
  function parseNullableInt(v){ return v===''? undefined : Number(v); }
  </script>
  </body></html>`;
}
function escapeHtml5(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function getNonce5() {
  let t = "";
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++)
    t += p.charAt(Math.floor(Math.random() * p.length));
  return t;
}
async function handleTokenError3(service, fallbackMsg) {
  try {
    const api = service["api"];
    const test = await api.get("/users/me");
    if (test?.error && test.error.category === "auth") {
      const pick = await vscode13.window.showWarningMessage("Your Taiga session has expired. Reconnect?", "Reconnect");
      if (pick === "Reconnect") {
        await vscode13.commands.executeCommand("taiga.connect");
      }
    } else {
      vscode13.window.showErrorMessage(fallbackMsg);
    }
  } catch {
    vscode13.window.showErrorMessage(fallbackMsg);
  }
}
function renderLoadingHtml2(csp) {
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);} .loading{opacity:.8; font-style: italic;}
  </style></head>
  <body><div class="loading">Loading\u2026</div></body></html>`;
}
var vscode13, TaskEditor;
var init_taskEditor = __esm({
  "src/editors/taskEditor.ts"() {
    "use strict";
    vscode13 = __toESM(require("vscode"));
    init_userService();
    TaskEditor = class {
      static async openForCreate(taskService, projectId, userStoryId, siteBaseUrl, projectSlug) {
        const panel = vscode13.window.createWebviewPanel("taigaTaskEditor", "New Task", vscode13.ViewColumn.Active, { enableScripts: true });
        const ext = vscode13.extensions.getExtension("antpavlenko.taiga-mcp-extension");
        if (ext)
          panel.iconPath = {
            light: vscode13.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
            dark: vscode13.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
          };
        const nonce = getNonce5();
        const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
        panel.webview.html = renderLoadingHtml2(csp);
        const userService = new UserService(taskService["api"]);
        const users = await (async () => {
          try {
            return await userService.listProjectUsers(projectId);
          } catch {
            return [];
          }
        })();
        const statuses = await (async () => {
          try {
            return await taskService.listTaskStatuses(projectId);
          } catch {
            return [];
          }
        })();
        panel.webview.html = renderHtml4(csp, nonce, { mode: "create", users, statuses, siteBaseUrl, projectSlug, projectId, userStoryId });
        panel.webview.onDidReceiveMessage(async (msg) => {
          if (msg.type === "save") {
            const { subject, description, statusId, assignedTo, due_date, tags, is_blocked } = msg.payload || {};
            const created = await taskService.createTask({ projectId, userStoryId, subject, description, statusId, assignedTo, dueDate: due_date, tags, isBlocked: is_blocked });
            if (created) {
              vscode13.window.showInformationMessage("Task created");
              panel.dispose();
              vscode13.commands.executeCommand("taiga.refreshAll");
            } else {
              await handleTokenError3(taskService, "Creating task failed");
            }
          }
          if (msg.type === "cancel")
            panel.dispose();
        });
      }
      static async openForEdit(taskService, task, siteBaseUrl, projectSlug) {
        const panel = vscode13.window.createWebviewPanel("taigaTaskEditor", `Edit Task: ${task.subject || task.id}`, vscode13.ViewColumn.Active, { enableScripts: true });
        const ext = vscode13.extensions.getExtension("antpavlenko.taiga-mcp-extension");
        if (ext)
          panel.iconPath = {
            light: vscode13.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
            dark: vscode13.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
          };
        const nonce = getNonce5();
        const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
        panel.webview.html = renderLoadingHtml2(csp);
        const pid = task.projectId ?? task.project;
        const userService = new UserService(taskService["api"]);
        const users = await (async () => {
          try {
            return pid ? await userService.listProjectUsers(Number(pid)) : [];
          } catch {
            return [];
          }
        })();
        const statuses = await (async () => {
          try {
            return pid ? await taskService.listTaskStatuses(Number(pid)) : [];
          } catch {
            return [];
          }
        })();
        const full = await (async () => {
          try {
            return await taskService.getTask(task.id) || task;
          } catch {
            return task;
          }
        })();
        panel.webview.html = renderHtml4(csp, nonce, { mode: "edit", task: full, users, statuses, siteBaseUrl, projectSlug, projectId: Number(pid || 0), userStoryId: Number(full.user_story || full.userStoryId || 0) });
        panel.webview.onDidReceiveMessage(async (msg) => {
          if (msg.type === "save") {
            const { subject, description, statusId, assignedTo, due_date, tags, is_blocked } = msg.payload || {};
            const updated = await taskService.updateTask(task.id, { subject, description: description ?? null, statusId: statusId ?? null, assignedTo: assignedTo ?? null, dueDate: due_date ?? null, tags: tags ?? void 0, isBlocked: is_blocked ?? null, version: full?.version });
            if (updated) {
              vscode13.window.showInformationMessage("Task updated");
              panel.dispose();
              vscode13.commands.executeCommand("taiga.refreshAll");
            } else {
              await handleTokenError3(taskService, "Updating task failed");
            }
          }
          if (msg.type === "cancel")
            panel.dispose();
        });
      }
    };
  }
});

// src/editors/issueEditor.ts
var issueEditor_exports = {};
__export(issueEditor_exports, {
  IssueEditor: () => IssueEditor
});
async function handleTokenError4(service, fallbackMsg) {
  try {
    const api = service["api"];
    const test = await api.get("/users/me");
    if (test?.error && test.error.category === "auth") {
      const pick = await vscode14.window.showWarningMessage("Your Taiga session has expired. Reconnect?", "Reconnect");
      if (pick === "Reconnect") {
        await vscode14.commands.executeCommand("taiga.connect");
      }
    } else {
      vscode14.window.showErrorMessage(fallbackMsg);
    }
  } catch {
    vscode14.window.showErrorMessage(fallbackMsg);
  }
}
function renderHtml5(csp, nonce, opts) {
  const t = opts.issue;
  const subject = t?.subject || "";
  const description = t?.description || "";
  const assignedId = t?.assigned_to ?? t?.assignedTo;
  const statusId = t?.status?.id ?? t?.status ?? t?.statusId;
  const dueDate = (t?.due_date || "").toString().slice(0, 10);
  const tags = Array.isArray(t?.tags) ? (t?.tags || []).map((x) => String(x ?? "").replace(/,+$/, "").trim()).filter((s) => s.length > 0) : [];
  const users = opts.users || [];
  const statuses = opts.statuses || [];
  const types = opts.types || [];
  const severities = opts.severities || [];
  const priorities = opts.priorities || [];
  const typeId = (t?.type && (t?.type.id ?? t?.type)) ?? t?.type;
  const severityId = (t?.severity && (t?.severity.id ?? t?.severity)) ?? t?.severity;
  const priorityId = (t?.priority && (t?.priority.id ?? t?.priority)) ?? t?.priority;
  const userOptions = ['<option value="">Unassigned</option>', ...users.map((u) => `<option value="${u.id}" ${String(assignedId) === String(u.id) ? "selected" : ""}>${escapeHtml6(u.fullName || u.username)}</option>`)].join("");
  const statusOptions = ['<option value="">(none)</option>', ...statuses.map((s) => `<option value="${s.id}" ${String(statusId) === String(s.id) ? "selected" : ""}>${escapeHtml6(s.name)}</option>`)].join("");
  const typeOptions = ['<option value="">(none)</option>', ...types.map((s) => `<option value="${s.id}" ${String(typeId) === String(s.id) ? "selected" : ""}>${escapeHtml6(s.name)}</option>`)].join("");
  const severityOptions = ['<option value="">(none)</option>', ...severities.map((s) => `<option value="${s.id}" ${String(severityId) === String(s.id) ? "selected" : ""}>${escapeHtml6(s.name)}</option>`)].join("");
  const priorityOptions = ['<option value="">(none)</option>', ...priorities.map((s) => `<option value="${s.id}" ${String(priorityId) === String(s.id) ? "selected" : ""}>${escapeHtml6(s.name)}</option>`)].join("");
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
  <script nonce="${nonce}">/* detect dark background and mark body for calendar icon contrast */(function(){try{var cs=getComputedStyle(document.body);var bg=cs.getPropertyValue('--vscode-editor-background').trim();function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return {r:r,g:g,b:b};}function parseBg(s){if(!s)return null;var m=s.match(/rgba?((d+)s*,s*(d+)s*,s*(d+)/i);if(m){return {r:+m[1],g:+m[2],b:+m[3]};}if(/^#/.test(s)){return hexToRgb(s);}return null;}var rgb=parseBg(bg);if(rgb){var L=0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b; if(L<140){document.body.classList.add('darklike');}}}catch(e){}})();</script>
  <div class="header">
    <h3 style="margin:0;">${opts.mode === "create" ? "Create Issue" : "Edit Issue"}${opts.mode === "edit" && ref ? ` <em style="font-weight: normal; opacity: .8;">#${escapeHtml6(String(ref))}</em>` : ""}</h3>
    <div class="right"><label style="min-width:auto;">Assigned to</label><select id="assigned">${userOptions}</select></div>
  </div>
  <div class="row"><label>Subject</label><input id="subject" type="text" value="${escapeHtml6(subject)}" /></div>
  <div class="row"><label>Description</label><textarea id="desc" rows="6">${escapeHtml6(description)}</textarea></div>
  <div class="row"><label>Status</label><select id="status">${statusOptions}</select></div>
  <div class="row"><label>Type</label><select id="type">${typeOptions}</select></div>
  <div class="row"><label>Severity</label><select id="severity">${severityOptions}</select></div>
  <div class="row"><label>Priority</label><select id="priority">${priorityOptions}</select></div>
  <div class="row"><label>Tags</label><input id="tags" type="text" placeholder="Comma-separated" value="${escapeHtml6(tags.join(", "))}" /></div>
  <div class="row"><label>Due date</label><input id="dueDate" type="date" value="${escapeHtml6(dueDate)}" /></div>
  ${(() => {
    const base = opts.siteBaseUrl || "";
    const slug = opts.projectSlug;
    let url = "";
    if (opts.mode === "edit") {
      const idPart = String(ref || "");
      if (base)
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/issue/${idPart}` : `${base}/issue/${idPart}`;
    } else {
      if (base)
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/issues` : `${base}/issues`;
    }
    const linkHtml = url ? ` (<a href="${url}" target="_blank">${escapeHtml6(url)}</a>)` : "";
    return `<div class="row"><label></label><div class="note">Comments can be edited in Taiga interface only${linkHtml}</div></div>`;
  })()}
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
function escapeHtml6(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function getNonce6() {
  let t = "";
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++)
    t += p.charAt(Math.floor(Math.random() * p.length));
  return t;
}
function renderLoadingHtml3(csp) {
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);} .loading{opacity:.8; font-style: italic; font-size: 12px;}
  </style></head>
  <body><div class="loading">Loading\u2026</div></body></html>`;
}
var vscode14, IssueEditor;
var init_issueEditor = __esm({
  "src/editors/issueEditor.ts"() {
    "use strict";
    vscode14 = __toESM(require("vscode"));
    init_userService();
    IssueEditor = class {
      static async openForCreate(issueService, projectId, siteBaseUrl, projectSlug) {
        const panel = vscode14.window.createWebviewPanel("taigaIssueEditor", "New Issue", vscode14.ViewColumn.Active, { enableScripts: true });
        const ext = vscode14.extensions.getExtension("antpavlenko.taiga-mcp-extension");
        if (ext)
          panel.iconPath = {
            light: vscode14.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
            dark: vscode14.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
          };
        const nonce = getNonce6();
        const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
        panel.webview.html = renderLoadingHtml3(csp);
        const userService = new UserService(issueService["api"]);
        const users = await (async () => {
          try {
            return await userService.listProjectUsers(projectId);
          } catch {
            return [];
          }
        })();
        const statuses = await (async () => {
          try {
            return await issueService.listIssueStatuses(projectId);
          } catch {
            return [];
          }
        })();
        const types = await (async () => {
          try {
            return await issueService.listIssueTypes(projectId);
          } catch {
            return [];
          }
        })();
        const severities = await (async () => {
          try {
            return await issueService.listIssueSeverities(projectId);
          } catch {
            return [];
          }
        })();
        const priorities = await (async () => {
          try {
            return await issueService.listIssuePriorities(projectId);
          } catch {
            return [];
          }
        })();
        panel.webview.html = renderHtml5(csp, nonce, { mode: "create", users, statuses, siteBaseUrl, projectSlug, types, severities, priorities });
        panel.webview.onDidReceiveMessage(async (msg) => {
          if (msg.type === "save") {
            const { subject, description, statusId, assignedTo, due_date, tags, typeId, severityId, priorityId } = msg.payload || {};
            const res = await issueService.createIssue({ projectId, subject, description, statusId, assignedTo, dueDate: due_date, tags, typeId, severityId, priorityId });
            if (!res) {
              await handleTokenError4(issueService, "Creating issue failed");
              return;
            }
            vscode14.window.showInformationMessage("Issue created");
            panel.dispose();
            vscode14.commands.executeCommand("taiga.refreshAll");
          }
          if (msg.type === "cancel")
            panel.dispose();
        });
      }
      static async openForEdit(issueService, issue, siteBaseUrl, projectSlug) {
        const panel = vscode14.window.createWebviewPanel("taigaIssueEditor", `Edit Issue: ${issue.subject || issue.id}`, vscode14.ViewColumn.Active, { enableScripts: true });
        const ext = vscode14.extensions.getExtension("antpavlenko.taiga-mcp-extension");
        if (ext)
          panel.iconPath = {
            light: vscode14.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
            dark: vscode14.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
          };
        const nonce = getNonce6();
        const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
        panel.webview.html = renderLoadingHtml3(csp);
        const pid = issue.projectId ?? issue.project;
        const userService = new UserService(issueService["api"]);
        const users = await (async () => {
          try {
            return pid ? await userService.listProjectUsers(Number(pid)) : [];
          } catch {
            return [];
          }
        })();
        const statuses = await (async () => {
          try {
            return pid ? await issueService.listIssueStatuses(Number(pid)) : [];
          } catch {
            return [];
          }
        })();
        const types = await (async () => {
          try {
            return pid ? await issueService.listIssueTypes(Number(pid)) : [];
          } catch {
            return [];
          }
        })();
        const severities = await (async () => {
          try {
            return pid ? await issueService.listIssueSeverities(Number(pid)) : [];
          } catch {
            return [];
          }
        })();
        const priorities = await (async () => {
          try {
            return pid ? await issueService.listIssuePriorities(Number(pid)) : [];
          } catch {
            return [];
          }
        })();
        const full = await (async () => {
          try {
            return await issueService.getIssue?.(issue.id) || issue;
          } catch {
            return issue;
          }
        })();
        panel.webview.html = renderHtml5(csp, nonce, { mode: "edit", issue: full, users, statuses, types, severities, priorities, siteBaseUrl, projectSlug });
        panel.webview.onDidReceiveMessage(async (msg) => {
          if (msg.type === "save") {
            const { subject, description, statusId, assignedTo, due_date, tags, typeId, severityId, priorityId } = msg.payload || {};
            const res = await issueService.updateIssue(issue.id, { subject, description: description ?? null, statusId: statusId ?? null, assignedTo: assignedTo ?? null, dueDate: due_date ?? null, tags: tags ?? void 0, typeId: typeId ?? null, severityId: severityId ?? null, priorityId: priorityId ?? null, version: full?.version });
            if (!res) {
              await handleTokenError4(issueService, "Updating issue failed");
              return;
            }
            vscode14.window.showInformationMessage("Issue updated");
            panel.dispose();
            vscode14.commands.executeCommand("taiga.refreshAll");
          }
          if (msg.type === "cancel")
            panel.dispose();
        });
      }
    };
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode15 = __toESM(require("vscode"));

// src/config/configurationManager.ts
var vscode = __toESM(require("vscode"));
var ConfigurationManager = class {
  constructor() {
    this._onDidChange = new vscode.EventEmitter();
    this.onDidChange = this._onDidChange.event;
  }
  getEffective() {
    const cfg = vscode.workspace.getConfiguration();
    let baseUrl = this.normalizeBaseUrl(String(cfg.get("taiga.baseUrl") || ""));
    if (!baseUrl) {
      const instances = cfg.get("taiga.instances") || [];
      const activeName = cfg.get("taiga.activeInstanceName") || instances[0]?.name;
      const active = instances.find((i) => i.name === activeName) || instances[0];
      if (active?.baseUrl)
        baseUrl = this.normalizeBaseUrl(String(active.baseUrl));
    }
    return {
      baseUrl,
      tokenSecretId: `taiga:default:token`,
      verbose: !!cfg.get("taiga.enableVerboseLogging"),
      maxPageSize: cfg.get("taiga.maxPageSize") || 50
    };
  }
  watch(context) {
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("taiga")) {
        this._onDidChange.fire(this.getEffective());
      }
    }));
  }
  // Old normalizeInstance not needed with single baseUrl; keep baseUrl helper below
  normalizeBaseUrl(rawBaseUrl) {
    let u = rawBaseUrl.trim().replace(/\/+$/, "");
    if (!u)
      return "";
    const hasApi = /\/api(\/|$)/.test(u);
    if (!hasApi)
      return `${u}/api/v1`;
    if (u.endsWith("/api"))
      return `${u}/v1`;
    return u;
  }
};

// src/auth/authManager.ts
var vscode2 = __toESM(require("vscode"));
var AuthManager = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async getToken(secretId) {
    return this.ctx.secrets.get(secretId);
  }
  async setToken(secretId, value) {
    const token = value || await vscode2.window.showInputBox({ prompt: "Enter Taiga API token", ignoreFocusOut: true, password: true });
    if (!token)
      return void 0;
    await this.ctx.secrets.store(secretId, token.trim());
    return token.trim();
  }
};

// src/utils/logger.ts
var vscode3 = __toESM(require("vscode"));
function createLogger(channelName = "Taiga", verboseFlag) {
  const channel = vscode3.window.createOutputChannel(channelName);
  function ts() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function redact(s) {
    return s.replace(/(Bearer\s+)[A-Za-z0-9._-]+/g, "$1***");
  }
  return {
    info(msg) {
      channel.appendLine(`[INFO] ${ts()} ${redact(msg)}`);
    },
    warn(msg) {
      channel.appendLine(`[WARN] ${ts()} ${redact(msg)}`);
    },
    error(msg) {
      channel.appendLine(`[ERROR] ${ts()} ${redact(msg)}`);
    },
    debug(msg) {
      if (verboseFlag())
        channel.appendLine(`[DEBUG] ${ts()} ${redact(msg)}`);
    }
  };
}

// src/api/errorTranslator.ts
function translate(status, body, networkErr) {
  if (networkErr)
    return { category: "network", message: networkErr.message };
  if (status === 401 || status === 403)
    return { category: "auth", httpStatus: status, message: body?.detail || "Unauthorized" };
  if (status === 404)
    return { category: "not_found", httpStatus: status, message: "Not Found" };
  if (status === 429)
    return { category: "rate_limit", httpStatus: status, message: "Rate limited" };
  if ([400, 409, 412, 422].includes(status))
    return { category: "validation", httpStatus: status, message: body?.message || "Validation error", details: body };
  if (status >= 500)
    return { category: "server", httpStatus: status, message: "Server error" };
  return { category: "unknown", httpStatus: status, message: "Unexpected response", details: body };
}

// src/api/taigaApiClient.ts
var TaigaApiClient = class {
  constructor(baseUrl, tokenProvider, fetchImpl, log) {
    this.baseUrl = baseUrl;
    this.tokenProvider = tokenProvider;
    this.log = log;
    this.fetchFn = fetchImpl || globalThis.fetch;
  }
  async get(path, opts = {}) {
    return this.request("GET", path, void 0, { headers: opts.headers }, opts.query);
  }
  async post(path, body, opts = {}) {
    return this.request("POST", path, body, opts);
  }
  async patch(path, body, opts = {}) {
    return this.request("PATCH", path, body, opts);
  }
  async delete(path, opts = {}) {
    return this.request("DELETE", path, void 0, opts);
  }
  async request(method, path, body, opts = {}, query) {
    if (!this.baseUrl) {
      this.log?.(`[TaigaApi] No baseUrl configured; skipping ${method} ${path}`);
      return { status: 0, headers: {}, error: translate(0, null, new Error("No Taiga baseUrl configured")) };
    }
    const token = await this.tokenProvider();
    const url = this.buildUrl(path, query);
    const headers = { Accept: "application/json", ...opts.headers || {} };
    let bodyStr = void 0;
    if (body !== void 0) {
      headers["Content-Type"] = "application/json";
      bodyStr = JSON.stringify(body);
    }
    if (token)
      headers.Authorization = `Bearer ${token}`;
    const logBody = bodyStr && !opts.sensitive ? ` body=${bodyStr.length > 200 ? bodyStr.slice(0, 200) + "\u2026" : bodyStr}` : "";
    this.log?.(`[TaigaApi] ${method} ${url} (token=${token ? "present" : "missing"})${logBody}`);
    let resp;
    try {
      resp = await this.fetchFn(url, { method, headers, body: bodyStr });
    } catch (e) {
      this.log?.(`[TaigaApi] ${method} ${url} network error: ${e.message}`);
      return { status: 0, headers: {}, error: translate(0, null, e) };
    }
    let data = void 0;
    const text = await resp.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!resp.ok) {
      this.log?.(`[TaigaApi] ${method} ${url} -> ${resp.status}`);
      return { status: resp.status, headers: this.headerObj(resp), error: translate(resp.status, data) };
    }
    this.log?.(`[TaigaApi] ${method} ${url} -> ${resp.status}`);
    try {
      if (method === "GET") {
        const preview = this.previewData(data);
        if (preview)
          this.log?.(`[TaigaApi] preview ${path}: ${preview}`);
      }
    } catch {
    }
    return { status: resp.status, headers: this.headerObj(resp), data };
  }
  // Create a small preview string for arrays/objects
  previewData(data) {
    if (data == null)
      return "null";
    try {
      if (Array.isArray(data)) {
        const first = data[0];
        if (first && typeof first === "object") {
          const keys = Object.keys(first).slice(0, 10);
          return `array(len=${data.length}) firstKeys=${keys.join(",")}`;
        }
        return `array(len=${data.length})`;
      }
      if (typeof data === "object") {
        const obj = data;
        if (Array.isArray(obj.results)) {
          const first = obj.results[0];
          const keys2 = first && typeof first === "object" ? Object.keys(first).slice(0, 10) : [];
          return `object{results: array(len=${obj.results.length}) firstKeys=${keys2.join(",")}}`;
        }
        const keys = Object.keys(obj).slice(0, 20);
        return `object keys=${keys.join(",")}`;
      }
      return String(data).slice(0, 200);
    } catch {
      return void 0;
    }
  }
  buildUrl(path, query) {
    const base = `${this.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    if (!query)
      return base;
    const params = Object.entries(query).filter(([, v]) => v !== void 0 && v !== null).flatMap(([k, v]) => Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]);
    if (!params.length)
      return base;
    const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
    return `${base}?${qs}`;
  }
  headerObj(resp) {
    const out = {};
    resp.headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
};

// src/services/projectService.ts
var ProjectService = class {
  constructor(api) {
    this.api = api;
  }
  async listProjects() {
    const { data, error } = await this.api.get("/projects");
    if (error || data == null)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
};

// src/services/userStoryService.ts
var UserStoryService = class {
  constructor(api) {
    this.api = api;
  }
  async listUserStories(projectId, opts) {
    const query = { project: projectId };
    if (opts) {
      if (opts.milestoneId === null)
        query["milestone__isnull"] = true;
      else if (typeof opts.milestoneId === "number")
        query["milestone"] = opts.milestoneId;
    }
    const { data, error } = await this.api.get("/userstories", { query });
    if (error || data == null)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
  async createUserStory(input) {
    const payload = { project: input.projectId, subject: input.subject };
    if (input.description !== void 0)
      payload.description = input.description;
    if (input.milestoneId !== void 0)
      payload.milestone = input.milestoneId;
    if (input.statusId !== void 0)
      payload.status = input.statusId;
    if (input.assignedTo !== void 0)
      payload.assigned_to = input.assignedTo;
    if (input.tags !== void 0)
      payload.tags = input.tags;
    if (input.isBlocked !== void 0)
      payload.is_blocked = input.isBlocked;
    if (input.isPrivate !== void 0)
      payload.is_private = input.isPrivate;
    if (input.teamRequirement !== void 0)
      payload.team_requirement = input.teamRequirement;
    if (input.clientRequirement !== void 0)
      payload.client_requirement = input.clientRequirement;
    if (input.dueDate !== void 0)
      payload.due_date = input.dueDate;
    if (input.points !== void 0)
      payload.points = input.points;
    const { data, error } = await this.api.post("/userstories", payload);
    if (error || !data)
      return void 0;
    const created = data;
    const epicIds = input.epicIds && Array.isArray(input.epicIds) ? input.epicIds : input.epicId != null ? [input.epicId] : [];
    if (created?.id && epicIds && epicIds.length) {
      for (const eid of epicIds) {
        await this.linkEpicToUserStory(eid, created.id);
      }
      return await this.getUserStory(created.id) || created;
    }
    return created;
  }
  async updateUserStory(id, input) {
    const payload = {};
    if (input.subject !== void 0)
      payload.subject = input.subject;
    if (input.description !== void 0)
      payload.description = input.description;
    if (input.milestoneId !== void 0)
      payload.milestone = input.milestoneId;
    if (input.statusId !== void 0)
      payload.status = input.statusId;
    if (input.assignedTo !== void 0)
      payload.assigned_to = input.assignedTo;
    if (input.tags !== void 0)
      payload.tags = input.tags;
    if (input.isBlocked !== void 0)
      payload.is_blocked = input.isBlocked;
    if (input.isPrivate !== void 0)
      payload.is_private = input.isPrivate;
    if (input.teamRequirement !== void 0)
      payload.team_requirement = input.teamRequirement;
    if (input.clientRequirement !== void 0)
      payload.client_requirement = input.clientRequirement;
    if (input.dueDate !== void 0)
      payload.due_date = input.dueDate;
    if (input.points !== void 0)
      payload.points = input.points;
    if (input.version !== void 0)
      payload.version = input.version;
    const { data, error } = await this.api.patch(`/userstories/${id}`, payload);
    if (error)
      return void 0;
    const updated = data;
    if (input.epicIds !== void 0) {
      const desired = new Set((input.epicIds || []).map((x) => Number(x)).filter((n) => !isNaN(n)));
      const cur = await this.getUserStory(id);
      const currentIds = new Set((cur?.epics || []).map((e) => Number(e?.id)).filter((n) => !isNaN(n)));
      for (const eid of desired) {
        if (!currentIds.has(eid))
          await this.linkEpicToUserStory(eid, id);
      }
      for (const eid of currentIds) {
        const num = Number(eid);
        if (!desired.has(num))
          await this.unlinkEpicFromUserStory(num, id);
      }
      return await this.getUserStory(id) || updated;
    }
    return updated;
  }
  async deleteUserStory(id) {
    const { status, error } = await this.api.delete(`/userstories/${id}`);
    return !error && status >= 200 && status < 300;
  }
  async getUserStory(id) {
    const { data, error } = await this.api.get(`/userstories/${id}`);
    if (error)
      return void 0;
    return data;
  }
  // Link a user story to an epic using nested endpoint: POST /epics/{epicId}/related_userstories
  async linkEpicToUserStory(epicId, userStoryId) {
    const body = { epic: epicId, user_story: userStoryId };
    const { status, error } = await this.api.post?.(`/epics/${epicId}/related_userstories`, body) || { status: 0, error: { message: "POST not implemented", category: "unknown" } };
    return !error && status >= 200 && status < 300;
  }
  // Unlink a user story from an epic: DELETE /epics/{epicId}/related_userstories/{userStoryId}
  async unlinkEpicFromUserStory(epicId, userStoryId) {
    const { status, error } = await this.api.delete?.(`/epics/${epicId}/related_userstories/${userStoryId}`) || { status: 0, error: { message: "DELETE not implemented", category: "unknown" } };
    return !error && status >= 200 && status < 300;
  }
  async listUserStoryStatuses(projectId) {
    const { data, error } = await this.api.get("/userstory-statuses", { query: { project: projectId } });
    if (error || data == null)
      return [];
    let arr = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
    arr = arr.filter((s) => {
      const p = s?.projectId ?? s?.project_id ?? s?.project;
      if (p == null)
        return true;
      const val = typeof p === "object" ? "id" in p ? p.id : "pk" in p ? p.pk : void 0 : p;
      return String(val) === String(projectId);
    });
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const s of arr) {
      const key = String(s?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }
    return out;
  }
  async listRoles(projectId) {
    const { data, error } = await this.api.get("/roles", { query: { project: projectId } });
    if (error || data == null)
      return [];
    const arr = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const r of arr) {
      const key = String(r?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ id: r.id, name: r.name, slug: r.slug, computable: r.computable });
      }
    }
    return out;
  }
  async listPoints(projectId) {
    const { data, error } = await this.api.get("/points", { query: { project: projectId } });
    if (error || data == null)
      return [];
    let arr = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
    arr = arr.filter((p) => {
      const proj = p?.projectId ?? p?.project_id ?? p?.project;
      if (proj == null)
        return true;
      const val = typeof proj === "object" ? "id" in proj ? proj.id : "pk" in proj ? proj.pk : void 0 : proj;
      return String(val) === String(projectId);
    });
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const p of arr) {
      const key = String(p?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(p);
      }
    }
    return out;
  }
  // Public wrappers for epic linking
  async addUserStoryToEpic(epicId, userStoryId) {
    return this.linkEpicToUserStory(epicId, userStoryId);
  }
  async removeUserStoryFromEpic(epicId, userStoryId) {
    return this.unlinkEpicFromUserStory(epicId, userStoryId);
  }
  // List user stories linked to a given epic within a project (best-effort client-side filter)
  async listUserStoriesForEpic(projectId, epicId) {
    const all = await this.listUserStories(projectId);
    const target = String(epicId);
    return all.filter((s) => {
      const single = s?.epicId ?? s?.epic;
      const singleId = single && typeof single === "object" ? single.id ?? single.pk ?? void 0 : single;
      if (singleId != null && String(singleId) === target)
        return true;
      const arr = Array.isArray(s?.epics) ? s.epics : [];
      return arr.some((e) => String(e && typeof e === "object" ? e.id ?? e.pk ?? e : e) === target);
    });
  }
  // List user stories not linked to a given epic (for "Add existing…" picker)
  async listUserStoriesNotInEpic(projectId, epicId) {
    const all = await this.listUserStories(projectId);
    const target = String(epicId);
    return all.filter((s) => {
      const single = s?.epicId ?? s?.epic;
      const singleId = single && typeof single === "object" ? single.id ?? single.pk ?? void 0 : single;
      if (singleId != null && String(singleId) === target)
        return false;
      const arr = Array.isArray(s?.epics) ? s.epics : [];
      return !arr.some((e) => String(e && typeof e === "object" ? e.id ?? e.pk ?? e : e) === target);
    });
  }
};

// src/services/issueService.ts
var IssueService = class {
  constructor(api) {
    this.api = api;
  }
  async listIssues(projectId, includeClosed) {
    const query = { project: projectId };
    if (!includeClosed) {
      query["status__is_closed"] = false;
    }
    const { data, error } = await this.api.get("/issues", { query });
    if (error || data == null)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
  async createIssue(input) {
    const payload = { project: input.projectId, subject: input.subject };
    if (input.description !== void 0)
      payload.description = input.description;
    if (input.statusId !== void 0)
      payload.status = input.statusId;
    if (input.assignedTo !== void 0)
      payload.assigned_to = input.assignedTo;
    if (input.tags !== void 0)
      payload.tags = input.tags;
    if (input.dueDate !== void 0)
      payload.due_date = input.dueDate;
    if (input.typeId !== void 0)
      payload.type = input.typeId;
    if (input.severityId !== void 0)
      payload.severity = input.severityId;
    if (input.priorityId !== void 0)
      payload.priority = input.priorityId;
    const { data, error } = await this.api.post("/issues", payload);
    if (error)
      return void 0;
    return data;
  }
  async updateIssue(id, input) {
    const payload = {};
    if (input.subject !== void 0)
      payload.subject = input.subject;
    if (input.description !== void 0)
      payload.description = input.description;
    if (input.statusId !== void 0)
      payload.status = input.statusId;
    if (input.assignedTo !== void 0)
      payload.assigned_to = input.assignedTo;
    if (input.tags !== void 0)
      payload.tags = input.tags;
    if (input.dueDate !== void 0)
      payload.due_date = input.dueDate;
    if (input.typeId !== void 0)
      payload.type = input.typeId;
    if (input.severityId !== void 0)
      payload.severity = input.severityId;
    if (input.priorityId !== void 0)
      payload.priority = input.priorityId;
    if (input.version !== void 0)
      payload.version = input.version;
    const { data, error } = await this.api.patch(`/issues/${id}`, payload);
    if (error)
      return void 0;
    return data;
  }
  async deleteIssue(id) {
    const { status, error } = await this.api.delete(`/issues/${id}`);
    return !error && status >= 200 && status < 300;
  }
  async listIssueStatuses(projectId) {
    const { data, error } = await this.api.get("/issue-statuses", { query: { project: projectId } });
    if (error || data == null)
      return [];
    const arr = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const s of arr) {
      const key = String(s?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ id: s.id, name: s.name, slug: s.slug });
      }
    }
    return out;
  }
  async listIssueTypes(projectId) {
    let data, error;
    ({ data, error } = await this.api.get("/issue-types", { query: { project: projectId } }));
    if (error || data == null || Array.isArray(data) && data.length === 0 || data?.results && data.results.length === 0) {
      ({ data, error } = await this.api.get("/issue-types"));
    }
    if (error || data == null)
      return [];
    const arr = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const s of arr) {
      const key = String(s?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ id: s.id, name: s.name, slug: s.slug });
      }
    }
    return out;
  }
  async listIssueSeverities(projectId) {
    let data = null, error = null;
    ({ data, error } = await this.api.get("/issue-severities", { query: { project: projectId } }));
    let arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get("/issue-severities"));
      arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    }
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get("/severities", { query: { project: projectId } }));
      arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    }
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get("/severities"));
      arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    }
    if (error || data == null)
      return [];
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const s of arr) {
      const key = String(s?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ id: s.id, name: s.name, slug: s.slug });
      }
    }
    return out;
  }
  async listIssuePriorities(projectId) {
    let data, error;
    ({ data, error } = await this.api.get("/priorities", { query: { project: projectId } }));
    let arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get("/issue-priorities", { query: { project: projectId } }));
      arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    }
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get("/priorities"));
      arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    }
    if (error || data == null)
      return [];
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const s of arr) {
      const key = String(s?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ id: s.id, name: s.name, slug: s.slug });
      }
    }
    return out;
  }
};

// src/tree/userStoriesTree.ts
var vscode4 = __toESM(require("vscode"));
var UserStoriesTreeProvider = class {
  constructor(userStoryService) {
    this.userStoryService = userStoryService;
    this._onDidChangeTreeData = new vscode4.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.stories = [];
    this.loading = false;
    this.selectedEpicIds = [];
    this.selectedSprintId = void 0;
    // undefined = no sprint filter, null = backlog
    this.baseUrlSet = false;
    this.tokenPresent = false;
  }
  setActiveProject(id) {
    this.activeProjectId = id;
    this.refresh();
  }
  setEpicFilter(ids) {
    this.selectedEpicIds = ids;
    this.refresh();
  }
  setSprintFilter(id) {
    this.selectedSprintId = id;
    this.refresh();
  }
  refresh() {
    this.load();
  }
  setConnectionState(opts) {
    this.baseUrlSet = opts.baseUrlSet;
    this.tokenPresent = opts.tokenPresent;
    this._onDidChangeTreeData.fire();
  }
  getStoryCount() {
    return this.stories.length;
  }
  getStories() {
    return this.stories;
  }
  async load() {
    if (this.loading)
      return;
    this.loading = true;
    this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId) {
        const milestoneId = this.selectedSprintId === void 0 ? void 0 : this.selectedSprintId;
        this.stories = await this.userStoryService.listUserStories(this.activeProjectId, { milestoneId });
        if (this.selectedEpicIds?.length) {
          const set = new Set(this.selectedEpicIds.map((x) => String(x)));
          this.stories = this.stories.filter((s) => {
            const single = s?.epicId ?? s?.epic;
            const singleId = single && typeof single === "object" ? single.id ?? single.pk ?? void 0 : single;
            if (singleId != null && set.has(String(singleId)))
              return true;
            const arr = Array.isArray(s?.epics) ? s.epics : [];
            return arr.some((e) => set.has(String(e && typeof e === "object" ? e.id ?? e.pk ?? e : e)));
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
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element)
      return Promise.resolve([]);
    if (this.loading) {
      return Promise.resolve([new UserStoryItem("Loading...")]);
    }
    if (!this.baseUrlSet) {
      const item = new UserStoryItem("Set Taiga URL in Settings");
      item.command = { command: "workbench.action.openSettings", title: "Open Settings", arguments: ["taiga.baseUrl"] };
      return Promise.resolve([item]);
    }
    if (!this.tokenPresent) {
      const item = new UserStoryItem("Connect to Taiga\u2026");
      item.command = { command: "taiga.connect", title: "Connect" };
      return Promise.resolve([item]);
    }
    if (!this.activeProjectId) {
      return Promise.resolve([new UserStoryItem("Select a project to view stories")]);
    }
    if (!this.stories.length) {
      return Promise.resolve([new UserStoryItem("No user stories")]);
    }
    const getClosed = (s) => {
      const st = s?.status || s?.statusId;
      const isClosed = typeof st === "object" ? st.is_closed || st.isClosed || false : false;
      const slug = (typeof st === "object" ? st.slug || "" : "").toString().toLowerCase();
      const name = (typeof st === "object" ? st.name || "" : "").toString().toLowerCase();
      const closedByText = slug.includes("closed") || name.includes("closed") || slug.includes("done") || name.includes("done") || slug.includes("finished") || name.includes("finished");
      return Boolean(isClosed || closedByText || s?.is_closed || s?.closed);
    };
    const sorted = this.stories.slice().sort((a, b) => {
      const ca = getClosed(a) ? 1 : 0;
      const cb = getClosed(b) ? 1 : 0;
      if (ca !== cb)
        return ca - cb;
      const ra = Number(a.ref ?? a.id ?? 0);
      const rb = Number(b.ref ?? b.id ?? 0);
      return (ra || 0) - (rb || 0);
    });
    return Promise.resolve(sorted.map((s) => new UserStoryItem(`[${s.ref ?? s.id}] ${s.subject || "User Story"}`, s)));
  }
};
var UserStoryItem = class extends vscode4.TreeItem {
  constructor(label, story) {
    super(label, vscode4.TreeItemCollapsibleState.None);
    this.story = story;
    if (!story) {
      this.contextValue = "info";
      return;
    }
    this.id = String(story.id);
    this.tooltip = story.subject || String(story.id);
    this.contextValue = "userStory";
    const st = story.status || story.statusId;
    const isClosed = (typeof st === "object" ? st.is_closed || st.isClosed || false : false) || (typeof st === "object" ? (st.slug || "").toString().toLowerCase().includes("closed") || (st.name || "").toString().toLowerCase().includes("closed") || (st.slug || "").toString().toLowerCase().includes("done") || (st.name || "").toString().toLowerCase().includes("done") : false) || (story.is_closed || story.closed);
    if (isClosed) {
      this.description = "closed";
      this.iconPath = new vscode4.ThemeIcon("circle-slash");
      this.resourceUri = vscode4.Uri.parse("taiga://userstory/closed/" + story.id);
    }
    this.command = { command: "taiga._openUserStoryOnDoubleClick", title: "Open User Story", arguments: [{ story }] };
  }
};

// src/tree/issuesTree.ts
var vscode5 = __toESM(require("vscode"));
var IssuesTreeProvider = class {
  constructor(issueService) {
    this.issueService = issueService;
    this._onDidChangeTreeData = new vscode5.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.issues = [];
    this.loading = false;
    this.baseUrlSet = false;
    this.tokenPresent = false;
    this.includeClosed = false;
    this.selectedEpicIds = [];
  }
  setActiveProject(id) {
    this.activeProjectId = id;
    this.refresh();
  }
  setIncludeClosed(v) {
    this.includeClosed = v;
    this.refresh();
  }
  getIncludeClosed() {
    return this.includeClosed;
  }
  setEpicFilter(ids) {
    this.selectedEpicIds = ids;
    this.refresh();
  }
  getEpicFilter() {
    return this.selectedEpicIds;
  }
  setSprintFilter(_id) {
  }
  refresh() {
    this.load();
  }
  setConnectionState(opts) {
    this.baseUrlSet = opts.baseUrlSet;
    this.tokenPresent = opts.tokenPresent;
    this._onDidChangeTreeData.fire();
  }
  async load() {
    if (this.loading)
      return;
    this.loading = true;
    this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId) {
        this.issues = await this.issueService.listIssues(this.activeProjectId, this.includeClosed);
        if (this.selectedEpicIds?.length) {
          const set = new Set(this.selectedEpicIds.map((x) => String(x)));
          this.issues = this.issues.filter((i) => {
            const single = i?.epicId ?? i?.epic;
            if (single != null && set.has(String(single)))
              return true;
            const arr = Array.isArray(i?.epics) ? i.epics : [];
            return arr.some((e) => set.has(String(e)) || set.has(String(e?.id ?? e)));
          });
        }
      } else {
        this.issues = [];
      }
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element)
      return Promise.resolve([]);
    if (this.loading)
      return Promise.resolve([new IssueItem("Loading...")]);
    if (!this.baseUrlSet) {
      const item = new IssueItem("Set Taiga URL in Settings");
      item.command = { command: "workbench.action.openSettings", title: "Open Settings", arguments: ["taiga.baseUrl"] };
      return Promise.resolve([item]);
    }
    if (!this.tokenPresent) {
      const item = new IssueItem("Connect to Taiga\u2026");
      item.command = { command: "taiga.connect", title: "Connect" };
      return Promise.resolve([item]);
    }
    if (!this.activeProjectId)
      return Promise.resolve([new IssueItem("Select a project to view issues")]);
    const rows = [];
    if (!this.issues.length)
      rows.push(new IssueItem("No issues"));
    else {
      const getClosed = (i) => {
        const st = i?.status || i?.statusId;
        const isClosed = typeof st === "object" ? st.is_closed || st.isClosed || false : false;
        const slug = (typeof st === "object" ? st.slug || "" : "").toString().toLowerCase();
        const name = (typeof st === "object" ? st.name || "" : "").toString().toLowerCase();
        const closedByText = slug.includes("closed") || name.includes("closed") || slug.includes("done") || name.includes("done") || slug.includes("finished") || name.includes("finished") || slug.includes("resolved") || name.includes("resolved");
        return Boolean(isClosed || closedByText || i?.is_closed || i?.closed);
      };
      const sorted = this.issues.slice().sort((a, b) => {
        const ca = getClosed(a) ? 1 : 0;
        const cb = getClosed(b) ? 1 : 0;
        if (ca !== cb)
          return ca - cb;
        const ra = Number(a.ref ?? a.id ?? 0);
        const rb = Number(b.ref ?? b.id ?? 0);
        return (ra || 0) - (rb || 0);
      });
      rows.push(...sorted.map((i) => new IssueItem(i)));
    }
    return Promise.resolve(rows);
  }
};
var IssueItem = class extends vscode5.TreeItem {
  constructor(issueOrLabel, maybeIssue) {
    const issue = typeof issueOrLabel === "string" ? maybeIssue : issueOrLabel;
    const label = typeof issueOrLabel === "string" ? issueOrLabel : `[${issue?.ref ?? issue?.id}] ${issue?.subject || "Issue"}`;
    super(label, vscode5.TreeItemCollapsibleState.None);
    this.issue = issue;
    if (!issue) {
      this.contextValue = "info";
      return;
    }
    this.id = String(issue.id);
    this.tooltip = issue.subject || String(issue.id);
    this.contextValue = "issue";
    const st = issue.status || issue.statusId;
    const isClosed = (typeof st === "object" ? st.is_closed || st.isClosed || false : false) || (typeof st === "object" ? (st.slug || "").toString().toLowerCase().includes("closed") || (st.name || "").toString().toLowerCase().includes("closed") || (st.slug || "").toString().toLowerCase().includes("done") || (st.name || "").toString().toLowerCase().includes("done") || (st.slug || "").toString().toLowerCase().includes("resolved") || (st.name || "").toString().toLowerCase().includes("resolved") : false) || (issue.is_closed || issue.closed);
    if (isClosed) {
      this.description = "closed";
      this.iconPath = new vscode5.ThemeIcon("circle-slash");
      this.resourceUri = vscode5.Uri.parse("taiga://issue/closed/" + issue.id);
    }
    this.command = { command: "taiga._openIssueOnDoubleClick", title: "Open Issue", arguments: [{ issue }] };
  }
};

// src/tree/epicsTree.ts
var vscode6 = __toESM(require("vscode"));
var EpicsTreeProvider = class {
  constructor(epicService) {
    this.epicService = epicService;
    this._onDidChangeTreeData = new vscode6.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.epics = [];
    this.loading = false;
    this.baseUrlSet = false;
    this.tokenPresent = false;
    this.selectedEpicIds = /* @__PURE__ */ new Set();
  }
  setActiveProject(id) {
    this.activeProjectId = id;
    this.refresh();
  }
  setConnectionState(opts) {
    this.baseUrlSet = opts.baseUrlSet;
    this.tokenPresent = opts.tokenPresent;
    this._onDidChangeTreeData.fire();
  }
  refresh() {
    this.load();
  }
  getSelectedEpicIds() {
    return Array.from(this.selectedEpicIds);
  }
  setSelectedEpicIds(ids) {
    this.selectedEpicIds = new Set(ids);
    this._onDidChangeTreeData.fire();
  }
  toggleEpicSelection(epicId) {
    if (this.selectedEpicIds.has(epicId))
      this.selectedEpicIds.delete(epicId);
    else
      this.selectedEpicIds.add(epicId);
    this._onDidChangeTreeData.fire();
  }
  async load() {
    if (this.loading)
      return;
    this.loading = true;
    this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId)
        this.epics = await this.epicService.listEpics(this.activeProjectId);
      else
        this.epics = [];
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element)
      return Promise.resolve([]);
    if (this.loading)
      return Promise.resolve([new EpicItem("Loading...")]);
    if (!this.baseUrlSet) {
      const i = new EpicItem("Set Taiga URL in Settings");
      i.command = { command: "workbench.action.openSettings", title: "Open Settings", arguments: ["taiga.baseUrl"] };
      return Promise.resolve([i]);
    }
    if (!this.tokenPresent) {
      const i = new EpicItem("Connect to Taiga\u2026");
      i.command = { command: "taiga.connect", title: "Connect" };
      return Promise.resolve([i]);
    }
    if (!this.activeProjectId)
      return Promise.resolve([new EpicItem("Select a project to view epics")]);
    if (!this.epics.length)
      return Promise.resolve([new EpicItem("No epics")]);
    const getClosed = (e) => {
      const st = e?.status || e?.statusId;
      const isClosed = typeof st === "object" ? st.is_closed || st.isClosed || false : false;
      const slug = (typeof st === "object" ? st.slug || "" : "").toString().toLowerCase();
      const name = (typeof st === "object" ? st.name || "" : "").toString().toLowerCase();
      const closedByText = slug.includes("closed") || name.includes("closed") || slug.includes("done") || name.includes("done") || slug.includes("finished") || name.includes("finished");
      return Boolean(isClosed || closedByText || e?.is_closed || e?.closed || e?.blocked === true);
    };
    const sorted = this.epics.slice().sort((a, b) => {
      const ca = getClosed(a) ? 1 : 0;
      const cb = getClosed(b) ? 1 : 0;
      if (ca !== cb)
        return ca - cb;
      return String(a.title || a.subject || "").localeCompare(String(b.title || b.subject || ""));
    });
    return Promise.resolve(sorted.map((e) => {
      const label = e.title || e.subject || e.name || `Epic ${e.id}`;
      return new EpicItem(label, e, this.selectedEpicIds.has(e.id));
    }));
  }
};
var EpicItem = class extends vscode6.TreeItem {
  constructor(label, epic, selected) {
    super(label, vscode6.TreeItemCollapsibleState.None);
    this.epic = epic;
    if (!epic) {
      this.contextValue = "info";
      return;
    }
    this.id = String(epic.id);
    this.tooltip = epic.description || label;
    this.contextValue = "epic";
    this.description = selected ? "\u2713" : "";
    const color = epic.color || epic.hexColor || epic.hex_color || void 0;
    if (color) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='6' fill='${color}' stroke='${color}'/></svg>`;
      this.iconPath = vscode6.Uri.parse(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    }
    this.command = { command: "taiga.toggleEpicFilter", title: "Toggle Epic Filter", arguments: [epic] };
    const st = epic.status || epic.statusId;
    const isClosed = (typeof st === "object" ? st.is_closed || st.isClosed || false : false) || (typeof st === "object" ? (st.slug || "").toString().toLowerCase().includes("closed") || (st.name || "").toString().toLowerCase().includes("closed") || (st.slug || "").toString().toLowerCase().includes("done") || (st.name || "").toString().toLowerCase().includes("done") : false) || (epic.is_closed || epic.closed);
    if (isClosed) {
      this.iconPath = new vscode6.ThemeIcon("circle-slash");
      if (!this.description)
        this.description = "closed";
      else
        this.description += " \u2022 closed";
      this.resourceUri = vscode6.Uri.parse("taiga://epic/closed/" + epic.id);
    }
  }
};

// src/tree/sprintsTree.ts
var vscode7 = __toESM(require("vscode"));
var SprintsTreeProvider = class {
  // undefined = no filter, null = Backlog
  constructor(sprintService) {
    this.sprintService = sprintService;
    this._onDidChangeTreeData = new vscode7.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.sprints = [];
    this.loading = false;
    this.baseUrlSet = false;
    this.tokenPresent = false;
    this.selectedSprintId = void 0;
  }
  setActiveProject(id) {
    this.activeProjectId = id;
    this.refresh();
  }
  setConnectionState(opts) {
    this.baseUrlSet = opts.baseUrlSet;
    this.tokenPresent = opts.tokenPresent;
    this._onDidChangeTreeData.fire();
  }
  refresh() {
    this.load();
  }
  getSelectedSprintId() {
    return this.selectedSprintId;
  }
  setSelectedSprintId(id) {
    this.selectedSprintId = id;
    this._onDidChangeTreeData.fire();
  }
  async load() {
    if (this.loading)
      return;
    this.loading = true;
    this._onDidChangeTreeData.fire();
    try {
      if (this.activeProjectId)
        this.sprints = await this.sprintService.listSprints(this.activeProjectId);
      else
        this.sprints = [];
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element)
      return Promise.resolve([]);
    if (this.loading)
      return Promise.resolve([new SprintItem("Loading...")]);
    if (!this.baseUrlSet) {
      const i = new SprintItem("Set Taiga URL in Settings");
      i.command = { command: "workbench.action.openSettings", title: "Open Settings", arguments: ["taiga.baseUrl"] };
      return Promise.resolve([i]);
    }
    if (!this.tokenPresent) {
      const i = new SprintItem("Connect to Taiga\u2026");
      i.command = { command: "taiga.connect", title: "Connect" };
      return Promise.resolve([i]);
    }
    if (!this.activeProjectId)
      return Promise.resolve([new SprintItem("Select a project to view sprints")]);
    const items = [];
    items.push(new SprintItem("Backlog", void 0, this.selectedSprintId === null, true));
    const sorted = this.sprints.slice().sort((a, b) => {
      const ca = a?.closed || a?.is_closed ? 1 : 0;
      const cb = b?.closed || b?.is_closed ? 1 : 0;
      if (ca !== cb)
        return ca - cb;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    for (const s of sorted)
      items.push(new SprintItem(s.name || `Sprint ${s.id}`, s, this.selectedSprintId === s.id));
    return Promise.resolve(items);
  }
};
var SprintItem = class extends vscode7.TreeItem {
  constructor(label, sprint, selected, isBacklog) {
    super(label, vscode7.TreeItemCollapsibleState.None);
    this.sprint = sprint;
    if (!sprint && !isBacklog) {
      this.contextValue = "info";
      return;
    }
    this.id = sprint ? String(sprint.id) : "backlog";
    this.contextValue = sprint ? "sprint" : "backlog";
    this.description = selected ? "\u25CF" : "";
    ;
    this.command = { command: "taiga.selectSprintFilter", title: "Select Sprint", arguments: [sprint] };
    if (sprint && (sprint.closed || sprint.is_closed)) {
      this.iconPath = new vscode7.ThemeIcon("circle-slash");
      if (!this.description)
        this.description = "closed";
      else
        this.description += " \u2022 closed";
      this.resourceUri = vscode7.Uri.parse("taiga://sprint/closed/" + sprint.id);
    }
  }
};

// src/services/epicService.ts
var EpicService = class {
  constructor(api) {
    this.api = api;
  }
  async listEpics(projectId) {
    const { data, error } = await this.api.get("/epics", { query: { project: projectId } });
    if (error || data == null)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
  async listEpicStatuses(projectId) {
    const { data, error } = await this.api.get?.("/epic-statuses", { query: { project: projectId } });
    if (error || !data)
      return [];
    if (Array.isArray(data))
      return data;
    if (Array.isArray(data.results))
      return data.results;
    return [];
  }
  async getEpic(id) {
    const { data, error } = await this.api.get?.(`/epics/${id}`);
    if (error)
      return void 0;
    return data;
  }
  async createEpic(input) {
    const payload = {
      project: input.projectId,
      subject: input.title
    };
    if (input.description !== void 0)
      payload.description = input.description;
    if (input.color !== void 0)
      payload.color = input.color;
    if (input.teamRequirement !== void 0)
      payload.team_requirement = input.teamRequirement;
    if (input.clientRequirement !== void 0)
      payload.client_requirement = input.clientRequirement;
    if (input.isBlocked !== void 0)
      payload.is_blocked = input.isBlocked;
    if (input.statusId !== void 0)
      payload.status = input.statusId;
    if (input.tags !== void 0)
      payload.tags = input.tags;
    if (input.assignedTo !== void 0)
      payload.assigned_to = input.assignedTo;
    const { data, error } = await this.api.post?.("/epics", payload) || { data: void 0, error: { message: "POST not implemented", category: "unknown" } };
    if (error)
      return void 0;
    return data;
  }
  async updateEpic(id, input) {
    const payload = {};
    if (input.title !== void 0)
      payload.subject = input.title;
    if (input.description !== void 0)
      payload.description = input.description;
    if (input.color !== void 0)
      payload.color = input.color;
    if (input.teamRequirement !== void 0)
      payload.team_requirement = input.teamRequirement;
    if (input.clientRequirement !== void 0)
      payload.client_requirement = input.clientRequirement;
    if (input.isBlocked !== void 0)
      payload.is_blocked = input.isBlocked;
    if (input.statusId !== void 0)
      payload.status = input.statusId;
    if (input.tags !== void 0)
      payload.tags = input.tags;
    if (input.assignedTo !== void 0)
      payload.assigned_to = input.assignedTo;
    if (input.version !== void 0)
      payload.version = input.version;
    const { data, error } = await this.api.patch?.(`/epics/${id}`, payload) || { data: void 0, error: { message: "PATCH not implemented", category: "unknown" } };
    if (error)
      return void 0;
    return data;
  }
  async deleteEpic(id) {
    const { status, error } = await this.api.delete?.(`/epics/${id}`) || { status: 0, error: { message: "DELETE not implemented", category: "unknown" } };
    return !error && status >= 200 && status < 300;
  }
};

// src/extension.ts
init_sprintService();
init_taskService();
init_userService();

// src/views/controlsView.ts
var ControlsViewProvider = class {
  constructor(projectService, ctx) {
    this.projectService = projectService;
    this.ctx = ctx;
  }
  static {
    this.viewId = "taigaControls";
  }
  resolveWebviewView(webviewView) {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "connect") {
        await this.ctx.connect();
        await this.render();
      } else if (msg.type === "selectProject") {
        const id = Number(msg.id);
        await this.ctx.setActiveProjectById(id);
        await this.render();
      } else if (msg.type === "toggleShowClosed") {
        await this.ctx.setShowClosedIssues(!!msg.value);
        await this.render();
      } else if (msg.type === "refresh") {
        await this.render();
      }
    });
    return this.render();
  }
  async render() {
    const projects = await this.projectService.listProjects();
    const active = this.ctx.getActiveProject();
    const showClosed = this.ctx.getShowClosedIssues();
    const options = projects.map((p) => `<option value="${p.id}" ${active?.id === p.id ? "selected" : ""}>${escapeHtml(p.name || String(p.id))}</option>`).join("");
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
  <div class="row"><button id="connect">Connect\u2026</button></div>
  <div class="row">
    <span class="label">Project</span>
    <select id="project">${options}</select>
  </div>
  <div class="row">
    <input type="checkbox" id="showClosed" ${showClosed ? "checked" : ""} />
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
};
function escapeHtml(s) {
  return s.replace(/[&<>"]+/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/commands/registerCommands.ts
var vscode8 = __toESM(require("vscode"));
function registerCommands(ctx, providers, commandCtx) {
  const disposables = [];
  disposables.push(
    vscode8.commands.registerCommand("taiga.refreshAll", () => commandCtx.refreshAll()),
    vscode8.commands.registerCommand("taiga.selectProject", (project) => {
      commandCtx.setActiveProject(project);
      commandCtx.refreshAll();
    }),
    vscode8.commands.registerCommand("taiga.showDiagnostics", () => commandCtx.showDiagnostics()),
    vscode8.commands.registerCommand("taiga.setToken", async () => {
      await commandCtx.setToken();
    }),
    vscode8.commands.registerCommand("taiga.connect", async () => {
      await commandCtx.connectWithCredentials();
    }),
    // Filters
    vscode8.commands.registerCommand("taiga.toggleEpicFilter", (epic) => {
      if (!providers.epics)
        return;
      providers.epics.toggleEpicSelection(epic.id);
      const ids = providers.epics.getSelectedEpicIds();
      providers.userStories.setEpicFilter(ids);
      if (providers.issuesProvider && typeof providers.issuesProvider.setEpicFilter === "function") {
        providers.issuesProvider.setEpicFilter(ids);
      }
    }),
    vscode8.commands.registerCommand("taiga.selectSprintFilter", (sprint) => {
      if (!providers.sprints)
        return;
      let next;
      const current = providers.sprints.getSelectedSprintId();
      if (sprint?.id == null) {
        next = current === null ? void 0 : null;
      } else {
        next = current === sprint.id ? void 0 : sprint.id;
      }
      providers.sprints.setSelectedSprintId(next);
      providers.userStories.setSprintFilter(next);
      if (providers.issuesProvider && typeof providers.issuesProvider.setSprintFilter === "function") {
        providers.issuesProvider.setSprintFilter(next);
      }
    })
    // Issues: toggle show closed handled in extension to persist state
  );
  disposables.forEach((d) => ctx.subscriptions.push(d));
}

// src/diagnostics/diagnostics.ts
var vscode9 = __toESM(require("vscode"));
function showDiagnostics(state) {
  const lines = [
    `Active Instance: ${state.activeInstance || "none"}`,
    `Active Project: ${state.activeProject ? state.activeProject.name : "none"}`,
    `Projects Loaded: ${state.projectCount}`,
    `User Stories Loaded: ${state.storyCount}`
  ];
  vscode9.window.showInformationMessage(lines.join("\n"));
}

// src/editors/epicEditor.ts
var vscode11 = __toESM(require("vscode"));
var EpicEditor = class {
  static async openForCreate(epicService, projectId, users, statuses, siteBaseUrl, projectSlug) {
    const panel = vscode11.window.createWebviewPanel("taigaEpicEditor", "New Epic", vscode11.ViewColumn.Active, { enableScripts: true });
    const ext = vscode11.extensions.getExtension("antpavlenko.taiga-mcp-extension");
    if (ext)
      panel.iconPath = {
        light: vscode11.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
        dark: vscode11.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
      };
    const nonce = getNonce3();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${csp}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class="loading">Loading\u2026</div></body></html>`;
    panel.webview.html = renderHtml2(csp, nonce, { mode: "create", users: users || [], statuses: statuses || [], siteBaseUrl, projectSlug, projectId });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "save") {
        const { title, color, description, status, team_requirement, client_requirement, blocked, tags, assigned_to } = msg.payload || {};
        const safeTags = Array.isArray(tags) ? tags.filter((t) => !!t && t.trim().length > 0) : void 0;
        const created = await epicService.createEpic({ projectId, title, color: color || void 0, description: description || void 0, statusId: status ? Number(status) : void 0, teamRequirement: !!team_requirement, clientRequirement: !!client_requirement, isBlocked: !!blocked, tags: safeTags, assignedTo: assigned_to ? Number(assigned_to) : void 0 });
        if (created) {
          vscode11.window.showInformationMessage("Epic created");
          panel.dispose();
          vscode11.commands.executeCommand("taiga.refreshAll");
        } else {
          await handleTokenError2(epicService, "Creating epic failed");
        }
      }
      if (msg.type === "cancel")
        panel.dispose();
    });
  }
  static async openForEdit(epicService, epic, users, statuses, storyService, siteBaseUrl, projectSlug) {
    const panel = vscode11.window.createWebviewPanel("taigaEpicEditor", `Edit Epic: ${epic.title || epic.subject || epic.id}`, vscode11.ViewColumn.Active, { enableScripts: true });
    const ext2 = vscode11.extensions.getExtension("antpavlenko.taiga-mcp-extension");
    if (ext2)
      panel.iconPath = {
        light: vscode11.Uri.joinPath(ext2.extensionUri, "media/taiga-emblem-light.svg"),
        dark: vscode11.Uri.joinPath(ext2.extensionUri, "media/taiga-emblem-dark.svg")
      };
    const nonce = getNonce3();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${csp}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class=loading>Loading\u2026</div></body></html>`;
    const projectId = epic.projectId || epic.project || 0;
    let statusList = statuses || [];
    try {
      if (projectId && !statusList.length)
        statusList = await epicService.listEpicStatuses(projectId);
    } catch {
    }
    const storyStatuses = await (async () => {
      try {
        return projectId ? await new UserStoryService(epicService["api"]).listUserStoryStatuses(projectId) : [];
      } catch {
        return [];
      }
    })();
    const linkedStories = await (async () => {
      try {
        return storyService && projectId ? await storyService.listUserStoriesForEpic(projectId, epic.id) : [];
      } catch {
        return [];
      }
    })();
    panel.webview.html = renderHtml2(csp, nonce, { mode: "edit", epic, statuses: statusList, users: users || [], linkedStories, storyStatuses, siteBaseUrl, projectSlug, projectId });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "save") {
        const { title, color, description, status, team_requirement, client_requirement, blocked, tags, assigned_to } = msg.payload || {};
        const safeTags = Array.isArray(tags) ? tags.filter((t) => !!t && t.trim().length > 0) : void 0;
        const updated = await epicService.updateEpic(epic.id, {
          title: title ?? null,
          color: (color ?? "") || null,
          description: description ?? null,
          statusId: status ? Number(status) : null,
          teamRequirement: !!team_requirement,
          clientRequirement: !!client_requirement,
          isBlocked: !!blocked,
          tags: safeTags,
          assignedTo: assigned_to ? Number(assigned_to) : null,
          version: epic?.version
        });
        if (updated) {
          vscode11.window.showInformationMessage("Epic updated");
          panel.dispose();
          vscode11.commands.executeCommand("taiga.refreshAll");
        } else {
          await handleTokenError2(epicService, "Updating epic failed");
        }
      }
      if (msg.type === "addExistingStory") {
        if (!storyService || !projectId)
          return;
        const candidates = await storyService.listUserStoriesNotInEpic(projectId, epic.id);
        if (!candidates.length) {
          vscode11.window.showInformationMessage("No available user stories to add.");
          return;
        }
        const picked = await vscode11.window.showQuickPick(candidates.map((s) => ({ label: s.subject, description: String(s.ref ?? s.id), s })), { placeHolder: "Select a user story to add" });
        if (picked) {
          await storyService.addUserStoryToEpic(epic.id, picked.s.id);
          const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
          panel.webview.postMessage({ type: "setLinkedStories", stories: refreshed });
        }
      }
      if (msg.type === "createNewStory") {
        try {
          const { StoryEditor: StoryEditor2 } = await Promise.resolve().then(() => (init_storyEditor(), storyEditor_exports));
          await StoryEditor2.openForCreate(storyService, new EpicService(epicService["api"]), new (await Promise.resolve().then(() => (init_sprintService(), sprintService_exports))).SprintService(epicService["api"]), projectId, [epic.id]);
        } catch {
        }
      }
      if (msg.type === "editStory" && msg.storyId) {
        try {
          const sFull = await storyService.getUserStory?.(msg.storyId);
          if (sFull) {
            const { StoryEditor: StoryEditor2 } = await Promise.resolve().then(() => (init_storyEditor(), storyEditor_exports));
            await StoryEditor2.openForEdit(storyService, new EpicService(epicService["api"]), new (await Promise.resolve().then(() => (init_sprintService(), sprintService_exports))).SprintService(epicService["api"]), sFull);
          }
        } catch {
        }
      }
      if (msg.type === "removeStory" && msg.storyId) {
        if (!storyService)
          return;
        await storyService.removeUserStoryFromEpic(epic.id, Number(msg.storyId));
        if (projectId) {
          const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
          panel.webview.postMessage({ type: "setLinkedStories", stories: refreshed });
        }
      }
      if (msg.type === "deleteStory" && msg.storyId) {
        if (!storyService)
          return;
        const ok = await vscode11.window.showWarningMessage("Delete this user story?", { modal: true }, "Delete");
        if (ok === "Delete") {
          await storyService.deleteUserStory?.(Number(msg.storyId));
          if (projectId) {
            const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
            panel.webview.postMessage({ type: "setLinkedStories", stories: refreshed });
          }
          vscode11.commands.executeCommand("taiga.refreshAll");
        }
      }
      if (msg.type === "cancel")
        panel.dispose();
    });
    panel.onDidChangeViewState(async (e) => {
      if (e.webviewPanel.active && storyService && projectId) {
        const refreshed = await storyService.listUserStoriesForEpic(projectId, epic.id);
        panel.webview.postMessage({ type: "setLinkedStories", stories: refreshed });
      }
    });
  }
};
function renderHtml2(csp, nonce, opts) {
  const epic = opts.epic;
  const title = epic?.title || epic?.subject || epic?.name || "";
  const color = epic?.color || epic?.hexColor || epic?.hex_color || "";
  const description = epic?.description || "";
  const status = epic?.status?.id ?? epic?.statusId ?? epic?.status ?? "";
  const statuses = opts.statuses || [];
  const statusSelect = statuses.length ? `<select id="status">${['<option value="">(none)</option>', ...statuses.map((s) => `<option value="${s.id}" ${String(status) === String(s.id) ? "selected" : ""}>${escapeHtml3(s.name)}</option>`)].join("")}</select>` : `<input id="status" type="text" placeholder="Status (choose from Taiga)" value="${escapeHtml3(String(status || ""))}" />`;
  const teamReq = !!epic?.team_requirement;
  const clientReq = !!epic?.client_requirement;
  const blocked = !!epic?.is_blocked || !!epic?.blocked;
  const tags = Array.isArray(epic?.tags) ? epic?.tags.map((t) => String(t ?? "")).map((t) => t.replace(/,+$/, "").trim()).filter((t) => t.length > 0) : [];
  const users = opts.users || [];
  const assignedId = epic?.assigned_to || epic?.assignedTo;
  const userSelect = ['<option value="">Unassigned</option>', ...users.map((u) => `<option value="${u.id}" ${String(assignedId) === String(u.id) ? "selected" : ""}>${escapeHtml3(u.fullName || u.username)}</option>`)].join("");
  const stories = Array.isArray(opts.linkedStories) ? opts.linkedStories : [];
  const storyStatuses = Array.isArray(opts.storyStatuses) ? opts.storyStatuses : [];
  function renderStoriesRows() {
    return stories.map((s) => {
      const dataId = s?.id;
      const displayId = s?.ref ?? s?.id;
      const name = s?.subject || "";
      const assignedId2 = s?.assigned_to ?? s?.assignedTo;
      const assignedName = (() => {
        const f = users.find((u) => String(u.id) === String(assignedId2));
        return f ? f.fullName || f.username : "";
      })();
      const statusId = s?.status?.id ?? s?.status;
      const statusName = (() => {
        const st = storyStatuses.find((ss) => String(ss.id) === String(statusId));
        return st ? st.name : statusId || "";
      })();
      return `<tr data-id="${dataId}" class="story-row">
        <td style="width:90px;">${escapeHtml3(String(displayId))}</td>
        <td>${escapeHtml3(String(name))}</td>
        <td style="width:200px;">${escapeHtml3(String(assignedName))}</td>
        <td style="width:160px;">${escapeHtml3(String(statusName))}</td>
      </tr>`;
    }).join("");
  }
  return `<!DOCTYPE html>
  <html><head><meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <style>
  :root { color-scheme: light dark; }
  body{font-family:var(--vscode-font-family); padding:12px; background: var(--vscode-editor-background); color: var(--vscode-foreground);}
  .row{display:flex; gap:8px; align-items:center; margin:6px 0;}
  input[type=text], textarea, select, input[type=date]{width:100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, rgba(0,0,0,0.18)); padding: 4px 6px; border-radius: 2px;}
  @media (prefers-color-scheme: dark){ input[type=text], textarea, select, input[type=date]{ border-color: var(--vscode-input-border, rgba(255,255,255,0.18)); } input[type="date"]::-webkit-calendar-picker-indicator{ filter: invert(1) contrast(1.1); } }
  @media (prefers-color-scheme: light){ input[type="date"]::-webkit-calendar-picker-indicator{ filter: none; } }
  .darklike input[type="date"]::-webkit-calendar-picker-indicator{ filter: invert(1) brightness(1.2) contrast(1.1); }
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
  <script nonce="${nonce}">/* detect dark background and mark body for calendar icon contrast */(function(){try{var cs=getComputedStyle(document.body);var bg=cs.getPropertyValue('--vscode-editor-background').trim();function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);return {r:r,g:g,b:b};}function parseBg(s){if(!s)return null;var m=s.match(/rgba?((d+)s*,s*(d+)s*,s*(d+)/i);if(m){return {r:+m[1],g:+m[2],b:+m[3]};}if(/^#/.test(s)){return hexToRgb(s);}return null;}var rgb=parseBg(bg);if(rgb){var L=0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b; if(L<140){document.body.classList.add('darklike');}}}catch(e){}})();</script>
  <div class="header">
    <h3 style="margin:0;">${opts.mode === "create" ? "Create Epic" : "Edit Epic"}${opts.mode === "edit" ? ` <em style="font-weight: normal; opacity: .8;">#${escapeHtml3(String(epic?.ref || epic?.id || ""))}</em>` : ""}</h3>
    <div class="right"><label style="min-width:auto;">Assigned to</label><select id="assigned">${userSelect}</select></div>
  </div>
  <div class="row"><label>Title</label><input id="title" type="text" value="${escapeHtml3(title)}" /></div>
  <div class="row"><label>Color</label><input id="color" type="text" placeholder="#RRGGBB (optional)" value="${escapeHtml3(color)}" /></div>
  <div class="row"><label></label><div class="color-palette" id="palette"></div></div>
  <div class="row"><label>Status</label>${statusSelect}</div>
  <div class="row"><label>Flags</label>
    <div class="flags" style="display:flex; gap:8px;">
      <button id="teamReq" title="Team requirement">\u{1F465}</button>
      <button id="clientReq" title="Client requirement">\u{1F464}</button>
      <button id="blocked" title="Blocked">\u26D4</button>
    </div>
  </div>
  <div class="row"><label>Tags</label><input id="tags" type="text" placeholder="Comma-separated" value="${escapeHtml3(tags.join(", "))}" /></div>
  <div class="row"><label>Description</label><textarea id="desc" rows="6">${escapeHtml3(description)}</textarea></div>
  ${(() => {
    const base = opts.siteBaseUrl || "";
    const slug = opts.projectSlug;
    let url = "";
    if (opts.mode === "edit") {
      const idPart = String(epic?.ref || epic?.id || "");
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/epic/${idPart}` : `${base}/epic/${idPart}`;
      }
    } else {
      if (base) {
        url = slug ? `${base}/project/${encodeURIComponent(slug)}/epics` : `${base}/epics`;
      }
    }
    const linkHtml = url ? ` (<a href="${url}" target="_blank">${escapeHtml3(url)}</a>)` : "";
    return `<div class="row"><label></label><div class="note">Comments can be edited in Taiga interface only${linkHtml}</div></div>`;
  })()}
  <div class="actions">
    <button id="save">Save</button>
    <button id="cancel">Cancel</button>
  </div>
  ${opts.mode === "edit" ? `
  <div class="list-header">
    <h4 style="margin:6px 0;">Linked User Stories</h4>
    <div class="right">
      <input id="storySearch" type="text" placeholder="Search..." />
      <button id="addExisting">Add existing\u2026</button>
      <button id="createNew">Create a new user story\u2026</button>
    </div>
  </div>
  <table class="list">
    <thead><tr>
      <th class="sortable" data-key="id" style="width:90px;">ID <span class="dir" id="dir-id"></span></th>
      <th class="sortable" data-key="name">Name <span class="dir" id="dir-name"></span></th>
      <th class="sortable" data-key="assigned" style="width:200px;">Assigned to <span class="dir" id="dir-assigned"></span></th>
      <th class="sortable" data-key="status" style="width:160px;">Status <span class="dir" id="dir-status"></span></th>
    </tr></thead>
    <tbody id="storiesBody">${renderStoriesRows()}</tbody>
  </table>
  <div id="cmenu" class="context-menu"></div>
  ` : ""}
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
      const el = document.getElementById('dir-'+k); if (!el) return; el.textContent = (__sortKey===k) ? (__sortDir==='asc' ? '\u25B2' : '\u25BC') : '';
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
        add('Edit the user story\u2026','editStory');
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
  const tagsInput = document.getElementById('tags');
  // initialize flags
  let teamRequirement = ${teamReq ? "true" : "false"};
  let clientRequirement = ${clientReq ? "true" : "false"};
  let isBlocked = ${blocked ? "true" : "false"};
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
function escapeHtml3(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function getNonce3() {
  let t = "";
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++)
    t += p.charAt(Math.floor(Math.random() * p.length));
  return t;
}
async function handleTokenError2(service, fallbackMsg) {
  try {
    const api = service["api"];
    const test = await api.get("/users/me");
    if (test?.error && test.error.category === "auth") {
      const pick = await vscode11.window.showWarningMessage("Your Taiga session has expired. Reconnect?", "Reconnect");
      if (pick === "Reconnect") {
        await vscode11.commands.executeCommand("taiga.connect");
      }
    } else {
      vscode11.window.showErrorMessage(fallbackMsg);
    }
  } catch {
    vscode11.window.showErrorMessage(fallbackMsg);
  }
}

// src/extension.ts
init_storyEditor();

// src/editors/sprintEditor.ts
var vscode12 = __toESM(require("vscode"));
var SprintEditor = class {
  static async openForCreate(sprintService, projectId) {
    const panel = vscode12.window.createWebviewPanel("taigaSprintEditor", "New Sprint", vscode12.ViewColumn.Active, { enableScripts: true });
    const ext = vscode12.extensions.getExtension("antpavlenko.taiga-mcp-extension");
    if (ext)
      panel.iconPath = {
        light: vscode12.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
        dark: vscode12.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
      };
    const nonce = getNonce4();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${csp}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class="loading">Loading\u2026</div></body></html>`;
    panel.webview.html = renderHtml3(csp, nonce, { mode: "create" });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "save") {
        const { name, start, end } = msg.payload || {};
        const created = await sprintService.createSprint({ projectId, name, startDate: start || void 0, endDate: end || void 0 });
        if (created) {
          vscode12.window.showInformationMessage("Sprint created");
          panel.dispose();
          vscode12.commands.executeCommand("taiga.refreshAll");
        }
      }
      if (msg.type === "cancel")
        panel.dispose();
    });
  }
  static async openForEdit(sprintService, sprint) {
    const panel = vscode12.window.createWebviewPanel("taigaSprintEditor", `Edit Sprint: ${sprint.name || sprint.id}`, vscode12.ViewColumn.Active, { enableScripts: true });
    const ext = vscode12.extensions.getExtension("antpavlenko.taiga-mcp-extension");
    if (ext)
      panel.iconPath = {
        light: vscode12.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-light.svg"),
        dark: vscode12.Uri.joinPath(ext.extensionUri, "media/taiga-emblem-dark.svg")
      };
    const nonceLoading = getNonce4();
    const cspLoading = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonceLoading}';`;
    panel.webview.html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${cspLoading}"><style>:root{color-scheme:light dark}body{font-family:var(--vscode-font-family);padding:12px;background:var(--vscode-editor-background);color:var(--vscode-foreground)}.loading{opacity:.8;font-style:italic}</style></head><body><div class="loading">Loading\u2026</div></body></html>`;
    const full = await (async () => {
      try {
        return await sprintService.getSprint(sprint.id) || sprint;
      } catch {
        return sprint;
      }
    })();
    const nonce = getNonce4();
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    panel.webview.html = renderHtml3(csp, nonce, { mode: "edit", sprint: full });
    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "save") {
        const { name, start, end, closed } = msg.payload || {};
        const updated = await sprintService.updateSprint(sprint.id, {
          name: name ?? null,
          startDate: start ?? null,
          endDate: end ?? null,
          closed: !!closed
        });
        if (updated) {
          vscode12.window.showInformationMessage("Sprint updated");
          panel.dispose();
          vscode12.commands.executeCommand("taiga.refreshAll");
        }
      }
      if (msg.type === "cancel")
        panel.dispose();
    });
  }
};
function renderHtml3(csp, nonce, opts) {
  const s = opts.sprint;
  const name = s?.name || "";
  const start = s?.estimated_start || s?.startDate || "";
  const end = s?.estimated_finish || s?.endDate || "";
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
  <div class="row"><label>Name</label><input id="name" type="text" value="${escapeHtml4(name)}" /></div>
  <div class="row"><label>Start date</label><input id="start" type="date" value="${escapeHtml4(start)}" /></div>
  <div class="row"><label>End date</label><input id="end" type="date" value="${escapeHtml4(end)}" /></div>
  ${opts.mode === "edit" ? '<div class="row"><label>Closed</label><input id="closed" type="checkbox" ' + (closed ? "checked" : "") + " /></div>" : ""}
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
function escapeHtml4(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function getNonce4() {
  let t = "";
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++)
    t += p.charAt(Math.floor(Math.random() * p.length));
  return t;
}

// src/extension.ts
var activeProject;
async function activate(context) {
  const configMgr = new ConfigurationManager();
  const currentCfg = configMgr.getEffective();
  const logger = createLogger("Taiga", () => configMgr.getEffective().verbose);
  const authMgr = new AuthManager(context);
  async function getToken() {
    const token = await authMgr.getToken(currentCfg.tokenSecretId);
    return token;
  }
  let api = new TaigaApiClient(currentCfg.baseUrl || "", getToken, void 0, (m) => logger.info(m));
  const projectService = new ProjectService(api);
  const userStoryService = new UserStoryService(api);
  const issueService = new IssueService(api);
  const epicService = new EpicService(api);
  const sprintService = new SprintService(api);
  const storiesTree = new UserStoriesTreeProvider(userStoryService);
  const issuesTree = new IssuesTreeProvider(issueService);
  const epicsTree = new EpicsTreeProvider(epicService);
  const sprintsTree = new SprintsTreeProvider(sprintService);
  const taskService = new TaskService(api);
  const userService = new UserService(api);
  vscode15.window.registerTreeDataProvider("taigaEpics", epicsTree);
  vscode15.window.registerTreeDataProvider("taigaSprints", sprintsTree);
  const storiesTreeView = vscode15.window.createTreeView("taigaUserStories", { treeDataProvider: storiesTree });
  context.subscriptions.push(storiesTreeView);
  vscode15.window.registerTreeDataProvider("taigaIssues", issuesTree);
  const controlsProvider = new ControlsViewProvider(projectService, {
    getActiveProject() {
      return activeProject;
    },
    async setActiveProjectById(id) {
      const projects = await projectService.listProjects();
      const p = projects.find((x) => x.id === id);
      if (p) {
        epicsTree.setActiveProject(p.id);
        sprintsTree.setActiveProject(p.id);
        storiesTree.setActiveProject(p.id);
        issuesTree.setActiveProject(p.id);
        commandCtx.setActiveProject(p);
      }
    },
    async connect() {
      await commandCtx.connectWithCredentials();
    },
    getShowClosedIssues() {
      return issuesTree.getIncludeClosed();
    },
    async setShowClosedIssues(v) {
      issuesTree.setIncludeClosed(v);
      await context.globalState.update("taiga.issues.includeClosed", v);
    }
  });
  context.subscriptions.push(vscode15.window.registerWebviewViewProvider(ControlsViewProvider.viewId, controlsProvider));
  async function updateConnectionState() {
    const cfg = configMgr.getEffective();
    const token = await authMgr.getToken(cfg.tokenSecretId);
    const baseUrlSet = !!cfg.baseUrl;
    const tokenPresent = !!token;
    epicsTree.setConnectionState({ baseUrlSet, tokenPresent });
    sprintsTree.setConnectionState({ baseUrlSet, tokenPresent });
    storiesTree.setConnectionState({ baseUrlSet, tokenPresent });
    issuesTree.setConnectionState({ baseUrlSet, tokenPresent });
  }
  const commandCtx = {
    setActiveProject(project) {
      activeProject = project;
      context.globalState.update("taiga.activeProject", project ? { id: project.id, name: project.name } : void 0);
      epicsTree.setActiveProject(project?.id);
      sprintsTree.setActiveProject(project?.id);
      storiesTree.setActiveProject(project?.id);
      issuesTree.setActiveProject(project?.id);
    },
    getActiveProject() {
      return activeProject;
    },
    showDiagnostics: () => showDiagnostics({
      activeInstance: currentCfg.baseUrl,
      activeProject,
      projectCount: 0,
      storyCount: storiesTree.getStoryCount()
    }),
    refreshAll: () => {
      epicsTree.refresh();
      sprintsTree.refresh();
      storiesTree.refresh();
      issuesTree.refresh();
    },
    setToken: async () => {
      await authMgr.setToken(currentCfg.tokenSecretId);
      commandCtx.refreshAll();
    },
    connectWithCredentials: async () => {
      const username = await vscode15.window.showInputBox({ prompt: "Taiga username or email", ignoreFocusOut: true });
      if (!username)
        return;
      const password = await vscode15.window.showInputBox({ prompt: "Taiga password", ignoreFocusOut: true, password: true });
      if (!password)
        return;
      const authUrl = `${configMgr.getEffective().baseUrl.replace(/\/$/, "")}/auth`;
      try {
        const resp = await globalThis.fetch(authUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ type: "normal", username: username.trim(), password })
        });
        const text = await resp.text();
        let body = void 0;
        try {
          body = text ? JSON.parse(text) : void 0;
        } catch {
          body = text;
        }
        if (!resp.ok) {
          const err = { category: resp.status === 401 ? "auth" : "server", httpStatus: resp.status, message: "Authentication failed", details: body };
          vscode15.window.showErrorMessage(`Taiga auth failed: ${err.message} (${resp.status})`);
          return;
        }
        const token = body?.auth_token || body?.token || body?.access_token;
        if (!token) {
          vscode15.window.showErrorMessage("Taiga auth response did not include a token.");
          return;
        }
        await authMgr.setToken(configMgr.getEffective().tokenSecretId, token);
        vscode15.window.showInformationMessage("Connected to Taiga.");
        await updateConnectionState();
        const projects = await projectService.listProjects();
        const picked = await vscode15.window.showQuickPick(projects.map((p) => ({ label: p.name, description: String(p.id), p })), { placeHolder: "Select Taiga project" });
        if (picked) {
          commandCtx.setActiveProject(picked.p);
        }
        commandCtx.refreshAll();
      } catch (e) {
        vscode15.window.showErrorMessage(`Taiga auth error: ${e.message}`);
      }
    }
  };
  registerCommands(context, { userStories: storiesTree, epics: epicsTree, sprints: sprintsTree, issuesProvider: issuesTree }, commandCtx);
  (function setupUserStoryDoubleClickCommand() {
    let lastById = /* @__PURE__ */ new Map();
    context.subscriptions.push(vscode15.commands.registerCommand("taiga._openUserStoryOnDoubleClick", (arg) => {
      const story = arg?.story;
      if (!story)
        return;
      const id = String(story.id);
      const now = Date.now();
      const prev = lastById.get(id) || 0;
      if (now - prev < 350) {
        vscode15.commands.executeCommand("taiga.editUserStory", { story });
        lastById.delete(id);
      } else {
        lastById.set(id, now);
        setTimeout(() => {
          if (Date.now() - (lastById.get(id) || 0) >= 350)
            lastById.delete(id);
        }, 400);
      }
    }));
  })();
  (function setupIssueDoubleClickCommand() {
    let lastById = /* @__PURE__ */ new Map();
    context.subscriptions.push(vscode15.commands.registerCommand("taiga._openIssueOnDoubleClick", async (arg) => {
      const issue = arg?.issue;
      if (!issue)
        return;
      const id = String(issue.id);
      const now = Date.now();
      const prev = lastById.get(id) || 0;
      if (now - prev < 350) {
        await vscode15.commands.executeCommand("taiga.editIssue", { issue });
        lastById.delete(id);
      } else {
        lastById.set(id, now);
        setTimeout(() => {
          if (Date.now() - (lastById.get(id) || 0) >= 350)
            lastById.delete(id);
        }, 400);
      }
    }));
  })();
  context.subscriptions.push(
    vscode15.commands.registerCommand("taiga.createEpic", async () => {
      if (!activeProject) {
        vscode15.window.showWarningMessage("Select a project first");
        return;
      }
      const [users, statuses] = await Promise.all([
        (async () => {
          try {
            return await userService.listProjectUsers(activeProject.id);
          } catch {
            return [];
          }
        })(),
        (async () => {
          try {
            return await epicService.listEpicStatuses(activeProject.id);
          } catch {
            return [];
          }
        })()
      ]);
      const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
      let projectSlug = void 0;
      try {
        const projects = await projectService.listProjects();
        projectSlug = projects.find((p) => p.id === activeProject.id)?.slug;
      } catch {
      }
      await EpicEditor.openForCreate(epicService, activeProject.id, users, statuses, siteBaseUrl, projectSlug);
    }),
    // Internal helpers to open Task editors from other parts (e.g., webview-backed editors)
    vscode15.commands.registerCommand("taiga._openTaskEditorCreate", async (args) => {
      try {
        if (!args)
          return;
        const projectId = Number(args.projectId);
        const storyId = Number(args.storyId);
        if (!projectId || !storyId)
          return;
        const { TaskEditor: TaskEditor2 } = await Promise.resolve().then(() => (init_taskEditor(), taskEditor_exports));
        await TaskEditor2.openForCreate(taskService, projectId, storyId, args.siteBaseUrl, args.projectSlug);
      } catch {
      }
    }),
    vscode15.commands.registerCommand("taiga._openTaskEditorEdit", async (args) => {
      try {
        if (!args)
          return;
        const taskId = Number(args.taskId);
        if (!taskId)
          return;
        const full = await taskService.getTask(taskId);
        if (!full)
          return;
        const { TaskEditor: TaskEditor2 } = await Promise.resolve().then(() => (init_taskEditor(), taskEditor_exports));
        await TaskEditor2.openForEdit(taskService, full, args.siteBaseUrl, args.projectSlug);
      } catch {
      }
    }),
    vscode15.commands.registerCommand("taiga.editEpic", async (node) => {
      const epic = node?.epic;
      if (!epic)
        return;
      const fullEpic = await (async () => {
        try {
          return await epicService.getEpic(epic.id) || epic;
        } catch {
          return epic;
        }
      })();
      const projectId = fullEpic.projectId || fullEpic.project || activeProject?.id;
      const [users, statuses] = await Promise.all([
        (async () => {
          try {
            return projectId ? await userService.listProjectUsers(projectId) : [];
          } catch {
            return [];
          }
        })(),
        (async () => {
          try {
            return projectId ? await epicService.listEpicStatuses(projectId) : [];
          } catch {
            return [];
          }
        })()
      ]);
      const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
      let projectSlug = void 0;
      try {
        const projects = await projectService.listProjects();
        projectSlug = projectId ? projects.find((p) => p.id === projectId)?.slug : void 0;
      } catch {
      }
      await EpicEditor.openForEdit(epicService, fullEpic, users, statuses, userStoryService, siteBaseUrl, projectSlug);
    }),
    vscode15.commands.registerCommand("taiga.deleteEpic", async (node) => {
      const epic = node?.epic;
      if (!epic)
        return;
      const label = epic.title || epic.subject || epic.name || `Epic ${epic.id}`;
      const ok = await vscode15.window.showWarningMessage(`Delete epic "${label}"?`, { modal: true }, "Delete");
      if (ok === "Delete") {
        if (await epicService.deleteEpic(epic.id)) {
          vscode15.window.showInformationMessage("Epic deleted");
          epicsTree.refresh();
        }
      }
    }),
    vscode15.commands.registerCommand("taiga.addStoriesToEpic", async (node) => {
      const epic = node?.epic;
      if (!epic)
        return;
      if (!activeProject) {
        vscode15.window.showWarningMessage("Select a project first");
        return;
      }
      await storiesTree.load();
      const all = storiesTree.getStories();
      const picks = await vscode15.window.showQuickPick(all.map((s) => ({ label: s.subject, description: String(s.ref ?? s.id), s })), { canPickMany: true, placeHolder: "Select stories to add to epic" });
      if (!picks || !picks.length)
        return;
      for (const p of picks) {
        await userStoryService.addUserStoryToEpic(epic.id, p.s.id);
      }
      vscode15.window.showInformationMessage(`Added ${picks.length} stories to epic`);
      storiesTree.refresh();
    }),
    vscode15.commands.registerCommand("taiga.createSprint", async () => {
      if (!activeProject) {
        vscode15.window.showWarningMessage("Select a project first");
        return;
      }
      await SprintEditor.openForCreate(sprintService, activeProject.id);
    }),
    vscode15.commands.registerCommand("taiga.editSprint", async (node) => {
      const sprint = node?.sprint;
      if (!sprint)
        return;
      const full = await (async () => {
        try {
          return await sprintService.getSprint(sprint.id) || sprint;
        } catch {
          return sprint;
        }
      })();
      await SprintEditor.openForEdit(sprintService, full);
    }),
    vscode15.commands.registerCommand("taiga.deleteSprint", async (node) => {
      const sprint = node?.sprint;
      if (!sprint)
        return;
      const ok = await vscode15.window.showWarningMessage(`Delete sprint "${sprint.name}"?`, { modal: true }, "Delete");
      if (ok === "Delete") {
        if (await sprintService.deleteSprint(sprint.id)) {
          vscode15.window.showInformationMessage("Sprint deleted");
          sprintsTree.refresh();
        }
      }
    }),
    vscode15.commands.registerCommand("taiga.createUserStory", async () => {
      if (!activeProject) {
        vscode15.window.showWarningMessage("Select a project first");
        return;
      }
      const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
      let projectSlug = void 0;
      try {
        const projects = await projectService.listProjects();
        projectSlug = projects.find((p) => p.id === activeProject.id)?.slug;
      } catch {
      }
      await StoryEditor.openForCreate(userStoryService, epicService, sprintService, activeProject.id, void 0, siteBaseUrl, projectSlug);
    }),
    vscode15.commands.registerCommand("taiga.createUserStoryForEpic", async (node) => {
      const epic = node?.epic;
      if (!epic || !activeProject)
        return;
      const subject = await vscode15.window.showInputBox({ prompt: `New story subject (epic: ${epic.title})` });
      if (!subject)
        return;
      const created = await userStoryService.createUserStory({ projectId: activeProject.id, subject, epicId: epic.id });
      if (created) {
        vscode15.window.showInformationMessage("User Story created");
        storiesTree.refresh();
      }
    }),
    vscode15.commands.registerCommand("taiga.editUserStory", async (node) => {
      const story = node?.story;
      if (!story)
        return;
      const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
      let projectSlug = void 0;
      try {
        const pidStr = String(story?.projectId ?? story?.project ?? activeProject?.id ?? "");
        const pid = Number(pidStr);
        const projects = await projectService.listProjects();
        projectSlug = !isNaN(pid) ? projects.find((p) => p.id === pid)?.slug : void 0;
      } catch {
      }
      await StoryEditor.openForEdit(userStoryService, epicService, sprintService, story, siteBaseUrl, projectSlug);
    }),
    vscode15.commands.registerCommand("taiga.manageStoryTasks", async (node) => {
      const story = node?.story;
      if (!story)
        return;
      const tasks = await taskService.listTasksByUserStory(story.id);
      const picked = await vscode15.window.showQuickPick(tasks.map((t) => ({ label: t.subject, description: String(t.id), t })), { placeHolder: "Tasks (pick to edit in editor or Esc to close)" });
      if (picked) {
        try {
          const { TaskEditor: TaskEditor2 } = await Promise.resolve().then(() => (init_taskEditor(), taskEditor_exports));
          const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
          let projectSlug = void 0;
          try {
            const pidStr = String(story?.projectId ?? story?.project ?? activeProject?.id ?? "");
            const pid = Number(pidStr);
            const projects = await projectService.listProjects();
            projectSlug = !isNaN(pid) ? projects.find((p) => p.id === pid)?.slug : void 0;
          } catch {
          }
          await TaskEditor2.openForEdit(taskService, picked.t, siteBaseUrl, projectSlug);
        } catch {
        }
      }
    }),
    vscode15.commands.registerCommand("taiga.createTaskForStory", async (node) => {
      const story = node?.story;
      if (!story || !activeProject)
        return;
      try {
        const { TaskEditor: TaskEditor2 } = await Promise.resolve().then(() => (init_taskEditor(), taskEditor_exports));
        const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
        let projectSlug = void 0;
        try {
          const projects = await projectService.listProjects();
          projectSlug = projects.find((p) => p.id === activeProject.id)?.slug;
        } catch {
        }
        await TaskEditor2.openForCreate(taskService, activeProject.id, story.id, siteBaseUrl, projectSlug);
      } catch {
      }
    }),
    vscode15.commands.registerCommand("taiga.deleteUserStory", async (node) => {
      const story = node?.story;
      if (!story)
        return;
      const ok = await vscode15.window.showWarningMessage(`Delete user story "${story.subject}"?`, { modal: true }, "Delete");
      if (ok === "Delete") {
        if (await userStoryService.deleteUserStory(story.id)) {
          vscode15.window.showInformationMessage("User Story deleted");
          storiesTree.refresh();
        }
      }
    }),
    vscode15.commands.registerCommand("taiga.createIssue", async () => {
      if (!activeProject) {
        vscode15.window.showWarningMessage("Select a project first");
        return;
      }
      const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
      let projectSlug = void 0;
      try {
        const projects = await projectService.listProjects();
        projectSlug = projects.find((p) => p.id === activeProject.id)?.slug;
      } catch {
      }
      const { IssueEditor: IssueEditor2 } = await Promise.resolve().then(() => (init_issueEditor(), issueEditor_exports));
      await IssueEditor2.openForCreate(issueService, activeProject.id, siteBaseUrl, projectSlug);
    }),
    vscode15.commands.registerCommand("taiga.editIssue", async (node) => {
      const issue = node?.issue;
      if (!issue)
        return;
      const siteBaseUrl = (configMgr.getEffective().baseUrl || "").replace(/\/(api)(\/v\d+)?$/, "");
      let projectSlug = void 0;
      try {
        const pid = issue.projectId ?? issue.project ?? activeProject?.id;
        const projects = await projectService.listProjects();
        projectSlug = projects.find((p) => String(p.id) === String(pid))?.slug;
      } catch {
      }
      const full = await (async () => {
        try {
          return await issueService.getIssue?.(issue.id) || issue;
        } catch {
          return issue;
        }
      })();
      const { IssueEditor: IssueEditor2 } = await Promise.resolve().then(() => (init_issueEditor(), issueEditor_exports));
      await IssueEditor2.openForEdit(issueService, full, siteBaseUrl, projectSlug);
    }),
    vscode15.commands.registerCommand("taiga.deleteIssue", async (node) => {
      const issue = node?.issue;
      if (!issue)
        return;
      const ok = await vscode15.window.showWarningMessage(`Delete issue "${issue.subject}"?`, { modal: true }, "Delete");
      if (ok === "Delete") {
        if (await issueService.deleteIssue(issue.id)) {
          vscode15.window.showInformationMessage("Issue deleted");
          issuesTree.refresh();
        }
      }
    })
  );
  const saved = context.globalState.get("taiga.activeProject");
  if (saved) {
    activeProject = saved;
    epicsTree.setActiveProject(saved.id);
    sprintsTree.setActiveProject(saved.id);
    storiesTree.setActiveProject(saved.id);
    issuesTree.setActiveProject(saved.id);
  }
  const showClosed = context.globalState.get("taiga.issues.includeClosed");
  if (typeof showClosed === "boolean")
    issuesTree.setIncludeClosed(showClosed);
  updateConnectionState();
  if (activeProject) {
    epicsTree.load();
    sprintsTree.load();
    storiesTree.load();
    issuesTree.load();
  }
  logger.info("Taiga extension activated.");
  configMgr.watch(context);
  configMgr.onDidChange(async () => {
    const cfg = configMgr.getEffective();
    api = new TaigaApiClient(cfg.baseUrl || "", getToken, void 0, (m) => logger.info(m));
    await updateConnectionState();
    epicsTree.setActiveProject(activeProject?.id);
    sprintsTree.setActiveProject(activeProject?.id);
    storiesTree.setActiveProject(activeProject?.id);
    issuesTree.setActiveProject(activeProject?.id);
    epicsTree.refresh();
    sprintsTree.refresh();
    storiesTree.refresh();
    issuesTree.refresh();
  });
  vscode15.commands.registerCommand("taiga.toggleShowClosedIssues", async () => {
    const next = !issuesTree.getIncludeClosed();
    issuesTree.setIncludeClosed(next);
    await context.globalState.update("taiga.issues.includeClosed", next);
  });
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
