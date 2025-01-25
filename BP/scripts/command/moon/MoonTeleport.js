import { CommandHandler, CommandArg, CommandArg, CommandInteraction, parseCommandLine } from "../CommandHandler";

const handler = new CommandHandler();

const handler = new CommandHandler();

handler.registerCommand({
    name: 'teleport',
    description: 'Teleport on another celestial body',
    category: 'MISC',
    args: [
        CommandArg.player('target', true, false), // Required player target
        CommandArg.number('amount', true, 0, 45000, false) // Required amount, with min and max
    ],

    execute(interaction) {
        const target = interaction.getPlayer('target'); // Get the target player
        const amount = interaction.getNumber('amount'); // Get the numerical amount

        // Implement the teleport logic here
        interaction.ctx.sendMessage(`Teleported ${target} to a celestial body with an amount of ${amount}.`);
    },
});