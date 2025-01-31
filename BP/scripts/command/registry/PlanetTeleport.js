import { CommandHandler, CommandArg } from "../CommandHandler";
import { world, Player } from "@minecraft/server";
import { Planet } from "../../planets/dimension/GalacticraftPlanets";

const handler = new CommandHandler();

handler.registerCommand({
    name: 'teleport',
    description: 'Teleports the target player to a specified location relative to the planet center.',
    category: 'MISC',
    args: [
        CommandArg.player('target', true, false), // Required player target
        CommandArg.literal('to', true),           // Literal to indicate the teleportation type
        CommandArg.number('destinationX', null, -22500, 22500), // Required relative X coordinate
        CommandArg.number('destinationZ', null, -22500, 22500), // Required relative Z coordinate
        CommandArg.boolean('checkForBlocks', false) // Optional check for blocks
    ],

    execute(interaction) {
        const target = interaction.getPlayer('target'); // Get the target player
        const destinationX = interaction.getNumber('destinationX'); // Get the destination X coordinate
        const destinationZ = interaction.getNumber('destinationZ'); // Get the destination Z coordinate
        const checkForBlocks = interaction.getBoolean('checkForBlocks'); // Optional check for blocks
        
        // Determine the planet based on the target player's current location
        const currentLocation = target.location;
        const currentPlanet = Planet.getAll().find(planet => planet.isOnPlanet(currentLocation));

        if (!currentPlanet) {
            target.sendMessage(`You are not in a registered planet !`);
            return;
        }

        // Get the player's position relative to the planet's center using the offset method
        const offsetPosition = currentPlanet.offset(currentLocation);

        // Calculate the absolute destination coordinates relative to the planet's center
        const planetCenter = currentPlanet.center;
        const teleportX = planetCenter.x + destinationX;
        const teleportZ = planetCenter.z + destinationZ;

        // Construct the teleport command
        let command = `/tp ${target.name} ${teleportX} ${offsetPosition.y} ${teleportZ}`;
        if (checkForBlocks) {
            command += ` true`; // Add block check if requested
        }

        // Execute the teleport command 
        world.getDimension("the_end").runCommand(command);

        // Confirmation message
        const message = `Teleported ${target.name} to ${teleportX}, ${offsetPosition.y}, ${teleportZ}.`;
        console.log(message); // Log to the console
    },
});