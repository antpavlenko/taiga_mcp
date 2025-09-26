import * as vscode from 'vscode';

export interface InstanceConfig {
  name: string;
  baseUrl: string;
  authType?: 'token';
  tokenSecretId?: string; // optional, can derive
  token?: string; // optional, insecure override from settings
}

export interface EffectiveConfig {
  instances: InstanceConfig[];
  activeInstanceName?: string;
  verbose: boolean;
  maxPageSize: number;
}

export class ConfigurationManager {
  private _onDidChange = new vscode.EventEmitter<EffectiveConfig>();
  readonly onDidChange = this._onDidChange.event;

  getEffective(): EffectiveConfig {
    const cfg = vscode.workspace.getConfiguration();
  const instances = (cfg.get<any[]>('taiga.instances') || []).map((raw: any) => this.normalizeInstance(raw));
    const activeInstanceName = cfg.get<string>('taiga.activeInstanceName') || undefined;
    return {
      instances,
      activeInstanceName,
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

  private normalizeInstance(raw: any): InstanceConfig {
    return {
      name: String(raw.name || ''),
      baseUrl: this.normalizeBaseUrl(String(raw.baseUrl || '')),
      authType: 'token',
      tokenSecretId: raw.tokenSecretId || `taiga:${raw.name}:token`,
      token: raw.token ? String(raw.token) : undefined
    };
  }

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
