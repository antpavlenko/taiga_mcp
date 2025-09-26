import * as vscode from 'vscode';

export class AuthManager {
  constructor(private ctx: vscode.ExtensionContext) {}

  async getToken(secretId: string): Promise<string | undefined> {
    return this.ctx.secrets.get(secretId);
  }

  async setToken(secretId: string, value?: string): Promise<string | undefined> {
    const token = value || await vscode.window.showInputBox({ prompt: 'Enter Taiga API token', ignoreFocusOut: true, password: true });
    if (!token) return undefined;
    await this.ctx.secrets.store(secretId, token.trim());
    return token.trim();
  }
}
