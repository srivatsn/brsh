// Default have this for every built in command 
export interface ICommandInformation {
    name: string,
    description: string,
    contract: string
}

export function prettyPrintCommand (command: ICommandInformation) {
    return `${command.name}\n${command.description}\ncontract: ${command.contract} \n`;
}

export const Ls_CommandInfo: ICommandInformation = {
    name: "ls",
    description: "List directory information",
    contract: "ls"
};

export const Cd_CommandInfo: ICommandInformation = {
    name: "cd",
    description: "Enter directory",
    contract: "cd <path>"
};

export const Pwd_CommandInfo: ICommandInformation = {
    name: "pwd",
    description: "Print current path",
    contract: "pwd"
};

export const Code_CommandInfo: ICommandInformation = {
    name: "code",
    description: "Open file/folder/current directory",
    contract: "code <path?>"
};

export const Clear_CommandInfo: ICommandInformation = {
    name: "clear",
    description: "Clear terminal",
    contract: "clear"
};

export const Help_CommandInfo: ICommandInformation = {
    name: "help",
    description: "Get info about brsh",
    contract: "help <command_name?>"
};

export const Install_CommandInfo: ICommandInformation = {
    name: "install",
    description: "Install a new wasi cmd to brsh",
    contract: "install <wasi_url>"
};

export const UnInstall_CommandInfo: ICommandInformation = {
    name: "uninstall",
    description: "Uninstall a wasi cmd from brsh",
    contract: "uninstall <wasi_command>"
};

export const Exit_CommandInfo: ICommandInformation = {
    name: "exit",
    description: "Close brsh :(",
    contract: "exit"
};

export const SUPPORTED_COMMANDS: {[name: string] : ICommandInformation} = {
    [Ls_CommandInfo.name] : Ls_CommandInfo,
    [Cd_CommandInfo.name]: Cd_CommandInfo,
    [Pwd_CommandInfo.name]: Pwd_CommandInfo,
    [Code_CommandInfo.name]: Code_CommandInfo,
    [Clear_CommandInfo.name]: Clear_CommandInfo,
    [Help_CommandInfo.name]: Help_CommandInfo,
    [Install_CommandInfo.name]: Install_CommandInfo,
    [UnInstall_CommandInfo.name]: UnInstall_CommandInfo,
    [Exit_CommandInfo.name]: Exit_CommandInfo
};
