// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TerminalProfileProvider } from './terminalProfileProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Register a terminal profile provider
	const terminalProfileProvider = new TerminalProfileProvider();
	const disposable = vscode.window.registerTerminalProfileProvider('browser-shell.brsh', terminalProfileProvider);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
