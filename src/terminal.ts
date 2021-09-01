import * as vscode from 'vscode';
import { FileSystem } from './commands/fs';
import * as quote from 'shell-quote';

// Settings
const PROMPT = "\x1b[32mcodespace\x1b[0m → \x1b[34m$pwd\x1b[0m $ ";
const KEYS = {
    enter: "\r",
    backspace: "\x7f",
};
const ACTIONS = {
    cursorBack: "\x1b[D",
    deleteChar: "\x1b[P",
    clear: "\x1b[2J\x1b[3J\x1b[;H",
};

export class BrowserTerminal implements vscode.Pseudoterminal {
    private readonly writeEmitter = new vscode.EventEmitter<string>();
    private readonly closeEmitter = new vscode.EventEmitter<void>();
    private readonly fs = new FileSystem();
    private currentLine = this.constructPrompt();

    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    onDidClose?: vscode.Event<number | void> | undefined = this.closeEmitter.event;

    onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
    onDidChangeName?: vscode.Event<string> | undefined;

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
        this.writeEmitter.fire(this.currentLine);
    }
    close(): void {
    }

    formatText = (text: string) => { return text + "\r\n"; };

    async handleInput(data: string): Promise<void> {
        switch (data) {
            case KEYS.enter:
                this.writeEmitter.fire(`\r\n`);

                const command = this.currentLine.slice(this.constructPrompt().length);
                // execute command
                try {
                    const { stdout, stderr } = await this.executeCommand(command);

                    if (stdout) {
                        this.writeEmitter.fire(this.formatText(stdout));
                    }

                    if (stderr && stderr.length) {
                        this.writeEmitter.fire(this.formatText(stderr));
                    }
                } catch (error: any) {
                    this.writeEmitter.fire(`\r${this.formatText(error.message)}`);
                }

                this.currentLine = this.constructPrompt();
                this.writeEmitter.fire(`\r${this.currentLine}`);
            case KEYS.backspace:
                if (this.currentLine.length <= this.constructPrompt().length) {
                    return;
                }

                // remove last character
                this.currentLine = this.currentLine.substr(0, this.currentLine.length - 1);
                this.writeEmitter.fire(ACTIONS.cursorBack);
                this.writeEmitter.fire(ACTIONS.deleteChar);
                return;
            default:
                this.currentLine += data;
                this.writeEmitter.fire(data);
        }
    }

    async executeCommand(input: string): Promise<{ stdout: string | undefined; stderr: string | undefined; }> {
        if (!input) {
            return { stdout: undefined, stderr: undefined };
        }

        const parsedArgs = quote.parse(input);
        let args = parsedArgs.filter(arg => typeof arg === "string") as string[];

        const command = args.shift() as string;
        if (!command) {
            return { stdout: undefined, stderr: undefined };
        }

        switch (command) {
            case "ls":
                return { stdout: await this.fs.ls([]), stderr: undefined };

            case "cd":
                return { stdout: await this.fs.cd(args), stderr: undefined };

            case "pwd":
                return { stdout: this.fs.pwd(), stderr: undefined };

            case "code":
                return { stdout: await this.fs.code(args), stderr: undefined };

            case "clear":
                return { stdout: ACTIONS.clear, stderr: undefined };

            case "exit":
                this.closeEmitter.fire();
        }

        return { stdout: undefined, stderr: `Unknown command: ${command}` };
    }

    private constructPrompt(): string {
        return PROMPT.replace("$pwd", this.fs.pwd());
    }
}