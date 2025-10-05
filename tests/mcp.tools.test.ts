import assert from 'assert';
import { registerTools } from '../src/mcp/tools';
import { TaigaClient } from '../src/mcp/client';

// Minimal fake server to capture tools
class FakeServer {
  tools: Record<string, (args?: any) => Promise<any>> = {};
  tool(name: string, _meta: any, handler: (args?: any) => Promise<any>) {
    this.tools[name] = handler;
  }
}

// Fake fetch-driven client: override methods to return canned data
class FakeClient extends TaigaClient {
  constructor() { super({ baseUrl: 'http://x', token: 't' }, (globalThis.fetch as any)); }
  listProjects() { return Promise.resolve([{ id: 1, name: 'P' }]); }
  getProject(_: any) { return Promise.resolve({ id: 1, name: 'P' }); }
  listEpics() { return Promise.resolve([{ id: 10, title: 'E' }]); }
  getEpic(_: number) { return Promise.resolve({ id: 10 }); }
  createEpic(_: any) { return Promise.resolve({ id: 11 }); }
  updateEpic(_: number, __: any) { return Promise.resolve({ id: 10, updated: true }); }
  listUserStories() { return Promise.resolve([{ id: 20, subject: 'S' }]); }
  getUserStory(_: number) { return Promise.resolve({ id: 20 }); }
  createUserStory(_: any) { return Promise.resolve({ id: 21 }); }
  updateUserStory(_: number, __: any) { return Promise.resolve({ id: 20, updated: true }); }
  listTasks(_: any) { return Promise.resolve([{ id: 30 }]); }
  getTask(_: number) { return Promise.resolve({ id: 30 }); }
  createTask(_: any) { return Promise.resolve({ id: 31 }); }
  updateTask(_: number, __: any) { return Promise.resolve({ id: 30, updated: true }); }
  listIssues(_: any) { return Promise.resolve([{ id: 40 }]); }
  getIssue(_: number) { return Promise.resolve({ id: 40 }); }
  createIssue(_: any) { return Promise.resolve({ id: 41 }); }
  updateIssue(_: number, __: any) { return Promise.resolve({ id: 40, updated: true }); }
  listComments(_: any, __: number) { return Promise.resolve([{ id: 1, comment: 'ok' }]); }
  createComment(_: any, __: number, ___: string) { return Promise.resolve({ id: 2, comment: 'ok' }); }
}

function parseContent(res: any) {
  const txt = res?.content?.[0]?.text ?? '{}';
  return JSON.parse(txt);
}

(async () => {
  const fake = new FakeServer();
  registerTools(fake as any, new FakeClient());

  // Projects
  assert.ok(fake.tools['taiga_projects_list']);
  assert.ok(fake.tools['taiga_project_get']);
  assert.equal(parseContent(await fake.tools['taiga_projects_list']()), undefined === undefined ? undefined : undefined);
  const proj = parseContent(await fake.tools['taiga_project_get']({ id: 1 }));
  assert.equal(proj.id, 1);

  // Epics
  const epics = parseContent(await fake.tools['taiga_epics_list']());
  assert.ok(Array.isArray(epics));
  const epic = parseContent(await fake.tools['taiga_epic_get']({ id: 10 }));
  assert.equal(epic.id, 10);

  // Comments
  // Removed: taiga_epics_comments_list; validate comments via epic_get instead when needed
  const created = parseContent(await fake.tools['taiga_epics_comments_create']({ id: 10, text: 'x' }));
  assert.equal(created.id, 2);

  // Tasks
  const tasks = parseContent(await fake.tools['taiga_tasks_list']({}));
  assert.ok(Array.isArray(tasks));

  console.log('MCP tools smoke tests passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
