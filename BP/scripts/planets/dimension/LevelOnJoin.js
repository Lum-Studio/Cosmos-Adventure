import { Planet } from "./GalacticraftPlanets";

export class PlanetEventHandler {
    constructor(planetId) { // Planet object or planet ID
        this.planet = Planet.get(planet.type || planet);
    }
    /**
     * Subscribe to the player dimension change event and execute the provided callback if the player is on a planet
     * @param {Function} callback - The function to execute when the player is on Mars
     */
    onJoinLevel(callback) {
        world.afterEvents.playerDimensionChange.subscribe(({ player }) => {
            if (this.planet.isOnPlanet(player.location)) {
                callback(player); // Execute the provided callback with the player entity
            }
        });
    }
}
