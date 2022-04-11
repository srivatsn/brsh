import { WASI } from '../wasi/wasi';
import bindings from '@wasmbindings';
import { WasmFs } from '@wasmer/wasmfs';
import * as vscode from 'vscode';
import { FileSystem } from './fs';
import * as Asyncify from 'asyncify-wasm';
import * as axios from 'axios';


export class WasiCommands {
    private readonly compiledCommands = new Map<string, WebAssembly.Module>();

    constructor(private readonly context: vscode.ExtensionContext, private readonly vscodeFileSystem: FileSystem) {
        this.install(['echo', 'https://wasicommands.blob.core.windows.net/wasicommands/echo.wasm']);
        this.install(['cat', 'https://wasicommands.blob.core.windows.net/wasicommands/cat.wasm']);
    }

    public async install(args: string[]): Promise<{ stdout: string, stderr: string }> {
        if (args.length !== 2) {
            return { stdout: "", stderr: "Usage: install <command name> <url of wasm file to be installed>" };
        }

        const commandName = args[0];

        let commandFileUri: vscode.Uri;
        try {
            commandFileUri = vscode.Uri.parse(args[1], true);
        } catch {
            return { stdout: "", stderr: "Invalid argument. Please provide a valid URL" };
        }

        try {
            const module = await this.compileCommand(commandFileUri);
            this.compiledCommands.set(commandName, module);
        } catch (e: any) {
            return ({ stdout: "", stderr: `Failed to install ${commandName}: ${e.toString()}` });
        }

        return ({ stdout: `Successfully installed ${commandName}`, stderr: "" });
    }

    public async uninstall(args: string[]): Promise<{ stdout: string, stderr: string }> {
        if (args.length !== 1) {
            return { stdout: "", stderr: "Usage: uninstall <command to be uninstalled>" };
        }

        const commandName = args[0];
        if (!this.compiledCommands.has(commandName)) {
            return { stdout: "", stderr: `Usage: Unkown command ${commandName}` };
        }

        this.compiledCommands.delete(commandName);
        return ({ stdout: `Successfully uninstalled ${commandName}`, stderr: "" });
    }

    public async run(commandName: string, args: string[]): Promise<{ stdout: string, stderr: string }> {
        let wasmModule = this.compiledCommands.get(commandName);

        if (wasmModule === undefined) {
            return ({ stdout: "", stderr: `Unknown command: ${commandName}` });
        }

        const wasmFs = new WasmFs();
        const wasi = new WASI({
            args: [commandName, ...args],
            env: {},
            preopens: {
                ".": ".",
                "/": "/",
            },
            bindings: {
                ...bindings,
                fs: wasmFs.fs,
            },
            vscodeFileSystem: this.vscodeFileSystem
        });

        const instance = await Asyncify.instantiate(wasmModule, {
            ...wasi.getImports(wasmModule)
        });

        // Start the WebAssembly WASI instance!
        await wasi.start(instance);

        // Output what's inside of /dev/stdout!
        const stdout = await wasmFs.getStdOut() as string;
        const stderr = wasmFs.fs.readFileSync('/dev/stderr').toString();
        return ({ stdout, stderr });
    }

    private async compileCommand(commandFileUri: vscode.Uri): Promise<WebAssembly.Module> {
        let wasmBytes: Uint8Array;
        if (commandFileUri.scheme === 'file') {
            wasmBytes = await vscode.workspace.fs.readFile(commandFileUri);
        }
        else {
            const wasmResponse = await axios.default(
                {
                    url: commandFileUri.toString(),
                    responseType: 'arraybuffer',
                });

            wasmBytes = new Uint8Array(wasmResponse.data);
        }
        const wasmModule = await WebAssembly.compile(wasmBytes);

        return wasmModule;
    }
}