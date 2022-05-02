import * as vscode from 'vscode';
import { FileSystem } from './fs';

export class PythonRunner {
    private readonly workerScript: string;
    private pyodideWorker: Worker | undefined;
    private stdOut = "";
    private stdErr = "";
    private isRunning = false;

    constructor(context: vscode.ExtensionContext, private readonly fs: FileSystem) {
        this.workerScript = vscode.Uri.joinPath(context.extensionUri, "pyodideWorker.js").toString();
    }

    private setupWorker(resolve: (value: any) => void) {
        this.pyodideWorker = new Worker(this.workerScript);

        this.pyodideWorker.onmessage = (event) => {
            const { stdout, done, error } = event.data;

            console.log("From worker:", event.data);
            if (stdout !== undefined) {
                if (stdout === "Python initialization complete") {
                    return; // Ignore this message
                }
                this.stdOut += stdout + "\n";
            } else if (done) {
                if (!this.isRunning) {
                    return;
                }

                this.isRunning = false;
                if (error) {
                    this.stdErr += error;
                }

                this.pyodideWorker?.terminate();
                resolve(undefined);
            }
        };

        this.pyodideWorker.onerror = (event) => {
            // Added additional check to avoid duplicate error printing
            if (!this.isRunning) {
                return;
            }
            this.isRunning = false;
            this.pyodideWorker?.terminate();
            resolve(undefined);
        };
    }

    private runCode(code: string) {
        return new Promise((resolve) => {
            this.isRunning = true;
            this.setupWorker(resolve);
            this.pyodideWorker?.postMessage({
                python: code,
            });
        });
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async run(args: string[]): Promise<{ stdout: string, stderr: string }> {
        if (args.length !== 1) {
            return { stdout: "", stderr: "Usage: python <filename>" };
        }

        await this.delay(3000);

        const fileName = args[0];
        const fileUri = this.fs.getFullUri(fileName);
        if (!fileUri) {
            return { stdout: "", stderr: "Usage: python <filename>" };
        }

        this.stdOut = this.stdErr = "";
        const document = await vscode.workspace.openTextDocument(fileUri);
        if (!document) {
            return { stdout: "", stderr: "Usage: python <filename>" };
        }

        const code = document.getText();
        await this.runCode(code);

        return { stdout: this.stdOut, stderr: this.stdErr };
    }
}