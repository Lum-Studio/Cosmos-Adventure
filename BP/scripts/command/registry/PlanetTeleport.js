import { CommandHandler, CommandArg, CommandInteraction } from "../CommandHandler";


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
        const target = interaction.getPlayer('target'); // Get the target player
        const literal = interaction.getString('literal'); // Get the literal string
        const destination = interaction.getTarget('destination'); // Get the destination
        const checkForBlocks = interaction.getBoolean('checkForBlocks'); // Optional check for blocks

        // Implement teleport logic here
        let message = `Teleported ${target} to ${destination}.`;
        console.log(message);
        ;
    },
});