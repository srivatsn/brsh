import * as vscode from 'vscode';
import { brshPty } from './terminal';

export class TerminalProfileProvider implements vscode.TerminalProfileProvider {
    provideTerminalProfile(token: vscode.CancellationToken): vscode.ProviderResult<vscode.TerminalProfile> {
        return new vscode.TerminalProfile({
            name: 'brsh',
            pty: brshPty,
            iconPath: new vscode.ThemeIcon('ports-open-browser-icon')
        });
    }
}
