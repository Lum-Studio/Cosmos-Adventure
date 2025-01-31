import { Player } from "@minecraft/server";
import { Planet } from "../../planets/dimension/GalacticraftPlanets";

/**
 * Class to manage player coordinates relative to a planet's coordinates
 */
export class PlayerCoordinateManager {
    /**
     * Creates an instance of PlayerCoordinateManager for a player
     * @param {Player} player - The player object
     */
    constructor(player) {
        this.player = player;
    }

    /**
     * Sets the player's coordinates relative to the specified planet's coordinates
     * @param {string} planetId - The ID of the planet
     */
    setPlayerCoordinates(planetId) {
        const planet = Planet.get(planetId);
        if (!planet) {
            throw new Error(`Planet with ID "${planetId}" not found`);
        }
        const location = this.player.location; 
        const offsetCoords = planet.offset(location); // Utilize the offset method from the Planet class
        this.updateDisplay(offsetCoords);
    }

    /**
     * Updates the display with the player's relative coordinates
     * @param {Object} coords - The relative coordinates
     */
    updateDisplay(coords) {
        const coordString = `X: ${coords.x} Y: ${coords.y} Z: ${coords.z}`;
        this.player.onScreenDisplay.setActionBar(coordString);
    }
}