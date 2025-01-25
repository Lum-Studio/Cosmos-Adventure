import { CommandHandler, CommandArg, CommandArg, CommandInteraction, parseCommandLine } from "../CommandHandler";


const handler = new CommandHandler();
handler.registerCommand({
    name: 'teleport',
    description: 'Teleports the target player to a specified location or entity.',
    category: 'MISC',
    args: [
        CommandArg.player('target', true, false), // Required player target
        CommandArg.literal('to', true), // Literal to indicate the teleportation type
        CommandArg.number('destination', null, 0, 45000), // Required destination target
        CommandArg.boolean('checkForBlocks', false) // Optional check for blocks
    ],

    execute(interaction) {
        const target = interaction.player('target'); // Get the target player
        const destination = interaction.target('destination'); // Get the destination
        const checkForBlocks = interaction.getBoolean('checkForBlocks'); // Optional check for blocks
        let message = `Teleported ${target} to ${destination}.`;
        if (checkForBlocks) {
            message += ' Checking for blocks...';
        }

        interaction.ctx.sendMessage(message);
    },
});