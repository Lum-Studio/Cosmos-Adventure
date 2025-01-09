import {  Player, world  } from "@minecraft/server";
import { Vec3, vec3 } from "../../api/libraries/Vector.js"


const the_end = world.getDimension('the_end');
/**
 * Class containing methods relating to the Moon
 */
export class Venus {
    /**
     * Range of blocks in the end that Venus takes up
     */
    static range = { start: { x: -50000, z: -50000 }, end: { x: -100000, z: -100000 } };

    /**
     * Center block of Venus
     */
    static origin = { x: (this.range.start.x + this.range.end.x) / 2, z: (this.range.start.z + this.range.end.z) / 2 };

    /**
     * Checks whether a given location is in Venus
     * @param {import("@minecraft/server").Vector3} location location to check
     * @returns {boolean} Whether or not the location is Venus
     */
    static isOnVenus(location) {
        return this.range.start.x <= location.x && location.x <= this.range.end.x && this.range.start.z <= location.z && location.z <= this.range.end.z;
    }

    /**
     * Gets all entities on Venus that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions Query to use for search
     * @returns {Entity[]} All entities matching the query
     */
    static getEntities(entityQueryOptions) {
        return the_end.getEntities(entityQueryOptions).filter((entity) => this.isOnVenus(entity.location));
    }

    /**
     * Gets all players on Venus that match the EntityQueryOptions
     * @param {EntityQueryOptions} entityQueryOptions Query to use for search
     * @returns {Player[]} All players matching the query
     */
    static getPlayers(entityQueryOptions) {
        return the_end.getPlayers(entityQueryOptions).filter((entity) => this.isOnVenus(entity.location));
    }
     /**
     * Get the player location on Mars
     * @param {Player} player - The player object to get the location from
     * @returns {Vec3} The adjusted position on Venus
     */
     static getPosition(player) {
        return Vec3.add(player.location, Vec3(+750000, 0, +750000));
     }
}


