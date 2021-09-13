import { WASI } from '../wasi/wasi';
import browserBindings from "@wasmer/wasi/lib/bindings/browser";
import { WasmFs } from '@wasmer/wasmfs';
import * as vscode from 'vscode';
import { FileSystem } from './fs';
import * as Asyncify from 'asyncify-wasm';


export class WasiCommands {
    constructor(private readonly context: vscode.ExtensionContext) {
    }

    public async echo(args: string[]): Promise<{ stdout: string, stderr: string }> {
        return this.runWasm('echo', 'echo.wasm', args);
    }

    public async cat(args: string[], fs: FileSystem): Promise<{ stdout: string, stderr: string }> {
        return this.runWasm('cat', 'cat.wasm', args, fs);
    }

    private async runWasm(commandName: string, commandFile: string, args: string[], fs?: FileSystem): Promise<{ stdout: string, stderr: string }> {
        const wasmFs = new WasmFs();
        const wasi = new WASI({
            args: [commandName, ...args],
            env: {},
            preopens: {
                ".": ".",
                "/": "/",
            },
            bindings: {
                ...browserBindings,
                fs: wasmFs.fs,
            },
            vscodeFileSystem: fs
        });

        const wasmResponse = await fetch(vscode.Uri.joinPath(this.context.extensionUri, commandFile).toString());
        const responseArrayBuffer = await wasmResponse.arrayBuffer();
        const wasmBytes = new Uint8Array(responseArrayBuffer);
        const wasmModule = await WebAssembly.compile(wasmBytes);
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
}