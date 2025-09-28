import * as vscode from 'vscode';

export interface EffectiveConfig {
  baseUrl: string;
  tokenSecretId: string;
  verbose: boolean;
  maxPageSize: number;
}

export class ConfigurationManager {
  private _onDidChange = new vscode.EventEmitter<EffectiveConfig>();
  readonly onDidChange = this._onDidChange.event;

  getEffective(): EffectiveConfig {
    const cfg = vscode.workspace.getConfiguration();
    // New single-baseUrl setting
    let baseUrl = this.normalizeBaseUrl(String(cfg.get<string>('taiga.baseUrl') || ''));
    // Backward compatibility: if old instances exist, use the first as fallback
    if (!baseUrl) {
      const instances = (cfg.get<any[]>('taiga.instances') || []);
      const activeName = cfg.get<string>('taiga.activeInstanceName') || instances[0]?.name;
      const active = instances.find((i: any) => i.name === activeName) || instances[0];
      if (active?.baseUrl) baseUrl = this.normalizeBaseUrl(String(active.baseUrl));
    }
    return {
      baseUrl,
      tokenSecretId: `taiga:default:token`,
      verbose: !!cfg.get<boolean>('taiga.enableVerboseLogging'),
      maxPageSize: cfg.get<number>('taiga.maxPageSize') || 50
    };
  }

  watch(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('taiga')) {
        this._onDidChange.fire(this.getEffective());
      }
    }));
  }

  // Old normalizeInstance not needed with single baseUrl; keep baseUrl helper below

  private normalizeBaseUrl(rawBaseUrl: string): string {
    let u = rawBaseUrl.trim().replace(/\/+$/, '');
    if (!u) return '';
    // If there's no '/api' segment at all, append default '/api/v1'
    const hasApi = /\/api(\/|$)/.test(u);
    if (!hasApi) return `${u}/api/v1`;
    // If it ends exactly with '/api', append '/v1'
    if (u.endsWith('/api')) return `${u}/v1`;
    return u;
  }
}
