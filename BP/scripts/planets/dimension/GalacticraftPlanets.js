import { world, Player } from "@minecraft/server";


const the_end = world.getDimension('the_end');

/**
 * Class representing a generic Planet
 */
export class Planet {
    /**
     * Creates an instance of a Planet
     * @param {Object} options - Options for the planet
     * @param {string} options.name - Name of the planet
     * @param {Object} options.range - Range of the planet
     */
    constructor({ name, range }) {
        this.name = name;
        this.range = range;
        this.origin = {
            x: (this.range.start.x + this.range.end.x) / 2,
            z: (this.range.start.z + this.range.end.z) / 2
        };
    }

    /**
     * Checks whether a given location is on the planet
     * @param {import("@minecraft/server").Vector3} location - Location to check
     * @returns {boolean} Whether or not the location is on the planet
     */
    isOnPlanet(location) {
        return (
            this.range.start.x <= location.x && location.x <= this.range.end.x &&
            this.range.start.z <= location.z && location.z <= this.range.end.z
        );
    }

    /**
     * Gets all entities in the End that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions - Query to use for search
     * @returns {Entity[]} All entities matching the query
     */
    getEntities(entityQueryOptions) {
        return the_end.getEntities(entityQueryOptions).filter(entity => 
            this.isOnPlanet(entity.location)
        );
    }

    /**
     * Gets all players on the planet that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions - Query to use for search
     * @returns {Player[]} All players matching the query
     */
    getPlayers(entityQueryOptions) {
        return the_end.getPlayers(entityQueryOptions).filter(entity => 
            this.isOnPlanet(entity.location)
        );
    }

    /**
     * Get the player location on the planet relative to the planet's origin
     * @param {Player} player - The player object to get the location from
     * @returns {import("@minecraft/server").Vector3} The player's position relative to the planet's origin
     */
    getPosition(player) {
        return {
            x: player.location.x - this.origin.x,
            y: player.location.y, 
            z: player.location.z - this.origin.z
        };
    }
}


export const MARS = the_end;