import { FileSystem } from "../../commands/fs";
import { WasiCommands } from "../../commands/wasiCommands";
import { SUPPORTED_COMMANDS } from "./commandInfo";
import * as vscode from 'vscode';

export function autocomplete(commandSnippet: string, commandHistory: string[], fs: FileSystem): Promise<string> {
    const splitArgs = commandSnippet.split(' ');
    if (commandSnippet.length == 0 || splitArgs[0].length == 0) {
        //default return help if empty
        return Promise.resolve("help");
    }

    //is command if all user has written is a command no space
    const isCommand = splitArgs.length == 1 && !commandSnippet.endsWith(' ');
    if (isCommand) {
        return Promise.resolve(autocompleteCommand(splitArgs[0]));
    } else {
        return autocompleteParam(splitArgs, commandHistory, fs);
    }
}

function autocompleteCommand(command: string): string {
    // concat supported commands + compiled commands
    const dict = Object.keys(SUPPORTED_COMMANDS)
        .concat(Object.keys(WasiCommands.compiledCommands))
    
    const bestRec = getBestRec(command, dict);

    return bestRec.substring(command.length, bestRec.length);
}

async function autocompleteParam(splitArgs: string[], commandHistory: string[], fs: FileSystem): Promise<string> {
    const command = splitArgs[0];
    let lastArg = splitArgs[splitArgs.length-1]; 
    let queryList: string[] = [];

    //first try to do it with the fileSystem
    let res = await getAllFSAtPath(lastArg, fs);
    queryList = res.fsList;

    if (queryList.length == 0) {
        queryList = getAllParamsUsedWithCommand(command, commandHistory);
        
        if (queryList.length == 0) {
            return "?"; // disregard if unknown -- recognize attempt
        }
    } else {
        //only use the last snippet if it's a relative path
        lastArg = res.lastFragment;
    }

    const bestRec = getBestRec(lastArg, queryList);
    

    return bestRec.substring(lastArg.length, bestRec.length);
}

async function getAllFSAtPath(lastArg: string, fs: FileSystem): Promise<{lastFragment: string, fsList: string[]}> {
    let fsList: string[] = [];
    
    let foldersInPath = lastArg.split('/');
    let lastFragment = foldersInPath.pop() ?? ''; // if empty url then just auto to a empty path
    let relativePath = foldersInPath.join('/'); // join all but last element

    const fullURI = fs.getFullUri(relativePath);
    if (fullURI === undefined) {
        // if no workspace is open 
        return {lastFragment: '', fsList: []};
    }

    const files =  await vscode.workspace.fs.readDirectory(fullURI);
    files.forEach((value: [string, vscode.FileType]) => {
        fsList.push(value[0]);
    })

    return {lastFragment, fsList};

}

function getAllParamsUsedWithCommand(command: string, commandHistory: string[]): string[] {
    let paramList: string[] = [];
    commandHistory.forEach((value:string) => {
        let splitHistory = value.split(' ');

        //if we know command
        if (splitHistory[0] === command) {
            //then add every param used with that command
            for (let i = 1; i < splitHistory.length; i++) {
                if (splitHistory[i] != "" && !paramList.includes(splitHistory[i])) {
                    //TODO: make paramList a hash so we don't need the includes check
                    paramList.push(splitHistory[i]);
                }
            }
        }
    });

    return paramList;
}
function getBestRec(val: string, dict: string[]): string {
    const matchedWords: { word: string, match: number }[] = [];

    dict.forEach((word: string) => {
        let match = 0; 
        //only recommend if val substr of word
        if (val.length < word.length) {
            //there's probably a one line way to do this but i'm on a flight :(
            for (let i = 0; i < word.length; i++) {
                if (word[i] == val[i]) {
                    match++;
                } else {
                    break;
                }
            }

            if (match > 0) {
                matchedWords.push({word, match});
            }
        }
    })

    let bestWord = { word: "", match: 0 };
    matchedWords.forEach((value: { word: string, match: number }) => {
        if (bestWord.match < value.match) {
            bestWord = value; 
        }
    });

    return bestWord.word;
}