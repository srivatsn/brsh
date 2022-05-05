import * as vscode from 'vscode';
import { FileSystem } from './commands/fs';
import * as quote from 'shell-quote';
import { WasiCommands } from './commands/wasiCommands';
import { formatHelpDialogue } from './utils/formatHelpDialogue';
import { HELP_SUBHEADER, WELCOME_DIALOGUE } from './utils/constants/constants';
import { autocomplete } from './utils/constants/autocomplete';
import { Git } from './commands/git';

// Settings
const PROMPT = "\x1b[32mcodespace\x1b[0m → \x1b[34m$pwd\x1b[0m $ ";
const KEYS = {
    enter: "\r",
    backspace: "\x7f",
    up: "\x1b[A",
    down: "\x1b[B",
    left: "\x1b[D",
    right: "\x1b[C",
    tab: "\t",
    home: "\x1b[1~",
    end: "\x1b[4~",
    pageUp: "\x1b[5~",
    pageDown: "\x1b[6~",
    delete: "\x1b[3~",
    insert: "\x1b[2~",
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
    private readonly git = new Git()
    private readonly wasiCmds;

    private commandHistory: string[] = [];
    private historyPointer = 0;

    private currentLine = this.constructPrompt();

    constructor(private readonly context: vscode.ExtensionContext) {
        this.wasiCmds = new WasiCommands(context, this.fs);
    }

    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    onDidClose?: vscode.Event<number | void> | undefined = this.closeEmitter.event;

    onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
    onDidChangeName?: vscode.Event<string> | undefined;

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
        //prompt dialogue
        const welcomePrompt = `${WELCOME_DIALOGUE}\r\n${HELP_SUBHEADER}\r\n`;
        this.writeEmitter.fire(welcomePrompt);

        this.writeEmitter.fire(this.currentLine);
    }
    close(): void {
    }

    formatText = (text: string) => {
        text = text.replace(/\r?\n/g, "\r\n");
        return text[text.length - 1] === '\n' ? text : text + "\r\n";
    };

    async handleInput(data: string): Promise<void> {
        const promptLength = this.constructPrompt().length;
        this.removeQuestionMark();
        
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

                    if (stdout || stderr) {
                        // if there was some valid output, then add this to the command history
                        this.commandHistory.push(command);
                    }
                } catch (error: any) {
                    this.writeEmitter.fire(`\r${this.formatText(error.message)}`);
                }

                this.currentLine = this.constructPrompt();
                this.writeEmitter.fire(`\r${this.currentLine}`);
                
                this.historyPointer = this.commandHistory.length;
            case KEYS.backspace:
                if (this.currentLine.length <= promptLength) {
                    return;
                }

                // remove last character
                this.removeNCharacters(1);
                return;
            case KEYS.up:
                this.clearCurrentCommand();
                this.addSnippetToCurrentLine(this.getHistory(--this.historyPointer));
                return;
            case KEYS.down:
                this.clearCurrentCommand();
                this.addSnippetToCurrentLine(this.getHistory(++this.historyPointer));
                return;
            case KEYS.pageUp:
                return;
            case KEYS.pageDown:
                return
            case KEYS.tab:
                // TODO: Autocomplete.
                let commandSlice = this.currentLine.slice(this.constructPrompt().length);
                let autoComplete = await autocomplete(commandSlice, this.commandHistory, this.fs);
                this.addSnippetToCurrentLine(autoComplete);
                return;

            default:
                this.currentLine += data;
                this.writeEmitter.fire(data);
        }
    }

    removeQuestionMark() {
        // use this to indicate autocomplete attempt
        // TODO: make this some emoji type character that users would never use
        if (this.currentLine.endsWith("?")) {
            this.removeNCharacters(1);
        }
    }
    
    addSnippetToCurrentLine(snippet: string) {
        this.currentLine += snippet;
        this.writeEmitter.fire(snippet);
    }

    clearCurrentCommand() {
        // remove last character
        const command = this.currentLine.slice(this.constructPrompt().length);

        this.removeNCharacters(command.length);
    }

    removeNCharacters(n: number) {
        for (let i = 0; i < n; i++) {
            this.currentLine = this.currentLine.substring(0, this.currentLine.length - 1);
            this.writeEmitter.fire(ACTIONS.cursorBack);
            this.writeEmitter.fire(ACTIONS.deleteChar);
        }
    }

    getHistory(historyIndex: number): string {
        // if no more history, lock on last entry
        if (historyIndex < 0) {
            this.historyPointer = 0;
        } else if (historyIndex >= this.commandHistory.length) {
            this.historyPointer = this.commandHistory.length-1;
        }
        return this.commandHistory[historyIndex];        
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
            
            case "help":
                return { stdout: formatHelpDialogue(args), stderr: undefined }

            case "install": {
                const { stdout, stderr } = await this.wasiCmds.install(args);
                return { stdout: stdout, stderr: stderr };
            }

            case "uninstall": {
                const { stdout, stderr } = await this.wasiCmds.uninstall(args);
                return { stdout: stdout, stderr: stderr };
            }

            case "git": {
                await this.git.command("clone");
                return { stdout: "", stderr: "" };
            }

            case "exit":
                this.closeEmitter.fire();
        }

        const { stdout, stderr } = await this.wasiCmds.run(command, args);
        return { stdout: stdout, stderr: stderr };
    }

    private constructPrompt(): string {
        return PROMPT.replace("$pwd", this.fs.pwd());
    }
}