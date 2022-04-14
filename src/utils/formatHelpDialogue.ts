import { prettyPrintCommand, SUPPORTED_COMMANDS } from "./constants/commandInfo";
import { HELP_SUBHEADER, WELCOME_DIALOGUE } from "./constants/constants";

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
        if (Object.keys(SUPPORTED_COMMANDS).includes(commandName)) {
            helpDialogue = prettyPrintCommand(SUPPORTED_COMMANDS[commandName]);
        } else {
            helpDialogue = `Sorry, unknown command.\n${HELP_SUBHEADER}\n${HELP_PROMPT}\n`         
        }
    } else {
        helpDialogue += `${WELCOME_DIALOGUE}\n`;
        helpDialogue += `We support the following commands: \n`;
        Object.keys(SUPPORTED_COMMANDS).forEach( (command: string) => {
            helpDialogue += `${command}\n`;
        });
        helpDialogue += `For more detail about a command try "help <commmand-name>"`;
    }
    return helpDialogue;
}