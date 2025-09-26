import * as vscode from 'vscode';

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug(msg: string): void;
}

export function createLogger(channelName = 'Taiga', verboseFlag: () => boolean): Logger {
  const channel = vscode.window.createOutputChannel(channelName);
  function ts() { return new Date().toISOString(); }
  function redact(s: string) { return s.replace(/(Bearer\s+)[A-Za-z0-9._-]+/g, '$1***'); }
  return {
    info(msg) { channel.appendLine(`[INFO] ${ts()} ${redact(msg)}`); },
    warn(msg) { channel.appendLine(`[WARN] ${ts()} ${redact(msg)}`); },
    error(msg) { channel.appendLine(`[ERROR] ${ts()} ${redact(msg)}`); },
    debug(msg) { if (verboseFlag()) channel.appendLine(`[DEBUG] ${ts()} ${redact(msg)}`); }
  };
}
