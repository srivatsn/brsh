import { WASI } from '@wasmer/wasi';
import browserBindings from "@wasmer/wasi/lib/bindings/browser";
import { WasmFs } from '@wasmer/wasmfs';
import * as vscode from 'vscode';

export class WasiCommands {
    constructor(private readonly context: vscode.ExtensionContext) {
    }

    public async echo(args: string[]): Promise<{ stdout: string, stderr: string }> {
        return this.runWasm('echo', 'echo.wasm', args);
    }

    private async runWasm(commandName: string, commandFile: string, args: string[]): Promise<{ stdout: string, stderr: string }> {
        const wasmFs = new WasmFs();
        const wasi = new WASI({
            args: [commandName, ...args],
            env: {},
            bindings: {
                ...browserBindings,
                fs: wasmFs.fs,
            },
        });

        const wasmResponse = await fetch(vscode.Uri.joinPath(this.context.extensionUri, commandFile).toString());
        const responseArrayBuffer = await wasmResponse.arrayBuffer();
        const wasmBytes = new Uint8Array(responseArrayBuffer);
        const wasmModule = await WebAssembly.compile(wasmBytes);
        const instance = await WebAssembly.instantiate(wasmModule, {
            ...wasi.getImports(wasmModule)
        });

        // Start the WebAssembly WASI instance!
        wasi.start(instance);

        // Output what's inside of /dev/stdout!
        const stdout = await wasmFs.getStdOut() as string;
        const stderr = wasmFs.fs.readFileSync('/dev/stderr').toString();
        return ({ stdout, stderr });
    }
}