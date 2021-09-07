import * as vscode from 'vscode';

export class FileSystem {
    private currentDir = "";
    private readonly rootUri: vscode.Uri | undefined;

    constructor() {
        if (vscode.workspace.workspaceFolders) {
            this.currentDir = vscode.workspace.workspaceFolders[0].uri.path;
            this.rootUri = vscode.workspace.workspaceFolders[0].uri.with({ path: "/" });
        }
    }

    public async ls(args: string[]): Promise<string> {
        const uri = this.getFullUri('');
        if (!uri) {
            return `No workspace opened`;
        }

        const files = await vscode.workspace.fs.readDirectory(uri);
        return files.map(f => f[0]).join('\r\n');
    }

    public async cd(args: string[]): Promise<string> {
        const newDir = args[0];

        const uri = this.getFullUri(newDir);
        if (!uri) {
            return `Directory not found: ${newDir}`;
        }

        let dir: vscode.FileStat | undefined;
        try {
            dir = await vscode.workspace.fs.stat(uri);
        }
        catch (e) {
        }

        if (!dir || dir.type !== vscode.FileType.Directory) {
            return `Directory not found: ${newDir}`;
        }

        this.currentDir = uri.path;
        return "";
    }

    public pwd(): string {
        return this.currentDir;
    }

    public async code(args: string[]): Promise<string> {
        const file = args[0];
        const uri = this.getFullUri(file);
        if (!uri) {
            return `File not found: ${file}`;
        }

        vscode.window.showTextDocument(uri);

        return "";
    }

    public getFullUri(relativePath: string): vscode.Uri | undefined {
        if (!this.rootUri) {
            return undefined;
        }

        return vscode.Uri.joinPath(this.rootUri, this.currentDir, relativePath);
    }
}