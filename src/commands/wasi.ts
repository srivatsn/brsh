import { WASI } from '@wasmer/wasi';
import browserBindings from "@wasmer/wasi/lib/bindings/browser";
import { WasmFs } from '@wasmer/wasmfs';
import * as vscode from 'vscode';
import { FileSystem } from './fs';

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

        wasmFs.fs.writeFileSync('/README.md', 'fake content');
        wasmFs.fs.writeFileSync('/SECURITY.md', 'fake content');
        if (fs) {
            const oldOpenSync = wasmFs.fs.openSync;
            wasmFs.fs.openSync = (path: string, flags: string, mode?: string): number => {
                console.log("Opening");
                console.log(path);
                console.log(flags);
                console.log(mode);
                const uri = fs.getFullUri(path);
                console.log(uri);

                async function writeTo(uri?: vscode.Uri) {
                    if (uri) {
                        const data = await vscode.workspace.fs.readFile(uri);
                        wasmFs.fs.writeFileSync(path, data);
                    }
                }

                writeTo(uri);
                console.log("calling oldopensync");
                const retVal = oldOpenSync(path, flags, mode);
                console.log("called oldopensync");
                return retVal;
            };
        }

        const wasi = new WASI({
            args: [commandName, ...args],
            env: {},
            preopens: {
                ".": ".",
                "/": "/",
                "README.md": "/README.md"
            },
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