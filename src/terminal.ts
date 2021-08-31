import * as vscode from 'vscode';

const writterEmitter = new vscode.EventEmitter<string>();

export const brshPty: vscode.Pseudoterminal = {
    onDidWrite: writterEmitter.event,
    open: () => {
        writterEmitter.fire('hello');
    },
    close: () => { }
};
