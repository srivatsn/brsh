import { HELP_SUBHEADER, WELCOME_DIALOGUE } from "./constants";

export const supportedCommands = [
"ls",
"cd",
"code",
"clear",
"install",
"help"
]

const HELP_PROMPT = `For more detail about a command try "help <commmand-name>"`
export function formatHelpDialogue(args: string[]):string {
    if (args.length > 1)
    {
        return `Sorry, too many params.\n${HELP_SUBHEADER}\n${HELP_PROMPT}\n`
    }
    let helpDialogue = "";

    if (args.length == 1)
    {
        let commandName = args[0];
        if (supportedCommands.includes(commandName)) {
            helpDialogue = `I know this`;
        } else {
            helpDialogue = `Sorry, unknown command.\n${HELP_SUBHEADER}\n${HELP_PROMPT}\n`         
        }
    } else {
        helpDialogue += `${WELCOME_DIALOGUE}\n`;
        helpDialogue += `We support the following commands: \n`;
        supportedCommands.forEach( (command: string) => {
            helpDialogue += `${command}\n`;
        });
        helpDialogue += `For more detail about a command try "help <commmand-name>"`;
    }
    return helpDialogue;
}