import { Planet } from "../dimension/GalacticraftPlanets";
import { Player, world } from "@minecraft/server";

class EventHandlerMars {
    constructor() {
        this.mars = Planet.get('mars');
    }
    /**
     * Subscribe to the player dimension change event and execute the provided callback if the player is on Mars
     * @param {Function} callback - The function to execute when the player is on Mars
     */
    onJoinLevel(callback) {
        world.afterEvents.playerDimensionChange.subscribe(({ entity }) => {
            if (entity instanceof Player && this.mars.isOnPlanet(entity.location)) {
                callback(entity); // Execute the provided callback with the player entity
            }
        });
    }
}

// Example usage
const eventHandler = new EventHandlerMars();
eventHandler.onJoinLevel((player) => {
    console.log(`Player ${player.name} is now on Mars.`);
});

// Instantiate the EventHandlerMars class to activate the event listener