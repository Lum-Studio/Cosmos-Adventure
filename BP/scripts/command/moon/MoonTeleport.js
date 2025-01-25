import { CommandHandler, CommandArg, CommandArg, CommandInteraction, parseCommandLine } from "../CommandHandler";

const handler = new CommandHandler();
//
// handler.registerCommand({
//     name: 'teleport',
//     description: 'Teleport Faction Command',
//     category: 'MISC',
//     args: [
//         CommandArg.literal('option_1', true, ['create', 'delete'], {
//             "create": [
//                 // Arg name, required
//                 CommandArg.string('factionName', true),
//                 // Arg name, optional
//                 CommandArg.boolean('factionIsOpen', false)
//             ],
//             "delete": [
//                 // Arg name, optional
//                 CommandArg.string('reason', false),
//             ],
//         })
//     ],

//     execute(interaction) {
//         // Get the option as a string
//         const option = interaction.getString('option_1');

//         switch(option) {
//             case 'create': {
//                 const factName = interaction.getString('factionName');
//                 const factOpen = interaction.getBoolean('factionIsOpen');

//                 interaction.ctx.sendMessage(`You created the faction ${factName}. Is public: ${factOpen}`);
//                 break;
//             }
//             case 'delete': {
//                 const reason = interaction.getString('reason');
//                 interaction.ctx.sendMessage(`You deleted your faction, reason: ${reason || 'None'}`);
//                 break;
//             }
//             default:
//                 interaction.ctx.sendMessage('Invalid option. Please choose "create" or "delete".');
//                 break;
//         }
//     },
// });