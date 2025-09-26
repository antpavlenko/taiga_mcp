import * as vscode from 'vscode';
import { Project } from '../models/types';

export interface DiagnosticsState {
  activeProject?: Project;
  projectCount: number;
  storyCount: number;
  activeInstance?: string;
}

export function showDiagnostics(state: DiagnosticsState) {
  const lines = [
    `Active Instance: ${state.activeInstance || 'none'}`,
    `Active Project: ${state.activeProject ? state.activeProject.name : 'none'}`,
    `Projects Loaded: ${state.projectCount}`,
    `User Stories Loaded: ${state.storyCount}`
  ];
  vscode.window.showInformationMessage(lines.join('\n'));
}
