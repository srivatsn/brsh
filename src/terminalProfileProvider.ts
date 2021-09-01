import * as vscode from 'vscode';
import { BrowserTerminal } from './terminal';

export class TerminalProfileProvider implements vscode.TerminalProfileProvider {
    provideTerminalProfile(token: vscode.CancellationToken): vscode.ProviderResult<vscode.TerminalProfile> {
        return new vscode.TerminalProfile({
            name: 'brsh',
            pty: new BrowserTerminal(),
            iconPath: new vscode.ThemeIcon('ports-open-browser-icon')
        });
    }
}
