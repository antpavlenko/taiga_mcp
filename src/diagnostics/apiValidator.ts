import * as vscode from 'vscode';
import { EpicService } from '../services/epicService';
import { SprintService } from '../services/sprintService';
import { UserStoryService } from '../services/userStoryService';
import { ProjectService } from '../services/projectService';
import { UserService } from '../services/userService';

function previewKeys(obj: any, max = 10): string {
  if (!obj || typeof obj !== 'object') return String(obj);
  return Object.keys(obj).slice(0, max).join(',');
}

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

export async function validateApisForProject(projectId: number, services: {
  epicService: EpicService;
  sprintService: SprintService;
  userStoryService: UserStoryService;
  projectService: ProjectService;
  userService: UserService;
}) {
  const out = vscode.window.createOutputChannel('Taiga: API Validation');
  out.clear();
  out.show(true);
  out.appendLine(`Validating Taiga APIs for project ${projectId}...`);
  try {
    const [project] = await Promise.all([
      (async ()=>{ try { const list = await services.projectService.listProjects(); return list.find(p => p.id === projectId); } catch { return undefined; } })(),
    ]);
    out.appendLine(`Project: ${project ? `${project.name} (#${project.id})` : `#${projectId}`}\n`);

    const tasks: Array<{ name: string; run: () => Promise<any[]>; sample: (x: any) => string; }> = [
      {
        name: 'Epics',
        run: () => services.epicService.listEpics(projectId),
        sample: (e) => `id=${e.id} project=${normalizeId((e as any).projectId ?? (e as any).project)} keys=[${previewKeys(e)}]`,
      },
      {
        name: 'Sprints',
        run: () => services.sprintService.listSprints(projectId),
        sample: (m) => `id=${m.id} project=${normalizeId((m as any).projectId ?? (m as any).project)} keys=[${previewKeys(m)}]`,
      },
      {
        name: 'User story statuses',
        run: () => services.userStoryService.listUserStoryStatuses(projectId),
        sample: (s) => `id=${s.id} name=${(s as any).name} keys=[${previewKeys(s)}]`,
      },
      {
        name: 'Points',
        run: () => services.userStoryService.listPoints(projectId),
        sample: (p) => `id=${p.id} name/value=${(p as any).value ?? (p as any).name} keys=[${previewKeys(p)}]`,
      },
      {
        name: 'Roles',
        run: () => services.userStoryService.listRoles(projectId),
        sample: (r) => `id=${r.id} name=${(r as any).name} keys=[${previewKeys(r)}]`,
      },
      {
        name: 'Users',
        run: () => services.userService.listProjectUsers(projectId),
        sample: (u) => `id=${u.id} name=${(u as any).fullName ?? (u as any).username} keys=[${previewKeys(u)}]`,
      },
    ];

    for (const t of tasks) {
      try {
        const arr = await t.run();
        out.appendLine(`${t.name}: ${arr.length}`);
        if (arr.length) out.appendLine(`  sample: ${t.sample(arr[0])}`);
      } catch (e) {
        out.appendLine(`${t.name}: ERROR ${String((e as Error).message || e)}`);
      }
    }
    out.appendLine('\nValidation completed.');
  } catch (e) {
    out.appendLine(`Validation failed: ${(e as Error).message}`);
  }
}
