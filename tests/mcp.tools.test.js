const assert = require('assert');
const { registerTools } = require('../dist/mcp/tools.js');
const { TaigaClient } = require('../dist/mcp/client.js');

class FakeServer {
  constructor() { this.tools = {}; }
  tool(name, _meta, handler) { this.tools[name] = handler; }
}

class FakeClient extends TaigaClient {
  constructor() { super({ baseUrl: 'http://x', token: 't' }); }
  listProjects() { return Promise.resolve([{ id: 1, name: 'P' }]); }
  getProject(_) { return Promise.resolve({ id: 1, name: 'P' }); }
  listEpics() { return Promise.resolve([{ id: 10, ref: 10, subject: 'E' }]); }
  getEpic(_) { return Promise.resolve({ id: 10, ref: 10 }); }
  createEpic(_) { return Promise.resolve({ id: 11 }); }
  updateEpic(_, __) { return Promise.resolve({ id: 10, updated: true }); }
  listUserStories() { return Promise.resolve([{ id: 20, ref: 20, subject: 'S' }]); }
  getUserStory(_) { return Promise.resolve({ id: 20, ref: 20 }); }
  createUserStory(_) { return Promise.resolve({ id: 21 }); }
  updateUserStory(_, __) { return Promise.resolve({ id: 20, updated: true }); }
  listTasks(_) { return Promise.resolve([{ id: 30, ref: 30 }]); }
  getTask(_) { return Promise.resolve({ id: 30, ref: 30 }); }
  createTask(_) { return Promise.resolve({ id: 31 }); }
  updateTask(_, __) { return Promise.resolve({ id: 30, updated: true }); }
  listIssues(_) { return Promise.resolve([{ id: 40, ref: 40 }]); }
  getIssue(_) { return Promise.resolve({ id: 40, ref: 40 }); }
  createIssue(_) { return Promise.resolve({ id: 41 }); }
  updateIssue(_, __) { return Promise.resolve({ id: 40, updated: true }); }
  listComments(_, __) { return Promise.resolve([{ id: 1, comment: 'ok' }]); }
  createComment(_, __, ___) { return Promise.resolve({ id: 2, comment: 'ok' }); }
  resolveIdByRef(kind, ref) { return Promise.resolve(Number(ref)); }
}

function parseContent(res) {
  const txt = res && res.content && res.content[0] && res.content[0].text;
  return JSON.parse(txt);
}

(async () => {
  const fake = new FakeServer();
  registerTools(fake, new FakeClient());

  // Projects
  const proj = parseContent(await fake.tools['taiga_project_get']({ id: 1 }));
  assert.equal(proj.id, 1);

  // Epics
  const epics = parseContent(await fake.tools['taiga_epics_list']());
  assert.ok(Array.isArray(epics));
  const epic = parseContent(await fake.tools['taiga_epic_get']({ ref: 10 }));
  assert.equal(epic.id, 10);
  // Removed: taiga_epics_comments_list; epic comments are returned via taiga_epic_get
  const c2 = parseContent(await fake.tools['taiga_epics_comments_create']({ ref: 10, text: 'hi' }));
  assert.ok(typeof c2 === 'string' && c2.toLowerCase().includes('created'));

  // Tasks
  const tasks = parseContent(await fake.tools['taiga_tasks_list']({}));
  assert.ok(Array.isArray(tasks));

  // Issues
  const issues = parseContent(await fake.tools['taiga_issues_list']({}));
  assert.ok(Array.isArray(issues));

  console.log('MCP tools smoke tests passed');
})().catch((e) => { console.error(e); process.exit(1); });
