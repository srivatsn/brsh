const lg = require('.,/../node_modules/wasm-git/lg2.js');

export class Git {
    private fs: any;
    constructor()
    {
        const FS = lg.FS;
        const MEMFS = FS.filesystems.MEMFS;
    }

    public command(arg:string) {
        lg.callMain([arg]);
    }
}