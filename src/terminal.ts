import * as vscode from 'vscode';

// Settings
const PROMPT = "codespace → ";
const KEYS = {
    enter: "\r",
    backspace: "\x7f",
};
const ACTIONS = {
    cursorBack: "\x1b[D",
    deleteChar: "\x1b[P",
    clear: "\x1b[2J\x1b[3J\x1b[;H",
};

// cleanup inconsitent line breaks
const formatText = (text: string) => `\r${text.split(/(\r?\n)/g).join("\r\n")}\r\n`;

export class BrowserTerminal implements vscode.Pseudoterminal {
    private readonly writeEmitter = new vscode.EventEmitter<string>();
    private currentLine = PROMPT;

    onDidWrite: vscode.Event<string> = this.writeEmitter.event;

    onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
    onDidClose?: vscode.Event<number | void> | undefined;
    onDidChangeName?: vscode.Event<string> | undefined;

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
        this.writeEmitter.fire(this.currentLine);

    }
    close(): void {
    }

    handleInput(data: string): void {
        switch (data) {
            case KEYS.enter:
                this.writeEmitter.fire(`\r\n`);

                const command = this.currentLine.slice(PROMPT.length);
                // execute command
                const { stdout, stderr } = this.executeCommand(command);

                if (stdout) {
                    this.writeEmitter.fire(formatText(stdout));
                }

                if (stderr && stderr.length) {
                    this.writeEmitter.fire(formatText(stderr));
                }

                this.currentLine = PROMPT;
                this.writeEmitter.fire(`\r${this.currentLine}`);
            case KEYS.backspace:
                if (this.currentLine.length <= PROMPT.length) {
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

    executeCommand(command: string): { stdout: string | undefined; stderr: string | undefined; } {
        if (!command) {
            return { stdout: undefined, stderr: undefined };
        }

        return { stdout: "done", stderr: undefined };
    }
}